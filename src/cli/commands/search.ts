import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { Searcher } from '../../core/searcher.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { getDbPath } from '../cli-paths.js';

export async function searchCommand(projectPath: string, queries: string[], format: OutputFormat, skipSync: boolean = false, verbose: boolean = false) {
    const store = new SQLiteStore(getDbPath(projectPath));
    const indexer = new Indexer(store);
    const searcher = new Searcher(store);

    if (!skipSync) {
        printInfo('Syncing index before search...');
        try {
            await indexer.indexProject(projectPath, false, (current, total, file) => {
                if (verbose && format !== 'json') {
                    process.stdout.write(`\rIndexing: ${current}/${total} files (Processing: ${file})`);
                    process.stdout.write('\x1b[K');
                }
            });
            if (verbose && format !== 'json') {
                process.stdout.write('\n');
            }
        } catch (e: any) {
            if (e.message.includes('locked')) {
                printInfo('Database is locked by another process. Skipping sync and searching current index...');
            } else {
                throw e;
            }
        }
    } else {
        printInfo('Skipping index sync (--no-sync provided). Searching current index...');
    }

    if (queries.length === 1) {
        return executeSingleSearch(searcher, projectPath, queries[0], format);
    }

    return executeMultiSearch(searcher, projectPath, queries, format);
}

async function executeSingleSearch(searcher: Searcher, projectPath: string, query: string, format: OutputFormat) {
    const results = await searcher.search({ query, topK: 10 });

    if (results.length === 0) {
        printResult('No relevant code found.', format);
        return;
    }

    const formattedResults = results.map((res: any, i: number) => {
        return `${i + 1}. [${res.chunk.filePath}:${res.chunk.startLine}-${res.chunk.endLine}] (score: ${res.score.toFixed(3)}, match: ${res.matchType})\n   Type: ${res.chunk.type}\n   \`\`\`${res.chunk.language}\n${res.chunk.content}\n   \`\`\``;
    }).join('\n\n');

    const output = `Found ${results.length} relevant code sections:\n\n${formattedResults}`;
    saveSearchLog(projectPath, [query], output);
    printResult(output, format);
    printSuccess('Results cached in .deepsift/outputs/');
}

async function executeMultiSearch(searcher: Searcher, projectPath: string, queries: string[], format: OutputFormat) {
    const allResults: string[] = [];
    let totalHits = 0;

    for (let i = 0; i < queries.length; i++) {
        const results = await searcher.search({ query: queries[i], topK: 5 });
        totalHits += results.length;

        const formattedResults = results.map((res: any, j: number) => {
            return `    ${j + 1}. [${res.chunk.filePath}:${res.chunk.startLine}-${res.chunk.endLine}] (score: ${res.score.toFixed(3)})\n       \`\`\`${res.chunk.language}\n${res.chunk.content}\n       \`\`\``;
        }).join('\n\n');

        allResults.push(`--- Query ${i + 1}: "${queries[i]}" ---\nFound ${results.length} results:\n${formattedResults}`);
    }

    const output = `Multi-Search Complete. ${queries.length} queries, ${totalHits} total results.\n\n${allResults.join('\n\n')}`;
    saveSearchLog(projectPath, queries, output);
    printResult(output, format);
    printSuccess('Results cached in .deepsift/outputs/');
}
