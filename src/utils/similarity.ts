import { cosineSim } from '@ternlight/base';
import { SearchResult } from '../types/index.js';
import path from 'path';

/**
 * Calculates cosine similarity between two 384-dim Float32Arrays.
 * We use the optimized version provided by @ternlight/base.
 */
export function calculateCosineSimilarity(a: Float32Array, b: Float32Array): number {
    return cosineSim(a, b);
}

/**
 * Calculates Reciprocal Rank Fusion (RRF) scores to combine semantic and keyword search results.
 * RRF(d) = Σ 1 / (k + rank_i(d))
 */
export function applyRRF(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    k: number = 60,
    structuralWeights?: Map<string, number>
): SearchResult[] {
    const scoreMap = new Map<string, { result: SearchResult; rrfScore: number }>();

    const getWeight = (filePath: string) => {
        if (!structuralWeights) return 1.0;
        return structuralWeights.get(filePath) || 1.0;
    };

    // Process semantic results
    semanticResults.forEach((res, index) => {
        const rank = index + 1;
        const rrfScore = (1 / (k + rank)) * getWeight(res.chunk.filePath);
        scoreMap.set(res.chunk.id, { result: res, rrfScore });
    });

    // Process keyword results
    keywordResults.forEach((res, index) => {
        const rank = index + 1;
        const rrfScore = (1 / (k + rank)) * getWeight(res.chunk.filePath);
        if (scoreMap.has(res.chunk.id)) {
            const existing = scoreMap.get(res.chunk.id)!;
            existing.rrfScore += rrfScore;
            existing.result.matchType = 'hybrid';
            // Boost original score for reference
            existing.result.score = Math.max(existing.result.score, res.score);
        } else {
            scoreMap.set(res.chunk.id, { result: res, rrfScore });
        }
    });

    // Sort by RRF score descending
    const maxPossibleRrf = 2 / (k + 1); // Max RRF if rank 1 in both keyword & semantic (approx 0.03278)

    const combined = Array.from(scoreMap.values())
        .sort((a, b) => b.rrfScore - a.rrfScore)
        .map(entry => {
            // Normalize score to a human-readable 0..1 scale
            // If it matched both at rank 1, normalized score is 1.0
            // If it matched only one at rank 1, normalized score is 0.5
            const normalizedScore = Math.min(1.0, entry.rrfScore / maxPossibleRrf);
            
            return {
                ...entry.result,
                score: normalizedScore
            };
        });

    return combined;
}

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getZigBinaryPath(): string | null {
    const ext = process.platform === 'win32' ? '.exe' : '';
    const paths = [
        path.resolve(__dirname, `../bin/deepsift-math${ext}`),
        path.resolve(__dirname, `../../bin/deepsift-math${ext}`),
        path.resolve(__dirname, `../../native/core-zig/zig-out/bin/deepsift-math${ext}`),
        path.resolve(__dirname, `../../../native/core-zig/zig-out/bin/deepsift-math${ext}`),
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/**
 * Quantizes a 384-dimensional Float32Array into a 48-byte Buffer (Binary Quantization).
 * Maps values > 0.0 to 1 and <= 0.0 to 0.
 */
export function quantizeF32ToBQ(vector: Float32Array): Buffer {
    const buffer = Buffer.alloc(48); // 12 * 4 bytes = 48 bytes
    for (let i = 0; i < 384; i++) {
        if (vector[i] > 0) {
            const byteIdx = Math.floor(i / 8);
            const bitIdx = i % 8;
            buffer[byteIdx] |= (1 << bitIdx);
        }
    }
    return buffer;
}

/**
 * Calculates Hamming similarity for a batch of BQ candidate vectors using the compiled Zig binary
 * for native speed. Falls back to TypeScript if the binary is missing or errors out.
 */
export function calculateHammingSimilarityBatch(
    queryVector: Buffer,
    candidates: { id: string; embedding: Buffer }[],
    topK: number
): { id: string; score: number }[] {
    const binPath = getZigBinaryPath();
    if (!binPath) {
        // Fallback to TS
        return candidates.map(c => {
            let distance = 0;
            for (let i = 0; i < 48; i++) {
                let xor = queryVector[i] ^ c.embedding[i];
                while (xor > 0) {
                    distance += xor & 1;
                    xor >>= 1;
                }
            }
            return {
                id: c.id,
                score: 1.0 - (distance / 384.0)
            };
        });
    }

    try {
        const headerSize = 4 + 48 + 4;
        const recordSize = 4 + 48;
        const totalSize = headerSize + candidates.length * recordSize;
        const buffer = Buffer.alloc(totalSize);

        let offset = 0;
        // Write topK
        buffer.writeUInt32LE(topK, offset); offset += 4;
        // Write queryVector
        queryVector.copy(buffer, offset); offset += 48;
        // Write numChunks
        buffer.writeUInt32LE(candidates.length, offset); offset += 4;

        // Write candidates
        for (let i = 0; i < candidates.length; i++) {
            buffer.writeUInt32LE(i, offset); offset += 4;
            candidates[i].embedding.copy(buffer, offset); offset += 48;
        }

        // Execute Zig binary synchronously
        console.log(`Sending buffer of size ${buffer.length} to Zig for ${candidates.length} candidates.`);
        const outputBuffer = execFileSync(binPath, [], { input: buffer, maxBuffer: 10 * 1024 * 1024 });

        let outOffset = 0;
        const writeCount = outputBuffer.readUInt32LE(outOffset); outOffset += 4;

        const results: { id: string; score: number }[] = [];
        for (let i = 0; i < writeCount; i++) {
            const index = outputBuffer.readUInt32LE(outOffset); outOffset += 4;
            const score = outputBuffer.readFloatLE(outOffset); outOffset += 4;
            results.push({
                id: candidates[index].id,
                score
            });
        }
        return results;
    } catch (err) {
        console.error("Zig math binary execution failed, falling back to TS:", err);
        return candidates.map(c => {
            let distance = 0;
            for (let i = 0; i < 48; i++) {
                let xor = queryVector[i] ^ c.embedding[i];
                while (xor > 0) {
                    distance += xor & 1;
                    xor >>= 1;
                }
            }
            return {
                id: c.id,
                score: 1.0 - (distance / 384.0)
            };
        });
    }
}
