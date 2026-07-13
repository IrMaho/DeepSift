export type ChunkType = 'function' | 'class' | 'import' | 'config' | 'block' | 'comment';

export interface CodeChunk {
    id: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: ChunkType;
    language: string;
}

export interface EmbeddedChunk {
    chunk: CodeChunk;
    embedding: Float32Array;
}

export interface SearchResult {
    chunk: CodeChunk;
    score: number;
    matchType: 'semantic' | 'keyword' | 'hybrid';
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
