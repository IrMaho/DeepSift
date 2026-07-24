/**
 * @file registry-miner.ts
 * @description Feature registry and UI tab miner for project capability and route discovery.
 *
 * @module analyzers/registry-miner
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { DiscoveredFeatureTab } from '../types/dna-types.js';

const REGISTRY_FILE_PATTERNS = [
    /tabs?[-_]?registry/i,
    /routes?[-_]?(registry|config|main|app)/i,
    /features?[-_]?(registry|config|list)/i,
    /nav(igation)?[-_]?(config|items|routes)/i,
    /tab[-_]?config/i,
    /menu[-_]?items/i,
    /app[-_]?(routes|router)/i,
    /tabs?\.json$/i,
    /routes?\.json$/i,
    /manifest\.json$/i,
    /swagger\.(json|yaml|yml)$/i,
    /openapi\.(json|yaml|yml)$/i,
    /controllers?/i,
    /endpoints?/i,
    /handlers?/i,
    /commands?/i
];

const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.deepsift', 'dist', 'build', 'out', 'coverage', '.cache', 'vendor'
]);

export function mineFeatureRegistries(projectPath: string): DiscoveredFeatureTab[] {
    const discoveredTabs: DiscoveredFeatureTab[] = [];
    const seenKeys = new Set<string>();

    function scanDir(dir: string, depth: number) {
        if (depth > 5) return;
        let entries: fs.Dirent[] = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch { return; }

        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
                    scanDir(path.join(dir, entry.name), depth + 1);
                }
            } else if (entry.isFile()) {
                const fileName = entry.name;
                const matchesPattern = REGISTRY_FILE_PATTERNS.some(p => p.test(fileName));

                if (matchesPattern) {
                    const fullPath = path.join(dir, fileName);
                    const relPath = path.relative(projectPath, fullPath).replace(/\\/g, '/');
                    extractTabsFromFile(fullPath, relPath, discoveredTabs, seenKeys);
                }
            }
        }
    }

    scanDir(projectPath, 0);
    return discoveredTabs;
}

function extractTabsFromFile(
    fullPath: string,
    relPath: string,
    out: DiscoveredFeatureTab[],
    seen: Set<string>
) {
    try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (relPath.endsWith('.json')) {
            const data = JSON.parse(content);
            parseDataObject(data, relPath, out, seen);
        } else {
            parseTextStructures(content, relPath, out, seen);
        }
    } catch {
        // Skip unparseable files gracefully
    }
}

function parseDataObject(
    data: any,
    relPath: string,
    out: DiscoveredFeatureTab[],
    seen: Set<string>
) {
    if (!data) return;

    const items = Array.isArray(data) ? data : (data.tabs || data.routes || data.features || data.endpoints || data.items || [data]);
    if (!Array.isArray(items)) return;

    for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        const id = String(item.id || item.key || item.code || item.name || item.path || '').trim();
        const title = String(item.title || item.label || item.name || item.displayName || item.summary || id).trim();
        if (!title && !id) continue;

        const uniqueKey = `${id}:${title}`.toLowerCase();
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        const description = item.description || item.summary || item.details || undefined;
        let capabilities: string[] | undefined;

        if (Array.isArray(item.capabilities)) {
            capabilities = item.capabilities.map((c: any) => String(c));
        } else if (item.subtabs && typeof item.subtabs === 'object') {
            capabilities = Object.keys(item.subtabs).map(k => `${k}: ${item.subtabs[k]?.title || item.subtabs[k]?.name || k}`);
        }

        out.push({
            id: id || title.toLowerCase().replace(/\s+/g, '-'),
            title,
            description,
            sourceFile: relPath,
            capabilities
        });
    }
}

function parseTextStructures(
    content: string,
    relPath: string,
    out: DiscoveredFeatureTab[],
    seen: Set<string>
) {
    // 1. Match JS/TS object tab definitions: id: 'color', title: 'Color Palette'
    const tabRegex = /(?:id|name|path)\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*(?:title|label|name|displayName)\s*:\s*['"`]([^'"`]+)['"`]/g;
    let match: RegExpExecArray | null;

    while ((match = tabRegex.exec(content)) !== null) {
        const id = match[1].trim();
        const title = match[2].trim();
        const key = `${id}:${title}`.toLowerCase();

        if (!seen.has(key)) {
            seen.add(key);
            out.push({
                id,
                title,
                sourceFile: relPath
            });
        }
    }

    // 2. Match Backend API Route definitions: e.g. app.get('/api/v1/users'), @Get('/users'), router.HandleFunc("/login")
    const apiRegex = /(?:@(?:Get|Post|Put|Delete|Patch)|app\.(?:get|post|put|delete)|router\.(?:GET|POST|PUT|DELETE|HandleFunc)|GoRoute|Route)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let apiMatch: RegExpExecArray | null;

    while ((apiMatch = apiRegex.exec(content)) !== null) {
        const routePath = apiMatch[1].trim();
        if (routePath.length <= 1) continue;

        const key = `api:${routePath}`.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push({
                id: routePath,
                title: `Route: ${routePath}`,
                description: `API / Navigation Route in ${relPath}`,
                sourceFile: relPath
            });
        }
    }
}
