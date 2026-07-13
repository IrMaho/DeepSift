import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';

export async function indexCommand(projectPath: string, force: boolean, format: OutputFormat) {
    const store = new SQLiteStore(getDbPath(projectPath));
    const indexer = new Indexer(store);

    printInfo(force ? 'Force re-indexing entire project...' : 'Indexing project (incremental)...');

    const stats = await indexer.indexProject(projectPath, force);

    if (format === 'json') {
        printResult(JSON.stringify(stats), format);
    } else {
        printResult(`Indexing complete. Processed ${stats.files} files and ${stats.chunks} chunks.`, format);
    }

    printSuccess('Index ready.');
}
