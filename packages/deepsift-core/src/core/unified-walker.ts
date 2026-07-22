import path from 'path';
import { getFiles } from '../utils/file-walker.js';
import { ProjectDNA } from '../types/dna-types.js';

export interface WalkResult {
    allFiles: string[];
    tokenFiles: string[];
    l10nFiles: string[];
    testFiles: string[];
    configFiles: string[];
    languageCounts: Record<string, number>;
}

const TOKEN_FILE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.vue', '.svelte',
    '.css', '.scss', '.sass', '.less',
    '.json', '.yaml', '.yml',
]);

const TOKEN_FILE_HINTS = [
    'theme', 'token', 'color', 'style', 'design', 'variable',
    'constant', 'config', 'palette', 'spacing', 'typography',
    'shadow', 'radius', 'breakpoint', 'font', 'size',
];

const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs',
    '.java', '.kt', '.swift', '.vue', '.svelte', '.php', '.rb',
]);

const TRANSLATION_FILE_PATTERNS = [
    /\.arb$/i, /\.po$/i, /\.pot$/i, /\.xlf$/i, /\.xliff$/i,
    /\.strings$/i, /\.stringsdict$/i, /\.resx$/i, /\.resw$/i,
];

const TRANSLATION_DIR_NAMES = new Set([
    'l10n', 'i18n', 'locales', 'locale', 'lang', 'langs',
    'translations', 'values',
]);

const TEST_PATTERNS = [
    /\.test\./i, /\.spec\./i, /_test\./i, /Test\./i,
    /\/tests?\//i, /\/__tests__\//i, /\/e2e\//i,
];

export async function unifiedWalk(projectPath: string, onProgress?: (phase: string, detail: string) => void): Promise<WalkResult> {
    if (onProgress) {
        onProgress('walk', 'Scanning repository files...');
    }
    
    const allFiles = await getFiles(projectPath);
    
    const result: WalkResult = {
        allFiles,
        tokenFiles: [],
        l10nFiles: [],
        testFiles: [],
        configFiles: [],
        languageCounts: {}
    };
    
    for (const file of allFiles) {
        const ext = path.extname(file).toLowerCase();
        const basename = path.basename(file).toLowerCase();
        const relativePath = path.relative(projectPath, file).replace(/\\/g, '/');
        const relativeParts = relativePath.split('/');
        
        // 1. Language Counts
        if (ext && ext !== '.' && ext !== '.json' && ext !== '.md' && ext !== '.txt') {
            result.languageCounts[ext] = (result.languageCounts[ext] || 0) + 1;
        }

        // 2. Token Files
        if (TOKEN_FILE_EXTENSIONS.has(ext) && TOKEN_FILE_HINTS.some(hint => basename.includes(hint))) {
            result.tokenFiles.push(file);
        }

        // 3. L10n Files
        let isL10n = false;
        for (const pattern of TRANSLATION_FILE_PATTERNS) {
            if (pattern.test(basename)) {
                isL10n = true;
                break;
            }
        }
        if (!isL10n && (ext === '.json' || ext === '.yaml' || ext === '.yml' || SOURCE_EXTENSIONS.has(ext))) {
            for (const part of relativeParts) {
                if (TRANSLATION_DIR_NAMES.has(part.toLowerCase())) {
                    isL10n = true;
                    break;
                }
            }
        }
        if (isL10n) {
            result.l10nFiles.push(file);
        }

        // 4. Test Files
        let isTest = false;
        for (const pattern of TEST_PATTERNS) {
            if (pattern.test(relativePath)) {
                isTest = true;
                break;
            }
        }
        if (isTest) {
            result.testFiles.push(file);
        }

        // 5. Config Files
        if (
            basename.includes('config') || basename.includes('setup') || basename.startsWith('.') ||
            ext === '.json' || ext === '.yaml' || ext === '.yml' || ext === '.toml' || ext === '.xml'
        ) {
            result.configFiles.push(file);
        }
    }
    
    return result;
}
