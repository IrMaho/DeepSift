import fs from 'fs';
import path from 'path';
import { RealmRouter, CrossRealmResult } from '../../core/realm-router.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { ContextInjector } from '../../core/context-injector.js';
import { promptForResearchFindings, AutoSaveContext } from './memo-prompt.js';

export interface SearchOptions {
    skipSync?: boolean;
    verbose?: boolean;
    filterPath?: string;
    compress?: boolean;
    contextLines?: number;
    realm?: string;
    allRealms?: boolean;
    noVisual?: boolean;
    limit?: number;
}


export async function searchCommand(
    projectPath: string, 
    queries: string[], 
    format: OutputFormat, 
    options: SearchOptions = {}
) {
    const router = new RealmRouter(projectPath);
    const targetRealms = options.allRealms ? undefined : (options.realm ? options.realm.split(',').map(r => r.trim()) : undefined);

    if (!options.skipSync) {
        const realmsToSync = targetRealms || ['code'];
        const realmsConfig = router.listRealms();
        for (const rid of realmsToSync) {
            const rConfig = realmsConfig[rid];
            if (rConfig && rConfig.autoIndex === false) {
                printInfo(`[${rid}] Auto-index is disabled. Skipping sync...`);
                continue;
            }
            try {
                const stats = await router.indexRealm(rid, undefined, false, (current, total, file) => {
                    if (options.verbose && format !== 'json') {
                        process.stdout.write(`\r[${rid}] Indexing: ${current}/${total} files (Processing: ${file})`);
                        process.stdout.write('\x1b[K');
                    }
                });
                if (options.verbose && format !== 'json') {
                    process.stdout.write('\n');
                }
                if (stats.newOrUpdated > 0 || stats.deleted > 0) {
                    printInfo(`[${rid}] Auto-synced ${stats.newOrUpdated} modified files.`);
                }
            } catch (e: any) {
                if (e.message.includes('locked')) {
                    printInfo(`[${rid}] Database is locked by another process. Skipping sync...`);
                } else {
                    printInfo(`[${rid}] Skipping sync due to error: ${e.message}`);
                }
            }
        }
    } else {
        // Recovery check if index is empty
        try {
            const store = router.getStore('code');
            const metaMap = await store.getAllMetadata();
            if (metaMap.size === 0) {
                printInfo('ℹ Initial index is empty. Auto-indexing repository...');
                await router.indexRealm('code', undefined, false);
            } else {
                printInfo('Skipping index sync (--no-sync provided). Searching current index...');
            }
        } catch {
            printInfo('Skipping index sync (--no-sync provided). Searching current index...');
        }
    }

    if (queries.length === 1) {
        return executeSingleSearch(router, projectPath, queries[0], format, options, targetRealms);
    }

    return executeMultiSearch(router, projectPath, queries, format, options, targetRealms);
}

function astSymbolFallback(projectPath: string, rawQuery: string): Array<{ file: string; line: number; snippet: string; score: number }> {
    const matches: Array<{ file: string; line: number; snippet: string; score: number }> = [];
    const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage', '.dart_tool', 'venv', '.venv', 'site-packages']);

    const queryClean = rawQuery.trim();
    const queryLower = queryClean.toLowerCase();
    const tokens = queryClean.includes(' ') 
        ? queryClean.split(/\s+/).map(t => t.toLowerCase()).filter(t => t.length >= 2)
        : [queryLower];

    function scan(dir: string) {
        if (!fs.existsSync(dir) || matches.length > 50) return;
        let items: fs.Dirent[];
        try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

        for (const item of items) {
            if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name.toLowerCase())) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scan(fullPath);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                if (['.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go'].includes(ext)) {
                    try {
                        const rel = path.relative(projectPath, fullPath).replace(/\\/g, '/');
                        const relLower = rel.toLowerCase();
                        
                        // Check if file path matches query tokens
                        let pathMatchCount = 0;
                        for (const t of tokens) {
                            if (relLower.includes(t)) pathMatchCount++;
                        }

                        const content = fs.readFileSync(fullPath, 'utf8');
                        const contentLower = content.toLowerCase();

                        // Exact substring match check
                        if (content.includes(queryClean)) {
                            const lines = content.split('\n');
                            lines.forEach((line, idx) => {
                                if (line.includes(queryClean) && matches.length < 50) {
                                    matches.push({ file: rel, line: idx + 1, snippet: line.trim(), score: 10 });
                                }
                            });
                        } else {
                            // Multi-token match check
                            let contentMatchCount = 0;
                            for (const t of tokens) {
                                if (contentLower.includes(t)) contentMatchCount++;
                            }

                            if (pathMatchCount > 0 || contentMatchCount >= Math.min(2, tokens.length)) {
                                const lines = content.split('\n');
                                const totalMatchScore = (pathMatchCount * 3) + contentMatchCount;
                                
                                for (let idx = 0; idx < lines.length; idx++) {
                                    const lineLower = lines[idx].toLowerCase();
                                    const hasToken = tokens.some(t => lineLower.includes(t));
                                    if (hasToken) {
                                        matches.push({ file: rel, line: idx + 1, snippet: lines[idx].trim(), score: totalMatchScore });
                                        break; // Pick first matching line per file
                                    }
                                }
                            }
                        }
                    } catch {}
                }
            }
        }
    }

    scan(projectPath);
    return matches.sort((a, b) => b.score - a.score);
}

async function executeSingleSearch(router: RealmRouter, projectPath: string, query: string, format: OutputFormat, options: SearchOptions, targetRealms?: string[]) {
    const rawResults = await router.searchAllRealms({ query, topK: 5, filterPath: options.filterPath }, targetRealms);
    const results = rawResults.filter(r => r.score >= 0.15);

    if (results.length === 0) {
        const fallbackMatches = astSymbolFallback(projectPath, query.trim());
        if (fallbackMatches.length > 0) {
            const fileMap = new Map<string, number>();
            fallbackMatches.forEach(m => fileMap.set(m.file, (fileMap.get(m.file) || 0) + 1));

            let fallbackText = `ℹ Primary vector search deferred. AST & Path Matcher found **${fallbackMatches.length}** relevant code references for \`${query}\` across **${fileMap.size}** files:\n\n`;
            fallbackMatches.slice(0, 10).forEach(m => {
                fallbackText += `  - 📄 **${m.file}:${m.line}**: \`${m.snippet.substring(0, 75)}\`\n`;
            });
            if (fallbackMatches.length > 10) {
                fallbackText += `  - ... (+${fallbackMatches.length - 10} more matches)\n`;
            }
            fallbackText += `\n💡 **Tip**: Run \`deepsift search "${query}" --sync\` to force vector index synchronization.`;
            printResult(fallbackText, format);
            return;
        }

        const hint = `No relevant code found for: "${query}"

💡 **Search Tips:**
- Try shorter, more specific keywords (e.g. "auth handler" instead of "what are the main features")
- Use \`deepsift arch\` for high-level project structure
- Use \`deepsift analyze "src/path"\` for deep dives into specific folders
- Use \`grep_search\` for exact text/variable name matches`;
        printResult(hint, format);
        return;
    }

    const displayLimit = options.limit || 8;
    const cappedResults = results.slice(0, displayLimit);

    const formattedResults = cappedResults.map((res: CrossRealmResult, i: number) => {
        let contentToDisplay = res.chunk.content;
        let displayStartLine = res.chunk.startLine;
        let displayEndLine = res.chunk.endLine;

        if (options.contextLines !== undefined && options.contextLines > 0) {
            try {
                const fullPath = path.join(projectPath, res.chunk.filePath);
                const fileContent = fs.readFileSync(fullPath, 'utf-8');
                const lines = fileContent.split('\n');
                
                displayStartLine = Math.max(1, res.chunk.startLine - options.contextLines);
                displayEndLine = Math.min(lines.length, res.chunk.endLine + options.contextLines);
                
                contentToDisplay = lines.slice(displayStartLine - 1, displayEndLine).join('\n');
            } catch (err) {
            }
        }
        
        return `${i + 1}. [${res.realmId}] [${res.chunk.filePath}:${displayStartLine}-${displayEndLine}] (score: ${res.score.toFixed(3)}, match: ${res.matchType})\n   Type: ${res.chunk.type}\n   \`\`\`${res.chunk.language}\n${contentToDisplay}\n   \`\`\``;
    }).join('\n\n');

    const injector = new ContextInjector(projectPath);
    const contextStr = injector.formatForOutput(await injector.inject([query]));

    let rawOutput = `${contextStr}Found ${results.length} relevant code sections${results.length > displayLimit ? ` (Showing top ${displayLimit}, pass --limit ${results.length} to view all)` : ''}:\n\n${formattedResults}`;
    if (results.length > displayLimit) {
        rawOutput += `\n\n💡 **Pagination Notice**: Showing top ${displayLimit} of ${results.length} results. Pass \`--limit ${results.length}\` to expand full list.`;
    }
    let finalOutput = rawOutput;
    
    if (options.compress !== false && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [query], finalOutput, { skipVisuals: options.noVisual });
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

    const topFiles = results.slice(0, 5).map(r =>
        `[${r.realmId}] ${r.chunk.filePath}:${r.chunk.startLine}-${r.chunk.endLine} (score: ${r.score.toFixed(3)})`
    );
    const snippetParts = results.slice(0, 3).map(r => {
        const truncated = r.chunk.content.length > 300
            ? r.chunk.content.substring(0, 300) + '...'
            : r.chunk.content;
        return `--- ${r.chunk.filePath}:${r.chunk.startLine} ---\n${truncated}`;
    });

    const autoSaveCtx: AutoSaveContext = {
        query,
        resultCount: results.length,
        topFiles,
        contentSummary: snippetParts.join('\n\n'),
        logFilePath: logInfo.filePath
    };

    await promptForResearchFindings(projectPath, format, autoSaveCtx);
}

async function executeMultiSearch(router: RealmRouter, projectPath: string, queries: string[], format: OutputFormat, options: SearchOptions, targetRealms?: string[]) {
    const allResults: string[] = [];
    let totalHits = 0;
    const allTopFiles: string[] = [];
    const allSnippets: string[] = [];

    for (let i = 0; i < queries.length; i++) {
        const rawResults = await router.searchAllRealms({ query: queries[i], topK: 4, filterPath: options.filterPath }, targetRealms);
        const results = rawResults.filter(r => r.score >= 0.15);
        totalHits += results.length;

        results.slice(0, 3).forEach(r => {
            allTopFiles.push(`[${r.realmId}] ${r.chunk.filePath}:${r.chunk.startLine}-${r.chunk.endLine} (score: ${r.score.toFixed(3)})`);
            const truncated = r.chunk.content.length > 200
                ? r.chunk.content.substring(0, 200) + '...'
                : r.chunk.content;
            allSnippets.push(`--- [Q: "${queries[i]}"] ${r.chunk.filePath}:${r.chunk.startLine} ---\n${truncated}`);
        });

        const formattedResults = results.map((res: CrossRealmResult, j: number) => {
            let contentToDisplay = res.chunk.content;
            let displayStartLine = res.chunk.startLine;
            let displayEndLine = res.chunk.endLine;

            if (options.contextLines !== undefined && options.contextLines > 0) {
                try {
                    const fullPath = path.join(projectPath, res.chunk.filePath);
                    const fileContent = fs.readFileSync(fullPath, 'utf-8');
                    const lines = fileContent.split('\n');
                    
                    displayStartLine = Math.max(1, res.chunk.startLine - options.contextLines);
                    displayEndLine = Math.min(lines.length, res.chunk.endLine + options.contextLines);
                    
                    contentToDisplay = lines.slice(displayStartLine - 1, displayEndLine).join('\n');
                } catch (err) {
                }
            }

            return `    ${j + 1}. [${res.realmId}] [${res.chunk.filePath}:${displayStartLine}-${displayEndLine}] (score: ${res.score.toFixed(3)})\n       \`\`\`${res.chunk.language}\n${contentToDisplay}\n       \`\`\``;
        }).join('\n\n');

        allResults.push(`--- Query ${i + 1}: "${queries[i]}" ---\nFound ${results.length} results:\n${formattedResults}`);
    }

    const injector = new ContextInjector(projectPath);
    const contextStr = injector.formatForOutput(await injector.inject(queries));

    const rawOutput = `${contextStr}Multi-Search Complete. ${queries.length} queries, ${totalHits} total results.\n\n${allResults.join('\n\n')}`;
    let finalOutput = rawOutput;

    if (options.compress !== false && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(rawOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, queries, finalOutput, { skipVisuals: options.noVisual });
    printResult(finalOutput, format);
    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img, idx) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Results cached in: ${link}`);
        }
    }

    const autoSaveCtx: AutoSaveContext = {
        query: queries.join(' | '),
        resultCount: totalHits,
        topFiles: allTopFiles.slice(0, 8),
        contentSummary: allSnippets.slice(0, 5).join('\n\n'),
        logFilePath: logInfo.filePath
    };

    await promptForResearchFindings(projectPath, format, autoSaveCtx);
}
