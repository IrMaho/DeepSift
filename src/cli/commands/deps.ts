import { NativeStore } from '../../storage/native-store.js';
import { Indexer } from '../../core/indexer.js';
import { Searcher } from '../../core/searcher.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, printInfo, OutputFormat } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Traces file dependents and outputs them as a tree.
 * Outputs are token-compressed by default.
 */
export async function depsCommand(projectPath: string, targetName: string, format: OutputFormat, compress: boolean = true) {
    const store = new NativeStore(getDbPath(projectPath));
    const indexer = new Indexer(store);
    const searcher = new Searcher(store);

    printInfo(`Tracing dependencies for '${targetName}'...`);
    await indexer.indexProject(projectPath);

    const results = await searcher.search({ query: targetName, topK: 20, filterType: ['import'] });

    let output: string;
    if (results.length === 0) {
        output = `No files found that explicitly depend on '${targetName}'.`;
    } else {
        output = `🔗 Dependency Tree for '${targetName}':\n`;
        output += `└── 📄 ${targetName}\n`;
        results.forEach((r: any, idx: number) => {
            const prefix = idx === results.length - 1 ? '    └── 📄 ' : '    ├── 📄 ';
            output += `${prefix}${r.chunk.filePath} (Score: ${r.score.toFixed(3)})\n`;
        });
    }

    let finalOutput = output;
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(output).toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`[Dependencies] ${targetName}`], finalOutput, { skipVisuals: !compress });
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
