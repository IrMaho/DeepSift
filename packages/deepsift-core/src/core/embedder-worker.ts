/**
 * @file embedder-worker.ts
 * @description Worker thread for parallel vector embedding computation.
 *
 * @module core/embedder-worker
 * @category Core Search & Discovery
 * @since 1.0.2
 */
import './disable-sharp.js';
import { parentPort } from 'worker_threads';
import { pipeline, env } from '@xenova/transformers';

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

if (env.remoteHost === 'https://huggingface.co') {
    env.remoteHost = 'https://hf-mirror.com';
}

let extractor: any = null;

async function getExtractor() {
    if (!extractor) {
        let retries = 10;
        while (retries > 0) {
            try {
                extractor = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', { 
                    quantized: true,
                    session_options: { executionProviders: ['directml', 'wasm', 'cpu'] }
                } as any);
                break;
            } catch (err: any) {
                if (err.message?.includes('fetch failed')) {
                    retries--;
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                } else {
                    throw err;
                }
            }
        }
    }
    return extractor;
}

if (parentPort) {
    parentPort.on('message', async (message: { id: number; texts: string[] }) => {
        let retries = 5;
        while (retries > 0) {
            try {
                const extract = await getExtractor();
                const output = await extract(message.texts, { pooling: 'mean', normalize: false });
                const list = output.tolist();
                
                const raw = Array.isArray(list[0]) ? list.map((vec: any) => new Float32Array(vec)) : [new Float32Array(list as any)];
                const vectors = raw.map(normalizeL2);
                
                parentPort!.postMessage({ id: message.id, vectors });
                return;
            } catch (err: any) {
                retries--;
                if (retries === 0) {
                    parentPort!.postMessage({ id: message.id, error: err.message || String(err) });
                } else {
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                }
            }
        }
    });
}
