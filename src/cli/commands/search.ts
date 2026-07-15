import fs from 'fs';
import path from 'path';
import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { Searcher } from '../../core/searcher.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { getDbPath } from '../cli-paths.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { ContextInjector } from '../../core/context-injector.js';

export async function searchCommand(
    projectPath: string, 
    queries: string[], 
    format: OutputFormat, 
    skipSync: boolean = false, 
    verbose: boolean = false, 
    filterPath?: string,
    compress: boolean = true,
    contextLines?: number
) {
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
        return executeSingleSearch(searcher, projectPath, queries[0], format, filterPath, compress, contextLines);
    }

    return executeMultiSearch(searcher, projectPath, queries, format, filterPath, compress, contextLines);
}

async function executeSingleSearch(searcher: Searcher, projectPath: string, query: string, format: OutputFormat, filterPath?: string, compress: boolean = true, contextLines?: number) {
    const results = await searcher.search({ query, topK: 10, filterPath });

    if (results.length === 0) {
        printResult('No relevant code found.', format);
        return;
    }

    const formattedResults = results.map((res: any, i: number) => {
        let contentToDisplay = res.chunk.content;
        let displayStartLine = res.chunk.startLine;
        let displayEndLine = res.chunk.endLine;

        if (contextLines !== undefined && contextLines > 0) {
            try {
                const fullPath = path.join(projectPath, res.chunk.filePath);
                const fileContent = fs.readFileSync(fullPath, 'utf-8');
                const lines = fileContent.split('\n');
                
                displayStartLine = Math.max(1, res.chunk.startLine - contextLines);
                displayEndLine = Math.min(lines.length, res.chunk.endLine + contextLines);
                
                contentToDisplay = lines.slice(displayStartLine - 1, displayEndLine).join('\n');
            } catch (err) {
                // Ignore and use original chunk content
            }
        }
        
        return `${i + 1}. [${res.chunk.filePath}:${displayStartLine}-${displayEndLine}] (score: ${res.score.toFixed(3)}, match: ${res.matchType})\n   Type: ${res.chunk.type}\n   \`\`\`${res.chunk.language}\n${contentToDisplay}\n   \`\`\``;
    }).join('\n\n');

    const injector = new ContextInjector(projectPath);
    const contextStr = injector.formatForOutput(injector.inject([query]));

    const rawOutput = `${contextStr}Found ${results.length} relevant code sections:\n\n${formattedResults}`;
    let finalOutput = rawOutput;
    
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [query], finalOutput);
    printResult(finalOutput, format);
    if (format !== 'json') {
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        printSuccess(`Results cached in: ${link}`);
    }
}

async function executeMultiSearch(searcher: Searcher, projectPath: string, queries: string[], format: OutputFormat, filterPath?: string, compress: boolean = true, contextLines?: number) {
    const allResults: string[] = [];
    let totalHits = 0;

    for (let i = 0; i < queries.length; i++) {
        const results = await searcher.search({ query: queries[i], topK: 5, filterPath });
        totalHits += results.length;

        const formattedResults = results.map((res: any, j: number) => {
            let contentToDisplay = res.chunk.content;
            let displayStartLine = res.chunk.startLine;
            let displayEndLine = res.chunk.endLine;

            if (contextLines !== undefined && contextLines > 0) {
                try {
                    const fullPath = path.join(projectPath, res.chunk.filePath);
                    const fileContent = fs.readFileSync(fullPath, 'utf-8');
                    const lines = fileContent.split('\n');
                    
                    displayStartLine = Math.max(1, res.chunk.startLine - contextLines);
                    displayEndLine = Math.min(lines.length, res.chunk.endLine + contextLines);
                    
                    contentToDisplay = lines.slice(displayStartLine - 1, displayEndLine).join('\n');
                } catch (err) {
                    // Ignore and use original chunk content
                }
            }

            return `    ${j + 1}. [${res.chunk.filePath}:${displayStartLine}-${displayEndLine}] (score: ${res.score.toFixed(3)})\n       \`\`\`${res.chunk.language}\n${contentToDisplay}\n       \`\`\``;
        }).join('\n\n');

        allResults.push(`--- Query ${i + 1}: "${queries[i]}" ---\nFound ${results.length} results:\n${formattedResults}`);
    }

    const injector = new ContextInjector(projectPath);
    const contextStr = injector.formatForOutput(injector.inject(queries));

    const rawOutput = `${contextStr}Multi-Search Complete. ${queries.length} queries, ${totalHits} total results.\n\n${allResults.join('\n\n')}`;
    let finalOutput = rawOutput;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, queries, finalOutput);
    printResult(finalOutput, format);
    if (format !== 'json') {
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        printSuccess(`Results cached in: ${link}`);
    }
}
