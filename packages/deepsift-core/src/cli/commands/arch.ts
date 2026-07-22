import { getProjectArchitecture } from '../../utils/architecture.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Executes the project architecture mapping command.
 * Outputs are token-compressed by default.
 */
export async function archCommand(projectPath: string, maxDepth: number, format: OutputFormat, compress: boolean = true) {
    const architectureText = getProjectArchitecture(projectPath, maxDepth, format);
    let finalOutput = architectureText;
    
    if (finalOutput.split('\n').length > 50) {
        finalOutput += '\n\n⚠️  [AI NOTE]: If this output appears truncated in your context window, please use `--depth` to reduce scope, or run `deepsift feature "path"` to analyze specific folders.';
    }

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(architectureText).toUnifiedString();
    }
    
    const logInfo = await saveSearchLog(projectPath, ['[Architecture Scan]'], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Results cached in: ${link}`);
        }
    }
}
