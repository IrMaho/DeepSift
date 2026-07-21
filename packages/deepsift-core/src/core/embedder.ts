import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUM_WORKERS = Math.max(1, os.cpus().length - 1);
const workerPath = path.join(__dirname, 'embedder-worker.js');

let workers: Worker[] = [];
let nextWorkerIndex = 0;
let initialized = false;

function initWorkers() {
    if (initialized) return;
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

// Map to track pending requests
let nextId = 0;
const pendingRequests = new Map<number, { resolve: (val: Float32Array) => void; reject: (err: any) => void }>();

// Listeners for worker messages
function setupWorkerListeners() {
    workers.forEach(worker => {
        worker.on('message', (response: { id: number; vector?: Float32Array; error?: string }) => {
            const req = pendingRequests.get(response.id);
            if (req) {
                pendingRequests.delete(response.id);
                if (response.error) {
                    req.reject(new Error(response.error));
                } else if (response.vector) {
                    req.resolve(response.vector);
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
export async function getEmbedding(text: string): Promise<Float32Array> {
    initWorkers();
    if (workers.length === 0) {
        // Fallback to sync if no workers
        const { embed } = await import('@ternlight/base');
        return embed(text);
    }

    return new Promise((resolve, reject) => {
        const id = nextId++;
        pendingRequests.set(id, { resolve, reject });
        
        const worker = workers[nextWorkerIndex];
        nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
        
        worker.postMessage({ id, text });
    });
}

/**
 * Generates embeddings for an array of texts asynchronously and in parallel.
 * 
 * @param texts Array of input texts
 * @returns A promise resolving to an array of Float32Array embeddings
 */
export async function getEmbeddings(texts: string[]): Promise<Float32Array[]> {
    const results: Float32Array[] = [];
    const BATCH_SIZE = 50; // Process 50 chunks at a time to prevent memory/IPC overload
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(text => getEmbedding(text)));
        results.push(...batchResults);
    }
    
    return results;
}

/**
 * Terminate all running worker threads.
 */
export function terminateWorkers() {
    workers.forEach(w => w.terminate());
    workers = [];
    initialized = false;
}
