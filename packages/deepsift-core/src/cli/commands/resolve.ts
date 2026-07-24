/**
 * @file resolve.ts
 * @description Import and symbol path resolver across workspace files.
 *
 * @module cli/commands/resolve
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { printResult, printInfo, OutputFormat } from '../cli-output.js';

export function resolveCommand(projectPath: string, token: string, format: OutputFormat) {
    const outputsDir = path.join(projectPath, '.deepsift', 'outputs');

    if (!fs.existsSync(outputsDir)) {
        printResult('No search history found. Run a search first.', format);
        return;
    }

    const files = fs.readdirSync(outputsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({
            name: f,
            mtime: fs.statSync(path.join(outputsDir, f)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
        printResult('No cached search results. Run a search first.', format);
        return;
    }

    for (const file of files) {
        const content = fs.readFileSync(path.join(outputsDir, file.name), 'utf-8');

        const dictMatch = content.match(/\[([^\]]+)\]\[/);
        if (!dictMatch) continue;

        const dictStr = dictMatch[1];
        const entries = dictStr.split(',');
        const dictionary: Record<string, string> = {};
        for (const entry of entries) {
            const colonIdx = entry.indexOf(':');
            if (colonIdx === -1) continue;
            const key = entry.substring(0, colonIdx).trim();
            const value = entry.substring(colonIdx + 1).trim();
            dictionary[key] = value;
        }

        if (dictionary[token]) {
            const result = format === 'json'
                ? JSON.stringify({ token, resolved: dictionary[token], source: file.name })
                : `🔓 Token "${token}" → "${dictionary[token]}" (from: ${file.name})`;
            printResult(result, format);
            return;
        }

        const lowerToken = token.toLowerCase();
        const partialMatches: { key: string; value: string }[] = [];
        for (const [k, v] of Object.entries(dictionary)) {
            if (k.toLowerCase().includes(lowerToken) || v.toLowerCase().includes(lowerToken)) {
                partialMatches.push({ key: k, value: v });
            }
        }

        if (partialMatches.length > 0) {
            let result: string;
            if (format === 'json') {
                result = JSON.stringify({ query: token, matches: partialMatches, source: file.name });
            } else {
                const lines = partialMatches.map(m => `  ${m.key} → ${m.value}`).join('\n');
                result = `🔍 Partial matches for "${token}" (from: ${file.name}):\n${lines}`;
            }
            printResult(result, format);
            return;
        }
    }

    printResult(`Token "${token}" not found in any cached dictionary.`, format);
}
