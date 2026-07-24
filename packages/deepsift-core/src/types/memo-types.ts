/**
 * @file memo-types.ts
 * @description Shared TypeScript type definitions for DRM tags, entries, and manifest structures.
 *
 * @module types/memo-types
 * @category Memory & Realms
 * @since 1.0.2
 */
export type MemoTagStatus = 'open' | 'closed' | 'archived';

export type MemoEntryType =
    | 'finding'
    | 'code_snippet'
    | 'api_response'
    | 'architecture_note'
    | 'decision'
    | 'reference'
    | 'error_solution';

export interface MemoTag {
    id: string;
    name: string;
    status: MemoTagStatus;
    createdAt: number;
    closedAt?: number;
    description?: string;
    entryCount: number;
    realmId: string;
}

export interface MemoEntry {
    id: string;
    tagId: string;
    type: MemoEntryType;
    content: string;
    summary?: string;
    source?: string;
    relations?: string[];
    createdAt: number;
    metadata?: Record<string, string>;
}

export interface MemoManifest {
    version: number;
    tags: Record<string, MemoTag>;
    lastUpdated: number;
}

export interface MemoQueryResult {
    entry: MemoEntry;
    score: number;
    matchType: 'semantic' | 'keyword' | 'hybrid' | 'relaxed_keyword';
    tagName: string;
}

export interface MemoInsightGraph {
    nodes: MemoInsightNode[];
    edges: MemoInsightEdge[];
}

export interface MemoInsightNode {
    id: string;
    label: string;
    type: MemoEntryType;
    tagId: string;
    weight: number;
}

export interface MemoInsightEdge {
    source: string;
    target: string;
    relation: 'related_to' | 'derived_from' | 'contradicts' | 'supports' | 'extends';
    strength: number;
}

export interface MemoEntriesFile {
    tagId: string;
    entries: MemoEntry[];
    lastUpdated: number;
}
