/**
 * @file memo-searcher.ts
 * @description Semantic search engine for querying entries within DRM research tags.
 *
 * @module memo/memo-searcher
 * @category Memory & Realms
 * @since 1.0.3
 */
import { MemoManifestManager } from './manifest-manager.js';
import { NoteProcessor } from './note-processor.js';
import { NativeStore } from '../storage/native-store.js';
import { Searcher } from '../core/searcher.js';
import { MemoQueryResult, MemoEntry, MemoEntryType } from '../types/memo-types.js';

export class MemoSearcher {
    private projectPath: string;
    private manifest: MemoManifestManager;
    private noteProcessor: NoteProcessor;

    constructor(projectPath: string, manifest: MemoManifestManager, noteProcessor: NoteProcessor) {
        this.projectPath = projectPath;
        this.manifest = manifest;
        this.noteProcessor = noteProcessor;
    }

    async queryTag(
        tagName: string,
        query: string,
        options?: { topK?: number; filterType?: MemoEntryType[] }
    ): Promise<MemoQueryResult[]> {
        const tag = this.manifest.getTag(tagName);
        if (!tag) {
            throw new Error(`Tag '${tagName}' not found.`);
        }

        const topK = options?.topK || 10;
        const dbPath = this.manifest.getTagDbPath(tag.id);
        const graphPath = this.manifest.getTagGraphPath(tag.id);
        const store = new NativeStore(dbPath, graphPath, tag.realmId, this.projectPath);
        const searcher = new Searcher(store);

        const results = await searcher.search({ query, topK: topK * 2 });

        let filtered = results;
        if (options?.filterType && options.filterType.length > 0) {
            filtered = results.filter(r => {
                const entryType = r.chunk.metadata?.['memoEntryType'] as MemoEntryType | undefined;
                return entryType && options.filterType!.includes(entryType);
            });
        }

        const entries = this.noteProcessor.getEntries(tag.id);
        const entryMap = new Map<string, MemoEntry>();
        for (const entry of entries) {
            entryMap.set(entry.id, entry);
        }

        return filtered.slice(0, topK).map(r => {
            const entryId = r.chunk.metadata?.['memoEntryId'] || '';
            const entry = entryMap.get(entryId);

            return {
                entry: entry || {
                    id: entryId,
                    tagId: tag.id,
                    type: (r.chunk.metadata?.['memoEntryType'] as MemoEntryType) || 'finding',
                    content: r.chunk.content,
                    createdAt: 0
                },
                score: r.score,
                matchType: r.matchType,
                tagName: tag.name
            };
        });
    }

    async queryAllOpenTags(
        query: string,
        topK: number = 10
    ): Promise<MemoQueryResult[]> {
        const openTags = this.manifest.getOpenTags();
        if (openTags.length === 0) {
            return [];
        }

        const allResults: MemoQueryResult[] = [];
        for (const tag of openTags) {
            const tagResults = await this.queryTag(tag.name, query, { topK });
            allResults.push(...tagResults);
        }

        allResults.sort((a, b) => b.score - a.score);
        return allResults.slice(0, topK);
    }

    async queryByType(tagName: string, type: MemoEntryType): Promise<MemoEntry[]> {
        const tag = this.manifest.getTag(tagName);
        if (!tag) {
            throw new Error(`Tag '${tagName}' not found.`);
        }

        const entries = this.noteProcessor.getEntries(tag.id);
        return entries.filter(e => e.type === type);
    }

    getTagStats(tagName: string): {
        name: string;
        status: string;
        entryCount: number;
        typeBreakdown: Record<string, number>;
        createdAt: string;
        closedAt?: string;
    } | undefined {
        const tag = this.manifest.getTag(tagName);
        if (!tag) return undefined;

        const entries = this.noteProcessor.getEntries(tag.id);
        const typeBreakdown: Record<string, number> = {};
        for (const entry of entries) {
            typeBreakdown[entry.type] = (typeBreakdown[entry.type] || 0) + 1;
        }

        return {
            name: tag.name,
            status: tag.status,
            entryCount: entries.length,
            typeBreakdown,
            createdAt: new Date(tag.createdAt).toLocaleString(),
            closedAt: tag.closedAt ? new Date(tag.closedAt).toLocaleString() : undefined
        };
    }
}
