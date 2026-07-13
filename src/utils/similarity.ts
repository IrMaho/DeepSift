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
