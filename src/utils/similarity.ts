import { cosineSim } from '@ternlight/base';
import { SearchResult } from '../types/index.js';

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
    k: number = 60
): SearchResult[] {
    const scoreMap = new Map<string, { result: SearchResult; rrfScore: number }>();

    // Process semantic results
    semanticResults.forEach((res, index) => {
        const rank = index + 1;
        const rrfScore = 1 / (k + rank);
        scoreMap.set(res.chunk.id, { result: res, rrfScore });
    });

    // Process keyword results
    keywordResults.forEach((res, index) => {
        const rank = index + 1;
        const rrfScore = 1 / (k + rank);
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
    const combined = Array.from(scoreMap.values())
        .sort((a, b) => b.rrfScore - a.rrfScore)
        .map(entry => {
            // Assign the rrfScore to the final result's score for downstream sorting/display
            return {
                ...entry.result,
                score: entry.rrfScore
            };
        });

    return combined;
}
