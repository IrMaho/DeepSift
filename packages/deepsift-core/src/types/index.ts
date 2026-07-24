/**
 * @file index.ts
 * @description Central type barrel export index for all DeepSift public type definitions.
 *
 * @module types/index
 * @category Core Search & Discovery
 * @since 1.0.0
 */
import { ChunkFamily } from './dna-types.js';

export type ChunkType = 'function' | 'class' | 'import' | 'config' | 'block' | 'comment';

export interface CodeChunk {
    id: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: ChunkType;
    family?: ChunkFamily;
    language: string;
    metadata?: Record<string, string>;
}

export interface EmbeddedChunk {
    chunk: CodeChunk;
    embedding: any; // Float32Array for cosine, Buffer for BQ
}

export interface SearchResult {
    chunk: CodeChunk;
    score: number;
    matchType: 'semantic' | 'keyword' | 'hybrid' | 'relaxed_keyword';
}

export interface IndexMetadata {
    filePath: string;
    fileHash: string;
    lastIndexed: number;
    chunkCount: number;
}

export interface SearchQuery {
    query: string;
    topK?: number;
    filterType?: ChunkType[];
    filterPath?: string;
}

export interface IndexStatus {
    totalFiles: number;
    totalChunks: number;
    lastUpdated: number;
    isIndexing: boolean;
}

export * from './memo-types.js';


