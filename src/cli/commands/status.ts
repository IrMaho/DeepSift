import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { printResult, OutputFormat } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';

export function statusCommand(projectPath: string, format: OutputFormat) {
    const store = new SQLiteStore(getDbPath(projectPath));
    const indexer = new Indexer(store);
    const status = indexer.getStatus();

    if (format === 'json') {
        printResult(JSON.stringify(status), format);
        return;
    }

    const lastUpdatedDate = status.lastUpdated > 0 ? new Date(status.lastUpdated).toLocaleString() : 'Never';
    const output = `Index Status:\n- Total Files Indexed: ${status.totalFiles}\n- Total Chunks: ${status.totalChunks}\n- Last Updated: ${lastUpdatedDate}\n- Currently Indexing: ${status.isIndexing}`;
    printResult(output, format);
}
