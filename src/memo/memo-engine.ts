import { MemoManifestManager } from './manifest-manager.js';
import { NoteProcessor } from './note-processor.js';
import { MemoSearcher } from './memo-searcher.js';
import { InsightGraphBuilder } from './insight-graph.js';
import {
    MemoTag,
    MemoEntry,
    MemoEntryType,
    MemoQueryResult,
    MemoInsightGraph
} from '../types/memo-types.js';

export class MemoEngine {
    private manifest: MemoManifestManager;
    private noteProcessor: NoteProcessor;
    private searcher: MemoSearcher;
    private graphBuilder: InsightGraphBuilder;
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.manifest = new MemoManifestManager(projectPath);
        this.noteProcessor = new NoteProcessor(projectPath, this.manifest);
        this.searcher = new MemoSearcher(projectPath, this.manifest, this.noteProcessor);
        this.graphBuilder = new InsightGraphBuilder(projectPath, this.manifest, this.noteProcessor);
    }

    openTag(name: string, description?: string): MemoTag {
        return this.manifest.createTag(name, description);
    }

    closeTag(name: string): MemoTag {
        return this.manifest.closeTag(name);
    }

    archiveTag(name: string): MemoTag {
        return this.manifest.archiveTag(name);
    }

    purgeTag(name: string): string {
        return this.manifest.purgeTag(name);
    }

    getOpenTags(): MemoTag[] {
        return this.manifest.getOpenTags();
    }

    getAllTags(): MemoTag[] {
        return this.manifest.getAllTags();
    }

    async addEntry(
        tagName: string,
        content: string,
        options?: { type?: MemoEntryType; source?: string; summary?: string }
    ): Promise<MemoEntry> {
        return this.noteProcessor.addEntry(tagName, content, options);
    }

    async addBatch(
        tagName: string,
        items: { content: string; type?: MemoEntryType; source?: string }[]
    ): Promise<MemoEntry[]> {
        return this.noteProcessor.addBatch(tagName, items);
    }

    async query(
        tagName: string,
        query: string,
        options?: { topK?: number; filterType?: MemoEntryType[] }
    ): Promise<MemoQueryResult[]> {
        return this.searcher.queryTag(tagName, query, options);
    }

    async queryAll(query: string, topK?: number): Promise<MemoQueryResult[]> {
        return this.searcher.queryAllOpenTags(query, topK);
    }

    async queryByType(tagName: string, type: MemoEntryType): Promise<MemoEntry[]> {
        return this.searcher.queryByType(tagName, type);
    }

    getTagStats(tagName: string) {
        return this.searcher.getTagStats(tagName);
    }

    async buildInsightGraph(tagName: string): Promise<MemoInsightGraph> {
        return this.graphBuilder.buildGraph(tagName);
    }

    async getGraphSummary(tagName: string): Promise<string> {
        return this.graphBuilder.getGraphSummary(tagName);
    }

    getEntries(tagName: string): MemoEntry[] {
        const tag = this.manifest.getTag(tagName);
        if (!tag) return [];
        return this.noteProcessor.getEntries(tag.id);
    }

    hasOpenTags(): boolean {
        return this.manifest.getOpenTags().length > 0;
    }

    getOpenTagNames(): string[] {
        return this.manifest.getOpenTags().map(t => t.name);
    }
}
