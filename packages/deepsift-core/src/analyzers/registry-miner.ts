import fs from 'fs';
import path from 'path';
import { DiscoveredFeatureTab } from '../types/dna-types.js';

const REGISTRY_FILE_PATTERNS = [
    /tabs?[-_]?registry/i,
    /routes?[-_]?registry/i,
    /features?[-_]?registry/i,
    /nav(igation)?[-_]?config/i,
    /tab[-_]?config/i,
    /menu[-_]?items/i,
    /app[-_]?routes/i,
    /tabs?\.json$/i,
    /routes?\.json$/i,
    /manifest\.json$/i
];

const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.deepsift', 'dist', 'build', 'out', 'coverage', '.cache'
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

    const items = Array.isArray(data) ? data : (data.tabs || data.routes || data.features || data.items || [data]);
    if (!Array.isArray(items)) return;

    for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        const id = String(item.id || item.key || item.code || item.name || '').trim();
        const title = String(item.title || item.label || item.name || item.displayName || id).trim();
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
    const tabRegex = /id\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*(?:title|label|name)\s*:\s*['"`]([^'"`]+)['"`]/g;
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
}
