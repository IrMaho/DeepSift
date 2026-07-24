/**
 * @file read.ts
 * @description File Reader Command with Token Compression & Line Range Support.
 * Reads source file contents, extracts line ranges (e.g. file.ts:10-50), and formats
 * uncompressed text or compressed DEC_v2 visual tokens for AI agents.
 * 
 * @module cli/commands/read
 * @category Core Search & Discovery
 * @since 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { saveSearchLog } from '../../utils/history.js';
import { promptForResearchFindings, AutoSaveContext } from './memo-prompt.js';

/**
 * Executes the `deepsift read` command to fetch file content or line range snippets.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param targets Array of target file strings with optional line ranges (e.g. ['src/file.ts:1-50']).
 * @param format Output format ('markdown', 'plain', or 'json').
 * @param compress Whether to apply DEC_v2 visual token compression (default: true).
 * @example
 * ```ts
 * await readCommand(process.cwd(), ['src/utils/config.ts:1-40'], 'markdown', false);
 * ```
 */
export async function readCommand(
    projectPath: string,
    targets: string[],
    format: OutputFormat,
    compress: boolean = true
): Promise<void> {
    if (targets.length === 0) {
        throw new Error('No targets provided for read command.');
    }

    const allResults: string[] = [];
    const readFiles: string[] = [];

    for (const target of targets) {
        let filePath = target;
        let startLine = 1;
        let endLine = -1;

        const colonIdx = target.lastIndexOf(':');
        if (colonIdx !== -1) {
            const rangeStr = target.substring(colonIdx + 1);
            const rangeParts = rangeStr.split('-');
            if (rangeParts.length === 2) {
                const s = parseInt(rangeParts[0], 10);
                const e = parseInt(rangeParts[1], 10);
                if (!isNaN(s) && !isNaN(e)) {
                    filePath = target.substring(0, colonIdx);
                    startLine = s;
                    endLine = e;
                }
            } else if (rangeParts.length === 1) {
                const s = parseInt(rangeParts[0], 10);
                if (!isNaN(s)) {
                    filePath = target.substring(0, colonIdx);
                    startLine = s;
                    endLine = s;
                }
            }
        }

        let fullPath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
            fullPath = path.resolve(projectPath, filePath);
        }

        if (!fs.existsSync(fullPath)) {
            allResults.push(`--- File: ${filePath} ---\n[Error: File not found]`);
            continue;
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            const actualEnd = endLine === -1 ? lines.length : Math.min(lines.length, endLine);
            const actualStart = Math.max(1, startLine);

            if (actualStart > lines.length) {
                allResults.push(`--- File: ${filePath} ---\n[Error: Start line ${actualStart} is beyond file length of ${lines.length}]`);
                continue;
            }

            const snippet = lines.slice(actualStart - 1, actualEnd).join('\n');
            const ext = path.extname(filePath).replace('.', '');
            
            allResults.push(`--- File: ${filePath} (Lines: ${actualStart}-${actualEnd}) ---\n\`\`\`${ext}\n${snippet}\n\`\`\``);
            readFiles.push(`${filePath}:${actualStart}-${actualEnd} (${actualEnd - actualStart + 1} lines)`);
        } catch (err: any) {
            allResults.push(`--- File: ${filePath} ---\n[Error reading file: ${err.message}]`);
        }
    }

    const rawOutput = allResults.join('\n\n');
    let finalOutput = rawOutput;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`Read: ${targets.join(', ')}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`File read results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`File read results cached in: ${link}`);
        }
    }

    const contentPreview = rawOutput.length > 800
        ? rawOutput.substring(0, 800) + '\n... [truncated]'
        : rawOutput;

    const autoSaveCtx: AutoSaveContext = {
        query: `Read: ${targets.join(', ')}`,
        resultCount: readFiles.length,
        topFiles: readFiles,
        contentSummary: contentPreview,
        logFilePath: logInfo.filePath
    };

    await promptForResearchFindings(projectPath, format, autoSaveCtx);
}
