/**
 * @file embedder.ts
 * @description Neural text embedding engine using local ONNX transformer models.
 *
 * @module core/embedder
 * @category Core Search & Discovery
 * @since 1.0.0
 */
import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { nativeBridge } from './mmap-bridge.js';

function normalizeL2(vector: Float32Array): Float32Array {
    let sumOfSquares = 0;
    for (let i = 0; i < vector.length; i++) {
        sumOfSquares += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(sumOfSquares);
    if (magnitude < 1e-10) return vector;
    for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
    }
    return vector;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cap worker pool to 4 worker threads to prevent ONNX Runtime memory allocation overhead while maximizing throughput
const NUM_WORKERS = Math.min(4, Math.max(2, os.cpus().length));
const workerJs = path.join(__dirname, 'embedder-worker.js');
const distWorkerJs = path.resolve(__dirname, '../../dist/core/embedder-worker.js');
const workerPath = fs.existsSync(workerJs) ? workerJs : (fs.existsSync(distWorkerJs) ? distWorkerJs : workerJs);

let workers: Worker[] = [];
let nextWorkerIndex = 0;
let initialized = false;

let initPromise: Promise<void> | null = null;

async function doInitWorkers() {
    if (initialized) return;
    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = new Worker(workerPath);
        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });
        worker.unref();
        workers.push(worker);
        // Stagger worker creation to prevent N-API native addon race conditions during ONNX initialization
        await new Promise(r => setTimeout(r, 250));
    }
    initialized = true;
    setupWorkerListeners();
}

function initWorkers(): Promise<void> {
    if (!initPromise) {
        initPromise = doInitWorkers();
    }
    return initPromise;
}

// Map to track pending requests
let nextId = 0;
const pendingRequests = new Map<number, { resolve: (val: Float32Array[]) => void; reject: (err: any) => void }>();

// Listeners for worker messages
function setupWorkerListeners() {
    workers.forEach(worker => {
        worker.on('message', (response: { id: number; vectors?: Float32Array[]; error?: string }) => {
            const req = pendingRequests.get(response.id);
            if (req) {
                pendingRequests.delete(response.id);
                if (response.error) {
                    req.reject(new Error(response.error));
                } else if (response.vectors) {
                    req.resolve(response.vectors);
                }
            }
        });
    });
}

// Global Content-Addressable Vector Cache (Zero-Loss Exact String Hash Cache)
const embeddingCache = new Map<string, Float32Array>();
const MAX_CACHE_SIZE = 15000;

function cacheVector(text: string, vector: Float32Array) {
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
        // Evict oldest 20% entries when capacity is reached
        const keysToEvict = Array.from(embeddingCache.keys()).slice(0, 3000);
        for (const k of keysToEvict) {
            embeddingCache.delete(k);
        }
    }
    embeddingCache.set(text, vector);
}

/**
 * Generates an embedding for a given text asynchronously using worker threads.
 * Uses Content-Addressable Caching and Length-Sorted Batching for zero-loss speedup.
 * 
 * @param texts The input texts to embed
 * @returns A promise resolving to 384-dimensional Float32Arrays
 */
export async function getEmbeddings(texts: string[]): Promise<Float32Array[]> {
    if (texts.length === 0) return [];
    
    // اطمینان از اجرای Daemon بومی Zig
    if (!(nativeBridge as any).isConnected) {
        try {
            await nativeBridge.startDaemon();
        } catch (e) {
            console.error("⚠️ [HPC] Daemon failed to start, falling back to JS-only mode.");
        }
    }
    
    await initWorkers();
    
    const results: Float32Array[] = new Array(texts.length);
    const uncachedIndices: number[] = [];
    const textHashes: string[] = new Array(texts.length);

    // 1. Generate ultra-fast BLAKE3 hashes via IPC Native Bridge
    for (let i = 0; i < texts.length; i++) {
        if ((nativeBridge as any).isConnected) {
            textHashes[i] = await nativeBridge.getChunkHash(texts[i]);
        } else {
            // Fallback
            textHashes[i] = texts[i]; // Store raw string if Daemon is down
        }
    }

    // 2. Check exact content cache using BLAKE3 Hash
    for (let i = 0; i < texts.length; i++) {
        const hash = textHashes[i];
        const cached = embeddingCache.get(hash);
        if (cached) {
            results[i] = cached;
        } else {
            uncachedIndices.push(i);
        }
    }

    if (uncachedIndices.length === 0) {
        return results;
    }

    // -------------------------------------------------------------------------
    // ⚡ HPC FAST PATH: DIRECTML / AVX-512 VIA ZIG DAEMON IPC
    // -------------------------------------------------------------------------
    if ((nativeBridge as any).isConnected) {
        // We blast all uncached chunks through the binary socket natively.
        // The Zig daemon will batch and process them on the GPU in milliseconds.
        const uncachedTexts = uncachedIndices.map(idx => texts[idx]);
        const vecs = await nativeBridge.getEmbeddingsNativeBatch(uncachedTexts);
        for (let i = 0; i < uncachedIndices.length; i++) {
            const origIdx = uncachedIndices[i];
            const normVec = normalizeL2(vecs[i]);
            const hash = textHashes[origIdx];
            cacheVector(hash, normVec);
            results[origIdx] = normVec;
        }
        return results;
    }

    // -------------------------------------------------------------------------
    // 🐌 SLOW PATH FALLBACK: WASM / JAVASCRIPT WORKERS
    // -------------------------------------------------------------------------
    // Fallback if no workers available
    if (workers.length === 0) {
        let retries = 5;
        while (retries > 0) {
            try {
                const { pipeline, env } = await import('@xenova/transformers');
                if (env.remoteHost === 'https://huggingface.co') {
                    env.remoteHost = 'https://hf-mirror.com';
                }
                const extract = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', { 
                    quantized: true,
                    session_options: { executionProviders: ['directml', 'wasm', 'cpu'] }
                } as any);
                const uncachedTexts = uncachedIndices.map(idx => texts[idx]);
                const output = await extract(uncachedTexts, { pooling: 'mean', normalize: false });
                const list = output.tolist();
                const raw = Array.isArray(list[0]) ? list.map((vec: any) => new Float32Array(vec)) : [new Float32Array(list as any)];
                const norm = raw.map(normalizeL2);
                uncachedIndices.forEach((origIdx, i) => {
                    const vec = norm[i];
                    const hash = textHashes[origIdx];
                    cacheVector(hash, vec);
                    results[origIdx] = vec;
                });
                return results;
            } catch (err: any) {
                retries--;
                if (retries === 0) {
                    throw err;
                }
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            }
        }
        throw new Error('Unreachable');
    }

    // 2. Length-Sorted Batching: Sort uncached items by length to minimize zero-padding matrix computation
    const sortedUncachedIndices = uncachedIndices.slice().sort((a, b) => texts[a].length - texts[b].length);

    const BATCH_SIZE = 32;
    const batchPromises: { indices: number[]; promise: Promise<Float32Array[]> }[] = [];
    
    for (let i = 0; i < sortedUncachedIndices.length; i += BATCH_SIZE) {
        const batchIndices = sortedUncachedIndices.slice(i, i + BATCH_SIZE);
        const batchTexts = batchIndices.map(idx => texts[idx]);
        const id = nextId++;
        const p = new Promise<Float32Array[]>((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject });
        });
        
        const worker = workers[nextWorkerIndex];
        nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
        
        worker.postMessage({ id, texts: batchTexts });
        batchPromises.push({ indices: batchIndices, promise: p });
    }
    
    const batchResultsArray = await Promise.all(batchPromises.map(b => b.promise));
    
    // 3. Store vectors into final results and update cache
    batchPromises.forEach((batchItem, batchIdx) => {
        const resBatch = batchResultsArray[batchIdx];
        batchItem.indices.forEach((origIdx, itemIdx) => {
            const vec = resBatch[itemIdx];
            const hash = textHashes[origIdx];
            cacheVector(hash, vec);
            results[origIdx] = vec;
        });
    });
    
    return results;
}

export async function getEmbedding(text: string): Promise<Float32Array> {
    const res = await getEmbeddings([text]);
    return res[0];
}

/**
 * Terminate all running worker threads.
 */
export function terminateWorkers() {
    workers.forEach(w => w.terminate());
    workers = [];
    initialized = false;
    embeddingCache.clear();
}
