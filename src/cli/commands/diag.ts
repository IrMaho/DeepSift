import fs from 'fs';
import path from 'path';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { saveSearchLog } from '../../utils/history.js';

interface IDEProblem {
    path: string;
    message: string;
    severity: string;
    startLine: number;
    endLine: number;
}

export async function diagCommand(
    projectPath: string,
    jsonPath: string,
    format: OutputFormat,
    compress: boolean = true
) {
    if (!jsonPath) {
        throw new Error('Please provide the path to the problems JSON file.');
    }

    const fullJsonPath = path.resolve(projectPath, jsonPath);
    if (!fs.existsSync(fullJsonPath)) {
        throw new Error(`Problems JSON file not found at: ${fullJsonPath}`);
    }

    let problems: IDEProblem[] = [];
    try {
        const raw = fs.readFileSync(fullJsonPath, 'utf-8');
        problems = JSON.parse(raw);
    } catch (err: any) {
        throw new Error(`Failed to parse problems JSON: ${err.message}`);
    }

    if (!Array.isArray(problems)) {
        throw new Error('Problems JSON must be an array of objects.');
    }

    // Group by file
    const problemsByFile = new Map<string, IDEProblem[]>();
    for (const prob of problems) {
        if (!problemsByFile.has(prob.path)) {
            problemsByFile.set(prob.path, []);
        }
        problemsByFile.get(prob.path)!.push(prob);
    }

    const allResults: string[] = [];

    for (const [filePath, fileProblems] of problemsByFile.entries()) {
        const fullPath = path.resolve(projectPath, filePath);
        
        allResults.push(`### File: ${filePath}`);
        
        if (!fs.existsSync(fullPath)) {
            allResults.push(`[Error: File not found]\n`);
            continue;
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            const ext = path.extname(filePath).replace('.', '');

            for (const prob of fileProblems) {
                allResults.push(`**[${prob.severity.toUpperCase()}]** Line ${prob.startLine}: ${prob.message}`);
                
                // Add context (3 lines before, 3 lines after)
                const startIdx = Math.max(0, prob.startLine - 1 - 3);
                const endIdx = Math.min(lines.length - 1, prob.endLine - 1 + 3);
                
                let snippet = '';
                for (let i = startIdx; i <= endIdx; i++) {
                    const lineNum = i + 1;
                    const isErrorLine = lineNum >= prob.startLine && lineNum <= prob.endLine;
                    const prefix = isErrorLine ? '> ' : '  ';
                    snippet += `${prefix}${lineNum} | ${lines[i]}\n`;
                }
                
                allResults.push(`\`\`\`${ext || 'txt'}\n${snippet}\`\`\`\n`);
            }
        } catch (err: any) {
            allResults.push(`[Error reading file: ${err.message}]\n`);
        }
    }

    const rawOutput = allResults.join('\n');
    let finalOutput = rawOutput;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`Diag: ${jsonPath}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Diagnostics read results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Diagnostics read results cached in: ${link}`);
        }
    }
}
