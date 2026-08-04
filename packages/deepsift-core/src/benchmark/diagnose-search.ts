import path from 'path';
import { fileURLToPath } from 'url';
import { Searcher } from '../core/searcher.js';
import { DEFAULT_REALM } from '../cli/cli-paths.js';
import { RealmRouter } from '../core/realm-router.js';
import { getEmbedding, terminateWorkers } from '../core/embedder.js';
import { applyRRF } from '../utils/similarity.js';
import { loadDNA } from '../intelligence/project-dna.js';
import { SearchResult } from '../types/index.js';

interface BenchmarkQuery {
    query: string;
    expectedFiles: string[];
    expectedMinPosition: number;
    category: 'semantic' | 'keyword' | 'hybrid' | 'structural';
}

interface QueryMetrics {
    recall1: number;
    recall3: number;
    recall5: number;
    mrr: number;
    hitRate: number;
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

function calculateMetrics(actualTopFiles: string[], expectedFiles: string[]): QueryMetrics {
    const uniqueActual = Array.from(new Set(actualTopFiles));
    
    const checkRecallK = (k: number): number => {
        const topKFiles = actualTopFiles.slice(0, k);
        return topKFiles.some(file => matchesExpected(file, expectedFiles)) ? 1 : 0;
    };

    const recall1 = checkRecallK(1);
    const recall3 = checkRecallK(3);
    const recall5 = checkRecallK(5);

    let mrr = 0;
    for (let i = 0; i < actualTopFiles.length; i++) {
        if (matchesExpected(actualTopFiles[i], expectedFiles)) {
            mrr = 1 / (i + 1);
            break;
        }
    }

    const foundExpectedCount = expectedFiles.filter(exp => 
        uniqueActual.some(act => matchesExpected(act, [exp]))
    ).length;
    const hitRate = expectedFiles.length > 0 ? foundExpectedCount / expectedFiles.length : 0;

    return {
        recall1,
        recall3,
        recall5,
        mrr,
        hitRate
    };
}

async function runDiagnostics() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const defaultProjectPath = path.resolve(__dirname, '../..');
    const projectPath = path.resolve(process.argv[2] || defaultProjectPath);

    const router = new RealmRouter(projectPath);
    await router.indexRealm(DEFAULT_REALM, projectPath, false);
    const store = router.getStore(DEFAULT_REALM);
    const searcher = new Searcher(store);

    let structuralWeights: Map<string, number> | undefined;
    try {
        const dna = loadDNA(projectPath);
        if (dna?.architecture?.coreFiles) {
            structuralWeights = new Map<string, number>();
            dna.architecture.coreFiles.forEach((f: string) => structuralWeights!.set(f, 1.5));
        }
    } catch {}

    const queryDiagnoses: Array<{
        id: number;
        query: string;
        expected: string[];
        category: string;
        mrr: number;
        usedHybridNative: boolean;
        nativeMrr: number;
        rrfMrr: number;
        topGot: string;
    }> = [];

    let totalHybridNativeMRR = 0;
    let countHybridNativeUsed = 0;
    let totalRrfMRR = 0;
    let countRrfUsed = 0;

    const hybridWins: string[] = [];
    const rrfWins: string[] = [];
    const ties: string[] = [];

    try {
        for (let idx = 0; idx < BENCHMARK_QUERIES.length; idx++) {
            const q = BENCHMARK_QUERIES[idx];
            const qId = idx + 1;

            const queryVector = await getEmbedding(q.query);
            const directNativeResults = await store.searchHybridNative(q.query, queryVector, 10);
            const nativeTopFiles = directNativeResults.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const nativeMetrics = calculateMetrics(nativeTopFiles, q.expectedFiles);

            const keywordResultsRaw = await store.searchKeyword(q.query, 50);
            const semanticResultsRaw = await store.searchSemantic(queryVector, 50);
            const rrfCandidates = applyRRF(semanticResultsRaw, keywordResultsRaw, 60, structuralWeights);
            const rrfTopFiles = rrfCandidates.slice(0, 10).map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const rrfMetrics = calculateMetrics(rrfTopFiles, q.expectedFiles);

            if (nativeMetrics.mrr > rrfMetrics.mrr) {
                hybridWins.push(`Q${qId}`);
            } else if (rrfMetrics.mrr > nativeMetrics.mrr) {
                rrfWins.push(`Q${qId}`);
            } else {
                ties.push(`Q${qId}`);
            }

            const searchResults = await searcher.search({ query: q.query, topK: 10 });
            const searchTopFiles = searchResults.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const searchMetrics = calculateMetrics(searchTopFiles, q.expectedFiles);

            const usedHybridNative = directNativeResults.length > 0;
            if (usedHybridNative) {
                countHybridNativeUsed++;
                totalHybridNativeMRR += searchMetrics.mrr;
            } else {
                countRrfUsed++;
                totalRrfMRR += searchMetrics.mrr;
            }

            let firstRank = 0;
            for (let i = 0; i < searchTopFiles.length; i++) {
                if (matchesExpected(searchTopFiles[i], q.expectedFiles)) {
                    firstRank = i + 1;
                    break;
                }
            }

            const uniqueSearchTopFiles = Array.from(new Set(searchTopFiles));
            const foundCount = q.expectedFiles.filter(exp => 
                uniqueSearchTopFiles.some(act => matchesExpected(act, [exp]))
            ).length;

            queryDiagnoses.push({
                id: qId,
                query: q.query,
                expected: q.expectedFiles,
                category: q.category,
                mrr: searchMetrics.mrr,
                usedHybridNative,
                nativeMrr: nativeMetrics.mrr,
                rrfMrr: rrfMetrics.mrr,
                topGot: searchTopFiles[0] || 'none'
            });

            console.log('================================================================================');
            console.log(`Q${qId}: "${q.query}"`);
            console.log(`  Expected: ${q.expectedFiles.join(', ')}`);
            console.log(`  Category: ${q.category}`);
            console.log('--------------------------------------------------------------------------------');

            if (directNativeResults.length > 0) {
                console.log(`  [DIAGNOSTIC] hybridNative returned: ${directNativeResults.length} results`);
                directNativeResults.slice(0, 5).forEach((r, i) => {
                    const normPath = r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : 'unknown';
                    const lineInfo = r.chunk.startLine && r.chunk.endLine ? `:${r.chunk.startLine}-${r.chunk.endLine}` : '';
                    console.log(`    #${i + 1} [score: ${(r.score || 0).toFixed(3)}] ${normPath}${lineInfo}`);
                });
            } else {
                console.log('  [DIAGNOSTIC] hybridNative returned: 0 results → fell through to RRF');
            }

            console.log('--------------------------------------------------------------------------------');
            console.log('  Top-10 Results:');
            searchResults.forEach((r, i) => {
                const normPath = r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : 'unknown';
                const lineInfo = r.chunk.startLine && r.chunk.endLine ? `:${r.chunk.startLine}-${r.chunk.endLine}` : '';
                const isExpected = matchesExpected(normPath, q.expectedFiles);
                const marker = isExpected ? `  \u2190 EXPECTED (rank ${i + 1})` : '';
                const scoreTag = `[score: ${(r.score || 0).toFixed(3)}, match: ${r.matchType || 'hybrid'}]`;
                console.log(`    #${i + 1} ${scoreTag.padEnd(30)} ${normPath}${lineInfo}${marker}`);
            });

            console.log(`  Expected files found: ${foundCount}/${q.expectedFiles.length}`);
            console.log(`  First expected at rank: ${firstRank > 0 ? firstRank : 'not found'}`);
            console.log(`  MRR: ${searchMetrics.mrr.toFixed(3)}`);
            console.log('================================================================================\n');
        }
    } finally {
        try {
            store.close();
        } catch {}
        terminateWorkers();
    }

    const avgHybridMRR = countHybridNativeUsed > 0 ? totalHybridNativeMRR / countHybridNativeUsed : 0;
    const avgRrfMRR = countRrfUsed > 0 ? totalRrfMRR / countRrfUsed : 0;

    const worstQueries = [...queryDiagnoses]
        .sort((a, b) => a.mrr - b.mrr)
        .slice(0, 5);

    console.log('================================================================================');
    console.log('DIAGNOSTIC SUMMARY');
    console.log('================================================================================');
    console.log(`Queries where hybridNative was used: ${countHybridNativeUsed}/${BENCHMARK_QUERIES.length}`);
    console.log(`Queries where RRF fallback was used: ${countRrfUsed}/${BENCHMARK_QUERIES.length}\n`);
    console.log(`hybridNative MRR: ${avgHybridMRR.toFixed(3)} (${countHybridNativeUsed} queries)`);
    console.log(`RRF fallback MRR: ${avgRrfMRR.toFixed(3)} (${countRrfUsed} queries)\n`);
    console.log('Per-query breakdown:');
    console.log(`  hybridNative wins:  ${hybridWins.join(', ') || 'None'}`);
    console.log(`  RRF fallback wins:  ${rrfWins.join(', ') || 'None'}`);
    console.log(`  Ties:               ${ties.join(', ') || 'None'}\n`);
    console.log('Worst 5 queries (lowest MRR):');
    worstQueries.forEach(q => {
        const expStr = q.expected.map(f => path.basename(f)).join(', ');
        const gotStr = path.basename(q.topGot);
        console.log(`  Q${q.id} "${q.query}" \u2014 MRR ${q.mrr.toFixed(3)} (expected: ${expStr}, got: ${gotStr})`);
    });
    console.log('================================================================================');
}

runDiagnostics().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
