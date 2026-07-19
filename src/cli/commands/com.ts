import { execSync } from 'child_process';
import { printResult, printSuccess, printError, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { saveSearchLog } from '../../utils/history.js';

export async function comCommand(
    projectPath: string,
    commandStr: string,
    format: OutputFormat,
    compress: boolean = true
) {
    if (!commandStr) {
        throw new Error('No command provided for com command.');
    }

    if (process.platform === 'win32') {
        if (commandStr.trim() === 'ls' || commandStr.match(/^ls\s+/)) {
            commandStr = commandStr.replace(/^ls\b/, 'dir');
        }
    }

    let output = '';
    let success = true;

    try {
        const result = execSync(commandStr, {
            cwd: projectPath,
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer just in case
        });
        output = result;
    } catch (err: any) {
        success = false;
        output = err.stdout ? err.stdout : err.message;
        if (err.stderr) {
            output += '\n' + err.stderr;
        }
    }

    const rawOutput = `--- Command: ${commandStr} ---\n\`\`\`bash\n${output.trim()}\n\`\`\``;
    let finalOutput = rawOutput;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`Command: ${commandStr}`], finalOutput, { skipVisuals: true });
    printResult(finalOutput, format);
    
    if (format !== 'json') {
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        if (success) {
            printSuccess(`Command output cached in: ${link}`);
        } else {
            printError(`Command failed. Output cached in: ${link}`);
        }
    }
}
