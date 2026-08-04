/**
 * @file search-quality-benchmark.ts
 * @description Code RAG Quality Benchmark Suite for DeepSift.
 * Measures search retrieval quality (Recall@1/3/5, MRR, Hit Rate) in normal and fast modes
 * across semantic, keyword, hybrid, and structural queries.
 * 
 * @module benchmark/search-quality-benchmark
 * @category Quality & Benchmarking
 * @since 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Searcher } from '../core/searcher.js';
import { NativeStore } from '../storage/native-store.js';
import { getRealmDbPath, getRealmGraphPath, DEFAULT_REALM } from '../cli/cli-paths.js';
import { RealmRouter } from '../core/realm-router.js';
import { terminateWorkers } from '../core/embedder.js';
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

interface ModeMetrics {
    meanRecall1: number;
    meanRecall3: number;
    meanRecall5: number;
    meanMRR: number;
    meanHitRate: number;
}

interface CategoryStat {
    meanMRR: number;
    count: number;
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

function aggregateMetrics(results: QueryMetrics[]): ModeMetrics {
    if (results.length === 0) {
        return { meanRecall1: 0, meanRecall3: 0, meanRecall5: 0, meanMRR: 0, meanHitRate: 0 };
    }
    const sum = results.reduce((acc, r) => ({
        recall1: acc.recall1 + r.recall1,
        recall3: acc.recall3 + r.recall3,
        recall5: acc.recall5 + r.recall5,
        mrr: acc.mrr + r.mrr,
        hitRate: acc.hitRate + r.hitRate,
    }), { recall1: 0, recall3: 0, recall5: 0, mrr: 0, hitRate: 0 });

    const n = results.length;
    return {
        meanRecall1: sum.recall1 / n,
        meanRecall3: sum.recall3 / n,
        meanRecall5: sum.recall5 / n,
        meanMRR: sum.mrr / n,
        meanHitRate: sum.hitRate / n,
    };
}

async function runBenchmark() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const defaultProjectPath = path.resolve(__dirname, '../..');
    const projectPath = path.resolve(process.argv[2] || defaultProjectPath);

    console.log('\n========================================================================================');
    console.log('                        DEEPSIFT SEARCH QUALITY BENCHMARK SUITE                         ');
    console.log('========================================================================================');
    console.log(`[Benchmark] Project Root: ${projectPath}`);
    console.log(`[Benchmark] Total Queries: ${BENCHMARK_QUERIES.length}`);

    const router = new RealmRouter(projectPath);
    console.log(`[Benchmark] Indexing codebase (realm: '${DEFAULT_REALM}')...`);
    const startTimeIndex = Date.now();
    try {
        const stats = await router.indexRealm(DEFAULT_REALM, projectPath, false);
        console.log(`[Benchmark] Indexing finished in ${Date.now() - startTimeIndex}ms (${stats.files} files, ${stats.chunks} chunks).`);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[Benchmark] Warning during indexing: ${msg}`);
    }

    const dbPath = getRealmDbPath(projectPath, DEFAULT_REALM);
    const graphPath = getRealmGraphPath(projectPath, DEFAULT_REALM);
    const store = new NativeStore(dbPath, graphPath, DEFAULT_REALM, projectPath);
    const searcher = new Searcher(store);

    const perQuery: any[] = [];
    const normalMetricsList: QueryMetrics[] = [];
    const fastMetricsList: QueryMetrics[] = [];

    let totalNormalTimeMs = 0;
    let totalFastTimeMs = 0;

    try {
        for (let idx = 0; idx < BENCHMARK_QUERIES.length; idx++) {
            const q = BENCHMARK_QUERIES[idx];
            console.log(`[Benchmark] Running query ${idx + 1}/${BENCHMARK_QUERIES.length}: "${q.query}"`);

            // Normal Mode
            const normalStart = Date.now();
            let normalResults: SearchResult[] = [];
            try {
                normalResults = await searcher.search({
                    query: q.query,
                    topK: 10,
                    skipRerank: false
                });
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[Benchmark] Normal search failed for query "${q.query}": ${msg}`);
            }
            const normalTimeMs = Date.now() - normalStart;
            totalNormalTimeMs += normalTimeMs;

            const normalTopFiles = normalResults.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const normalScores = normalResults.map(r => r?.score || 0);
            const normalMetrics = calculateMetrics(normalTopFiles, q.expectedFiles);
            normalMetricsList.push(normalMetrics);

            perQuery.push({
                query: q.query,
                category: q.category,
                expectedFiles: q.expectedFiles,
                actualTopFiles: normalTopFiles,
                actualScores: normalScores,
                recall1: normalMetrics.recall1,
                recall3: normalMetrics.recall3,
                recall5: normalMetrics.recall5,
                mrr: normalMetrics.mrr,
                hitRate: normalMetrics.hitRate,
                timeMs: normalTimeMs,
                reranked: true,
                fast: false
            });

            // Fast Mode
            const fastStart = Date.now();
            let fastResults: SearchResult[] = [];
            try {
                fastResults = await searcher.search({
                    query: q.query,
                    topK: 10,
                    skipRerank: true,
                    fast: true
                });
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[Benchmark] Fast search failed for query "${q.query}": ${msg}`);
            }
            const fastTimeMs = Date.now() - fastStart;
            totalFastTimeMs += fastTimeMs;

            const fastTopFiles = fastResults.map(r => r?.chunk?.filePath ? normalizeFilePath(projectPath, r.chunk.filePath) : '');
            const fastScores = fastResults.map(r => r?.score || 0);
            const fastMetrics = calculateMetrics(fastTopFiles, q.expectedFiles);
            fastMetricsList.push(fastMetrics);

            perQuery.push({
                query: q.query,
                category: q.category,
                expectedFiles: q.expectedFiles,
                actualTopFiles: fastTopFiles,
                actualScores: fastScores,
                recall1: fastMetrics.recall1,
                recall3: fastMetrics.recall3,
                recall5: fastMetrics.recall5,
                mrr: fastMetrics.mrr,
                hitRate: fastMetrics.hitRate,
                timeMs: fastTimeMs,
                reranked: false,
                fast: true
            });
        }
    } finally {
        try {
            store.close();
        } catch {
            // Intentionally silent
        }
        terminateWorkers();
    }

    const normalAgg = aggregateMetrics(normalMetricsList);
    const fastAgg = aggregateMetrics(fastMetricsList);
    const avgNormalTime = BENCHMARK_QUERIES.length > 0 ? totalNormalTimeMs / BENCHMARK_QUERIES.length : 0;
    const avgFastTime = BENCHMARK_QUERIES.length > 0 ? totalFastTimeMs / BENCHMARK_QUERIES.length : 0;

    const categories: Array<'semantic' | 'keyword' | 'hybrid' | 'structural'> = ['semantic', 'keyword', 'hybrid', 'structural'];
    const categoryBreakdown: Record<string, CategoryStat> = {};

    for (const cat of categories) {
        const catResults = perQuery.filter(r => r.category === cat && !r.fast);
        const count = catResults.length;
        const sumMRR = catResults.reduce((sum, r) => sum + r.mrr, 0);
        categoryBreakdown[cat] = {
            meanMRR: count > 0 ? sumMRR / count : 0,
            count
        };
    }

    const report = {
        timestamp: new Date().toISOString(),
        projectPath,
        totalQueries: BENCHMARK_QUERIES.length,
        modes: {
            normal: normalAgg,
            fast: fastAgg
        },
        categoryBreakdown,
        perQuery
    };

    const reportPath = path.join(projectPath, 'benchmark-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log('\n----------------------------------------------------------------------------------------');
    console.log('Mode      | Recall@1 | Recall@3 | Recall@5 | Mean MRR | Hit Rate | Avg Time (ms)');
    console.log('----------|----------|----------|----------|----------|----------|-----------------');

    const formatRow = (modeName: string, m: ModeMetrics, avgTime: number) => {
        return (
            modeName.padEnd(10) + ' | ' +
            (m.meanRecall1 * 100).toFixed(1).padStart(7) + '% | ' +
            (m.meanRecall3 * 100).toFixed(1).padStart(7) + '% | ' +
            (m.meanRecall5 * 100).toFixed(1).padStart(7) + '% | ' +
            m.meanMRR.toFixed(3).padStart(8) + ' | ' +
            (m.meanHitRate * 100).toFixed(1).padStart(7) + '% | ' +
            avgTime.toFixed(1).padStart(13)
        );
    };

    console.log(formatRow('Normal', normalAgg, avgNormalTime));
    console.log(formatRow('Fast', fastAgg, avgFastTime));
    console.log('----------------------------------------------------------------------------------------');
    console.log('Category Breakdown (Normal Mode Mean MRR):');
    for (const [cat, data] of Object.entries(categoryBreakdown)) {
        console.log(`  - ${cat.padEnd(12)} : MRR ${data.meanMRR.toFixed(3)} (${data.count} queries)`);
    }
    console.log('========================================================================================');
    console.log(`[Benchmark] Full JSON report saved to: ${reportPath}\n`);
}

runBenchmark().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('[Benchmark] Fatal error:', err);
    process.exit(1);
});
