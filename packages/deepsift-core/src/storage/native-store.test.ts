import { describe, it, expect } from 'vitest';
import { NativeStore } from './native-store.js';
import path from 'path';
import fs from 'fs';

describe('Native Store Zig Engine Integration', () => {
    const testDbPath = path.resolve(process.cwd(), '.deepsift/test-native.db');

    it('should invoke native hybrid search, symbol extraction, clone hashing, walker, and similarity matrix', async () => {
        const store = new NativeStore(testDbPath);

        // Test native symbol extraction
        const sampleCode = `
        export function computeTotal(a: number, b: number): number {
            return a + b;
        }
        export class NativeEngine {
            public run() {}
        }
        `;
        const symbols = await store.extractSymbolsNative(sampleCode);
        expect(Array.isArray(symbols)).toBe(true);

        // Test native clone hashing
        const sampleDuplicate = `
        const x = 1;
        const y = 2;
        const z = 3;
        console.log(x + y + z);
        return x + y + z;
        `;
        const clones = await store.computeCloneHashesNative(sampleDuplicate, 3);
        expect(Array.isArray(clones)).toBe(true);

        // Test native directory walker on src subfolder
        const srcPath = path.resolve(process.cwd(), 'src');
        const walked = await store.walkDirectoryNative(srcPath);
        expect(Array.isArray(walked)).toBe(true);

        // Test native similarity matrix
        const similarityMatrix = await store.computeSimilarityMatrixNative(0.5, 10);
        expect(Array.isArray(similarityMatrix)).toBe(true);

        // Cleanup test database if created
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        if (fs.existsSync(testDbPath + '.tmp')) fs.unlinkSync(testDbPath + '.tmp');
    }, 15000);
});
