/**
 * @file entropy-filter.ts
 * @description Shannon Entropy & Minified Code Filter Engine.
 * Detects bundled JS files, minified code artifacts, and high-entropy text chunks to prevent indexing noise.
 * 
 * @module analyzers/entropy-filter
 * @category Security & Diagnostics
 * @since 1.0.3
 */

import fs from 'fs';
import path from 'path';

/**
 * Calculates Shannon Entropy for a text string to detect randomness or minification.
 * 
 * @param text Content string to analyze.
 * @returns Floating point entropy score.
 * @example
 * ```ts
 * const score = calculateEntropy("function foo() { return 42; }");
 * ```
 */
export function calculateEntropy(text: string): number {
    if (!text || text.length === 0) return 0;
    const freqs: Record<string, number> = {};
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        freqs[char] = (freqs[char] || 0) + 1;
    }
    let entropy = 0;
    const len = text.length;
    for (const char in freqs) {
        const p = freqs[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

/**
 * Determines whether a file path or file content represents a minified or bundled artifact.
 * 
 * @param filePath Relative or absolute path to the file.
 * @param content Optional pre-read file content.
 * @returns Boolean indicating if the file is bundled/minified.
 * @example
 * ```ts
 * const isBundled = isBundledOrMinifiedFile('dist/bundle.min.js');
 * ```
 */
export function isBundledOrMinifiedFile(filePath: string, content?: string): boolean {
    const normalized = filePath.replace(/\\/g, '/').toLowerCase();
    
    const BUNDLED_PATTERNS = [
        '/dist/', '/build/', '/out/', '/.next/', '/bundle/',
        'node_modules/', '/release/', '.min.js', '.min.css',
        '.bundle.js', '/vendor/', '/public/bundle/'
    ];

    for (const pattern of BUNDLED_PATTERNS) {
        if (normalized.includes(pattern)) return true;
    }

    if (normalized.endsWith('/code.js') || normalized.endsWith('/bundle.js') || normalized.endsWith('/main.js')) {
        if (normalized.includes('backend') || normalized.includes('plugin') || normalized.includes('dist')) {
            return true;
        }
    }

    if (!content && fs.existsSync(filePath)) {
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch {
            return false;
        }
    }

    if (content) {
        const lines = content.split('\n');
        if (lines.length > 0) {
            const nonBlankLines = lines.filter(l => l.trim().length > 0);
            if (nonBlankLines.length > 0) {
                const totalLength = nonBlankLines.reduce((acc, l) => acc + l.length, 0);
                const avgLength = totalLength / nonBlankLines.length;
                if (avgLength > 250 && nonBlankLines.length < 50) return true;
            }
        }

        if (content.includes('__spreadProps') || content.includes('__awaiter') || content.includes('__generator')) {
            if (lines.length > 100 && content.length > 20000) return true;
        }
    }

    return false;
}
