import fs from 'fs';
import path from 'path';
import { NamingConventions, NamingDistribution, StructureTemplate, createEmptyNamingDistribution } from '../types/dna-types.js';

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next', '.nuxt',
    '.cache', '.output', '.idea', '.vscode', 'generated', 'gen',
]);

const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs',
    '.java', '.kt', '.swift', '.cpp', '.c', '.h', '.hpp',
    '.cs', '.rb', '.php', '.vue', '.svelte', '.ex', '.exs',
]);

interface ConventionResult {
    naming: NamingConventions;
    structureTemplate: StructureTemplate | null;
}

export function mineConventions(projectPath: string, allFiles: string[]): ConventionResult {
    const fileNames: string[] = [];
    const dirNames = new Set<string>();
    const identifiers: { classes: string[]; functions: string[]; variables: string[]; constants: string[] } = {
        classes: [], functions: [], variables: [], constants: [],
    };

    for (const file of allFiles) {
        const ext = path.extname(file).toLowerCase();
        
        const dirName = path.basename(path.dirname(file));
        if (dirName && dirName !== '.') {
            dirNames.add(dirName);
        }

        if (SOURCE_EXTENSIONS.has(ext)) {
            const baseName = path.basename(file, ext);
            fileNames.push(baseName);

            try {
                const stats = fs.statSync(file);
                if (stats.size <= 300_000) {
                    const fileContent = fs.readFileSync(file, 'utf-8');
                    extractIdentifiers(fileContent, identifiers);
                }
            } catch { /* skip */ }
        }
    }

    const naming: NamingConventions = {
        files: analyzeNaming(fileNames),
        directories: analyzeNaming(Array.from(dirNames)),
        classes: analyzeNaming(identifiers.classes),
        functions: analyzeNaming(identifiers.functions),
        variables: analyzeNaming(identifiers.variables),
        constants: analyzeNaming(identifiers.constants),
    };

    // Add multi-language naming summary hint
    const langDistribution: Record<string, string> = {};
    if (fileNames.some(f => f.includes('_'))) langDistribution['Python/C/Go'] = 'snake_case';
    if (fileNames.some(f => /[a-z][A-Z]/.test(f))) langDistribution['TS/JS/Dart'] = 'camelCase';
    (naming as any).byLanguageHint = langDistribution;

    const structureTemplate = detectStructureTemplate(projectPath);

    return { naming, structureTemplate };
}

function walkForConventions(
    dir: string,
    fileNames: string[],
    dirNames: string[],
    identifiers: { classes: string[]; functions: string[]; variables: string[]; constants: string[] },
    depth: number
): void {
    if (depth > 8) return;

    let items: fs.Dirent[];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const item of items) {
        if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            dirNames.push(item.name);
            walkForConventions(full, fileNames, dirNames, identifiers, depth + 1);
        } else {
            const ext = path.extname(item.name).toLowerCase();
            if (!SOURCE_EXTENSIONS.has(ext)) continue;

            const baseName = path.basename(item.name, ext);
            fileNames.push(baseName);

            try {
                const stats = fs.statSync(full);
                if (stats.size > 300_000) continue;
                const content = fs.readFileSync(full, 'utf-8');
                extractIdentifiers(content, identifiers);
            } catch { /* skip */ }
        }
    }
}

function extractIdentifiers(
    content: string,
    out: { classes: string[]; functions: string[]; variables: string[]; constants: string[] }
): void {
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        const classMatch = trimmed.match(
            /(?:class|struct|enum|interface|trait|protocol|mixin|extension|abstract\s+class)\s+(\w+)/
        );
        if (classMatch) { out.classes.push(classMatch[1]); continue; }

        const funcMatch = trimmed.match(
            /(?:function|func|fn|def|fun|sub|proc|method)\s+(\w+)/
        );
        if (funcMatch) { out.functions.push(funcMatch[1]); continue; }

        const constMatch = trimmed.match(
            /(?:const|final|static\s+const|static\s+final|#define)\s+([A-Z][A-Z0-9_]+)\s*[=:]/
        );
        if (constMatch) { out.constants.push(constMatch[1]); continue; }

        const varMatch = trimmed.match(
            /(?:const|let|var|val|final)\s+(\w+)\s*[=:]/
        );
        if (varMatch && varMatch[1].length > 1) { out.variables.push(varMatch[1]); }
    }
}

type NamingCase = 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case' | 'UPPER_SNAKE' | 'other';

function detectCase(name: string): NamingCase {
    if (/^[A-Z][A-Z0-9_]+$/.test(name) && name.includes('_')) return 'UPPER_SNAKE';
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
    if (/^[a-z][a-zA-Z0-9]*$/.test(name) && /[A-Z]/.test(name)) return 'camelCase';
    if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(name)) return 'snake_case';
    if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)) return 'kebab-case';
    if (/^[a-z]+$/.test(name)) return 'camelCase';
    return 'other';
}

function analyzeNaming(names: string[]): NamingDistribution {
    if (names.length === 0) return createEmptyNamingDistribution();

    const distribution: Record<string, number> = {};
    for (const name of names) {
        if (name.length < 2) continue;
        const caseType = detectCase(name);
        distribution[caseType] = (distribution[caseType] || 0) + 1;
    }

    delete distribution['other'];

    const sorted = Object.entries(distribution).sort(([, a], [, b]) => b - a);
    const dominant = sorted.length > 0 ? sorted[0][0] : 'unknown';

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const deviations: string[] = [];
    if (sorted.length > 1 && dominant !== 'unknown') {
        const dominantCount = sorted[0][1];
        const deviationRatio = 1 - (dominantCount / total);
        if (deviationRatio > 0.15) {
            deviations.push(
                `${(deviationRatio * 100).toFixed(0)}% of names deviate from ${dominant}`
            );
        }
    }

    return { dominant, distribution, deviations };
}

function detectStructureTemplate(projectPath: string): StructureTemplate | null {
    const candidateRoots = findFeatureLikeDirectories(projectPath);
    if (candidateRoots.length === 0) return null;

    for (const root of candidateRoots) {
        const template = analyzeDirectoryTemplate(root.path, root.name);
        if (template) return template;
    }

    return null;
}

interface CandidateRoot {
    path: string;
    name: string;
}

function findFeatureLikeDirectories(projectPath: string): CandidateRoot[] {
    const candidates: CandidateRoot[] = [];

    function scan(dir: string, depth: number): void {
        if (depth > 4) return;

        let items: fs.Dirent[];
        try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

        const subdirs = items.filter(i => i.isDirectory() && !i.name.startsWith('.') && !IGNORED_DIRS.has(i.name));
        if (subdirs.length >= 2) {
            const subStructures = subdirs.map(d => {
                const full = path.join(dir, d.name);
                try {
                    return {
                        name: d.name,
                        children: fs.readdirSync(full, { withFileTypes: true })
                            .filter(c => c.isDirectory() && !c.name.startsWith('.'))
                            .map(c => c.name)
                            .sort(),
                    };
                } catch { return { name: d.name, children: [] as string[] }; }
            }).filter(s => s.children.length >= 2);

            if (subStructures.length >= 2) {
                const first = subStructures[0].children;
                const matching = subStructures.filter(s => {
                    const overlap = s.children.filter(c => first.includes(c));
                    return overlap.length / Math.max(first.length, 1) >= 0.5;
                });

                if (matching.length >= 2) {
                    candidates.push({
                        path: dir,
                        name: path.relative(projectPath, dir) || path.basename(dir),
                    });
                }
            }
        }

        for (const subdir of subdirs) {
            scan(path.join(dir, subdir.name), depth + 1);
        }
    }

    scan(projectPath, 0);
    return candidates;
}

function analyzeDirectoryTemplate(dirPath: string, dirName: string): StructureTemplate | null {
    let subdirs: fs.Dirent[];
    try { subdirs = fs.readdirSync(dirPath, { withFileTypes: true }).filter(i => i.isDirectory() && !i.name.startsWith('.') && !IGNORED_DIRS.has(i.name)); } catch { return null; }

    const structures = subdirs.map(d => {
        const full = path.join(dirPath, d.name);
        try {
            return {
                name: d.name,
                children: fs.readdirSync(full, { withFileTypes: true })
                    .filter(c => c.isDirectory() && !c.name.startsWith('.'))
                    .map(c => c.name)
                    .sort(),
            };
        } catch { return { name: d.name, children: [] as string[] }; }
    }).filter(s => s.children.length >= 2);

    if (structures.length < 2) return null;

    const allChildren = structures.flatMap(s => s.children);
    const childCounts = new Map<string, number>();
    for (const child of allChildren) {
        childCounts.set(child, (childCounts.get(child) || 0) + 1);
    }

    const commonSubfolders = [...childCounts.entries()]
        .filter(([, count]) => count >= Math.ceil(structures.length * 0.5))
        .sort(([, a], [, b]) => b - a)
        .map(([name]) => name);

    if (commonSubfolders.length < 2) return null;

    const confidence = commonSubfolders.length / Math.max(...structures.map(s => s.children.length), 1);

    return {
        pattern: `${dirName}/*/ typically contains: ${commonSubfolders.join(', ')}`,
        examples: structures.slice(0, 3).map(s => path.join(dirName, s.name)),
        commonSubfolders,
        confidence: Math.min(confidence, 0.95),
    };
}
