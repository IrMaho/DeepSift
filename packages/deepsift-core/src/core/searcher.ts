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
        
        const queryVectorF32 = await getEmbedding(query);
        const hybridNativeRaw = await this.store.searchHybridNative(query, queryVectorF32, topK * 2);
        if (hybridNativeRaw && hybridNativeRaw.length > 0) {
            const filtered = this.filterResults(hybridNativeRaw, filterType, filterPath);
            if (filtered.length > 0) {
                return filtered.slice(0, topK);
            }
        }

        const keywordResultsRaw = await this.store.searchKeyword(query, topK * 2);
        const keywordResults = this.filterResults(keywordResultsRaw, filterType, filterPath);

        const semanticResultsRaw = await this.store.searchSemantic(queryVectorF32, topK * 2);
        const semanticResults = this.filterResults(semanticResultsRaw, filterType, filterPath);

        // Calculate Structural Weights from DNA
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

        // 3. Reciprocal Rank Fusion (Hybrid) with structural weights
        const combined = applyRRF(semanticResults, keywordResults, 60, structuralWeights);
        
        if (combined.length > 0 && combined[0].score >= 0.20) {
            return combined.slice(0, topK);
        }

        // 4. Smart Query Relaxation & Sub-term Keyword Matching
        const tokens = Searcher.tokenizeQuery(query);
        if (tokens.length >= 2) {
            const relaxedResultsMap = new Map<string, SearchResult>();

            for (const token of tokens) {
                const subKw = await this.store.searchKeyword(token, topK * 2);
                const filteredSubKw = this.filterResults(subKw, filterType, filterPath);

                for (const item of filteredSubKw) {
                    const existing = relaxedResultsMap.get(item.chunk.id);
                    if (existing) {
                        existing.score += 0.25;
                    } else {
                        relaxedResultsMap.set(item.chunk.id, {
                            ...item,
                            score: 0.35,
                            matchType: 'relaxed_keyword'
                        });
                    }
                }
            }

            // Path & Token Alignment Bonus
            for (const res of relaxedResultsMap.values()) {
                const filePathLower = res.chunk.filePath.toLowerCase();
                const contentLower = res.chunk.content.toLowerCase();
                let matchedTokenCount = 0;

                for (const t of tokens) {
                    if (filePathLower.includes(t)) {
                        res.score += 0.40;
                        matchedTokenCount++;
                    } else if (contentLower.includes(t)) {
                        res.score += 0.15;
                        matchedTokenCount++;
                    }
                }

                if (matchedTokenCount === tokens.length) {
                    res.score += 0.50; // All query tokens matched!
                }
            }

            const relaxedSorted = Array.from(relaxedResultsMap.values()).sort((a, b) => b.score - a.score);
            
            // Combine primary and relaxed results if primary was non-empty
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

                deduplicated.sort((a, b) => b.score - a.score);
                return deduplicated.slice(0, topK);
            }
        }

        return combined.slice(0, topK);
    }

    private filterResults(results: SearchResult[], types?: ChunkType[], pathSubstring?: string): SearchResult[] {
        return results.filter(res => {
            if (types && types.length > 0 && !types.includes(res.chunk.type)) return false;
            if (pathSubstring && !res.chunk.filePath.includes(pathSubstring)) return false;
            return true;
        });
    }
}
