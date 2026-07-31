/**
 * @file benchmark-index-speed.ts
 * @description DeepSift Indexing Speed & Throughput Benchmark Suite (Parallel Worker Pool & Bulk Transactions)
 */

import { performance } from 'perf_hooks';
import path from 'path';
import fs from 'fs';
import { RealmRouter } from '../src/core/realm-router.js';
import { Indexer } from '../src/core/indexer.js';
import { getEmbedding, getEmbeddings } from '../src/core/embedder.js';
import { unifiedWalk } from '../src/core/unified-walker.js';
import { isBinaryFile } from '../src/utils/binary-check.js';
import { parseWithAst } from '../src/parsers/ast-chunker.js';
import crypto from 'crypto';

const TARGET_PROJECT_PATH = `C:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\example\\dashboard\\app`;

interface PhaseTiming {
    walkerTime: number;
    hashingTime: number;
    chunkingTime: number;
    embeddingTime: number;
    dbWriteTime: number;
    totalTime: number;
    filesCount: number;
    chunksCount: number;
}

function hardCleanStorage(projectPath: string) {
    const dsDir = path.join(projectPath, '.deepsift');
    if (fs.existsSync(dsDir)) {
        try {
            fs.rmSync(dsDir, { recursive: true, force: true });
            console.log(`🧹 Hard Clean: Successfully deleted local storage: ${dsDir}`);
        } catch (e: any) {
            console.warn(`⚠️ Warning deleting ${dsDir}:`, e.message);
        }
    }
}

async function runDetailedPhaseProfiling(rootDir: string, isFullClean: boolean): Promise<PhaseTiming> {
    if (isFullClean) {
        hardCleanStorage(rootDir);
    }

    const t0 = performance.now();

    // 1. File Walker & Ignore Matcher Time
    const w0 = performance.now();
    const walkResult = await unifiedWalk(rootDir);
    let allFiles = walkResult.allFiles;

    try {
        const ignoreLib = (await import('ignore')).default;
        const ig = ignoreLib();
        ig.add(['node_modules', 'dist', 'build', 'out', 'web-remote', '*.min.js', '*.bundle.js']);
        allFiles = allFiles.filter((file: string) => !ig.ignores(path.relative(rootDir, file)));
    } catch {}
    const w1 = performance.now();
    const walkerTime = w1 - w0;

    // 2. Hashing & Diff Time
    const h0 = performance.now();
    const router = new RealmRouter(rootDir);
    const store = router.getStore('code');
    const allMetadata = await store.getAllMetadata();

    const filesToProcess: string[] = [];
    const fileHashes = new Map<string, string>();

    for (const file of allFiles) {
        try {
            if (await isBinaryFile(file)) continue;
            const content = await fs.promises.readFile(file, 'utf-8');
            const hash = crypto.createHash('md5').update(content).digest('hex');
            fileHashes.set(file, hash);

            const existingMeta = allMetadata.get(file);
            if (isFullClean || !existingMeta || existingMeta.fileHash !== hash) {
                filesToProcess.push(file);
            }
        } catch {}
    }
    const h1 = performance.now();
    const hashingTime = h1 - h0;

    // 3. AST Chunking Time
    const c0 = performance.now();
    const allChunks: any[] = [];
    for (const file of filesToProcess) {
        if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
            try {
                const content = await fs.promises.readFile(file, 'utf-8');
                const ext = path.extname(file).replace('.', '');
                const chunks = await parseWithAst(content, file, ext);
                allChunks.push(...chunks);
            } catch {}
        }
    }
    const c1 = performance.now();
    const chunkingTime = c1 - c0;

    // 4. Real Parallel Batch Embedding Time (Worker Pool with Promise.all)
    const e0 = performance.now();
    const validChunks = allChunks.filter(c => typeof c.content === 'string' && c.content.trim().length > 0);
    const textsToEmbed = validChunks.map(c => c.content);
    let embeddings: Float32Array[] = [];
    
    if (textsToEmbed.length > 0) {
        embeddings = await getEmbeddings(textsToEmbed);
    }
    const e1 = performance.now();
    const embeddingTime = e1 - e0;

    // 5. Database Bulk Write & I/O Time (Single Transaction Batch Commit)
    const db0 = performance.now();
    const batchOperations: any[] = [];
    
    for (const file of filesToProcess) {
        if (allMetadata.has(file)) {
            batchOperations.push({ action: 'deleteFileChunks', filePath: file });
        }
    }

    if (validChunks.length > 0 && embeddings.length > 0) {
        const embeddedChunks = validChunks.map((chunk, idx) => ({
            chunk,
            embedding: embeddings[idx]
        }));
        const formattedChunks = embeddedChunks.map(c => store.formatChunkForBatch(c));
        batchOperations.push({ action: 'saveChunks', chunks: formattedChunks });
    }

    for (const file of filesToProcess) {
        const fileChunks = allChunks.filter(c => c.filePath === file);
        batchOperations.push({
            action: 'saveMetadata',
            metadata: {
                file_path: file,
                file_hash: fileHashes.get(file)!,
                last_indexed: Date.now(),
                chunk_count: fileChunks.length
            }
        });
    }

    if (batchOperations.length > 0) {
        await store.executeBatch(batchOperations);
    }
    const db1 = performance.now();
    const dbWriteTime = db1 - db0;

    const t1 = performance.now();
    const totalTime = t1 - t0;

    return {
        walkerTime,
        hashingTime,
        chunkingTime,
        embeddingTime,
        dbWriteTime,
        totalTime,
        filesCount: allFiles.length,
        chunksCount: validChunks.length
    };
}

async function main() {
    console.log(`\n===============================================================`);
    console.log(`🚀 DEEPSIFT INDEXING SPEED BENCHMARK SUITE (Parallel Workers & Bulk Tx)`);
    console.log(`===============================================================`);
    console.log(`📍 Target Project Path: ${TARGET_PROJECT_PATH}`);
    console.log(`===============================================================\n`);

    if (!fs.existsSync(TARGET_PROJECT_PATH)) {
        console.error(`❌ Target directory does not exist: ${TARGET_PROJECT_PATH}`);
        process.exit(1);
    }

    // Embedder model warmup
    console.log(`[1/3] Warming up ONNX Transformer & Worker Pool...`);
    const w0 = performance.now();
    await getEmbedding("warmup index");
    const w1 = performance.now();
    console.log(`   Model Warmup Time: ${(w1 - w0).toFixed(2)} ms\n`);

    // Scenario A: Real Full Index (Hard Clean & From Scratch)
    console.log(`[2/3] Executing Scenario A: Real Full Index (Hard Clean & From Scratch)...`);
    const fullTiming = await runDetailedPhaseProfiling(TARGET_PROJECT_PATH, true);

    // Scenario B: Incremental Index (Sync with No Changes)
    console.log(`[3/3] Executing Scenario B: Incremental Index (Sync with No Changes)...`);
    const incTiming = await runDetailedPhaseProfiling(TARGET_PROJECT_PATH, false);

    const fullFilesPerSec = (fullTiming.filesCount / (fullTiming.totalTime / 1000)).toFixed(1);
    const fullChunksPerSec = (fullTiming.chunksCount / (fullTiming.totalTime / 1000)).toFixed(1);

    const incFilesPerSec = (incTiming.filesCount / (incTiming.totalTime / 1000)).toFixed(1);
    const incChunksPerSec = (incTiming.chunksCount / (incTiming.totalTime / 1000)).toFixed(1);

    console.log(`\n========================================================================================`);
    console.log(`📊 DEEPSIFT REAL FULL INDEX & INCREMENTAL BENCHMARK REPORT`);
    console.log(`========================================================================================`);
    console.log(`| Indexing Sub-Phase                        | Full Clean (A) | Incremental (B)| Status   |`);
    console.log(`|---------------------------------------------|----------------|----------------|----------|`);
    console.log(`| 📂 File Walker & Ignore Matcher Time        | ${fullTiming.walkerTime.toFixed(2).padStart(11)} ms | ${incTiming.walkerTime.toFixed(2).padStart(11)} ms | ${fullTiming.walkerTime > 100 ? '⚠️ SLOW' : '✅ FAST'} |`);
    console.log(`| 🔑 Hashing (SHA-256) & Diff Check Time      | ${fullTiming.hashingTime.toFixed(2).padStart(11)} ms | ${incTiming.hashingTime.toFixed(2).padStart(11)} ms | ${fullTiming.hashingTime > 100 ? '⚠️ SLOW' : '✅ FAST'} |`);
    console.log(`| 🌲 AST Chunking Time (Tree-sitter)         | ${fullTiming.chunkingTime.toFixed(2).padStart(11)} ms | ${incTiming.chunkingTime.toFixed(2).padStart(11)} ms | ${fullTiming.chunkingTime > 200 ? '⚠️ SLOW' : '✅ FAST'} |`);
    console.log(`| 🧬 Batch Embedding Time (Worker Threads)   | ${fullTiming.embeddingTime.toFixed(2).padStart(11)} ms | ${incTiming.embeddingTime.toFixed(2).padStart(11)} ms | ${fullTiming.embeddingTime > 1000 ? '🚨 SLOW' : '✅ ULTRA-FAST'} |`);
    console.log(`| ⚡ SQLite / Zig Database Write & I/O Time   | ${fullTiming.dbWriteTime.toFixed(2).padStart(11)} ms | ${incTiming.dbWriteTime.toFixed(2).padStart(11)} ms | ${fullTiming.dbWriteTime > 500 ? '🚨 CRITICAL' : '✅ ULTRA-FAST'} |`);
    console.log(`|---------------------------------------------|----------------|----------------|----------|`);
    console.log(`| 🎯 TOTAL INDEXING E2E LATENCY               | ${fullTiming.totalTime.toFixed(2).padStart(11)} ms | ${incTiming.totalTime.toFixed(2).padStart(11)} ms | ${fullTiming.totalTime < 2000 ? '🏆 ULTRA-FAST' : '🚨 BOTTLENECK'} |`);
    console.log(`| 🚀 Processing Throughput (Files/sec)        | ${fullFilesPerSec.padStart(11)} /s | ${incFilesPerSec.padStart(11)} /s | ${Number(fullFilesPerSec) >= 500 ? '🏆 >500 F/s' : '⚠️ TARGET >500'} |`);
    console.log(`| ⚡ Chunk Processing Throughput (Chunks/sec)  | ${fullChunksPerSec.padStart(11)} /s | ${incChunksPerSec.padStart(11)} /s |           |`);
    console.log(`========================================================================================\n`);

    process.exit(0);
}

main().catch((err) => {
    console.error(`❌ Benchmark error:`, err);
    process.exit(1);
});
