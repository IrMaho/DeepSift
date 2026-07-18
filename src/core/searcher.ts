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

    public async search(searchQuery: SearchQuery): Promise<SearchResult[]> {
        const { query, topK = 10, filterType, filterPath } = searchQuery;
        
        const keywordResultsRaw = await this.store.searchKeyword(query, topK * 2);
        const keywordResults = this.filterResults(keywordResultsRaw, filterType, filterPath);

        const queryVectorF32 = await getEmbedding(query);
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
