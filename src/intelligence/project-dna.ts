import { ProjectDNA, createEmptyDNA, DiscoveredToken } from '../types/dna-types.js';
import { mineTokens } from '../analyzers/property-miner.js';
import { mineConventions } from '../analyzers/convention-miner.js';
import { detectLocalization } from '../analyzers/l10n-detector.js';
import { analyzeArchitecture } from '../analyzers/graph-analyzer.js';
import { integrateTestAnalyzer } from '../analyzers/test-analyzer.js';
import { detectSimilarities } from '../analyzers/similarity-engine.js';
import { mapResources } from '../analyzers/resource-mapper.js';
import { NativeStore } from '../storage/native-store.js';
import { integrateTemporalMiner } from './temporal-analyzer.js';
import fs from 'fs';
import path from 'path';
import { jsonToToon, toonToJson } from '../utils/toon-serializer.js';
import crypto from 'crypto';

const DNA_FILENAME = 'project-dna.toon';

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next', '.nuxt',
    '.cache', '.output', '.svelte-kit', '.idea', '.vscode',
]);

const EXT_TO_LANG: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.dart': 'Dart', '.py': 'Python', '.go': 'Go', '.rs': 'Rust',
    '.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
    '.cpp': 'C++', '.c': 'C', '.h': 'C/C++', '.hpp': 'C++',
    '.cs': 'C#', '.rb': 'Ruby', '.php': 'PHP', '.vue': 'Vue',
    '.svelte': 'Svelte', '.astro': 'Astro', '.ex': 'Elixir', '.exs': 'Elixir',
    '.zig': 'Zig', '.nim': 'Nim', '.lua': 'Lua', '.r': 'R', '.R': 'R',
    '.scala': 'Scala', '.clj': 'Clojure', '.hs': 'Haskell', '.erl': 'Erlang',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'SASS', '.less': 'LESS',
    '.html': 'HTML', '.xml': 'XML', '.sql': 'SQL',
};

const PACKAGE_MANAGER_FILES: Record<string, string> = {
    'package-lock.json': 'npm', 'yarn.lock': 'yarn', 'pnpm-lock.yaml': 'pnpm', 'bun.lockb': 'bun',
    'package.json': 'npm', 'pubspec.yaml': 'pub', 'Cargo.toml': 'cargo', 'go.mod': 'go',
    'requirements.txt': 'pip', 'pyproject.toml': 'pip', 'Pipfile': 'pipenv',
    'Gemfile': 'bundler', 'composer.json': 'composer',
    'build.gradle': 'gradle', 'build.gradle.kts': 'gradle', 'pom.xml': 'maven',
    'Package.swift': 'spm', 'CMakeLists.txt': 'cmake', 'Makefile': 'make',
};

function getDnaPath(projectPath: string): string {
    return path.join(projectPath, '.deepsift', DNA_FILENAME);
}

export function loadDNA(projectPath: string): ProjectDNA | null {
    const dnaPath = getDnaPath(projectPath);
    const legacyPath = dnaPath.replace('.toon', '.json');
    
    if (fs.existsSync(dnaPath)) {
        try {
            const toonText = fs.readFileSync(dnaPath, 'utf-8');
            return toonToJson(toonText) as ProjectDNA;
        } catch {
            return null;
        }
    } else if (fs.existsSync(legacyPath)) {
        try {
            const jsonText = fs.readFileSync(legacyPath, 'utf-8');
            const dna = JSON.parse(jsonText) as ProjectDNA;
            // Migrated to toon
            saveDNA(projectPath, dna);
            return dna;
        } catch {
            return null;
        }
    }
    return null;
}

export function saveDNA(projectPath: string, dna: ProjectDNA): void {
    const dnaPath = getDnaPath(projectPath);
    const dir = path.dirname(dnaPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    dna.fingerprint = crypto.createHash('sha256')
        .update(JSON.stringify(dna))
        .digest('hex')
        .substring(0, 16);

    const toonText = jsonToToon(dna);
    fs.writeFileSync(dnaPath, toonText, 'utf-8');
}

import { WalkResult } from '../core/unified-walker.js';

export async function generateDNA(
    projectPath: string,
    walkResult: WalkResult,
    onProgress?: (phase: string, detail: string) => void
): Promise<ProjectDNA> {
    const dna = createEmptyDNA(path.basename(projectPath));

    if (onProgress) onProgress('identity', 'Detecting project identity...');
    detectIdentity(projectPath, dna, walkResult);

    if (onProgress) onProgress('tokens', 'Mining design tokens...');
    integratePropertyMiner(projectPath, dna, walkResult, onProgress);

    if (onProgress) onProgress('conventions', 'Mining naming conventions...');
    integrateConventionMiner(projectPath, dna, walkResult);

    if (onProgress) onProgress('i18n', 'Detecting localization...');
    integrateL10nDetector(projectPath, dna, walkResult);

    if (onProgress) onProgress('graph', 'Analyzing dependency graph...');
    integrateGraphAnalyzer(projectPath, dna, onProgress);

    if (onProgress) onProgress('testing', 'Analyzing test coverage and Time Bombs...');
    integrateTestAnalyzer(projectPath, dna, walkResult.testFiles, onProgress);

    if (onProgress) onProgress('similarity', 'Detecting component similarities...');
    await integrateSimilarityEngine(projectPath, dna, onProgress);

    if (onProgress) onProgress('resources', 'Mapping static resources and icons...');
    integrateResourceMapper(projectPath, dna, walkResult, onProgress);

    if (onProgress) onProgress('temporal', 'Mining temporal dynamics and AI regressions...');
    integrateTemporalMiner(projectPath, dna, onProgress);

    // Read learned patterns if they exist
    const learnedPatternsPath = path.join(projectPath, '.deepsift', 'learned-patterns.json');
    if (fs.existsSync(learnedPatternsPath)) {
        try {
            dna.conventions.learnedPatterns = JSON.parse(fs.readFileSync(learnedPatternsPath, 'utf-8'));
            if (onProgress) onProgress('patterns', `Loaded ${dna.conventions.learnedPatterns?.length} auto-learned patterns.`);
        } catch { /* skip */ }
    }

    if (onProgress) onProgress('rules', 'Generating rules from discovered data...');
    generateRules(dna);

    dna.generatedAt = new Date().toISOString();
    saveDNA(projectPath, dna);
    return dna;
}

function detectIdentity(projectPath: string, dna: ProjectDNA, walkResult: WalkResult): void {
    dna.identity.name = detectProjectName(projectPath);
    dna.identity.languages = walkResult.languageCounts;
    dna.identity.packageManager = detectPackageManager(projectPath);
    dna.identity.framework = detectFramework(projectPath);
}

function detectProjectName(projectPath: string): string {
    const configParsers: Array<{ file: string; extract: (content: string) => string | null }> = [
        {
            file: 'package.json',
            extract: (c) => { try { return JSON.parse(c).name || null; } catch { return null; } },
        },
        {
            file: 'pubspec.yaml',
            extract: (c) => c.match(/^name:\s*(.+)$/m)?.[1]?.trim() || null,
        },
        {
            file: 'Cargo.toml',
            extract: (c) => c.match(/^name\s*=\s*"(.+)"/m)?.[1]?.trim() || null,
        },
        {
            file: 'go.mod',
            extract: (c) => {
                const mod = c.match(/^module\s+(.+)$/m)?.[1]?.trim();
                return mod ? mod.split('/').pop() || null : null;
            },
        },
        {
            file: 'pyproject.toml',
            extract: (c) => c.match(/^name\s*=\s*"(.+)"/m)?.[1]?.trim() || null,
        },
    ];

    for (const parser of configParsers) {
        const filePath = path.join(projectPath, parser.file);
        if (fs.existsSync(filePath)) {
            try {
                const name = parser.extract(fs.readFileSync(filePath, 'utf-8'));
                if (name) return name;
            } catch { /* skip */ }
        }
    }

    return path.basename(projectPath);
}

function scanLanguages(rootDir: string): Record<string, number> {
    const languages: Record<string, number> = {};
    walkForLanguages(rootDir, languages, 0);
    return sortByValueDesc(languages);
}

function walkForLanguages(dir: string, languages: Record<string, number>, depth: number): void {
    if (depth > 8) return;

    let items: fs.Dirent[];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const item of items) {
        if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            walkForLanguages(full, languages, depth + 1);
        } else {
            const ext = path.extname(item.name).toLowerCase();
            const lang = EXT_TO_LANG[ext];
            if (lang) languages[lang] = (languages[lang] || 0) + 1;
        }
    }
}

function detectPackageManager(projectPath: string): string {
    for (const [file, manager] of Object.entries(PACKAGE_MANAGER_FILES)) {
        if (fs.existsSync(path.join(projectPath, file))) return manager;
    }
    return 'unknown';
}

function detectFramework(projectPath: string): string {
    const detectors: Array<{ file: string; detect: (content: string) => string | null }> = [
        {
            file: 'package.json',
            detect: (c) => {
                try {
                    const pkg = JSON.parse(c);
                    const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
                    const meaningful = allDeps.filter(d =>
                        !d.startsWith('@types/') &&
                        !d.startsWith('eslint') &&
                        !d.startsWith('prettier') &&
                        !d.startsWith('typescript')
                    );
                    return meaningful.slice(0, 5).join(', ') || null;
                } catch { return null; }
            },
        },
        {
            file: 'pubspec.yaml',
            detect: (c) => c.includes('flutter:') ? 'Flutter' : 'Dart',
        },
        {
            file: 'Cargo.toml',
            detect: () => 'Rust',
        },
        {
            file: 'go.mod',
            detect: () => 'Go',
        },
    ];

    for (const detector of detectors) {
        const filePath = path.join(projectPath, detector.file);
        if (fs.existsSync(filePath)) {
            try {
                const result = detector.detect(fs.readFileSync(filePath, 'utf-8'));
                if (result) return result;
            } catch { /* skip */ }
        }
    }

    return 'unknown';
}

function integratePropertyMiner(
    projectPath: string,
    dna: ProjectDNA,
    walkResult: WalkResult,
    onProgress?: (phase: string, detail: string) => void
): void {
    const { tokens, clusters } = mineTokens(projectPath, walkResult.tokenFiles, (current, total) => {
        if (onProgress && current % 50 === 0) {
            onProgress('tokens', `Scanning files... (${current}/${total})`);
        }
    });

    const typeMap: Record<string, keyof typeof dna.designSystem.tokens> = {
        'color': 'colors',
        'dimension': 'dimensions',
        'font': 'typography',
        'shadow': 'shadows',
        'radius': 'radii',
        'duration': 'durations',
        'opacity': 'opacities',
    };

    for (const token of tokens) {
        const bucket = typeMap[token.propertyType];
        if (bucket && dna.designSystem.tokens[bucket]) {
            dna.designSystem.tokens[bucket].push(token);
        }
    }

    const designSystemClusters = clusters.filter(c => c.isDesignSystem);
    dna.designSystem.tokenSources = [
        ...new Set(designSystemClusters.flatMap(c => c.sourceFiles))
    ];

    dna.designSystem.confidence = designSystemClusters.length > 0
        ? Math.max(...designSystemClusters.map(c => c.confidence))
        : tokens.length > 0 ? 0.3 : 0;
}

function integrateConventionMiner(projectPath: string, dna: ProjectDNA, walkResult: WalkResult): void {
    const { naming, structureTemplate } = mineConventions(projectPath, walkResult.allFiles);
    dna.conventions.naming = naming;
    dna.conventions.structureTemplate = structureTemplate;
}

function integrateL10nDetector(projectPath: string, dna: ProjectDNA, walkResult: WalkResult): void {
    dna.localization = detectLocalization(projectPath, walkResult.l10nFiles);
}

function integrateGraphAnalyzer(projectPath: string, dna: ProjectDNA, onProgress?: (phase: string, detail: string) => void): void {
    const archResult = analyzeArchitecture(projectPath, (current, total) => {
        if (onProgress && current % 50 === 0) {
            onProgress('graph', `Analyzing imports... (${current}/${total})`);
        }
    });

    dna.architecture.topology = archResult.topology;
    dna.architecture.clusters = archResult.clusters;
    dna.architecture.coreFiles = archResult.coreFiles;
    dna.architecture.graph = archResult.graph;
}

async function integrateSimilarityEngine(projectPath: string, dna: ProjectDNA, onProgress?: (phase: string, detail: string) => void): Promise<void> {
    const groups = await detectSimilarities(projectPath, (current, total) => {
        if (onProgress && current % 50 === 0) {
            onProgress('similarity', `Comparing embeddings... (${current}/${total})`);
        }
    });

    dna.components.similarityGroups = groups;
    
    // Attempt to guess total component count based on naming patterns of chunks
    let totalCount = 0;
    try {
        const dbPath = path.join(projectPath, '.deepsift', 'deepsift.db');
        const store = new NativeStore(dbPath);
        const all = await store.getAllChunks();
        totalCount = all.filter((c: any) => c.chunk.type === 'class' || c.chunk.type === 'function').length;
    } catch { /* ignore */ }
    
    dna.components.totalCount = totalCount;
}

function integrateResourceMapper(projectPath: string, dna: ProjectDNA, walkResult: WalkResult, onProgress?: (phase: string, detail: string) => void): void {
    dna.assets = mapResources(projectPath, walkResult.allFiles, onProgress);
}

function generateRules(dna: ProjectDNA): void {
    dna.rules = [];

    if (dna.designSystem.confidence > 0.5) {
        dna.rules.push(
            `Design tokens discovered in: ${dna.designSystem.tokenSources.join(', ')}. Use these tokens instead of hardcoded values.`
        );
    }

    if (dna.localization.hasI18n) {
        dna.rules.push(
            'Project uses i18n. All user-facing strings must go through the translation system.'
        );
    }

    if (dna.components.similarityGroups.length > 0) {
        dna.rules.push(
            `${dna.components.similarityGroups.length} groups of similar components detected. Check for existing components before creating new ones.`
        );
    }

    if (dna.conventions.structureTemplate) {
        dna.rules.push(
            `Feature template pattern detected: ${dna.conventions.structureTemplate.commonSubfolders.join(', ')}. Follow this structure for new features.`
        );
    }

    const dominantFileNaming = dna.conventions.naming.files.dominant;
    if (dominantFileNaming !== 'unknown') {
        dna.rules.push(`File naming convention: ${dominantFileNaming}`);
    }
}

function sortByValueDesc(obj: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
        Object.entries(obj).sort(([, a], [, b]) => b - a)
    );
}

export function formatDNASummary(dna: ProjectDNA): string {
    const lines: string[] = [];

    lines.push(`# 🧬 Project DNA: ${dna.identity.name}`);
    lines.push(`Generated: ${dna.generatedAt} | Fingerprint: ${dna.fingerprint}`);
    lines.push('');

    lines.push('## 🪪 Identity');
    const topLangs = Object.entries(dna.identity.languages)
        .slice(0, 5)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(', ');
    lines.push(`- **Languages:** ${topLangs || 'N/A'}`);
    lines.push(`- **Framework:** ${dna.identity.framework}`);
    lines.push(`- **Package Manager:** ${dna.identity.packageManager}`);
    lines.push('');

    lines.push('## 🎨 Design System');
    const tokenCounts = Object.entries(dna.designSystem.tokens)
        .map(([cat, tokens]) => ({ cat, count: (tokens as unknown[]).length, samples: tokens as DiscoveredToken[] }))
        .filter(t => t.count > 0);
    if (tokenCounts.length > 0) {
        lines.push(`- **Tokens:** ${tokenCounts.map(t => `${t.cat}: ${t.count}`).join(' | ')}`);
        lines.push(`- **Format Samples:**`);
        tokenCounts.forEach(t => {
            const sampleStrs = t.samples.slice(0, 3).map(s => `\`${s.name}: ${s.value}\``).join(', ');
            lines.push(`  - *${t.cat}*: ${sampleStrs}${t.count > 3 ? '...' : ''}`);
        });
        lines.push(`- **Sources:** ${dna.designSystem.tokenSources.join(', ')}`);
        lines.push(`- **Confidence:** ${(dna.designSystem.confidence * 100).toFixed(0)}%`);
    } else {
        lines.push('- No design tokens discovered yet. Run `deepsift scan tokens`.');
    }
    lines.push('');

    lines.push('## 📐 Architecture');
    lines.push(`- **Topology:** ${dna.architecture.topology}`);
    if (dna.architecture.coreFiles.length > 0) {
        lines.push(`- **Core Files:** ${dna.architecture.coreFiles.slice(0, 5).join(', ')}`);
    }
    if (dna.architecture.templatePatterns.length > 0) {
        lines.push(`- **Template Patterns:** ${dna.architecture.templatePatterns.length} detected`);
    }
    lines.push('');

    lines.push('## 🧩 Components');
    lines.push(`- **Total:** ${dna.components.totalCount}`);
    lines.push(`- **Similarity Groups:** ${dna.components.similarityGroups.length}`);
    lines.push('');

    lines.push('## 🌍 Localization');
    lines.push(`- **Has i18n:** ${dna.localization.hasI18n ? 'Yes' : 'No'}`);
    if (dna.localization.hasI18n) {
        lines.push(`- **Locales:** ${dna.localization.supportedLocales.join(', ') || 'Unknown'}`);
        lines.push(`- **Hardcoded Strings:** ${dna.localization.hardcodedStrings.length}`);
    }
    lines.push('');

    lines.push('## 📛 Conventions');
    lines.push(`- **File Naming:** ${dna.conventions.naming.files.dominant}`);
    lines.push(`- **Class Naming:** ${dna.conventions.naming.classes.dominant}`);
    lines.push(`- **Function Naming:** ${dna.conventions.naming.functions.dominant}`);
    
    if (dna.conventions.learnedPatterns && dna.conventions.learnedPatterns.length > 0) {
        lines.push('');
        lines.push('## 🧠 Learned Coding Patterns (Auto-Discovered)');
        dna.conventions.learnedPatterns.forEach(p => {
            lines.push(`- **${p.category}**: ${p.name} (Confidence: ${(p.evidence.frequency * 100).toFixed(0)}%)`);
            lines.push(`  ↳ ${p.description}`);
        });
    }
    
    lines.push('');

    if (dna.temporal) {
        lines.push('## ⏳ Temporal Dynamics');
        lines.push(`- **Bottlenecks:** ${dna.temporal.bottlenecks.length}`);
        lines.push(`- **Dead Zones:** ${dna.temporal.deadZones.length}`);
        lines.push(`- **Uncommitted Anomalies:** ${dna.temporal.recentUncommittedAnomalies?.length || 0}`);
        lines.push('');
    }

    if (dna.rules.length > 0) {
        lines.push('## 📜 Rules');
        dna.rules.forEach(rule => lines.push(`- ${rule}`));
        lines.push('');
    }

    if (dna.testing) {
        if (dna.testing.timeBombs && dna.testing.timeBombs.length > 0) {
            lines.push(`\n\x1b[31;1m💣 SEMANTIC TIME BOMBS DETECTED 💣\x1b[0m`);
            lines.push(`The following core architecture files have critically low test coverage and pose a massive regression risk:`);
            dna.testing.timeBombs.forEach((b: any) => {
                lines.push(` - \x1b[31m${b.filePath}\x1b[0m (Coverage: ${b.coveragePercent}% | In-Degree: ${b.inDegree})`);
            });
            lines.push('');
        } else if (dna.testing.safeCores && dna.testing.safeCores.length > 0) {
            lines.push(`\n\x1b[32;1m🛡️ SECURE ARCHITECTURE\x1b[0m`);
            lines.push(`Your God Nodes are well-tested and robust. Excellent work.\n`);
            lines.push('');
        }
    }

    return lines.join('\n');
}
