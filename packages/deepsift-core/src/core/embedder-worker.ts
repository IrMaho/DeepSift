/**
 * @file embedder-worker.ts
 * @description Worker thread for parallel vector embedding computation.
 *
 * @module core/embedder-worker
 * @category Core Search & Discovery
 * @since 1.0.2
 */
import { parentPort } from 'worker_threads';
import { pipeline, env } from '@xenova/transformers';

if (env.remoteHost === 'https://huggingface.co') {
    env.remoteHost = 'https://hf-mirror.com';
}

let extractor: any = null;

async function getExtractor() {
    if (!extractor) {
        let retries = 10;
        while (retries > 0) {
            try {
                extractor = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', { quantized: true });
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
    parentPort.on('message', async (message: { id: number; text: string }) => {
        let retries = 5;
        while (retries > 0) {
            try {
                const extract = await getExtractor();
                const output = await extract(message.text, { pooling: 'mean', normalize: true });
                const vector = new Float32Array(output.tolist()[0] || output.tolist());
                parentPort!.postMessage({ id: message.id, vector });
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
