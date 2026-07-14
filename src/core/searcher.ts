import { SQLiteStore } from '../storage/sqlite-store.js';
import { getEmbedding } from './embedder.js';
import { calculateCosineSimilarity, calculateCosineSimilarityBatch, applyRRF } from '../utils/similarity.js';
import { SearchQuery, SearchResult, ChunkType } from '../types/index.js';

export class Searcher {
    private store: SQLiteStore;

    constructor(store: SQLiteStore) {
        this.store = store;
    }

    public async search(searchQuery: SearchQuery): Promise<SearchResult[]> {
        const { query, topK = 10, filterType, filterPath } = searchQuery;
        
        // 1. Keyword search (BM25)
        const keywordResultsRaw = this.store.searchKeyword(query, topK * 2);
        const keywordResults = this.filterResults(keywordResultsRaw, filterType, filterPath);

        // 2. Semantic search (Vector)
        const queryVector = await getEmbedding(query);
        const candidates = this.store.getChunkEmbeddings();
        
        const scoredCandidates = calculateCosineSimilarityBatch(queryVector, candidates, topK * 2);
        
        // Fetch full chunks only for top K candidates to save memory
        const topIds = scoredCandidates.map(c => c.id);
        const topChunks = this.store.getChunksByIds(topIds);
        
        const semanticResultsRaw: SearchResult[] = topChunks.map(item => {
            const scoreObj = scoredCandidates.find(c => c.id === item.chunk.id);
            return {
                chunk: item.chunk,
                score: scoreObj ? scoreObj.score : 0.0,
                matchType: 'semantic'
            };
        });
        
        // Sort and filter
        semanticResultsRaw.sort((a, b) => b.score - a.score);
        const semanticResults = this.filterResults(semanticResultsRaw, filterType, filterPath);

        // 3. Reciprocal Rank Fusion (Hybrid)
        const combined = applyRRF(semanticResults, keywordResults);
        
        // Return topK
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
