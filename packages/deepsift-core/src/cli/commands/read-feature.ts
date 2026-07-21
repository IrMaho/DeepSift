import path from 'path';
import fs from 'fs';
import { getFiles } from '../../utils/file-walker.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, printError, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Reads all relevant code files within a feature directory.
 * Combines them and optionally token-compresses the output.
 */
export async function readFeatureCommand(projectPath: string, featureDir: string, format: OutputFormat, compress: boolean = true) {
    let targetPath = featureDir;
    if (!path.isAbsolute(featureDir)) {
        let tempPath = path.resolve(process.cwd(), featureDir);
        if (fs.existsSync(tempPath)) {
            targetPath = tempPath;
        } else {
            targetPath = path.resolve(projectPath, featureDir);
        }
    }

    if (!fs.existsSync(targetPath)) {
        throw new Error(`Directory not found: ${targetPath}`);
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
        throw new Error(`Target is not a directory: ${targetPath}`);
    }

    // Pass the projectPath as the rootDir to getFiles to respect global configs,
    // but filter for the targetPath
    const allProjectFiles = await getFiles(projectPath);
    
    // Convert targetPath to cross-platform standard representation for checking prefix
    const targetPathNormalized = targetPath.replace(/\\/g, '/');
    const featureFiles = allProjectFiles.filter(file => {
        const fileNormalized = file.replace(/\\/g, '/');
        return fileNormalized.startsWith(targetPathNormalized);
    });

    if (featureFiles.length === 0) {
        throw new Error(`No relevant code files found in directory: ${targetPath}`);
    }

    const allResults: string[] = [];

    for (const filePath of featureFiles) {
        const relPath = path.relative(projectPath, filePath).replace(/\\/g, '/');
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath).replace('.', '');
            allResults.push(`--- File: ${relPath} ---\n\`\`\`${ext}\n${content}\n\`\`\``);
        } catch (err: any) {
            allResults.push(`--- File: ${relPath} ---\n[Error reading file: ${err.message}]`);
        }
    }

    const rawOutput = allResults.join('\n\n');
    let finalOutput = rawOutput;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`[Read Feature] ${featureDir}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Feature code results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Feature code results cached in: ${link}`);
        }
    }
}
