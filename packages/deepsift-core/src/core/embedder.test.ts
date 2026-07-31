import { describe, it, expect, afterAll } from 'vitest';
import { getEmbedding, getEmbeddings, terminateWorkers } from './embedder.js';

describe('Embedder Engine', () => {
    // Note: Model downloading/loading might take a while on the first run,
    // so we give this test suite a generous timeout.
    const TIMEOUT = 60000;

    afterAll(() => {
        // Ensure workers are cleaned up after tests
        terminateWorkers();
    });

    it('should generate a 768-dimensional embedding for a single text', async () => {
        const text = 'DeepSift is a highly optimized code semantic search engine.';
        const vector = await getEmbedding(text);
        
        expect(vector).toBeInstanceOf(Float32Array);
        expect(vector.length).toBe(768);
        
        // Ensure the vector is not completely empty (zeros)
        const isAllZeros = vector.every(v => v === 0);
        expect(isAllZeros).toBe(false);
    }, TIMEOUT);

    it('should handle batch embeddings efficiently via worker threads', async () => {
        const texts = [
            'First batch item to test memory management.',
            'Second batch item to verify IPC array structures.',
            'Third batch item to ensure robust execution providers.'
        ];

        const vectors = await getEmbeddings(texts);
        
        expect(Array.isArray(vectors)).toBe(true);
        expect(vectors.length).toBe(3);
        
        for (const vector of vectors) {
            expect(vector).toBeInstanceOf(Float32Array);
            expect(vector.length).toBe(768);
        }
        
        // Vectors for different texts should not be perfectly identical
        const isIdentical = vectors[0].every((val, index) => val === vectors[1][index]);
        expect(isIdentical).toBe(false);
    }, TIMEOUT);
});
