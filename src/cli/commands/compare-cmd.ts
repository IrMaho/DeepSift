import { RealmRouter } from '../../core/realm-router.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { saveSearchLog } from '../../utils/history.js';

export async function compareCommand(
    projectPath: string, 
    realm1: string, 
    realm2: string, 
    query: string, 
    format: OutputFormat, 
    compress: boolean
) {
    const router = new RealmRouter(projectPath);
    
    printInfo(`Comparing [${realm1}] vs [${realm2}] for query: "${query}"...`);
    
    const { similarities, gaps } = await router.compareRealms(realm1, realm2, query, 10);
    
    let rawOutput = `--- Vector Diff Search (Cross-Reference) ---\n`;
    rawOutput += `Source: [${realm1}] | Target: [${realm2}] | Query: "${query}"\n\n`;
    
    rawOutput += `### 🔄 SIMILARITIES (${similarities.length} matches >= 0.45)\n`;
    rawOutput += `These concepts exist in both realms and are strongly aligned.\n\n`;
    
    if (similarities.length === 0) {
        rawOutput += `No strong similarities found.\n\n`;
    } else {
        similarities.forEach((sim, i) => {
            rawOutput += `${i + 1}. Score: ${sim.similarityScore.toFixed(3)}\n`;
            rawOutput += `   [${realm1}] Source: ${sim.sourceChunk.chunk.filePath}:${sim.sourceChunk.chunk.startLine}\n`;
            rawOutput += `   [${realm2}] Target: ${sim.targetChunk.chunk.filePath}:${sim.targetChunk.chunk.startLine}\n`;
            rawOutput += `   Content Snippet (${realm1}):\n   \`\`\`${sim.sourceChunk.chunk.language}\n${sim.sourceChunk.chunk.content.substring(0, 300)}...\n   \`\`\`\n\n`;
        });
    }

    rawOutput += `### ⚠️ GAPS / DIFFERENCES (${gaps.length} missing/weak matches < 0.45)\n`;
    rawOutput += `These concepts exist in [${realm1}] but have no strong equivalent in [${realm2}].\n\n`;
    
    if (gaps.length === 0) {
        rawOutput += `No gaps found. The realms are highly aligned on this topic.\n\n`;
    } else {
        gaps.forEach((gap, i) => {
            rawOutput += `${i + 1}. Max Target Score: ${gap.similarityScore.toFixed(3)}\n`;
            rawOutput += `   [${realm1}] Source: ${gap.sourceChunk.chunk.filePath}:${gap.sourceChunk.chunk.startLine}\n`;
            if (gap.targetChunk) {
                rawOutput += `   [${realm2}] Best Weak Match: ${gap.targetChunk.chunk.filePath}:${gap.targetChunk.chunk.startLine}\n`;
            } else {
                rawOutput += `   [${realm2}] Best Weak Match: NONE\n`;
            }
            rawOutput += `   Content Snippet (${realm1}):\n   \`\`\`${gap.sourceChunk.chunk.language}\n${gap.sourceChunk.chunk.content.substring(0, 300)}...\n   \`\`\`\n\n`;
        });
    }

    let finalOutput = rawOutput;
    
    if (compress !== false && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`COMPARE: ${query} (${realm1} vs ${realm2})`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Comparison results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Comparison results cached in: ${link}`);
        }
    }
}
