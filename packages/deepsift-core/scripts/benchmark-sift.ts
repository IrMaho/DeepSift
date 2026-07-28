/// <reference types="node" />
import { NativeStore } from '../src/storage/native-store.js';
import { EmbeddedChunk } from '../src/types/index.js';
import fs from 'fs';

async function runBenchmark() {
    console.log("🚀 Starting SiftEmbedding Hybrid Quantization Benchmark...");
    
    const dbPath = './benchmark-db.zdb';
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + '.tmp')) fs.unlinkSync(dbPath + '.tmp');

    const store = new NativeStore(dbPath);
    const CHUNK_COUNT = 10_000;
    const VECTOR_DIM = 384;

    console.log(`\n📦 Generating ${CHUNK_COUNT} random chunks with ${VECTOR_DIM}-dim f32 vectors...`);
    const chunks: EmbeddedChunk[] = [];
    for (let i = 0; i < CHUNK_COUNT; i++) {
        // Generate random vector between -1.0 and 1.0
        const vec = new Float32Array(VECTOR_DIM);
        for (let j = 0; j < VECTOR_DIM; j++) {
            vec[j] = (Math.random() * 2) - 1;
        }

        chunks.push({
            chunk: {
                id: `chunk_${i}`,
                filePath: `file_${i % 100}.ts`,
                content: `This is random content for chunk ${i}`,
                startLine: 1,
                endLine: 10,
                type: 'function',
                language: 'TypeScript'
            },
            embedding: vec
        });
    }

    console.log(`\n💾 Saving chunks to ZDB3 database (quantizing to SiftEmbedding)...`);
    const t0 = performance.now();
    
    // Batch save in chunks of 2000
    for(let i=0; i<CHUNK_COUNT; i+=2000) {
        await store.saveChunks(chunks.slice(i, i+2000));
    }
    
    const t1 = performance.now();
    console.log(`✅ Saved ${CHUNK_COUNT} chunks in ${(t1 - t0).toFixed(2)} ms.`);

    console.log(`\n🔍 Running 100 random semantic searches...`);
    let totalSearchTime = 0;
    for (let i = 0; i < 100; i++) {
        const queryVec = new Float32Array(VECTOR_DIM);
        for (let j = 0; j < VECTOR_DIM; j++) {
            queryVec[j] = (Math.random() * 2) - 1;
        }

        const s0 = performance.now();
        const results = await store.searchSemantic(queryVec, 10);
        const s1 = performance.now();
        totalSearchTime += (s1 - s0);
    }
    console.log(`✅ 100 searches completed in ${totalSearchTime.toFixed(2)} ms.`);
    console.log(`⚡ Average search time: ${(totalSearchTime / 100).toFixed(2)} ms / query`);

    // Sync to disk to check final file size
    await store.syncToDisk();
    
    if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        const kb = (stats.size / 1024).toFixed(2);
        console.log(`\n📊 Database Size (Compressed): ${kb} KB for ${CHUNK_COUNT} chunks.`);
        console.log(`📏 Average bytes per chunk: ${(stats.size / CHUNK_COUNT).toFixed(2)} bytes/chunk`);
    }

    try {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(dbPath + '.tmp')) fs.unlinkSync(dbPath + '.tmp');
    } catch (e) {}
}

runBenchmark().catch(console.error);
