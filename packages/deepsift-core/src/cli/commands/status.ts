/**
 * @file status.ts
 * @description Index Statistics & System Status Command.
 * Retrieves database state, total indexed files, chunk counts, and indexing timestamps.
 * 
 * @module cli/commands/status
 * @category Security & Diagnostics
 * @since 1.0.0
 */

import { NativeStore } from '../../storage/native-store.js';
import { Indexer } from '../../core/indexer.js';
import { printResult, OutputFormat } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';

/**
 * Executes the `deepsift status` command to display current index statistics.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param format Output format ('markdown', 'plain', or 'json').
 * @example
 * ```ts
 * await statusCommand(process.cwd(), 'markdown');
 * ```
 */
export async function statusCommand(projectPath: string, format: OutputFormat): Promise<void> {
    const store = new NativeStore(getDbPath(projectPath));
    const indexer = new Indexer(store);
    const status = await indexer.getStatus();

    if (format === 'json') {
        printResult(JSON.stringify(status), format);
        return;
    }

    const lastUpdatedDate = status.lastUpdated > 0 ? new Date(status.lastUpdated).toLocaleString() : 'Never';
    const output = `Index Status:\n- Total Files Indexed: ${status.totalFiles}\n- Total Chunks: ${status.totalChunks}\n- Last Updated: ${lastUpdatedDate}\n- Currently Indexing: ${status.isIndexing}`;
    printResult(output, format);
}
