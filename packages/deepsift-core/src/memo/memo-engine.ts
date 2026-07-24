/**
 * @file memo-engine.ts
 * @description Dynamic Research Memory (DRM) Engine Core facade.
 * Coordinates research tag tracking, entry insertion, semantic querying,
 * insight graph construction, and Markdown export for AI Agents.
 * 
 * @module memo/memo-engine
 * @category Memory & Realms
 * @since 1.0.2
 */

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

/**
 * Facade class providing public API for Dynamic Research Memory operations.
 */
export class MemoEngine {
    private manifest: MemoManifestManager;
    private noteProcessor: NoteProcessor;
    private searcher: MemoSearcher;
    private graphBuilder: InsightGraphBuilder;
    private projectPath: string;

    /**
     * Initializes the MemoEngine for a specific project directory.
     * 
     * @param projectPath Absolute path to the workspace root.
     */
    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.manifest = new MemoManifestManager(projectPath);
        this.noteProcessor = new NoteProcessor(projectPath, this.manifest);
        this.searcher = new MemoSearcher(projectPath, this.manifest, this.noteProcessor);
        this.graphBuilder = new InsightGraphBuilder(projectPath, this.manifest, this.noteProcessor);
    }

    /**
     * Opens a new research tag or retrieves an existing active tag.
     * 
     * @param name Name of the research tag.
     * @param description Optional description of the research goal.
     * @returns MemoTag object.
     */
    openTag(name: string, description?: string): MemoTag {
        return this.manifest.createTag(name, description);
    }

    /**
     * Closes an active research tag when the research phase completes.
     * 
     * @param name Tag name to close.
     * @returns Updated MemoTag.
     */
    closeTag(name: string): MemoTag {
        return this.manifest.closeTag(name);
    }

    /**
     * Archives a research tag.
     * 
     * @param name Tag name to archive.
     * @returns Updated MemoTag.
     */
    archiveTag(name: string): MemoTag {
        return this.manifest.archiveTag(name);
    }

    /**
     * Permanently purges a research tag and all associated entry records.
     * 
     * @param name Tag name to purge.
     * @returns Confirmation message.
     */
    purgeTag(name: string): string {
        return this.manifest.purgeTag(name);
    }

    /**
     * Returns a list of all currently open research tags.
     */
    getOpenTags(): MemoTag[] {
        return this.manifest.getOpenTags();
    }

    /**
     * Returns a list of all research tags across all states.
     */
    getAllTags(): MemoTag[] {
        return this.manifest.getAllTags();
    }

    /**
     * Adds a research note entry to a specified tag.
     * 
     * @param tagName Target tag name.
     * @param content Content text of the research note.
     * @param options Metadata options (type, source, summary).
     * @returns Created MemoEntry.
     */
    async addEntry(
        tagName: string,
        content: string,
        options?: { type?: MemoEntryType; source?: string; summary?: string }
    ): Promise<MemoEntry> {
        return this.noteProcessor.addEntry(tagName, content, options);
    }

    /**
     * Adds a batch of research entries in a single atomic transaction.
     * 
     * @param tagName Target tag name.
     * @param items Array of entry items.
     * @returns Array of created MemoEntry objects.
     */
    async addBatch(
        tagName: string,
        items: { content: string; type?: MemoEntryType; source?: string }[]
    ): Promise<MemoEntry[]> {
        return this.noteProcessor.addBatch(tagName, items);
    }

    /**
     * Queries research notes within a specific tag using semantic vector search.
     * 
     * @param tagName Tag name to query.
     * @param query Search query text.
     * @param options Search options (topK, filterType).
     * @returns Array of MemoQueryResult records.
     */
    async query(
        tagName: string,
        query: string,
        options?: { topK?: number; filterType?: MemoEntryType[] }
    ): Promise<MemoQueryResult[]> {
        return this.searcher.queryTag(tagName, query, options);
    }

    /**
     * Queries all currently open research tags simultaneously.
     * 
     * @param query Search query text.
     * @param topK Max results to return.
     */
    async queryAll(query: string, topK?: number): Promise<MemoQueryResult[]> {
        return this.searcher.queryAllOpenTags(query, topK);
    }

    /**
     * Queries entries by entry type (e.g. 'decision', 'finding', 'bug').
     */
    async queryByType(tagName: string, type: MemoEntryType): Promise<MemoEntry[]> {
        return this.searcher.queryByType(tagName, type);
    }

    /**
     * Gets statistic counters for a tag.
     */
    getTagStats(tagName: string) {
        return this.searcher.getTagStats(tagName);
    }

    /**
     * Constructs a knowledge graph connecting concepts and files within a research tag.
     */
    async buildInsightGraph(tagName: string): Promise<MemoInsightGraph> {
        return this.graphBuilder.buildGraph(tagName);
    }

    /**
     * Returns a human-readable text summary of the insight graph.
     */
    async getGraphSummary(tagName: string): Promise<string> {
        return this.graphBuilder.getGraphSummary(tagName);
    }

    /**
     * Returns all entries recorded in a research tag.
     */
    getEntries(tagName: string): MemoEntry[] {
        const tag = this.manifest.getTag(tagName);
        if (!tag) return [];
        return this.noteProcessor.getEntries(tag.id);
    }

    /**
     * Checks if there are any open research tags.
     */
    hasOpenTags(): boolean {
        return this.manifest.getOpenTags().length > 0;
    }

    /**
     * Returns names of all currently open research tags.
     */
    getOpenTagNames(): string[] {
        return this.manifest.getOpenTags().map(t => t.name);
    }

    /**
     * Exports all research entries for a tag into formatted Markdown.
     * 
     * @param tagName Target tag name.
     * @returns Formatted Markdown string.
     */
    exportMarkdown(tagName: string): string {
        const entries = this.getEntries(tagName);
        if (entries.length === 0) return `No entries recorded in DRM tag '${tagName}'.`;
        return entries.map(e => `### [${e.type || 'note'}] ${e.createdAt}\n${e.content}`).join('\n\n');
    }
}
