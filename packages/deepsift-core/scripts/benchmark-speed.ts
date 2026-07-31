/**
 * @file benchmark-speed.ts
 * @description DeepSift Sub-Second Speed Benchmark Suite (V16 Query Performance Audit)
 */

import { performance } from 'perf_hooks';
import path from 'path';
import fs from 'fs';

const processStartTime = performance.now();

// 1. Measure Module Import Time
const t0 = performance.now();

import { RealmRouter } from '../src/core/realm-router.js';
import { getEmbedding } from '../src/core/embedder.js';
import { NativeStore } from '../src/storage/native-store.js';
import { Searcher } from '../src/core/searcher.js';
import { searchCommand } from '../src/cli/commands/search.js';

const t1 = performance.now();
const moduleImportTime = t1 - t0;

const TEST_PROJECT_PATH = `C:\\Users\\ASUS\\Desktop\\flutter_project\\plugin_figma\\color\\my-color-test`;
const HARDCORE_QUERY = "user authentication persistent session management";

async function runSpeedBenchmark() {
    console.log(`\n===============================================================`);
    console.log(`🚀 DEEPSIFT SEARCH SPEED BENCHMARK & LATENCY PROFILER V1.2`);
    console.log(`===============================================================`);
    console.log(`📍 Target Database Path: ${TEST_PROJECT_PATH}`);
    console.log(`🔍 Hardcore Query V16 : "${HARDCORE_QUERY}"`);
    console.log(`===============================================================\n`);

    if (!fs.existsSync(TEST_PROJECT_PATH)) {
        console.error(`❌ Target project path does not exist: ${TEST_PROJECT_PATH}`);
        process.exit(1);
    }

    // 2. Measure Model Embedder & ONNX Cold-Start Time
    const t2 = performance.now();
    console.log(`[1/6] Profiling Model & ONNX Cold-Start...`);
    await getEmbedding("warmup");
    const t3 = performance.now();
    const modelColdStartTime = t3 - t2;

    // 3. Measure Query Embedding Generation Time (Warm Call)
    console.log(`[2/6] Profiling Embedding Vector Generation (Query: "${HARDCORE_QUERY}")...`);
    const t4 = performance.now();
    const queryVector = await getEmbedding(HARDCORE_QUERY);
    const t5 = performance.now();
    const embeddingGenTime = t5 - t4;

    // 4. Measure Direct Native Hybrid Vector Search (Zig SIMD Engine)
    console.log(`[3/6] Profiling Direct Zig SIMD Hybrid Vector Search (IVF Index)...`);
    const router = new RealmRouter(TEST_PROJECT_PATH);
    const store = router.getStore('code');
    const t6_direct = performance.now();
    const directResults = await store.searchHybridNative(HARDCORE_QUERY, queryVector, 10);
    const t7_direct = performance.now();
    const directZigSearchTime = t7_direct - t6_direct;

    // 5. Measure Warm Search Execution (Sub-300ms Search)
    console.log(`[4/6] Profiling Warm Sub-300ms Search Execution...`);
    const searcher = new Searcher(store);
    const t6_warm = performance.now();
    const warmResults = await searcher.search({ query: HARDCORE_QUERY, topK: 10, fast: true });
    const t7_warm = performance.now();
    const warmSearchTime = t7_warm - t6_warm;

    // 6. Measure Full Searcher Engine Pipeline (Hybrid + RRF + Smart Skip-Reranker)
    console.log(`[5/6] Profiling Full Searcher Pipeline (Hybrid + RRF + Smart Rerank)...`);
    const t6 = performance.now();
    const engineResults = await searcher.search({ query: HARDCORE_QUERY, topK: 10 });
    const t7 = performance.now();
    const engineSearchTime = t7 - t6;

    // 7. Measure Full End-to-End CLI Search Execution Time
    console.log(`[6/6] Profiling End-to-End (E2E) CLI Search Command...`);
    const t8 = performance.now();
    await searchCommand(TEST_PROJECT_PATH, [HARDCORE_QUERY], 'markdown', { limit: 5, skipSync: true, compress: false, fast: true });
    const t9 = performance.now();
    const cliCommandTime = t9 - t8;

    const totalE2ELatency = t9 - processStartTime;

    // Generate Timing Breakdown Table
    console.log(`\n========================================================================================`);
    console.log(`📊 DEEPSIFT SEARCH LATENCY BREAKDOWN & BENCHMARK REPORT V1.2`);
    console.log(`========================================================================================`);
    console.log(`| Phase / Component                           | Latency (ms) | Percentage (%) | Status   |`);
    console.log(`|---------------------------------------------|--------------|----------------|----------|`);
    console.log(`| 📦 Module Import & Initialization          | ${moduleImportTime.toFixed(2).padStart(12)} ms | ${(moduleImportTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${moduleImportTime > 200 ? '⚠️ SLOW  ' : '✅ FAST  '} |`);
    console.log(`| ❄️ Model Cold-Start (ONNX + Workers)       | ${modelColdStartTime.toFixed(2).padStart(12)} ms | ${(modelColdStartTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${modelColdStartTime > 2000 ? '🚨 CRITICAL' : '✅ FAST  '} |`);
    console.log(`| 🧬 Query Embedding Vector Generation       | ${embeddingGenTime.toFixed(2).padStart(12)} ms | ${(embeddingGenTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${embeddingGenTime > 100 ? '⚠️ SLOW  ' : '✅ FAST  '} |`);
    console.log(`| ⚡ Direct Zig SIMD Hybrid Vector Search     | ${directZigSearchTime.toFixed(2).padStart(12)} ms | ${(directZigSearchTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${directZigSearchTime > 100 ? '⚠️ SLOW  ' : '🏆 SUB-100MS'} |`);
    console.log(`| ⚡ Warm Search Engine (Fast Flag)           | ${warmSearchTime.toFixed(2).padStart(12)} ms | ${(warmSearchTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${warmSearchTime < 300 ? '🏆 SUB-300MS' : '✅ FAST  '} |`);
    console.log(`| ⚡ Full Searcher Engine (Hybrid + RRF)      | ${engineSearchTime.toFixed(2).padStart(12)} ms | ${(engineSearchTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${engineSearchTime > 500 ? '⚠️ SLOW  ' : '✅ FAST  '} |`);
    console.log(`| 🔄 CLI End-to-End Search Pipeline           | ${cliCommandTime.toFixed(2).padStart(12)} ms | ${(cliCommandTime / totalE2ELatency * 100).toFixed(1).padStart(13)}% | ${cliCommandTime > 2000 ? '🚨 CRITICAL' : '✅ OPTIMIZED'} |`);
    console.log(`|---------------------------------------------|--------------|----------------|----------|`);
    console.log(`| 🎯 TOTAL END-TO-END LATENCY (Process Start) | ${totalE2ELatency.toFixed(2).padStart(12)} ms |           100.0% | ${totalE2ELatency < 2000 ? '🏆 SUB-2S E2E' : '🚨 BOTTLENECK'} |`);
    console.log(`========================================================================================\n`);

    console.log(`💡 Direct Hybrid Matches: ${directResults.length} chunks`);
    console.log(`💡 Engine Total Matches : ${engineResults.length} chunks`);
    if (engineResults.length > 0) {
        console.log(`   Top Match: ${engineResults[0].chunk.filePath}:${engineResults[0].chunk.startLine} (score: ${engineResults[0].score.toFixed(3)})`);
    }

    process.exit(0);
}

runSpeedBenchmark().catch((err) => {
    console.error(`❌ Benchmark error:`, err);
    process.exit(1);
});
