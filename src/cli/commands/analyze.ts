import path from 'path';
import fs from 'fs';
import { getFeatureOutline } from '../../utils/outline.js';
import { loadDNA } from '../../intelligence/project-dna.js';
import { processDnaFilters } from './dna.js';
import { printResult, printSuccess, printError, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { saveSearchLog } from '../../utils/history.js';

/**
 * Super-command: Analyzes a specific path by combining Feature Outline and DNA Intelligence.
 */
export async function analyzeCommand(
    projectPath: string,
    targetDir: string,
    format: OutputFormat,
    compress: boolean = false,
    limit?: number,
    offset?: number,
    summarizeOnly: boolean = false
) {
    let targetPath = targetDir;
    if (!path.isAbsolute(targetDir)) {
        let tempPath = path.resolve(process.cwd(), targetDir);
        if (fs.existsSync(tempPath)) {
            targetPath = tempPath;
        } else {
            targetPath = path.resolve(projectPath, targetDir);
        }
    }

    if (!fs.existsSync(targetPath)) {
        printError(`Target path not found: ${targetPath}`);
        return;
    }

    // 1. Get Feature Outline
    const outlineText = getFeatureOutline(targetPath, limit ?? 20, offset ?? 0, summarizeOnly);

    // 2. Get DNA for this specific path
    const dna = loadDNA(projectPath);
    let dnaText = '';

    if (dna) {
        // We filter DNA looking for mentions of this path
        // We use the relative path for matching inside DNA
        const relPath = path.relative(projectPath, targetPath).replace(/\\/g, '/');
        
        let filteredDna = processDnaFilters(dna, relPath, undefined, limit, offset ?? 0, false);
        
        if (filteredDna && typeof filteredDna === 'object') {
            // Prune graph data
            if (filteredDna.graph) delete filteredDna.graph;
            if (filteredDna.architecture && filteredDna.architecture.graph) delete filteredDna.architecture.graph;
            
            dnaText = `### DNA Intelligence for \`${relPath}\`\n\n\`\`\`json\n` + JSON.stringify(filteredDna, null, 2) + `\n\`\`\`\n`;
        } else {
            dnaText = `### DNA Intelligence for \`${relPath}\`\n\nNo specific DNA rules or architecture nodes found for this path.\n`;
        }
    } else {
        dnaText = `### DNA Intelligence\n\nNo DNA found. Run \`deepsift dna\` to generate it first.\n`;
    }

    let finalOutput = `# 🔍 DeepSift Analysis Report\n\n${dnaText}\n\n---\n\n${outlineText}`;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(finalOutput).toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`[Analyze] ${targetDir}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Analysis cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Analysis cached in: ${link}`);
        }
    }
}
