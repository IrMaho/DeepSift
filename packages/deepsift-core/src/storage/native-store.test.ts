import { describe, it, expect } from 'vitest';
import { NativeStore } from './native-store.js';
import path from 'path';
import fs from 'fs';

describe('Native Store Zig Engine Integration', () => {
    const testDbPath = path.resolve(process.cwd(), '.deepsift/test-native.db');

    it('should invoke native hybrid search, symbol extraction, clone hashing, walker, similarity matrix, property miner, LCOV parser, CallTree, CFG, outline classifier, memo graph, l10n, resource mapper, dead code detector, and TOON serializer', async () => {
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

        // Test native property miner (color tokens & naming conventions)
        const sampleUI = `const primaryColor = "#3b82f6"; const navBg = "#1e293b";`;
        const colorTokens = await store.mineColorTokensNative(sampleUI);
        expect(Array.isArray(colorTokens)).toBe(true);

        const namingStats = await store.analyzeNamingConventionsNative(sampleUI);
        expect(typeof namingStats).toBe('object');

        // Test native LCOV parser
        const sampleLcov = `SF:src/utils/test.ts\nLF:10\nLH:8\nend_of_record\n`;
        const lcovResults = await store.parseLcovNative(sampleLcov);
        expect(Array.isArray(lcovResults)).toBe(true);

        // Test native CallTree analysis
        const callLinks = await store.analyzeCallTreeNative(sampleCode, "computeTotal");
        expect(Array.isArray(callLinks)).toBe(true);

        // Test native CFG branch extraction
        const cfgBranches = await store.extractControlFlowNative("if (x > 0) { doWork(); }");
        expect(Array.isArray(cfgBranches)).toBe(true);

        // Test native file classification
        const fileOutline = await store.classifyFileNative("src/features/auth-service.ts", sampleCode);
        expect(typeof fileOutline).toBe('object');

        // Test native DRM memo graph builder
        const sampleNotes = [
            { id: "1", tag: "auth", title: "Auth token validation", content: "JWT bearer security", status: "open" },
            { id: "2", tag: "auth", title: "Auth session expiration", content: "Session timeout handling", status: "open" }
        ];
        const memoEdges = await store.buildInsightGraphNative(sampleNotes, 0.2);
        expect(Array.isArray(memoEdges)).toBe(true);

        // Test native i18n/l10n key extraction
        const l10nKeys = await store.extractL10nKeysNative(`"welcome_title": "Welcome User", "button_submit": "Submit"`);
        expect(Array.isArray(l10nKeys)).toBe(true);

        // Test native resource ref mapper
        const resourceRefs = await store.mapResourceRefsNative(`import logo from "./assets/logo.png"; const font = "inter.woff2";`);
        expect(Array.isArray(resourceRefs)).toBe(true);

        // Test native dead code detector
        const deadSymbols = await store.findDeadCodeNative(
            [{ name: "unusedFunc", file_path: "src/old.ts", line: 1, usage_count: 1 }],
            ["function unusedFunc() {}"]
        );
        expect(Array.isArray(deadSymbols)).toBe(true);

        // Test native TOON tabular serializer
        const toonStr = await store.serializeToonTabularNative(["id", "name"], [["1", "Alice"], ["2", "Bob"]]);
        expect(typeof toonStr).toBe('string');
        expect(toonStr.length).toBeGreaterThan(0);

        // Cleanup test database if created
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
        if (fs.existsSync(testDbPath + '.tmp')) fs.unlinkSync(testDbPath + '.tmp');
    }, 15000);
});
