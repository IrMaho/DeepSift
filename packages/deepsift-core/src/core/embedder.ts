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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_WORKERS = Math.max(1, os.cpus().length - 1);
const workerJs = path.join(__dirname, 'embedder-worker.js');
const workerTs = path.join(__dirname, 'embedder-worker.ts');
const workerPath = fs.existsSync(workerJs) ? workerJs : (fs.existsSync(workerTs) ? workerTs : workerJs);

let workers: Worker[] = [];
let nextWorkerIndex = 0;
let initialized = false;

let initPromise: Promise<void> | null = null;

async function doInitWorkers() {
    if (initialized) return;
    try {
        console.log('[DeepSift] Pre-downloading embedding model on main thread...');
        const { pipeline, env } = await import('@xenova/transformers');
        
        // Use mirror if fetch fails due to network restrictions
        if (env.remoteHost === 'https://huggingface.co') {
            env.remoteHost = 'https://hf-mirror.com';
        }

        await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', { 
            quantized: true,
            session_options: { executionProviders: ['directml', 'wasm', 'cpu'] }
        } as any);
        console.log('[DeepSift] Embedding model cached. Starting workers...');
    } catch (err) {
        console.warn('[DeepSift] Failed to pre-download model, workers will attempt to download:', err);
    }
    
    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = new Worker(workerPath);
        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });
        worker.unref();
        workers.push(worker);
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
                const output = await extract(texts, { pooling: 'mean', normalize: true });
                const list = output.tolist();
                return Array.isArray(list[0]) ? list.map((vec: any) => new Float32Array(vec)) : [new Float32Array(list as any)];
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

    const results: Float32Array[] = [];
    const BATCH_SIZE = 100; // Process chunks at a time in bulk
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const id = nextId++;
        const p = new Promise<Float32Array[]>((resolve, reject) => {
            pendingRequests.set(id, { resolve, reject });
        });
        
        const worker = workers[nextWorkerIndex];
        nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
        
        worker.postMessage({ id, texts: batch });
        const batchResults = await p;
        results.push(...batchResults);
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
