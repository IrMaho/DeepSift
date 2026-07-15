import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { EmbeddedChunk, IndexMetadata, SearchResult, ChunkType } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the correct path to the Zig executable
// It is located at bin/deepsift-math.exe
const EXE_PATH = process.platform === 'win32'
    ? path.resolve(__dirname, '../../bin/deepsift-math.exe')
    : path.resolve(__dirname, '../../bin/deepsift-math');

export class NativeStore {
    private dbPath: string;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
        
        // Ensure the executable exists
        if (!fs.existsSync(EXE_PATH)) {
            throw new Error(`Zig database executable not found at ${EXE_PATH}. Please compile it first.`);
        }
    }

    private executeAction(action: string, payload: any = {}): any {
        const req = {
            action,
            dbPath: this.dbPath,
            ...payload
        };

        const result = spawnSync(EXE_PATH, [], {
            input: JSON.stringify(req),
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 100 // 100MB output buffer
        });

        if (result.error) {
            throw new Error(`Failed to execute Zig database process: ${result.error.message}`);
        }

        if (result.status !== 0) {
            throw new Error(`Zig database process exited with code ${result.status}: ${result.stderr}`);
        }

        if (!result.stdout || result.stdout.trim().length === 0) {
            return undefined;
        }

        try {
            const res = JSON.parse(result.stdout);
            if (res.error) {
                throw new Error(`Database error: ${res.message}`);
            }
            return res.data;
        } catch (err: any) {
            if (err.name === 'SyntaxError') {
                throw new Error(`Invalid JSON response from Zig database: ${result.stdout}`);
            }
            throw err;
        }
    }

    public saveMetadata(metadata: IndexMetadata) {
        this.executeAction('saveMetadata', {
            metadata: {
                file_path: metadata.filePath,
                file_hash: metadata.fileHash,
                last_indexed: metadata.lastIndexed,
                chunk_count: metadata.chunkCount
            }
        });
    }

    public getMetadata(filePath: string): IndexMetadata | undefined {
        const data = this.executeAction('getMetadata', { filePath });
        if (!data) return undefined;
        return {
            filePath: data.file_path,
            fileHash: data.file_hash,
            lastIndexed: data.last_indexed,
            chunkCount: data.chunk_count
        };
    }

    public deleteFileChunks(filePath: string) {
        this.executeAction('deleteFileChunks', { filePath });
    }

    private quantizeF32ToBQ(vector: Float32Array): number[] {
        const result = new Array(12).fill(0);
        for (let i = 0; i < 384; i++) {
            if (vector[i] > 0) {
                const u32Idx = Math.floor(i / 32);
                const bitIdx = i % 32;
                result[u32Idx] = (result[u32Idx] | (1 << bitIdx)) >>> 0;
            }
        }
        return result;
    }

    public saveChunks(chunks: EmbeddedChunk[]) {
        if (chunks.length === 0) return;
        
        const serializedChunks = chunks.map(c => {
            let bqEmbedding: number[];
            if (c.embedding instanceof Float32Array) {
                bqEmbedding = this.quantizeF32ToBQ(c.embedding);
            } else if (Array.isArray(c.embedding) && c.embedding.length === 12) {
                bqEmbedding = c.embedding;
            } else {
                bqEmbedding = this.quantizeF32ToBQ(new Float32Array(c.embedding));
            }
            
            return {
                id: c.chunk.id,
                file_path: c.chunk.filePath,
                content: c.chunk.content,
                start_line: c.chunk.startLine,
                end_line: c.chunk.endLine,
                chunk_type: c.chunk.type,
                language: c.chunk.language || '',
                embedding: bqEmbedding
            };
        });

        this.executeAction('saveChunks', { chunks: serializedChunks });
    }

    public searchSemantic(queryEmbeddingF32: Float32Array, topK: number = 20): SearchResult[] {
        const bqQuery = this.quantizeF32ToBQ(queryEmbeddingF32);
        const data = this.executeAction('searchSemantic', { queryEmbedding: bqQuery, topK });
        if (!data) return [];
        
        return data.map((row: any) => ({
            chunk: {
                id: row.id,
                filePath: row.filePath,
                content: row.content,
                startLine: row.startLine,
                endLine: row.endLine,
                type: row.type,
                language: row.language
            },
            score: row.score,
            matchType: row.matchType || 'semantic'
        }));
    }


    public searchKeyword(query: string, topK: number = 20): SearchResult[] {
        const data = this.executeAction('searchKeyword', { query, topK });
        if (!data) return [];
        
        return data.map((row: any) => ({
            chunk: {
                id: row.id,
                filePath: row.filePath,
                content: row.content,
                startLine: row.startLine,
                endLine: row.endLine,
                type: row.type,
                language: row.language
            },
            score: row.score,
            matchType: row.matchType || 'keyword'
        }));
    }

    public getAllChunks(): EmbeddedChunk[] {
        const data = this.executeAction('getAllChunks');
        if (!data) return [];
        
        return data.map((row: any) => ({
            chunk: {
                id: row.id,
                filePath: row.file_path,
                content: row.content,
                startLine: row.start_line,
                endLine: row.end_line,
                type: row.chunk_type,
                language: row.language
            },
            embedding: row.embedding
        }));
    }

    public getChunkEmbeddings(): { id: string; embedding: Buffer }[] {
        const data = this.executeAction('getChunkEmbeddings');
        if (!data) return [];
        
        return data.map((row: any) => ({
            id: row.id,
            embedding: Buffer.from(row.embedding)
        }));
    }

    public getChunksByIds(ids: string[]): EmbeddedChunk[] {
        if (ids.length === 0) return [];
        const data = this.executeAction('getChunksByIds', { ids });
        if (!data) return [];
        
        return data.map((row: any) => ({
            chunk: {
                id: row.id,
                filePath: row.file_path,
                content: row.content,
                startLine: row.start_line,
                endLine: row.end_line,
                type: row.chunk_type,
                language: row.language
            },
            embedding: row.embedding
        }));
    }

    public close() {
        // No-op for the native store, as the process exits after each request.
    }

    public getStatus() {
        const data = this.executeAction('getStatus');
        if (!data) {
            return {
                totalFiles: 0,
                totalChunks: 0,
                lastUpdated: 0,
                isIndexing: false
            };
        }
        return {
            totalFiles: data.totalFiles || 0,
            totalChunks: data.totalChunks || 0,
            lastUpdated: data.lastUpdated || 0,
            isIndexing: false
        };
    }
}
