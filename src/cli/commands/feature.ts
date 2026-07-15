import path from 'path';
import { getFeatureOutline } from '../../utils/outline.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Generates outline stats and imports for a specific folder feature.
 * Outputs are token-compressed by default.
 */
export async function featureCommand(projectPath: string, featureDir: string, format: OutputFormat, compress: boolean = true) {
    let targetPath = featureDir;
    if (!path.isAbsolute(featureDir)) {
        targetPath = path.join(projectPath, featureDir);
    }

    const outlineText = getFeatureOutline(targetPath);
    let finalOutput = outlineText;
    
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(outlineText).toUnifiedString();
    }
    
    const logInfo = await saveSearchLog(projectPath, [`[Feature Outline] ${featureDir}`], finalOutput);
    printResult(finalOutput, format);
    if (format !== 'json') {
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        printSuccess(`Results cached in: ${link}`);
    }
}
