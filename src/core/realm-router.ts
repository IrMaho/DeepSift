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
}
