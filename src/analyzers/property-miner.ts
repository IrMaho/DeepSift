import fs from 'fs';
import path from 'path';
import { DiscoveredToken, TokenCluster, PropertyType } from '../types/dna-types.js';
import { classifyToken, classifyValue } from './value-classifier.js';

const ASSIGNMENT_PATTERNS: RegExp[] = [
    /(?:const|final|static|let|val|var|#define)\s+([\w.]+)\s*[=:]\s*(.+?)(?:[;,]|$)/,
    /--([\w][\w-]*)\s*:\s*(.+?)(?:;|$)/,
    /\$([\w][\w-]*)\s*:\s*(.+?)(?:;|$)/,
    /@([\w][\w-]*)\s*:\s*(.+?)(?:;|$)/,
    /([\w][\w.-]*)\s*:\s*(.+?)(?:[;,}]|$)/,
    /([\w]+)\s*=\s*(.+?)(?:;|$)/,
];

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next',
]);

const TOKEN_FILE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs',
    '.java', '.kt', '.swift', '.css', '.scss', '.sass', '.less',
    '.json', '.yaml', '.yml', '.toml', '.xml',
]);

const TOKEN_FILE_HINTS = [
    'theme', 'token', 'color', 'style', 'design', 'variable',
    'constant', 'config', 'palette', 'spacing', 'typography',
    'shadow', 'radius', 'breakpoint', 'font', 'size',
];

interface RawAssignment {
    name: string;
    value: string;
    filePath: string;
    line: number;
}

export function mineTokens(projectPath: string, tokenFiles: string[], onProgress?: (current: number, total: number) => void): { tokens: DiscoveredToken[]; clusters: TokenCluster[] } {
    const rawAssignments: RawAssignment[] = [];

    for (let i = 0; i < tokenFiles.length; i++) {
        if (onProgress) onProgress(i + 1, tokenFiles.length);
        const assignments = extractAssignments(tokenFiles[i]);
        rawAssignments.push(...assignments);
    }

    const tokens = classifyAssignments(rawAssignments, projectPath);
    const usageCounts = countUsages(tokens, projectPath);
    tokens.forEach(t => { t.usageCount = usageCounts.get(t.name) || 0; });

    const clusters = clusterTokens(tokens);
    return { tokens, clusters };
}

function findCandidateFiles(projectPath: string): string[] {
    const files: string[] = [];
    walkForTokenFiles(projectPath, files, 0);
    return prioritizeTokenFiles(files);
}

function walkForTokenFiles(dir: string, files: string[], depth: number): void {
    if (depth > 8) return;

    let items: fs.Dirent[];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const item of items) {
        if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            walkForTokenFiles(full, files, depth + 1);
        } else {
            const ext = path.extname(item.name).toLowerCase();
            if (TOKEN_FILE_EXTENSIONS.has(ext)) files.push(full);
        }
    }
}

function prioritizeTokenFiles(files: string[]): string[] {
    const scored = files.map(f => {
        const lower = f.toLowerCase();
        const hintScore = TOKEN_FILE_HINTS.reduce((acc, hint) =>
            acc + (lower.includes(hint) ? 10 : 0), 0
        );
        return { file: f, score: hintScore };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.file);
}

function extractAssignments(filePath: string): RawAssignment[] {
    let content: string;
    try {
        const stats = fs.statSync(filePath);
        if (stats.size > 500_000) return [];
        content = fs.readFileSync(filePath, 'utf-8');
    } catch { return []; }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.json') return extractFromJSON(content, filePath);
    if (ext === '.yaml' || ext === '.yml') return extractFromYAML(content, filePath);

    return extractFromCode(content, filePath);
}

function extractFromCode(content: string, filePath: string): RawAssignment[] {
    const assignments: RawAssignment[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('*')) continue;

        for (const pattern of ASSIGNMENT_PATTERNS) {
            const match = line.match(pattern);
            if (match && match[1] && match[2]) {
                const name = match[1].trim();
                const value = match[2].trim().replace(/['"`;,]$/g, '').trim();
                if (name.length > 1 && name.length < 100 && value.length > 0 && value.length < 300) {
                    assignments.push({ name, value, filePath, line: i + 1 });
                }
                break;
            }
        }
    }

    return assignments;
}

function extractFromJSON(content: string, filePath: string): RawAssignment[] {
    const assignments: RawAssignment[] = [];
    try {
        const obj = JSON.parse(content);
        flattenObject(obj, '', assignments, filePath, 1);
    } catch { /* invalid JSON */ }
    return assignments;
}

function flattenObject(obj: any, prefix: string, out: RawAssignment[], filePath: string, line: number): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'string' || typeof val === 'number') {
            out.push({ name: fullKey, value: String(val), filePath, line });
        } else if (typeof val === 'object' && val !== null) {
            flattenObject(val, fullKey, out, filePath, line);
        }
    }
}

function extractFromYAML(content: string, filePath: string): RawAssignment[] {
    const assignments: RawAssignment[] = [];
    const lines = content.split('\n');
    const stack: string[] = [];
    let prevIndent = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const indent = line.length - line.trimStart().length;
        const kvMatch = trimmed.match(/^([\w][\w.-]*)\s*:\s*(.+)$/);

        if (kvMatch) {
            while (stack.length > 0 && indent <= prevIndent) {
                stack.pop();
                prevIndent -= 2;
            }
            const name = [...stack, kvMatch[1]].join('.');
            const value = kvMatch[2].trim().replace(/^['"]|['"]$/g, '');
            assignments.push({ name, value, filePath, line: i + 1 });
        } else {
            const keyOnly = trimmed.match(/^([\w][\w.-]*)\s*:$/);
            if (keyOnly) {
                while (stack.length > 0 && indent <= prevIndent) {
                    stack.pop();
                    prevIndent -= 2;
                }
                stack.push(keyOnly[1]);
                prevIndent = indent;
            }
        }
    }

    return assignments;
}

function classifyAssignments(assignments: RawAssignment[], projectPath: string): DiscoveredToken[] {
    const tokens: DiscoveredToken[] = [];

    for (const a of assignments) {
        const propertyType = classifyToken(a.name, a.value);
        if (propertyType === 'unknown') continue;

        const relPath = path.relative(projectPath, a.filePath);
        const isInTokenFile = TOKEN_FILE_HINTS.some(h => relPath.toLowerCase().includes(h));
        const confidence = isInTokenFile ? 0.9 : 0.6;

        tokens.push({
            name: a.name,
            value: a.value,
            propertyType,
            filePath: relPath,
            line: a.line,
            usageCount: 0,
            confidence,
        });
    }

    return tokens;
}

function countUsages(tokens: DiscoveredToken[], projectPath: string): Map<string, number> {
    const counts = new Map<string, number>();
    if (tokens.length === 0) return counts;

    const tokenNames = new Set(tokens.map(t => t.name));
    const shortNames = new Set(
        tokens.map(t => {
            const parts = t.name.split('.');
            return parts[parts.length - 1];
        }).filter(n => n.length > 2)
    );

    walkForUsages(projectPath, tokenNames, shortNames, counts, 0);
    return counts;
}

function walkForUsages(
    dir: string,
    tokenNames: Set<string>,
    shortNames: Set<string>,
    counts: Map<string, number>,
    depth: number
): void {
    if (depth > 8) return;

    let items: fs.Dirent[];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const item of items) {
        if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            walkForUsages(full, tokenNames, shortNames, counts, depth + 1);
        } else {
            const ext = path.extname(item.name).toLowerCase();
            if (!TOKEN_FILE_EXTENSIONS.has(ext)) continue;

            try {
                const stats = fs.statSync(full);
                if (stats.size > 500_000) continue;
                const content = fs.readFileSync(full, 'utf-8');

                for (const name of tokenNames) {
                    if (content.includes(name)) {
                        counts.set(name, (counts.get(name) || 0) + 1);
                    }
                }
                for (const short of shortNames) {
                    if (content.includes(short)) {
                        counts.set(short, (counts.get(short) || 0) + 1);
                    }
                }
            } catch { /* skip unreadable */ }
        }
    }
}

function clusterTokens(tokens: DiscoveredToken[]): TokenCluster[] {
    const groups = new Map<PropertyType, DiscoveredToken[]>();

    for (const t of tokens) {
        const list = groups.get(t.propertyType) || [];
        list.push(t);
        groups.set(t.propertyType, list);
    }

    const clusters: TokenCluster[] = [];

    for (const [type, groupTokens] of groups) {
        const sourceFiles = [...new Set(groupTokens.map(t => t.filePath))];
        const highUsageCount = groupTokens.filter(t => t.usageCount > 2).length;
        const isDesignSystem = sourceFiles.length <= 3
            && groupTokens.length >= 3
            && highUsageCount >= 2;

        const confidence = isDesignSystem
            ? Math.min(0.95, 0.5 + (highUsageCount / groupTokens.length) * 0.5)
            : 0.3;

        clusters.push({
            category: type,
            tokens: groupTokens,
            sourceFiles,
            isDesignSystem,
            confidence,
        });
    }

    return clusters.sort((a, b) => b.confidence - a.confidence);
}
