import fs from 'fs';
import path from 'path';
import { L10nReport, L10nSignals, HardcodedString } from '../types/dna-types.js';

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next',
]);

const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs',
    '.java', '.kt', '.swift', '.vue', '.svelte', '.php', '.rb',
]);

const TRANSLATION_FILE_PATTERNS = [
    /\.arb$/i, /\.po$/i, /\.pot$/i, /\.xlf$/i, /\.xliff$/i,
    /\.strings$/i, /\.stringsdict$/i, /\.resx$/i, /\.resw$/i,
];

const TRANSLATION_DIR_NAMES = new Set([
    'l10n', 'i18n', 'locales', 'locale', 'translations', 'lang',
    'languages', 'intl', 'messages',
]);

const TRANSLATION_FUNCTION_PATTERNS: RegExp[] = [
    /\bt\s*\(\s*['"]/,
    /\btr\s*\(\s*['"]/,
    /\btranslate\s*\(\s*['"]/,
    /\blocalize\s*\(\s*['"]/,
    /\bintl\s*\.\s*\w+\s*\(/,
    /\$t\s*\(\s*['"]/,
    /\bi18n\s*\.\s*\w+\s*\(/,
    /\bmsg\s*\(\s*['"]/,
    /\bgettext\s*\(\s*['"]/,
    /\bngettext\s*\(\s*['"]/,
    /AppLocalizations\s*\.\s*of\s*\(/i,
    /\bS\s*\.\s*of\s*\(\s*context\s*\)/,
    /\bcontext\s*\.\s*l10n\b/,
    /\buseTranslation\s*\(/,
    /\buseIntl\s*\(/,
    /FormattedMessage/,
    /Trans\s*[\s>]/,
];

const TRANSLATION_JSON_PATTERNS = [
    /^[a-z][a-z]\.json$/i,
    /^[a-z]{2}[-_][A-Z]{2}\.json$/i,
    /^messages_[a-z]{2}\.json$/i,
    /^strings_[a-z]{2}\.json$/i,
];

export function detectLocalization(projectPath: string, l10nFiles: string[]): L10nReport {
    const signals: L10nSignals = {
        translationFiles: [],
        translationFunctions: [],
        translationWrappers: [],
        localeDirectories: [],
    };

    const hardcodedStrings: HardcodedString[] = [];
    const supportedLocales: string[] = [];

    scanForL10nSignals(projectPath, signals, supportedLocales, 0);

    const hasI18n = signals.translationFiles.length > 0
        || signals.localeDirectories.length > 0
        || signals.translationFunctions.length > 0;

    if (hasI18n) {
        scanForHardcodedStrings(projectPath, signals, hardcodedStrings, 0);
    }

    const signalCount = [
        signals.translationFiles.length > 0,
        signals.localeDirectories.length > 0,
        signals.translationFunctions.length > 0,
    ].filter(Boolean).length;

    const confidence = hasI18n ? Math.min(0.95, 0.3 + signalCount * 0.25) : 0;

    return {
        hasI18n,
        signals,
        hardcodedStrings: hardcodedStrings.slice(0, 100),
        supportedLocales: [...new Set(supportedLocales)],
        confidence,
    };
}

function scanForL10nSignals(
    dir: string,
    signals: L10nSignals,
    locales: string[],
    depth: number
): void {
    if (depth > 6) return;

    let items: fs.Dirent[];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const item of items) {
        if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            if (TRANSLATION_DIR_NAMES.has(item.name.toLowerCase())) {
                signals.localeDirectories.push(full);
                detectLocalesInDirectory(full, locales);
            }
            scanForL10nSignals(full, signals, locales, depth + 1);
        } else {
            if (TRANSLATION_FILE_PATTERNS.some(p => p.test(item.name))) {
                signals.translationFiles.push(full);
                extractLocaleFromFilename(item.name, locales);
            }

            if (TRANSLATION_JSON_PATTERNS.some(p => p.test(item.name))) {
                signals.translationFiles.push(full);
                extractLocaleFromFilename(item.name, locales);
            }

            const ext = path.extname(item.name).toLowerCase();
            if (SOURCE_EXTENSIONS.has(ext) && signals.translationFunctions.length < 10) {
                try {
                    const stats = fs.statSync(full);
                    if (stats.size > 200_000) continue;
                    const content = fs.readFileSync(full, 'utf-8');
                    detectTranslationFunctions(content, full, signals);
                } catch { /* skip */ }
            }
        }
    }
}

function detectLocalesInDirectory(dir: string, locales: string[]): void {
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            extractLocaleFromFilename(item.name, locales);
            if (item.isDirectory() && /^[a-z]{2}(?:[-_][A-Z]{2})?$/.test(item.name)) {
                locales.push(item.name);
            }
        }
    } catch { /* skip */ }
}

function extractLocaleFromFilename(filename: string, locales: string[]): void {
    const match = filename.match(/(?:^|[_.-])([a-z]{2}(?:[-_][A-Z]{2})?)(?:\.|$)/);
    if (match) locales.push(match[1]);
}

function detectTranslationFunctions(content: string, filePath: string, signals: L10nSignals): void {
    for (const pattern of TRANSLATION_FUNCTION_PATTERNS) {
        if (pattern.test(content)) {
            const funcName = pattern.source.replace(/\\[bsS().'"/]/g, '').substring(0, 30);
            if (!signals.translationFunctions.includes(funcName)) {
                signals.translationFunctions.push(funcName);
            }
            return;
        }
    }
}

function scanForHardcodedStrings(
    dir: string,
    signals: L10nSignals,
    hardcoded: HardcodedString[],
    depth: number
): void {
    if (depth > 6 || hardcoded.length >= 100) return;

    let items: fs.Dirent[];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const item of items) {
        if (hardcoded.length >= 100) return;
        if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            scanForHardcodedStrings(full, signals, hardcoded, depth + 1);
        } else {
            const ext = path.extname(item.name).toLowerCase();
            if (!SOURCE_EXTENSIONS.has(ext)) continue;

            try {
                const stats = fs.statSync(full);
                if (stats.size > 200_000) continue;
                const content = fs.readFileSync(full, 'utf-8');
                findHardcodedInFile(content, full, hardcoded);
            } catch { /* skip */ }
        }
    }
}

function findHardcodedInFile(content: string, filePath: string, hardcoded: HardcodedString[]): void {
    const lines = content.split('\n');
    const stringLiteralPattern = /(['"])([^'"]{3,80})\1/g;
    const uiContextPatterns = [
        /Text\s*\(/, /label\s*[:=]/, /title\s*[:=]/, /hint\s*[:=]/,
        /placeholder\s*[:=]/, /tooltip\s*[:=]/, /message\s*[:=]/,
        /description\s*[:=]/, /content\s*[:=]/, /alt\s*[:=]/,
        /aria-label/, /helperText/, /errorText/, /hintText/,
        /AppBar/, /BottomNavigationBar/, /TabBar/,
        /<[A-Z]\w*[^>]*>/, /return\s*\(/, /render\s*\(/,
    ];

    for (let i = 0; i < lines.length; i++) {
        if (hardcoded.length >= 100) return;
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;
        if (trimmed.startsWith('import ') || trimmed.startsWith('require(')) continue;

        const isUIContext = uiContextPatterns.some(p => p.test(line));
        if (!isUIContext) continue;

        let match: RegExpExecArray | null;
        stringLiteralPattern.lastIndex = 0;
        while ((match = stringLiteralPattern.exec(line)) !== null) {
            const str = match[2];

            if (looksLikeUserFacingText(str)) {
                hardcoded.push({
                    filePath,
                    line: i + 1,
                    content: str,
                    context: trimmed.substring(0, 120),
                });
            }
        }
    }
}

function looksLikeUserFacingText(str: string): boolean {
    if (str.length < 3) return false;
    if (/^[\/\\.]/.test(str)) return false;
    if (/^https?:\/\//.test(str)) return false;
    if (/^\w+\.\w+\.\w+$/.test(str)) return false;
    if (/^[A-Z_]+$/.test(str)) return false;
    if (/^[a-z]+_[a-z]+/.test(str) && !str.includes(' ')) return false;
    if (/^[\w.-]+@[\w.-]+$/.test(str)) return false;

    const wordCount = str.split(/\s+/).length;
    const hasLetters = /[a-zA-Z\u0600-\u06FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(str);
    return wordCount >= 2 && hasLetters;
}
