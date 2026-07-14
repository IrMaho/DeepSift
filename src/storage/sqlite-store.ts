import Database from 'better-sqlite3';
import { EmbeddedChunk, IndexMetadata, SearchResult, ChunkType } from '../types/index.js';
import path from 'path';

export class SQLiteStore {
    private db: Database.Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath, { timeout: 10000 }); // 10 seconds busy timeout
        this.db.pragma('journal_mode = WAL'); // Better concurrency
        this.init();
    }

    private init() {
        // Initialize tables
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                content TEXT NOT NULL,
                start_line INTEGER,
                end_line INTEGER,
                chunk_type TEXT,
                language TEXT,
                embedding BLOB NOT NULL,
                created_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS file_metadata (
                file_path TEXT PRIMARY KEY,
                file_hash TEXT NOT NULL,
                last_indexed INTEGER NOT NULL,
                chunk_count INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_chunks_file_path ON chunks(file_path);
            CREATE INDEX IF NOT EXISTS idx_chunks_type ON chunks(chunk_type);

            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                content,
                file_path,
                content='chunks',
                content_rowid='rowid',
                tokenize='unicode61 tokenchars ''[]{}()_#-'''
            );
        `);
    }

    public saveMetadata(metadata: IndexMetadata) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO file_metadata (file_path, file_hash, last_indexed, chunk_count)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(metadata.filePath, metadata.fileHash, metadata.lastIndexed, metadata.chunkCount);
    }

    public getMetadata(filePath: string): IndexMetadata | undefined {
        const stmt = this.db.prepare('SELECT * FROM file_metadata WHERE file_path = ?');
        const row = stmt.get(filePath) as any;
        if (!row) return undefined;
        return {
            filePath: row.file_path,
            fileHash: row.file_hash,
            lastIndexed: row.last_indexed,
            chunkCount: row.chunk_count
        };
    }

    public deleteFileChunks(filePath: string) {
        // Delete from FTS first using triggers or manually
        this.db.exec('BEGIN TRANSACTION');
        try {
            this.db.prepare(`INSERT INTO chunks_fts (chunks_fts, rowid, content, file_path) 
                             SELECT 'delete', rowid, content, file_path FROM chunks WHERE file_path = ?`)
                   .run(filePath);
            this.db.prepare('DELETE FROM chunks WHERE file_path = ?').run(filePath);
            this.db.prepare('DELETE FROM file_metadata WHERE file_path = ?').run(filePath);
            this.db.exec('COMMIT');
        } catch (err) {
            this.db.exec('ROLLBACK');
            throw err;
        }
    }

    public saveChunks(chunks: EmbeddedChunk[]) {
        if (chunks.length === 0) return;

        this.db.exec('BEGIN TRANSACTION');
        try {
            const insertChunk = this.db.prepare(`
                INSERT INTO chunks (id, file_path, content, start_line, end_line, chunk_type, language, embedding, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const insertFTS = this.db.prepare(`
                INSERT INTO chunks_fts (rowid, content, file_path)
                VALUES (?, ?, ?)
            `);

            for (const item of chunks) {
                const { chunk, embedding } = item;
                const buffer = Buffer.from(embedding.buffer);
                
                const info = insertChunk.run(
                    chunk.id, chunk.filePath, chunk.content, chunk.startLine, chunk.endLine, 
                    chunk.type, chunk.language, buffer, Date.now()
                );

                insertFTS.run(info.lastInsertRowid, chunk.content, chunk.filePath);
            }
            this.db.exec('COMMIT');
        } catch (err) {
            this.db.exec('ROLLBACK');
            throw err;
        }
    }

    public searchKeyword(query: string, topK: number = 20): SearchResult[] {
        // Strip punctuation but keep special characters like []{}()_#- for FTS5
        const safeTokens = query.replace(/[^\w\s\[\]\{\}\(\)\_\#\-]/g, ' ').trim().split(/\s+/).filter(t => t.length > 0);
        if (safeTokens.length === 0) return [];
        const safeQuery = safeTokens.map(t => `"${t}"*`).join(' OR ');
        const stmt = this.db.prepare(`
            SELECT c.*, fts.rank as score
            FROM chunks_fts fts
            JOIN chunks c ON fts.rowid = c.rowid
            WHERE chunks_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        `);
        const rows = stmt.all(safeQuery, topK) as any[];

        return rows.map(row => ({
            chunk: {
                id: row.id,
                filePath: row.file_path,
                content: row.content,
                startLine: row.start_line,
                endLine: row.end_line,
                type: row.chunk_type as ChunkType,
                language: row.language
            },
            // FTS rank is usually a negative number or smaller is better. We invert it for our RRF formula.
            score: Math.abs(1 / (row.score || 1)), 
            matchType: 'keyword'
        }));
    }

    public getAllChunks(): EmbeddedChunk[] {
        const stmt = this.db.prepare('SELECT * FROM chunks');
        const rows = stmt.all() as any[];
        
        return rows.map(row => {
            const floatArray = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / Float32Array.BYTES_PER_ELEMENT);
            return {
                chunk: {
                    id: row.id,
                    filePath: row.file_path,
                    content: row.content,
                    startLine: row.start_line,
                    endLine: row.end_line,
                    type: row.chunk_type as ChunkType,
                    language: row.language
                },
                embedding: floatArray
            };
        });
    }

    public getChunkEmbeddings(): { id: string; embedding: Buffer }[] {
        const stmt = this.db.prepare('SELECT id, embedding FROM chunks');
        const rows = stmt.all() as any[];
        return rows.map(row => ({
            id: row.id,
            embedding: row.embedding
        }));
    }

    public getChunksByIds(ids: string[]): EmbeddedChunk[] {
        if (ids.length === 0) return [];
        const placeholders = ids.map(() => '?').join(',');
        const stmt = this.db.prepare(`SELECT * FROM chunks WHERE id IN (${placeholders})`);
        const rows = stmt.all(...ids) as any[];
        
        return rows.map(row => {
            const floatArray = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / Float32Array.BYTES_PER_ELEMENT);
            return {
                chunk: {
                    id: row.id,
                    filePath: row.file_path,
                    content: row.content,
                    startLine: row.start_line,
                    endLine: row.end_line,
                    type: row.chunk_type as ChunkType,
                    language: row.language
                },
                embedding: floatArray
            };
        });
    }

    public close() {
        this.db.close();
    }

    public getStatus() {
        const fileCount = (this.db.prepare('SELECT COUNT(*) as count FROM file_metadata').get() as any).count;
        const chunkCount = (this.db.prepare('SELECT COUNT(*) as count FROM chunks').get() as any).count;
        const lastUpdated = (this.db.prepare('SELECT MAX(last_indexed) as max FROM file_metadata').get() as any).max;

        return {
            totalFiles: fileCount,
            totalChunks: chunkCount,
            lastUpdated: lastUpdated || 0,
            isIndexing: false
        };
    }
}
