import { describe, it, expect } from 'vitest';
import { jsonToToon, toonToJson } from './toon-serializer.js';

describe('TOON Serializer', () => {
    it('should serialize and deserialize primitives', () => {
        expect(toonToJson(jsonToToon(null))).toBe(null);
        expect(toonToJson(jsonToToon(true))).toBe(true);
        expect(toonToJson(jsonToToon(false))).toBe(false);
        expect(toonToJson(jsonToToon(123))).toBe(123);
        expect(toonToJson(jsonToToon("hello"))).toBe("hello");
    });

    it('should serialize and deserialize nested objects', () => {
        const obj = {
            name: "gpt-monorepo",
            languages: {
                TypeScript: 429,
                Go: 66
            },
            frameworks: ["react", "ethers"]
        };

        const toon = jsonToToon(obj);
        console.log("Serialized Object to TOON:\n", toon);
        const parsed = toonToJson(toon);
        expect(parsed).toEqual(obj);
    });

    it('should serialize and deserialize tabular arrays of objects', () => {
        const arr = [
            { id: 1, name: "Alice", role: "admin" },
            { id: 2, name: "Bob", role: "user" }
        ];

        const toon = jsonToToon(arr);
        console.log("Serialized Tabular to TOON:\n", toon);
        const parsed = toonToJson(toon);
        expect(parsed).toEqual(arr);
    });
});
