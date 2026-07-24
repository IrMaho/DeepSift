import fs from 'fs';
import path from 'path';
import { printHeader, printBox, printError } from '../cli-output.js';

export async function resolveErrorCommand(stacktraceInput: string, options: { json?: boolean } = {}) {
    if (!stacktraceInput) {
        printError('Please provide a stacktrace or error snippet string');
        return;
    }

    const projectPath = process.cwd();
    const lineMatches = stacktraceInput.matchAll(/(?:at\s+.*?\s+\(?|in\s+|\s+)?([A-Za-z0-9_\-\/\.\\]+\.(?:ts|tsx|js|jsx|dart|go|py|rs|java)):(\d+)(?::(\d+))?/g);

    const matches: { filePath: string; line: number; snippet: string }[] = [];

    for (const match of lineMatches) {
        const rawFile = match[1];
        const lineNum = parseInt(match[2], 10);
        const resolvedPath = path.resolve(projectPath, rawFile);

        if (fs.existsSync(resolvedPath)) {
            try {
                const content = fs.readFileSync(resolvedPath, 'utf-8');
                const lines = content.split('\n');
                const start = Math.max(0, lineNum - 5);
                const end = Math.min(lines.length, lineNum + 5);
                const snippet = lines.slice(start, end).map((l, idx) => {
                    const cur = start + idx + 1;
                    return `${cur === lineNum ? '➔ ' : '  '}${cur}: ${l}`;
                }).join('\n');

                matches.push({
                    filePath: path.relative(projectPath, resolvedPath),
                    line: lineNum,
                    snippet
                });
            } catch {
            }
        }
    }

    if (options.json) {
        console.log(JSON.stringify(matches, null, 2));
        return;
    }

    if (matches.length === 0) {
        printError('No existing codebase files could be resolved from the provided stacktrace.');
        return;
    }

    printHeader(`🚨 Resolved Stacktrace Error Locations (${matches.length})`);
    matches.forEach(m => {
        console.log(`\n\x1b[33mFile:\x1b[0m ${m.filePath}:${m.line}`);
        printBox(m.snippet, `${m.filePath}:${m.line}`);
    });
}
