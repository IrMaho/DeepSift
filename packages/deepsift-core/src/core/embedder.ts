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

/**
 * Generates an embedding for a given text asynchronously using worker threads.
 * 
 * @param text The input text to embed
 * @returns A promise resolving to a 384-dimensional Float32Array
 */
export async function getEmbeddings(texts: string[]): Promise<Float32Array[]> {
    await initWorkers();
    
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
                const output = await extract(texts, { pooling: 'mean', normalize: false });
                const list = output.tolist();
                const raw = Array.isArray(list[0]) ? list.map((vec: any) => new Float32Array(vec)) : [new Float32Array(list as any)];
                return raw.map(normalizeL2);
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

    const BATCH_SIZE = 32;
    const batchPromises: Promise<Float32Array[]>[] = [];
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const id = nextId++;
        const p = new Promise<Float32Array[]>((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject });
        });
        
        const worker = workers[nextWorkerIndex];
        nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
        
        worker.postMessage({ id, texts: batch });
        batchPromises.push(p);
    }
    
    const batchResultsArray = await Promise.all(batchPromises);
    const results: Float32Array[] = [];
    for (const resBatch of batchResultsArray) {
        results.push(...resBatch);
    }
    
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
}
