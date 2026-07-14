import { getProjectArchitecture } from '../../utils/architecture.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Executes the project architecture mapping command.
 * Outputs are token-compressed by default.
 */
export function archCommand(projectPath: string, maxDepth: number, format: OutputFormat, compress: boolean = true) {
    const architectureText = getProjectArchitecture(projectPath, maxDepth);
    let finalOutput = architectureText;
    
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(architectureText).toUnifiedString();
    }
    
    saveSearchLog(projectPath, ['[Architecture Scan]'], finalOutput);
    printResult(finalOutput, format);
}
