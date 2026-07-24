/**
 * @file embedder-worker.ts
 * @description Worker thread for parallel vector embedding computation.
 *
 * @module core/embedder-worker
 * @category Core Search & Discovery
 * @since 1.0.2
 */
import { parentPort } from 'worker_threads';
import { embed } from '@ternlight/base';

if (parentPort) {
    parentPort.on('message', (message: { id: number; text: string }) => {
        try {
            const vector = embed(message.text);
            parentPort!.postMessage({ id: message.id, vector });
        } catch (err: any) {
            parentPort!.postMessage({ id: message.id, error: err.message });
        }
    });
}
