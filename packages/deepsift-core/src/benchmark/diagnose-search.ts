import path from 'path';
import { fileURLToPath } from 'url';
import { Searcher } from '../core/searcher.js';
import { NativeStore } from '../storage/native-store.js';
import { DEFAULT_REALM } from '../cli/cli-paths.js';
import { RealmRouter } from '../core/realm-router.js';
import { getEmbedding, terminateWorkers } from '../core/embedder.js';
import { SearchResult } from '../types/index.js';
import { applyRRF } from '../utils/similarity.js';
import { loadDNA } from '../intelligence/project-dna.js';

interface BenchmarkQuery {
    query: string;
    expectedFiles: string[];
    expectedMinPosition: number;
    category: 'semantic' | 'keyword' | 'hybrid' | 'structural';
}

const BENCHMARK_QUERIES: BenchmarkQuery[] = [
    { query: "how does hybrid search combine BM25 and vector results", expectedFiles: ["src/core/searcher.ts", "src/utils/similarity.ts"], expectedMinPosition: 2, category: "semantic" },
    { query: "SIFT quantization embedding compression", expectedFiles: ["src/utils/similarity.ts", "src/storage/native-store.ts"], expectedMinPosition: 3, category: "keyword" },
    { query: "MCP tool registration", expectedFiles: ["src/server.ts"], expectedMinPosition: 1, category: "keyword" },
    { query: "incremental indexing file hash comparison", expectedFiles: ["src/core/indexer.ts"], expectedMinPosition: 2, category: "semantic" },
    { query: "realm routing multi-database search", expectedFiles: ["src/core/realm-router.ts"], expectedMinPosition: 2, category: "semantic" },
    { query: "graph node Louvain clustering", expectedFiles: ["src/graphify/graph-cluster.ts", "src/graphify/graph-builder.ts"], expectedMinPosition: 3, category: "keyword" },
    { query: "AST parsing chunk extraction", expectedFiles: ["src/parsers/ast-chunker.ts"], expectedMinPosition: 1, category: "keyword" },
    { query: "embedding worker thread pool", expectedFiles: ["src/core/embedder.ts"], expectedMinPosition: 1, category: "semantic" },
    { query: "cross-encoder reranking", expectedFiles: ["src/core/reranker.ts"], expectedMinPosition: 2, category: "semantic" },
    { query: "token compression DEC optimization", expectedFiles: ["src/utils/token-compressor.ts", "src/utils/toon-serializer.ts"], expectedMinPosition: 3, category: "hybrid" },
    { query: "DNA fingerprint project analysis", expectedFiles: ["src/cli/commands/dna.ts"], expectedMinPosition: 2, category: "hybrid" },
    { query: "search command output formatting", expectedFiles: ["src/cli/commands/search.ts"], expectedMinPosition: 1, category: "structural" },
    { query: "zig native daemon bridge IPC", expectedFiles: ["src/storage/zig-bridge.ts", "src/storage/native-store.ts"], expectedMinPosition: 3, category: "keyword" },
    { query: "error handling catch block categorization", expectedFiles: ["src/cli/cli-entry.ts", "src/server.ts"], expectedMinPosition: 3, category: "semantic" },
    { query: "binary file detection skip", expectedFiles: ["src/utils/binary-check.ts"], expectedMinPosition: 1, category: "keyword" },
    { query: "schema drift UI backend synchronization check", expectedFiles: ["src/cli/commands/schema-drift.ts"], expectedMinPosition: 2, category: "hybrid" },
    { query: "dead code detection unreferenced exports", expectedFiles: ["src/cli/commands/dead-code.ts"], expectedMinPosition: 2, category: "semantic" },
    { query: "git churn complexity risk score heatmap", expectedFiles: ["src/cli/cli-entry.ts", "src/analyzers/git-churn-miner.ts"], expectedMinPosition: 2, category: "hybrid" },
    { query: "AST safe scope symbol rename refactoring", expectedFiles: ["src/cli/commands/refactor.ts", "src/analyzers/refactor-engine.ts"], expectedMinPosition: 2, category: "structural" },
    { query: "dynamic research memory DRM notes and tags", expectedFiles: ["src/cli/commands/memo.ts", "src/cli/commands/memo-prompt.ts"], expectedMinPosition: 2, category: "semantic" }
];

function normalizeFilePath(projectRoot: string, filePath: string): string {
    let clean = filePath.replace(/\\/g, '/');
    const cleanRoot = projectRoot.replace(/\\/g, '/');
    
    if (path.isAbsolute(filePath)) {
        clean = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    } else if (clean.startsWith(cleanRoot + '/')) {
        clean = clean.substring(cleanRoot.length + 1);
    }
    return clean.replace(/^(\.\/|\/)+/, '');
}

function matchesExpected(normalizedActual: string, expectedFiles: string[]): boolean {
    const act = normalizedActual.replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '');
    return expectedFiles.some(exp => {
        const cleanExp = exp.replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '');
        return act === cleanExp || act.endsWith('/' + cleanExp) || cleanExp.endsWith('/' + act);
    });
}

function getMrrAndFirstRank(actualTopFiles: string[], expectedFiles: string[]): { mrr: number; firstRank: number | null } {
    for (let i = 0; i < actualTopFiles.length; i++) {
        if (matchesExpected(actualTopFiles[i], expectedFiles)) {
            return { mrr: 1 / (i + 1), firstRank: i + 1 };
        }
    }
    return { mrr: 0, firstRank: null };
}

async function runRrfFallback(store: NativeStore, query: string, queryVectorF32: Float32Array): Promise<SearchResult[]> {
    const keywordResultsRaw = await store.searchKeyword(query, 50);
    const semanticResultsRaw = await store.searchSemantic(queryVectorF32, 50);

    let structuralWeights: Map<string, number> | undefined;
    try {
        const dna = await loadDNA(process.cwd());
        if (dna && dna.architecture && dna.architecture.coreFiles) {
            structuralWeights = new Map<string, number>();
            dna.architecture.coreFiles.forEach((f: string) => structuralWeights!.set(f, 1.5));
        }
    } catch {}

    const combined = applyRRF(semanticResultsRaw, keywordResultsRaw, 60, structuralWeights);
    let candidates = combined;

    const tokens = Searcher.tokenizeQuery(query);
    if (tokens.length >= 2) {
        const relaxedResultsMap = new Map<string, SearchResult>();

        for (const token of tokens) {
            const subKw = await store.searchKeyword(token, 20);
            for (const item of subKw) {
                const existing = relaxedResultsMap.get(item.chunk.id);
                if (existing) {
                    existing.score += 0.10;
                } else {
                    relaxedResultsMap.set(item.chunk.id, {
                        ...item,
                        score: 0.15,
                        matchType: 'relaxed_keyword'
                    });
                }
            }
        }

        for (const res of relaxedResultsMap.values()) {
            const filePathLower = res.chunk.filePath.toLowerCase();
            const contentLower = res.chunk.content.toLowerCase();
            let matchedTokenCount = 0;

            for (const t of tokens) {
                if (filePathLower.includes(t)) {
                    res.score += 0.10;
                    matchedTokenCount++;
                } else if (contentLower.includes(t)) {
                    res.score += 0.03;
                    matchedTokenCount++;
                }
            }

            if (matchedTokenCount === tokens.length) {
                res.score += 0.10;
            }
        }

        const relaxedSorted = Array.from(relaxedResultsMap.values());
        if (relaxedSorted.length > 0) {
            const merged = [...candidates, ...relaxedSorted];
            const seenIds = new Set<string>();
            const deduplicated: SearchResult[] = [];

            for (const item of merged) {
                if (!seenIds.has(item.chunk.id)) {
                    seenIds.add(item.chunk.id);
                    deduplicated.push(item);
                }
            }
            candidates = deduplicated;
        }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 10);
}

async function runDiagnosis() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const defaultProjectPath = path.resolve(__dirname, '../..');
    const projectPath = path.resolve(process.argv[2] || defaultProjectPath);

    const router = new RealmRouter(projectPath);
    console.log(`[Diagnostic] Indexing codebase (realm: '${DEFAULT_REALM}')...`);
    await router.indexRealm(DEFAULT_REALM, projectPath, false);
    const store = router.getStore('code');
    const searcher = new Searcher(store);

    let hybridUsedCount = 0;
    let rrfUsedCount = 0;
    const hybridMrrs: number[] = [];
    const rrfMrrs: number[] = [];

    const hybridWins: string[] = [];
    const rrfWins: string[] = [];
    const ties: string[] = [];

    interface QueryReport {
        id: string;
        query: string;
        expectedFiles: string[];
        got: string;
        mrr: number;
        usedPath: 'hybridNative' | 'RRF fallback';
    }

    const allReports: QueryReport[] = [];

    try {
        for (let idx = 0; idx < BENCHMARK_QUERIES.length; idx++) {
            const q = BENCHMARK_QUERIES[idx];
            const qId = `Q${idx + 1}`;
            const queryVector = await getEmbedding(q.query);

            const directHybridRaw = await store.searchHybridNative(q.query, queryVector, 10);
            const directHybrid = directHybridRaw || [];

            const rrfResults = await runRrfFallback(store, q.query, queryVector);

            const searchResults = await searcher.search({ query: q.query, topK: 10 });

            const usedHybrid = directHybrid.length > 0;
            if (usedHybrid) {
                hybridUsedCount++;
            } else {
                rrfUsedCount++;
            }

            const searchFiles = searchResults.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const searchMetrics = getMrrAndFirstRank(searchFiles, q.expectedFiles);

            const directHybridFiles = directHybrid.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const hybridMetrics = getMrrAndFirstRank(directHybridFiles, q.expectedFiles);

            const rrfFiles = rrfResults.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const rrfMetrics = getMrrAndFirstRank(rrfFiles, q.expectedFiles);

            if (usedHybrid) {
                hybridMrrs.push(searchMetrics.mrr);
            } else {
                rrfMrrs.push(searchMetrics.mrr);
            }

            if (hybridMetrics.mrr > rrfMetrics.mrr) {
                hybridWins.push(qId);
            } else if (rrfMetrics.mrr > hybridMetrics.mrr) {
                rrfWins.push(qId);
            } else {
                ties.push(qId);
            }

            const foundCount = q.expectedFiles.filter(exp => 
                searchFiles.some(act => matchesExpected(act, [exp]))
            ).length;

            console.log('================================================================================');
            console.log(`${qId}: "${q.query}"`);
            console.log(`  Expected: ${q.expectedFiles.join(', ')}`);
            console.log(`  Category: ${q.category}`);
            console.log('--------------------------------------------------------------------------------');

            if (directHybrid.length > 0) {
                console.log(`  [DIAGNOSTIC] hybridNative returned: ${directHybrid.length} results`);
                directHybrid.slice(0, 5).forEach((r, i) => {
                    const normPath = normalizeFilePath(projectPath, r.chunk.filePath);
                    const lineInfo = r.chunk.startLine && r.chunk.endLine ? `:${r.chunk.startLine}-${r.chunk.endLine}` : '';
                    const isExp = matchesExpected(normPath, q.expectedFiles) ? '  ← EXPECTED' : '';
                    console.log(`    #${i + 1} [score: ${r.score.toFixed(3)}] ${normPath}${lineInfo}${isExp}`);
                });
            } else {
                console.log(`  [DIAGNOSTIC] hybridNative returned: 0 results → fell through to RRF`);
            }

            console.log('  Top-10 Results:');
            searchResults.forEach((r, i) => {
                const normPath = normalizeFilePath(projectPath, r.chunk.filePath);
                const lineInfo = r.chunk.startLine && r.chunk.endLine ? `:${r.chunk.startLine}-${r.chunk.endLine}` : '';
                const isExp = matchesExpected(normPath, q.expectedFiles) ? `  ← EXPECTED (rank ${i + 1})` : '';
                const matchStr = r.matchType || 'hybrid';
                console.log(`    #${i + 1} [score: ${r.score.toFixed(3)}, match: ${matchStr.padEnd(7)}]     ${normPath}${lineInfo}${isExp}`);
            });

            console.log(`  Expected files found: ${foundCount}/${q.expectedFiles.length}`);
            console.log(`  First expected at rank: ${searchMetrics.firstRank !== null ? searchMetrics.firstRank : 'none'}`);
            console.log(`  MRR: ${searchMetrics.mrr.toFixed(3)}`);
            console.log('================================================================================\n');

            allReports.push({
                id: qId,
                query: q.query,
                expectedFiles: q.expectedFiles,
                got: searchFiles[0] || 'none',
                mrr: searchMetrics.mrr,
                usedPath: usedHybrid ? 'hybridNative' : 'RRF fallback'
            });
        }
    } finally {
        try {
            store.close();
        } catch {}
        terminateWorkers();
    }

    const meanHybridMrr = hybridMrrs.length > 0 ? hybridMrrs.reduce((a, b) => a + b, 0) / hybridMrrs.length : 0;
    const meanRrfMrr = rrfMrrs.length > 0 ? rrfMrrs.reduce((a, b) => a + b, 0) / rrfMrrs.length : 0;

    const worstQueries = [...allReports].sort((a, b) => a.mrr - b.mrr).slice(0, 5);

    console.log('================================================================================');
    console.log('DIAGNOSTIC SUMMARY');
    console.log('================================================================================');
    console.log(`Queries where hybridNative was used: ${hybridUsedCount}/${BENCHMARK_QUERIES.length}`);
    console.log(`Queries where RRF fallback was used: ${rrfUsedCount}/${BENCHMARK_QUERIES.length}\n`);

    console.log(`hybridNative MRR: ${meanHybridMrr.toFixed(3)} (${hybridUsedCount} queries)`);
    console.log(`RRF fallback MRR: ${meanRrfMrr.toFixed(3)} (${rrfUsedCount} queries)\n`);

    console.log('Per-query breakdown:');
    console.log(`  hybridNative wins:  ${hybridWins.length > 0 ? hybridWins.join(', ') : 'None'}`);
    console.log(`  RRF fallback wins:  ${rrfWins.length > 0 ? rrfWins.join(', ') : 'None'}`);
    console.log(`  Ties:               ${ties.length > 0 ? ties.join(', ') : 'None'}\n`);

    console.log('Worst 5 queries (lowest MRR):');
    worstQueries.forEach(w => {
        const expectedStr = w.expectedFiles.map(f => path.basename(f)).join(', ');
        const gotStr = w.got !== 'none' ? path.basename(w.got) : 'none';
        console.log(`  ${w.id} "${w.query}" — MRR ${w.mrr.toFixed(3)} (expected: ${expectedStr}, got: ${gotStr})`);
    });
    console.log('================================================================================');
}

runDiagnosis().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('[Diagnostic] Fatal error:', err);
    process.exit(1);
});
