import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { Searcher } from '../../core/searcher.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printInfo, OutputFormat } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';

export async function depsCommand(projectPath: string, targetName: string, format: OutputFormat) {
    const store = new SQLiteStore(getDbPath(projectPath));
    const indexer = new Indexer(store);
    const searcher = new Searcher(store);

    printInfo(`Tracing dependencies for '${targetName}'...`);
    await indexer.indexProject(projectPath);

    const results = await searcher.search({ query: targetName, topK: 20, filterType: ['import'] });

    let output: string;
    if (results.length === 0) {
        output = `No files found that explicitly import '${targetName}'.`;
    } else {
        const deps = results.map((r: any) =>
            `- ${r.chunk.filePath} (Score: ${r.score.toFixed(3)})\n  \`\`\`ts\n${r.chunk.content}\n  \`\`\``
        ).join('\n\n');
        output = `The following files depend on '${targetName}':\n\n${deps}`;
    }

    saveSearchLog(projectPath, [`[Dependencies] ${targetName}`], output);
    printResult(output, format);
}
