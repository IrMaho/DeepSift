import { getSearchHistory, getSearchLog } from '../../utils/history.js';
import { printResult, OutputFormat } from '../cli-output.js';

export function historyCommand(projectPath: string, format: OutputFormat) {
    const historyText = getSearchHistory(projectPath);
    printResult(historyText, format);
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
