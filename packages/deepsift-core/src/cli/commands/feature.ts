/**
 * @file feature.ts
 * @description AST Feature Outline Generator Command.
 * Extracts function signatures, exported classes, dependencies, and file purpose summaries for targeted directories.
 * 
 * @module cli/commands/feature
 * @category Core Search & Discovery
 * @since 1.0.0
 */

import path from 'path';
import fs from 'fs';
import { getFeatureOutline } from '../../utils/outline.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Executes the `deepsift feature` command to generate AST feature outlines.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param featureDir Target feature directory or file path.
 * @param format Output format ('markdown', 'plain', or 'json').
 * @param compress Whether to apply DEC_v2 visual token compression.
 * @param limit Max files per page.
 * @param offset Starting file index for pagination.
 * @param summarizeOnly Summary mode displaying top-level exports only.
 * @param maxDepth Max directory depth to traverse.
 * @param groupByFeature Group output by sub-feature directories.
 * @param compact High-density purpose & dependency outline.
 * @param quietCache Suppress log cache print output.
 * @example
 * ```ts
 * await featureCommand(process.cwd(), 'src/core', 'markdown', false, 15, 0, true);
 * ```
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
): Promise<void> {
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
