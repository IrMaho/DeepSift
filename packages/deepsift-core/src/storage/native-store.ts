/**
 * @file native-store.ts
 * @description SQLite native store for vector chunks, graph topology, and metadata persistence.
 *
 * @module storage/native-store
 * @category Core Search & Discovery
 * @since 1.0.0
 */
import { ZigBridge } from './zig-bridge.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import zlib from 'zlib';
import { EmbeddedChunk, IndexMetadata, SearchResult, ChunkType } from '../types/index.js';

export interface BatchOperation {
    action: 'saveMetadata' | 'deleteFileChunks' | 'saveChunks';
    metadata?: any;
    filePath?: string;
    chunks?: any[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the correct path to the Zig executable
// It is located at bin/deepsift-math.exe
const EXE_PATH = process.platform === 'win32'
    ? path.resolve(__dirname, '../../bin/deepsift-math.exe')
    : path.resolve(__dirname, '../../bin/deepsift-math');

export class NativeStore {
    private dbPath: string;
    private graphDbPath?: string;
    private realmId?: string;
    private projectPath?: string;
    private workingDbPath: string;

    constructor(dbPath: string, graphDbPath?: string, realmId?: string, projectPath?: string) {
        this.dbPath = dbPath;
        this.graphDbPath = graphDbPath;
        this.realmId = realmId;
        this.projectPath = projectPath;
        this.workingDbPath = dbPath + ".tmp";
        
        // Decompress database if exists
        if (fs.existsSync(this.dbPath) && !fs.existsSync(this.workingDbPath)) {
            try {
                const data = fs.readFileSync(this.dbPath);
                const uncompressed = zlib.gunzipSync(data);
                fs.writeFileSync(this.workingDbPath, uncompressed);
            } catch (e) {
                // If it wasn't compressed, just copy it
                fs.copyFileSync(this.dbPath, this.workingDbPath);
            }
        }
        
        if (!fs.existsSync(EXE_PATH)) {
            // Initialize bridge if needed
            ZigBridge.getInstance();
        }
    }

    private async executeAction(action: string, payload: any = {}): Promise<any> {
        const req = {
            action,
            dbPath: this.workingDbPath,
            graphDbPath: this.graphDbPath,
            realmId: this.realmId,
            projectPath: this.projectPath,
            ...payload
        };

        const result = await ZigBridge.getInstance().sendRequest(req);
        return result;
    }

    private async syncToDisk() {
        if (fs.existsSync(this.workingDbPath)) {
            try {
                const data = await fs.promises.readFile(this.workingDbPath);
                const compressed = zlib.gzipSync(data);
                await fs.promises.writeFile(this.dbPath, compressed);
            } catch (e) {
                console.error("Failed to compress cache.db", e);
            }
        }
    }

    public async saveMetadata(metadata: IndexMetadata) {
        await this.executeAction('saveMetadata', {
            metadata: {
                file_path: metadata.filePath,
                file_hash: metadata.fileHash,
                last_indexed: metadata.lastIndexed,
                chunk_count: metadata.chunkCount
            }
        });
        await this.syncToDisk();
    }

    public async getMetadata(filePath: string): Promise<IndexMetadata | undefined> {
        const data = await this.executeAction('getMetadata', { filePath });
        if (!data) return undefined;
        return {
            filePath: data.file_path,
            fileHash: data.file_hash,
            lastIndexed: data.last_indexed,
            chunkCount: data.chunk_count
        };
    }

    public async getAllMetadata(): Promise<Map<string, IndexMetadata>> {
        const data = await this.executeAction('getAllMetadata');
        const map = new Map<string, IndexMetadata>();
        if (!data) return map;
        
        for (const row of data) {
            map.set(row.file_path, {
                filePath: row.file_path,
                fileHash: row.file_hash,
                lastIndexed: row.last_indexed,
                chunkCount: row.chunk_count
            });
        }
        return map;
    }

    public async deleteFileChunks(filePath: string) {
        await this.executeAction('deleteFileChunks', { filePath });
        await this.syncToDisk();
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

    public async saveChunks(chunks: EmbeddedChunk[]) {
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

        await this.executeAction('saveChunks', { chunks: serializedChunks });
        await this.syncToDisk();
    }

    public async executeBatch(ops: BatchOperation[]) {
        if (ops.length === 0) return;
        await this.executeAction('batchExecute', { batch: ops });
        await this.syncToDisk();
    }

    public formatChunkForBatch(c: EmbeddedChunk): any {
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
    }

    public async searchSemantic(queryEmbeddingF32: Float32Array, topK: number = 20): Promise<SearchResult[]> {
        const bqQuery = this.quantizeF32ToBQ(queryEmbeddingF32);
        const data = await this.executeAction('searchSemantic', { queryEmbedding: bqQuery, topK });
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


    public async searchKeyword(query: string, topK: number = 20): Promise<SearchResult[]> {
        const data = await this.executeAction('searchKeyword', { query, topK });
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

    public async searchHybridNative(query: string, queryEmbeddingF32?: Float32Array, topK: number = 20): Promise<SearchResult[]> {
        const bqQuery = queryEmbeddingF32 ? this.quantizeF32ToBQ(queryEmbeddingF32) : undefined;
        const data = await this.executeAction('searchHybridNative', { query, queryEmbedding: bqQuery, topK });
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
            matchType: row.matchType || 'hybrid-native'
        }));
    }

    public async extractSymbolsNative(content: string): Promise<any[]> {
        const data = await this.executeAction('extractSymbolsNative', { content });
        return data || [];
    }

    public async computeCloneHashesNative(content: string, minLines: number = 5): Promise<any[]> {
        const data = await this.executeAction('computeCloneHashesNative', { content, minLines });
        return data || [];
    }

    public async walkDirectoryNative(projectPath: string): Promise<any[]> {
        const data = await this.executeAction('walkDirectoryNative', { projectPath });
        return data || [];
    }

    public async computeSimilarityMatrixNative(threshold: number = 0.70, limit: number = 50): Promise<any[]> {
        const data = await this.executeAction('computeSimilarityMatrixNative', { threshold, topK: limit });
        return data || [];
    }

    public async mineColorTokensNative(content: string): Promise<any[]> {
        const data = await this.executeAction('mineColorTokensNative', { content });
        return data || [];
    }

    public async analyzeNamingConventionsNative(content: string): Promise<any> {
        const data = await this.executeAction('analyzeNamingConventionsNative', { content });
        return data || { camel_case: 0, pascal_case: 0, snake_case: 0, kebab_case: 0 };
    }

    public async parseLcovNative(content: string): Promise<any[]> {
        const data = await this.executeAction('parseLcovNative', { content });
        return data || [];
    }

    public async analyzeCallTreeNative(content: string, symbol: string): Promise<any[]> {
        const data = await this.executeAction('analyzeCallTreeNative', { content, symbol });
        return data || [];
    }

    public async extractControlFlowNative(content: string): Promise<any[]> {
        const data = await this.executeAction('extractControlFlowNative', { content });
        return data || [];
    }

    public async classifyFileNative(filePath: string, content?: string): Promise<any> {
        const data = await this.executeAction('classifyFileNative', { filePath, content });
        return data || { file_name: filePath, category: 'Core', weight: 1.0 };
    }

    public async buildInsightGraphNative(notes: any[], minWeight: number = 0.30): Promise<any[]> {
        const data = await this.executeAction('buildInsightGraphNative', { notes, threshold: minWeight });
        return data || [];
    }

    public async extractL10nKeysNative(content: string): Promise<any[]> {
        const data = await this.executeAction('extractL10nKeysNative', { content });
        return data || [];
    }

    public async mapResourceRefsNative(content: string): Promise<any[]> {
        const data = await this.executeAction('mapResourceRefsNative', { content });
        return data || [];
    }

    public async findDeadCodeNative(symbols: any[], contents: string[]): Promise<any[]> {
        const data = await this.executeAction('findDeadCodeNative', { symbols, contents });
        return data || [];
    }

    public async serializeToonTabularNative(headers: string[], rows: string[][]): Promise<string> {
        const data = await this.executeAction('serializeToonTabularNative', { headers, rows });
        return data || '';
    }

    public async renderTextBitmapNative(content: string, width: number = 640, height: number = 480): Promise<Buffer> {
        const data = await this.executeAction('renderTextBitmapNative', { content, width, height });
        return Buffer.from(data || []);
    }

    public async getAllChunks(): Promise<EmbeddedChunk[]> {
        const data = await this.executeAction('getAllChunks');
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

    public async getChunkEmbeddings(): Promise<{ id: string; embedding: Buffer }[]> {
        const data = await this.executeAction('getChunkEmbeddings');
        if (!data) return [];
        
        return data.map((row: any) => ({
            id: row.id,
            embedding: Buffer.from(row.embedding)
        }));
    }

    public async getChunksByIds(ids: string[]): Promise<EmbeddedChunk[]> {
        if (ids.length === 0) return [];
        const data = await this.executeAction('getChunksByIds', { ids });
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

    public async saveGraph(nodes: any[], edges: any[]) {
        const nodeIndexMap = new Map<string, number>();
        const mappedNodes = nodes.map((node, index) => {
            nodeIndexMap.set(node.id, index);
            return {
                id: node.id,
                label: node.label,
                source_file: node.sourceFile,
                source_location: node.sourceLocation,
                community: node.community || 0,
                in_degree: node.inDegree || 0,
                out_degree: node.outDegree || 0,
                page_rank: node.pageRank || 0
            };
        });

        const mappedEdges = edges.map(edge => ({
            source: nodeIndexMap.get(edge.source) ?? 0,
            target: nodeIndexMap.get(edge.target) ?? 0,
            relation: edge.relation,
            confidence: edge.confidence
        }));

        await this.executeAction('saveGraph', {
            graphNodes: mappedNodes,
            graphEdges: mappedEdges
        });
    }

    public async getStatus(): Promise<any> {
        const data = await this.executeAction('getStatus');
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
