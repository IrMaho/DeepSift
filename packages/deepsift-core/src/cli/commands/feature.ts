import path from 'path';
import fs from 'fs';
import { getFeatureOutline } from '../../utils/outline.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Generates outline stats and imports for a specific folder feature.
 * Outputs are token-compressed by default.
 */
export async function featureCommand(
    projectPath: string, 
    featureDir: string, 
    format: OutputFormat, 
    compress: boolean = false, 
    limit?: number, 
    offset?: number,
    summarizeOnly: boolean = false,
    maxDepth?: number,
    groupByFeature: boolean = false,
    compact: boolean = false,
    quietCache: boolean = false
) {
    let targetPath = featureDir;
    if (!path.isAbsolute(featureDir)) {
        let tempPath = path.resolve(process.cwd(), featureDir);
        if (fs.existsSync(tempPath)) {
            targetPath = tempPath;
        } else {
            targetPath = path.resolve(projectPath, featureDir);
        }
    }

    const outlineText = getFeatureOutline(targetPath, limit, offset, summarizeOnly, maxDepth, groupByFeature, format, compact);
    let finalOutput = outlineText;
    
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(finalOutput).toUnifiedString();
    }
    
    const logInfo = await saveSearchLog(projectPath, [`[Feature Outline] ${featureDir}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    if (format !== 'json' && !quietCache) {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Results cached in (Page ${idx + 1}): ${link}`);
            });
        } else if (compress) {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Results cached in: ${link}`);
        }
    }
}
