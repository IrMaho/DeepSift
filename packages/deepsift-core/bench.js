import { NativeStore } from './dist/storage/native-store.js';
import path from 'path';
import fs from 'fs';

async function runBenchmark() {
    console.log("Starting DeepSift Native Benchmark...");
    const testDbPath = path.resolve(process.cwd(), '.deepsift/test-native.db');
    const store = new NativeStore(testDbPath);
    
    // Initialize with some mock data for benchmark
    console.time("Extract Symbols (Warmup)");
    const sampleCode = `export function computeTotal(a: number, b: number): number { return a + b; }`;
    await store.extractSymbolsNative(sampleCode.repeat(100));
    console.timeEnd("Extract Symbols (Warmup)");

    console.time("Similarity Matrix SIMD (1000 iter)");
    for (let i = 0; i < 1000; i++) {
        await store.computeSimilarityMatrixNative(0.5, 10);
    }
    console.timeEnd("Similarity Matrix SIMD (1000 iter)");

    console.log("Benchmark Completed!");
}
runBenchmark().catch(console.error);
