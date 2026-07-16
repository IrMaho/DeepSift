import { NativeStore } from '../storage/native-store.js';
import { Searcher } from './searcher.js';
import { Indexer } from './indexer.js';
import { SearchQuery, SearchResult } from '../types/index.js';
import { getRealmDbPath, getRealmGraphPath, ensureRealmDir, DEFAULT_REALM } from '../cli/cli-paths.js';
import { loadConfig, DeepSiftConfig, RealmDefinition } from '../utils/config.js';
import { applyRRF } from '../utils/similarity.js';

export interface CrossRealmResult extends SearchResult {
    realmId: string;
}

export class RealmRouter {
    private projectPath: string;
    private config: DeepSiftConfig;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.config = loadConfig(projectPath);
    }

    public listRealms(): Record<string, RealmDefinition> {
        return this.config.realms || {};
    }

    public getStore(realmId: string): NativeStore {
        ensureRealmDir(this.projectPath, realmId);
        const dbPath = getRealmDbPath(this.projectPath, realmId);
        const graphPath = getRealmGraphPath(this.projectPath, realmId);
        return new NativeStore(dbPath, graphPath, realmId, this.projectPath);
    }

    public async searchRealm(realmId: string, query: SearchQuery): Promise<CrossRealmResult[]> {
        const store = this.getStore(realmId);
        const searcher = new Searcher(store);
        const results = await searcher.search(query);
        return results.map(r => ({ ...r, realmId }));
    }

    public async searchAllRealms(query: SearchQuery, realmIds?: string[]): Promise<CrossRealmResult[]> {
        const realms = this.config.realms || {};
        const targetRealms = realmIds || Object.keys(realms);
        
        if (targetRealms.length === 0) {
            return this.searchRealm(DEFAULT_REALM, query);
        }

        const allResults: CrossRealmResult[] = [];

        for (const rid of targetRealms) {
            try {
                const results = await this.searchRealm(rid, query);
                allResults.push(...results);
            } catch {
                // skip realm
            }
        }

        allResults.sort((a, b) => b.score - a.score);
        const topK = query.topK || 10;
        return allResults.slice(0, topK);
    }

    public async indexRealm(
        realmId: string, 
        sourcePath?: string,
        force: boolean = false,
        onProgress?: (current: number, total: number, file: string) => void
    ): Promise<{ files: number; chunks: number }> {
        const store = this.getStore(realmId);
        const realmConfig = this.config.realms?.[realmId];
        const parserProfile = realmConfig?.parserProfile || 'code';
        const indexer = new Indexer(store, parserProfile);

        const targetPath = sourcePath || realmConfig?.sourcePaths?.[0] || this.projectPath;
        const fullPath = targetPath.startsWith('/') || targetPath.includes(':') 
            ? targetPath 
            : `${this.projectPath}/${targetPath}`;

        return indexer.indexProject(fullPath, force, onProgress);
    }

    public async compareRealms(realm1: string, realm2: string, query: string, topK: number = 5) {
        const r1Results = await this.searchRealm(realm1, { query, topK });
        
        const similarities: any[] = [];
        const gaps: any[] = [];

        for (const r1 of r1Results) {
            // Search realm2 using the exact content of r1 as the query to find vector matches
            // We use a shorter snippet of the content to avoid overly long queries (limit to first 500 chars)
            const queryContent = r1.chunk.content.substring(0, 500);
            const r2Results = await this.searchRealm(realm2, { query: queryContent, topK: 1 });
            
            if (r2Results.length > 0) {
                const bestMatch = r2Results[0];
                const similarityScore = bestMatch.score;

                const comparison = {
                    sourceChunk: r1,
                    targetChunk: bestMatch,
                    similarityScore
                };

                // Tunable threshold for similarity: 0.45 because semantic-only matches
                // peak at 0.50 in our RRF normalization (unless there is an exact keyword match)
                if (similarityScore >= 0.45) {
                    similarities.push(comparison);
                } else {
                    gaps.push(comparison);
                }
            } else {
                gaps.push({
                    sourceChunk: r1,
                    targetChunk: null,
                    similarityScore: 0
                });
            }
        }

        return { similarities, gaps };
    }
}
