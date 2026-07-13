import { SQLiteStore } from '../storage/sqlite-store.js';
import { getEmbedding } from './embedder.js';
import { calculateCosineSimilarity, applyRRF } from '../utils/similarity.js';
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
        const queryVector = getEmbedding(query);
        const allChunks = this.store.getAllChunks();
        
        const semanticResultsRaw: SearchResult[] = allChunks.map(item => ({
            chunk: item.chunk,
            score: calculateCosineSimilarity(queryVector, item.embedding),
            matchType: 'semantic'
        }));
        
        // Sort and take top
        semanticResultsRaw.sort((a, b) => b.score - a.score);
        const topSemantic = semanticResultsRaw.slice(0, topK * 2);
        const semanticResults = this.filterResults(topSemantic, filterType, filterPath);

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
