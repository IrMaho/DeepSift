import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';

export async function indexCommand(projectPath: string, force: boolean, format: OutputFormat, verbose: boolean = false) {
    const store = new SQLiteStore(getDbPath(projectPath));
    const indexer = new Indexer(store);

    printInfo(force ? 'Force re-indexing entire project...' : 'Indexing project (incremental)...');

    const stats = await indexer.indexProject(projectPath, force, (current, total, file) => {
        if (verbose && format !== 'json') {
            process.stdout.write(`\rIndexing: ${current}/${total} files (Processing: ${file})`);
            // Clear rest of the line
            process.stdout.write('\x1b[K');
        }
    });

    if (verbose && format !== 'json') {
        process.stdout.write('\n'); // newline after progress bar
    }

    if (format === 'json') {
        printResult(JSON.stringify(stats), format);
    } else {
        printResult(`Indexing complete. Processed ${stats.files} files and ${stats.chunks} chunks.`, format);
    }

    printSuccess('Index ready.');
}
