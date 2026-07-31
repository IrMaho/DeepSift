/**
 * @file searcher.ts
 * @description Hybrid vector cosine + BM25 lexical result combiner and relevance scorer.
 *
 * @module core/searcher
 * @category Core Search & Discovery
 * @since 1.0.0
 */
import path from 'path';
import { NativeStore } from '../storage/native-store.js';
import { getEmbedding } from './embedder.js';
import { applyRRF } from '../utils/similarity.js';
import { SearchQuery, SearchResult, ChunkType } from '../types/index.js';
import { loadDNA } from '../intelligence/project-dna.js';

export class Searcher {
    private store: NativeStore;

    constructor(store: NativeStore) {
        this.store = store;
    }

    public static tokenizeQuery(rawQuery: string): string[] {
        const STOP_WORDS = new Set([
            'the', 'a', 'an', 'in', 'on', 'and', 'or', 'to', 'for', 'of', 'with', 'is', 'are', 'be', 'this', 'that', 'from', 'by', 'as', 'at', 'it', 'into', 'file', 'handler'
        ]);
        
        // Split camelCase, PascalCase, kebab-case, snake_case, and whitespace
        const parts = rawQuery
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_.:/\\]+/g, ' ')
            .split(/\s+/)
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

        return Array.from(new Set(parts));
    }

    public async search(searchQuery: SearchQuery): Promise<SearchResult[]> {
        const { query, topK = 10, filterType, filterPath } = searchQuery;
        
        let candidates: SearchResult[] = [];
        
        const queryVectorF32 = await getEmbedding(query);
        const hybridNativeRaw = await this.store.searchHybridNative(query, queryVectorF32, 400);
        if (hybridNativeRaw && hybridNativeRaw.length > 0) {
            candidates = this.filterResults(hybridNativeRaw, filterType, filterPath);
        }
        
        if (candidates.length === 0) {
            const keywordResultsRaw = await this.store.searchKeyword(query, 50);
            const keywordResults = this.filterResults(keywordResultsRaw, filterType, filterPath);

            const semanticResultsRaw = await this.store.searchSemantic(queryVectorF32, 50);
            const semanticResults = this.filterResults(semanticResultsRaw, filterType, filterPath);

            let structuralWeights: Map<string, number> | undefined;
            try {
                const dna = await loadDNA(process.cwd());
                if (dna && dna.architecture && dna.architecture.coreFiles) {
                    structuralWeights = new Map<string, number>();
                    dna.architecture.coreFiles.forEach((f: string) => structuralWeights!.set(f, 1.5));
                }
            } catch (e) {
                // Ignore if DNA is not available
            }

            const combined = applyRRF(semanticResults, keywordResults, 60, structuralWeights);
            candidates = combined;

            const tokens = Searcher.tokenizeQuery(query);
            if (tokens.length >= 2) {
                const relaxedResultsMap = new Map<string, SearchResult>();

                for (const token of tokens) {
                    const subKw = await this.store.searchKeyword(token, 20);
                    const filteredSubKw = this.filterResults(subKw, filterType, filterPath);

                    for (const item of filteredSubKw) {
                        const existing = relaxedResultsMap.get(item.chunk.id);
                        if (existing) {
                            existing.score += 0.10;
                        } else {
                            relaxedResultsMap.set(item.chunk.id, {
                                ...item,
                                score: 0.15,
                                matchType: 'relaxed_keyword'
                            });
                        }
                    }
                }

                // Path & Token Alignment Bonus (Reduced weights to prevent BM25 UI Bias)
                for (const res of relaxedResultsMap.values()) {
                    const filePathLower = res.chunk.filePath.toLowerCase();
                    const contentLower = res.chunk.content.toLowerCase();
                    let matchedTokenCount = 0;

                    for (const t of tokens) {
                        if (filePathLower.includes(t)) {
                            res.score += 0.50; // High bonus for path matches
                            matchedTokenCount++;
                        } else if (contentLower.includes(t)) {
                            res.score += 0.10; // Medium bonus for content matches
                            matchedTokenCount++;
                        }
                    }

                    if (matchedTokenCount === tokens.length) {
                        res.score += 0.50; // High bonus for full match
                    }
                }

                const relaxedSorted = Array.from(relaxedResultsMap.values());
                if (relaxedSorted.length > 0) {
                    const merged = [...combined, ...relaxedSorted];
                    const seenIds = new Set<string>();
                    const deduplicated: SearchResult[] = [];

                    for (const item of merged) {
                        if (!seenIds.has(item.chunk.id)) {
                            seenIds.add(item.chunk.id);
                            deduplicated.push(item);
                        }
                    }
                    candidates = deduplicated;
                }
            }
        }
        
        candidates.sort((a, b) => b.score - a.score);

        const topScore = candidates[0]?.score || 0;
        if (searchQuery.fast || searchQuery.skipRerank || topScore >= 0.50) {
            return candidates.slice(0, topK);
        }

        const topCandidates = candidates.slice(0, Math.min(15, candidates.length));

        try {
            const rerankerPayload = topCandidates.map(c => {
                return {
                    content: c.chunk.content,
                    original: c
                };
            });

            const { Reranker } = await import('./reranker.js');
            const reranked = await Reranker.rerank(query, rerankerPayload, topK);

            return reranked.map(r => ({
                ...r.original,
                score: r.crossScore,
                matchType: 'hybrid'
            }));
        } catch (err) {
            console.error("[DeepSift] Reranking failed, falling back to basic scoring.", err);
            return topCandidates.slice(0, topK);
        }
    }

    private filterResults(results: SearchResult[], types?: ChunkType[], pathSubstring?: string): SearchResult[] {
        return results.filter(res => {
            if (types && types.length > 0 && !types.includes(res.chunk.type)) return false;
            if (pathSubstring && !res.chunk.filePath.includes(pathSubstring)) return false;
            return true;
        });
    }
}
