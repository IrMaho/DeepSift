/**
 * @file history.ts
 * @description Search and read result history log viewer command.
 *
 * @module cli/commands/history
 * @category Utilities & Dashboard
 * @since 1.0.3
 */
import { getSearchHistory, getSearchLog, cleanupOldOutputs } from '../../utils/history.js';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import fs from 'fs';
import path from 'path';

export function historyCommand(projectPath: string, format: OutputFormat) {
    const historyText = getSearchHistory(projectPath);
    printResult(historyText, format);
}

export function cleanHistoryCommand(projectPath: string, format: OutputFormat, keepFiles?: number, keepDays?: number) {
    if (keepFiles !== undefined || keepDays !== undefined) {
        const deleted = cleanupOldOutputs(projectPath, keepFiles ?? 30, keepDays ?? 7);
        if (format === 'json') {
            printResult(JSON.stringify({ status: 'success', clearedCount: deleted }), format);
        } else {
            printSuccess(`Retention cleanup completed. Removed ${deleted} old log files.`);
        }
        return;
    }

    const targets = ['.deepsift/outputs', '.mcp_search_outputs'];
    let count = 0;

    for (const target of targets) {
        const outputsDir = path.join(projectPath, target);
        if (fs.existsSync(outputsDir)) {
            const files = fs.readdirSync(outputsDir);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    fs.unlinkSync(path.join(outputsDir, file));
                    count++;
                }
            }
        }
    }

    if (format === 'json') {
        printResult(JSON.stringify({ status: 'success', clearedCount: count }), format);
    } else {
        printSuccess(`Cleared ${count} cached search result logs and history index.`);
    }
}

export function drillCommand(projectPath: string, logFilename: string, keyword: string, format: OutputFormat) {
    const logContent = getSearchLog(projectPath, logFilename);
    if (logContent.startsWith('Log file not found')) {
        printResult(logContent, format);
        return;
    }

    const lines = logContent.split('\n');
    const matchedChunks: string[] = [];
    const contextLines = 4;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
            const start = Math.max(0, i - contextLines);
            const end = Math.min(lines.length - 1, i + contextLines);
            matchedChunks.push(`--- Context (Lines ${start + 1} to ${end + 1}) ---\n${lines.slice(start, end + 1).join('\n')}`);
            i = end;
        }
    }

    const output = matchedChunks.length === 0
        ? `Keyword '${keyword}' not found in ${logFilename}.`
        : `Found ${matchedChunks.length} occurrences in isolated context:\n\n${matchedChunks.join('\n\n')}`;

    printResult(output, format);
}
