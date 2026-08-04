/**
 * @file search.ts
 * @description Hybrid Semantic & BM25 Search Command Engine.
 * Executes vector semantic search, BM25 lexical retrieval, Graphify PageRank boosting,
 * AST symbol fallbacks, and token compression for multi-realm codebases.
 * 
 * @module cli/commands/search
 * @category Core Search & Discovery
 * @since 1.0.0
 */

import fs from 'fs';
import path from 'path';

const BULB = '\u{1F4A1}';
import { RealmRouter, CrossRealmResult } from '../../core/realm-router.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { ContextInjector } from '../../core/context-injector.js';
import { promptForResearchFindings, AutoSaveContext } from './memo-prompt.js';

/**
 * Options interface for controlling semantic search execution.
 */
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
    fast?: boolean;
    rerankCandidates?: number;
    showContext?: boolean;
    allResults?: boolean;
}

function formatSnippet(content: string, filePath: string, startLine: number, endLine: number): string {
    const cleaned = content
        .replace(/\/\* DEEPSIFT CONTEXT:?[\s\S]*?\*\//g, '')
        .replace(/\/\/ DEEPSIFT CONTEXT:?.*(\r?\n|$)/g, '')
        .trim();
    const lines = cleaned.split('\n');
    if (lines.length <= 50) {
        return cleaned;
    }
    const omittedCount = lines.length - 40;
    const first35 = lines.slice(0, 35).join('\n');
    const last5 = lines.slice(lines.length - 5).join('\n');
    return `${first35}\n// ... (${omittedCount} lines omitted. Use 'deepsift read "${filePath}:${startLine}-${endLine}"' for full code) ...\n${last5}`;
}

/**
 * Executes the `deepsift search` command across single or multiple queries.
 * 
 * @param projectPath Absolute path to the workspace root.
 * @param queries Array of search query strings.
 * @param format Output format ('markdown', 'plain', or 'json').
 * @param options Search execution options (skipSync, filterPath, limit).
 * @example
 * ```ts
 * await searchCommand(process.cwd(), ['authentication store'], 'markdown', { limit: 10 });
 * ```
 */
import { fileURLToPath } from 'url';

export async function searchCommand(
    projectPath: string, 
    queries: string[], 
    format: OutputFormat, 
    options: SearchOptions = {}
): Promise<void> {
    const router = new RealmRouter(projectPath);
    const targetRealms = options.allRealms ? undefined : (options.realm ? options.realm!.split(',').map(r => r.trim()) : undefined);

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

/**
 * @param projectPath The root directory to scan.
 * @param query The exact string to locate.
 * @returns Array of fallback matches.
 */
export function astSymbolFallback(projectPath: string, query: string): { file: string, line: number, snippet: string, score: number }[] {
    const matches: { file: string, line: number, snippet: string, score: number }[] = [];
    const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage', '.dart_tool', 'venv', '.venv', 'site-packages']);

    const queryClean = query.trim();
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
                        
                        let pathMatchCount = 0;
                        for (const t of tokens) {
                            if (relLower.includes(t)) pathMatchCount++;
                        }

                        const content = fs.readFileSync(fullPath, 'utf8');
                        const contentLower = content.toLowerCase();

                        if (content.includes(queryClean)) {
                            const lines = content.split('\n');
                            lines.forEach((line, idx) => {
                                if (line.includes(queryClean) && matches.length < 50) {
                                    matches.push({ file: rel, line: idx + 1, snippet: line.trim(), score: 10 });
                                }
                            });
                        } else {
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
                                        break;
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

/**
 * Handles single query vector and BM25 search.
 */
async function executeSingleSearch(router: RealmRouter, projectPath: string, query: string, format: OutputFormat, options: SearchOptions, targetRealms?: string[]) {
    const rawResults = await router.searchAllRealms({ query, topK: options.limit || 15, filterPath: options.filterPath }, targetRealms);
    
    const results = rawResults;

    if (results.length === 0) {
        const fallbackMatches = astSymbolFallback(projectPath, query.trim());
        
        if (fallbackMatches.length > 0 && format !== 'json') {
            const fileMap = new Map<string, number>();
            fallbackMatches.forEach(m => fileMap.set(m.file, (fileMap.get(m.file) || 0) + 1));

            let fallbackText = `ℹ AST & Path Matcher found **${fallbackMatches.length}** relevant code references across **${fileMap.size}** files:\n`;
            fallbackMatches.slice(0, 5).forEach(m => {
                fallbackText += `  - 📄 **${m.file}:${m.line}**: \`${m.snippet.substring(0, 75)}\`\n`;
            });
            console.log(fallbackText);
        } else {
            const hint = `No relevant code found for: "${query}"\n\n💡 **Search Tips:**\n- Try shorter, more specific keywords (e.g. "auth handler")\n- Use \`deepsift arch\` for high-level project structure\n- Use \`grep_search\` for exact text/variable name matches`;
            printResult(hint, format);
        }
        return;
    }

    const displayLimit = options.limit ? options.limit : (options.allResults ? Math.min(20, results.length) : 1);
    const cappedResults = results.slice(0, displayLimit);

    let anyTruncated = false;
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

        const relPath = path.isAbsolute(res.chunk.filePath)
            ? path.relative(projectPath, res.chunk.filePath).replace(/\\/g, '/')
            : res.chunk.filePath.replace(/\\/g, '/');
        const snippet = formatSnippet(contentToDisplay, relPath, displayStartLine, displayEndLine);
        if (snippet !== contentToDisplay) anyTruncated = true;
        const realmTag = (res.realmId && res.realmId !== 'default' && res.realmId !== 'workspace') ? `[${res.realmId}] ` : '';
        return `${i + 1}. ${realmTag}[${relPath}:${displayStartLine}-${displayEndLine}] (score: ${res.score.toFixed(3)})\n   \`\`\`${res.chunk.language}\n${snippet}\n   \`\`\``;
    }).join('\n\n');

    let contextStr = '';
    if (options.showContext) {
        const injector = new ContextInjector(projectPath);
        contextStr = injector.formatForOutput(await injector.inject([query]));
    }

    let rawOutput = `${contextStr}Found ${results.length} relevant code sections${results.length > displayLimit ? ` (Showing top ${displayLimit}, pass --top ${results.length} or --all to view all)` : ''}:\n\n${formattedResults}`;
    if (results.length > displayLimit && !options.allResults) {
        rawOutput += `\n\n${BULB} **Pagination Notice**: Showing top ${displayLimit} of ${results.length} results. Pass \`--top 5\` or \`--all\` to expand full list.`;
    }
    if (results.length > displayLimit || anyTruncated) {
        rawOutput += `\n\n${BULB} Use \`deepsift read <file:line>\` for full file context.`;
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
        const firstLine = r.chunk.content.split('\n')[0] || '';
        return `[${r.chunk.filePath}:${r.chunk.startLine}] ${firstLine.substring(0, 80)}`;
    });

    const memoCtx: AutoSaveContext = {
        query: query,
        resultCount: results.length,
        topFiles,
        contentSummary: snippetParts.join(' | ')
    };
    await promptForResearchFindings(projectPath, format, memoCtx);
}

/**
 * Handles multi-query parallel vector and BM25 search.
 */
async function executeMultiSearch(router: RealmRouter, projectPath: string, queries: string[], format: OutputFormat, options: SearchOptions, targetRealms?: string[]) {
    let combinedOutput = `# 🔍 Multi-Query Search Results (${queries.length} Queries)\n\n`;
    const allResultsMap = new Map<string, CrossRealmResult>();

    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        let parsedTypes = undefined;
        const rawResults = await router.searchAllRealms({ query, topK: options.limit || 20, filterType: parsedTypes, filterPath: options.filterPath }, targetRealms);
        const results = rawResults.filter(r => r.score >= 0.15);

        combinedOutput += `## Query ${i + 1}: "${query}"\n`;
        if (results.length === 0) {
            const fallbackMatches = astSymbolFallback(projectPath, query.trim());
            if (fallbackMatches.length > 0) {
                combinedOutput += `ℹ AST & Path Matcher found **${fallbackMatches.length}** code references:\n`;
                fallbackMatches.slice(0, 5).forEach(m => {
                    combinedOutput += `  - 📄 **${m.file}:${m.line}**: \`${m.snippet.substring(0, 70)}\`\n`;
                });
                combinedOutput += '\n';
                continue;
            }
            combinedOutput += `⚠️ No relevant code found.\n\n`;
            continue;
        }

        const displayLimit = options.limit ? options.limit : (options.allResults ? Math.min(10, results.length) : 1);
        let anyTruncated = false;
        results.slice(0, displayLimit).forEach((res, idx) => {
            const key = `${res.realmId}:${res.chunk.filePath}:${res.chunk.startLine}`;
            allResultsMap.set(key, res);
            const relPath = path.isAbsolute(res.chunk.filePath)
                ? path.relative(projectPath, res.chunk.filePath).replace(/\\/g, '/')
                : res.chunk.filePath.replace(/\\/g, '/');
            const snippet = formatSnippet(res.chunk.content, relPath, res.chunk.startLine, res.chunk.endLine);
            if (snippet !== res.chunk.content) anyTruncated = true;
            const realmTag = (res.realmId && res.realmId !== 'default' && res.realmId !== 'workspace') ? `[${res.realmId}] ` : '';
            combinedOutput += `${idx + 1}. ${realmTag}[${relPath}:${res.chunk.startLine}-${res.chunk.endLine}] (score: ${res.score.toFixed(3)})\n   \`\`\`${res.chunk.language}\n${snippet}\n   \`\`\`\n`;
        });
        if (results.length > displayLimit || anyTruncated) {
            combinedOutput += `${BULB} Use \`deepsift read <file:line>\` for full file context.\n`;
        }
        combinedOutput += '\n';
    }

    let finalOutput = combinedOutput;
    if (options.compress !== false && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        const payload = optimizer.optimize(combinedOutput);
        finalOutput = payload.toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, queries, finalOutput, { skipVisuals: options.noVisual });
    printResult(finalOutput, format);
    if (format !== 'json') {
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        printSuccess(`Multi-search results cached in: ${link}`);
    }

    const allResArray = Array.from(allResultsMap.values());
    const topFiles = allResArray.slice(0, options.limit || 5).map(r =>
        `[${r.realmId}] ${r.chunk.filePath}:${r.chunk.startLine}-${r.chunk.endLine}`
    );
    const memoCtx: AutoSaveContext = {
        query: queries.join(', '),
        resultCount: allResultsMap.size,
        topFiles,
        contentSummary: `Multi-query search across ${queries.length} queries returned ${allResultsMap.size} distinct code matches.`
    };
    await promptForResearchFindings(projectPath, format, memoCtx);
}
