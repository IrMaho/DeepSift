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
import { createRequire } from 'module';
import { EmbeddedChunk, IndexMetadata, SearchResult, ChunkType } from '../types/index.js';
import { GraphifyNode, GraphifyEdge } from '../graphify/graph-types.js';

export interface BatchOperation {
    action: 'saveMetadata' | 'deleteFileChunks' | 'saveChunks';
    metadata?: IndexMetadata;
    filePath?: string;
    chunks?: Record<string, unknown>[];
}

export interface CalltreeRow {
    file_path: string;
    line: number;
    snippet: string;
    role?: string;
    [key: string]: unknown;
}

interface SearchRow {
    id: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: ChunkType;
    language: string;
    score: number;
    bm25Score?: number;
    vectorScore?: number;
    matchType?: SearchResult['matchType'];
}

interface ChunkDbRow {
    id: string;
    file_path: string;
    content: string;
    start_line: number;
    end_line: number;
    chunk_type: ChunkType;
    language: string;
    embedding: number[];
}

interface EmbeddingRow {
    id: string;
    embedding: number[] | Buffer;
}

interface MetadataRow {
    file_path: string;
    file_hash: string;
    last_indexed: number;
    chunk_count: number;
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

    constructor(dbPath: string, graphDbPath?: string, realmId?: string, projectPath?: string) {
        this.dbPath = dbPath;
        this.graphDbPath = graphDbPath;
        this.realmId = realmId;
        this.projectPath = projectPath;
        // One-time decompression for migration
        const uncompressFile = (src: string) => {
            if (!fs.existsSync(src)) return;
            // Check for gzip magic number (0x1f 0x8b)
            const buffer = Buffer.alloc(2);
            try {
                const fd = fs.openSync(src, 'r');
                fs.readSync(fd, buffer, 0, 2, 0);
                fs.closeSync(fd);
                if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
                    return; // Already uncompressed (or invalid)
                }
            } catch (e) {
                return;
            }

            console.log('[DeepSift] Migrating compressed DB to raw format for zero-copy streaming: ' + src);
            const temp = src + ".uncompressed.tmp";
            try {
                const _require = createRequire(import.meta.url);
                const zlib = _require('zlib');
                const data = fs.readFileSync(src);
                const uncompressed = zlib.gunzipSync(data);
                fs.writeFileSync(temp, uncompressed);
                fs.renameSync(temp, src);
            } catch (e) {
                if (fs.existsSync(temp)) fs.unlinkSync(temp);
                console.error('[DeepSift] Failed to decompress ' + src, e);
            }
        };

        uncompressFile(this.dbPath);
        if (this.graphDbPath) {
            uncompressFile(this.graphDbPath);
        }

        if (!fs.existsSync(EXE_PATH)) {
            // Initialize bridge if needed
            ZigBridge.getInstance();
        }
    }

    private async executeAction<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
        const req = {
            action,
            dbPath: this.dbPath,
            graphDbPath: this.graphDbPath,
            realmId: this.realmId,
            projectPath: this.projectPath,
            ...payload
        };

        const result = await ZigBridge.getInstance().sendRequest(req);
        return result;
    }

    public async syncToDisk() {
        // No-op: Zig writes directly to the uncompressed DB file via mmap
    }

    public async syncGraphToDisk() {
        // No-op: Zig writes directly to the uncompressed DB file via mmap
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
        const data = await this.executeAction<MetadataRow | null>('getMetadata', { filePath });
        if (!data) return undefined;
        return {
            filePath: data.file_path,
            fileHash: data.file_hash,
            lastIndexed: data.last_indexed,
            chunkCount: data.chunk_count
        };
    }

    public async getAllMetadata(): Promise<Map<string, IndexMetadata>> {
        const data = await this.executeAction<MetadataRow[] | null>('getAllMetadata');
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

    public async extractChunksNative(content: string, filePath: string, language: string): Promise<Record<string, unknown>[]> {
        const result = await this.executeAction<Record<string, unknown>[] | null>('extractChunksNative', {
            content,
            filePath,
            language
        });
        return result || [];
    }

    public async extractChunksBulkNative(filePaths: string[]): Promise<Record<string, unknown>[]> {
        const result = await this.executeAction<Record<string, unknown>[] | null>('extractChunksBulkNative', {
            filePaths
        });
        return result || [];
    }

    public async extractCalltreeBulkNative(filePaths: string[], symbol: string): Promise<CalltreeRow[]> {
        const result = await this.executeAction<CalltreeRow[] | null>('extractCalltreeBulkNative', {
            filePaths,
            symbol
        });
        return result || [];
    }

    public async addGraphNode(node: GraphifyNode) {
        await this.executeAction('saveGraph', { graphNodes: [node] });
        await this.syncGraphToDisk();
    }

    public async addGraphEdge(edge: GraphifyEdge) {
        await this.executeAction('saveGraph', { graphEdges: [edge] });
        await this.syncGraphToDisk();
    }

    public async computePageRank() {
        await this.executeAction('computePageRankNative');
        await this.syncGraphToDisk();
    }

    public async computeCommunities() {
        await this.executeAction('computeCommunitiesNative');
        await this.syncGraphToDisk();
    }

    public async expandContext(startNodes: number[], depth: number = 2, hubThreshold: number = 50): Promise<number[]> {
        const result = await this.executeAction<number[] | null>('expandContextNative', {
            startNodes,
            depth,
            hubThreshold
        });
        return result || [];
    }

    private quantizeF32ToSift(vector: Float32Array | number[]) {
        let min_val = Infinity;
        let max_val = -Infinity;
        for (let i = 0; i < vector.length; i++) {
            if (vector[i] < min_val) min_val = vector[i];
            if (vector[i] > max_val) max_val = vector[i];
        }

        const range = max_val - min_val;
        const scale = range === 0 ? 1.0 : range / 15.0;
        const offset = min_val;

        const outlier_indices = new Array(16).fill(0);
        const outlier_values = new Array(16).fill(0);
        for (let i = 0; i < 16; i++) {
            outlier_indices[i] = i;
            const norm = Math.round((vector[i] - min_val) / scale);
            outlier_values[i] = Math.max(-128, Math.min(127, norm));
        }

        const packed_data = new Array(376).fill(0);
        let p = 0;
        let r = 16;
        while (r + 1 < vector.length && p < 376) {
            const n1 = Math.max(0, Math.min(15, Math.round((vector[r] - min_val) / scale)));
            const n2 = Math.max(0, Math.min(15, Math.round((vector[r + 1] - min_val) / scale)));
            packed_data[p] = n1 | (n2 << 4);
            p++;
            r += 2;
        }

        return {
            scale,
            offset,
            outlier_indices,
            outlier_values,
            packed_data
        };
    }

    public async saveChunks(chunks: EmbeddedChunk[]) {
        if (chunks.length === 0) return;
        
        const serializedChunks = chunks.map(c => {
            let siftEmbedding;
            if (c.embedding instanceof Float32Array || Array.isArray(c.embedding)) {
                // If it's a 12-element BQ array, this quantize logic will produce garbage.
                // However, since we're using hybrid quantization, raw Float32Arrays of length 384 are expected.
                if (c.embedding.length === 768) {
                    siftEmbedding = this.quantizeF32ToSift(c.embedding as Float32Array | number[]);
                } else if (c.embedding.length === 12 || c.embedding.length === 24) {
                    // Fallback to avoid crash, but this should be deprecated
                    siftEmbedding = this.quantizeF32ToSift(new Float32Array(768));
                }
            }
            
            return {
                id: c.chunk.id,
                file_path: c.chunk.filePath,
                content: c.chunk.content,
                start_line: c.chunk.startLine,
                end_line: c.chunk.endLine,
                chunk_type: c.chunk.type,
                language: c.chunk.language || '',
                semantic_kind: c.chunk.semanticKind || 0,
                ast_density: c.chunk.astDensity || 0.0,
                embedding: siftEmbedding
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

    public formatChunkForBatch(c: EmbeddedChunk): Record<string, unknown> {
        let siftEmbedding;
        if (c.embedding instanceof Float32Array || Array.isArray(c.embedding)) {
            if (c.embedding.length === 768) {
                siftEmbedding = this.quantizeF32ToSift(c.embedding as Float32Array | number[]);
            } else {
                siftEmbedding = this.quantizeF32ToSift(new Float32Array(768));
            }
        }
        
        return {
            id: c.chunk.id,
            file_path: c.chunk.filePath,
            content: c.chunk.content,
            start_line: c.chunk.startLine,
            end_line: c.chunk.endLine,
            chunk_type: c.chunk.type,
            language: c.chunk.language || '',
            semantic_kind: c.chunk.semanticKind || 0,
            ast_density: c.chunk.astDensity || 0.0,
            embedding: siftEmbedding
        };
    }

    public async searchSemantic(embedding: number[] | Float32Array, topK: number = 20): Promise<SearchResult[]> {
        const siftEmbedding = (embedding.length === 384)
            ? this.quantizeF32ToSift(embedding)
            : this.quantizeF32ToSift(new Float32Array(384));

        const data = await this.executeAction<SearchRow[] | null>('searchSemantic', {
            queryEmbedding: siftEmbedding,
            topK
        });if (!data) return [];
        
        return data.map((row: SearchRow) => ({
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
            bm25Score: row.bm25Score,
            vectorScore: row.vectorScore,
            matchType: row.matchType || 'semantic'
        }));
    }


    public async searchKeyword(query: string, topK: number = 20): Promise<SearchResult[]> {
        const data = await this.executeAction<SearchRow[] | null>('searchKeyword', { query, topK });
        if (!data) return [];
        
        return data.map((row: SearchRow) => ({
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
            bm25Score: row.bm25Score,
            vectorScore: row.vectorScore,
            matchType: row.matchType || 'keyword'
        }));
    }

    public async searchHybridNative(query: string, embedding: number[] | Float32Array | null, topK: number = 20, filterPath?: string): Promise<SearchResult[]> {
        let siftEmbedding = null;
        if (embedding) {
            siftEmbedding = (embedding.length === 768)
                ? this.quantizeF32ToSift(embedding)
                : this.quantizeF32ToSift(new Float32Array(768).fill(0));
        }

        const data = await this.executeAction<SearchRow[] | null>('searchHybridNative', {
            query,
            queryEmbedding: siftEmbedding,
            topK,
            filterPath
        });if (!data) return [];
        
        return data.map((row: SearchRow) => ({
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
            bm25Score: row.bm25Score,
            vectorScore: row.vectorScore,
            matchType: row.matchType || 'hybrid'
        }));
    }

    public async extractSymbolsNative(content: string): Promise<string[]> {
        const data = await this.executeAction<string[] | null>('extractSymbolsNative', { content });
        return data || [];
    }

    public async computeCloneHashesNative(content: string, minLines: number = 5): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('computeCloneHashesNative', { content, minLines });
        return data || [];
    }

    public async walkDirectoryNative(projectPath: string): Promise<string[]> {
        const data = await this.executeAction<string[] | null>('walkDirectoryNative', { projectPath });
        return data || [];
    }

    public async computeSimilarityMatrixNative(threshold: number = 0.70, limit: number = 50): Promise<number[][]> {
        const data = await this.executeAction<number[][] | null>('computeSimilarityMatrixNative', { threshold, topK: limit });
        return data || [];
    }

    public async mineColorTokensNative(content: string): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('mineColorTokensNative', { content });
        return data || [];
    }

    public async analyzeNamingConventionsNative(content: string): Promise<Record<string, number>> {
        const data = await this.executeAction<Record<string, number> | null>('analyzeNamingConventionsNative', { content });
        return data || { camel_case: 0, pascal_case: 0, snake_case: 0, kebab_case: 0 };
    }

    public async parseLcovNative(content: string): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('parseLcovNative', { content });
        return data || [];
    }

    public async analyzeCallTreeNative(content: string, symbol: string): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('analyzeCallTreeNative', { content, symbol });
        return data || [];
    }

    public async extractControlFlowNative(content: string): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('extractControlFlowNative', { content });
        return data || [];
    }

    public async classifyFileNative(filePath: string, content?: string): Promise<Record<string, unknown>> {
        const data = await this.executeAction<Record<string, unknown> | null>('classifyFileNative', { filePath, content });
        return data || { file_name: filePath, category: 'Core', weight: 1.0 };
    }

    public async buildInsightGraphNative(notes: Record<string, unknown>[], minWeight: number = 0.30): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('buildInsightGraphNative', { notes, threshold: minWeight });
        return data || [];
    }

    public async extractL10nKeysNative(content: string): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('extractL10nKeysNative', { content });
        return data || [];
    }

    public async mapResourceRefsNative(content: string): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('mapResourceRefsNative', { content });
        return data || [];
    }

    public async findDeadCodeNative(symbols: Record<string, unknown>[], contents: string[]): Promise<Record<string, unknown>[]> {
        const data = await this.executeAction<Record<string, unknown>[] | null>('findDeadCodeNative', { symbols, contents });
        return data || [];
    }

    public async serializeToonTabularNative(headers: string[], rows: string[][]): Promise<string> {
        const data = await this.executeAction<string | null>('serializeToonTabularNative', { headers, rows });
        return data || '';
    }

    public async renderTextBitmapNative(content: string, width: number = 640, height: number = 480): Promise<Buffer> {
        const data = await this.executeAction<number[] | null>('renderTextBitmapNative', { content, width, height });
        return Buffer.from(data || []);
    }

    public async getAllChunks(): Promise<EmbeddedChunk[]> {
        const data = await this.executeAction<ChunkDbRow[] | null>('getAllChunks');
        if (!data) return [];
        
        return data.map((row: ChunkDbRow) => ({
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
        const data = await this.executeAction<EmbeddingRow[] | null>('getChunkEmbeddings');
        if (!data) return [];
        
        return data.map((row: EmbeddingRow) => ({
            id: row.id,
            embedding: Buffer.from(row.embedding)
        }));
    }

    public async getChunksByIds(ids: string[]): Promise<EmbeddedChunk[]> {
        if (ids.length === 0) return [];
        const data = await this.executeAction<ChunkDbRow[] | null>('getChunksByIds', { ids });
        if (!data) return [];
        
        return data.map((row: ChunkDbRow) => ({
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

    
  public async extractCycleNative(): Promise<string[]> {
    return this.executeAction<string[]>('extractCycleNative');
  }

  public async extractTaintNative(symbol: string): Promise<string[]> {
    return this.executeAction<string[]>('extractTaintNative', { symbol });
  }

  public close() {
        // No-op for the native store, as the process exits after each request.
    }

    public async saveGraph(nodes: GraphifyNode[], edges: GraphifyEdge[]) {
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

    public async getStatus(): Promise<{ totalFiles: number; totalChunks: number; lastUpdated: number; isIndexing: boolean }> {
        const data = await this.executeAction<Record<string, unknown> | null>('getStatus');
        if (!data) {
            return {
                totalFiles: 0,
                totalChunks: 0,
                lastUpdated: 0,
                isIndexing: false
            };
        }
        return {
            totalFiles: (data.totalFiles as number) || 0,
            totalChunks: (data.totalChunks as number) || 0,
            lastUpdated: (data.lastUpdated as number) || 0,
            isIndexing: false
        };
    }
}
