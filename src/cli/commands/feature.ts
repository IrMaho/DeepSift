import path from 'path';
import { getFeatureOutline } from '../../utils/outline.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Generates outline stats and imports for a specific folder feature.
 * Outputs are token-compressed by default.
 */
export function featureCommand(projectPath: string, featureDir: string, format: OutputFormat, compress: boolean = true) {
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
    
    saveSearchLog(projectPath, [`[Feature Outline] ${featureDir}`], finalOutput);
    printResult(finalOutput, format);
}
