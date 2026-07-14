import { SQLiteStore } from '../storage/sqlite-store.js';
import { getFiles } from '../utils/file-walker.js';
import { parseAST } from '../parsers/tree-sitter-parser.js';
import { getEmbeddings } from './embedder.js';
import { isBinaryFile } from '../utils/binary-check.js';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export class Indexer {
    private store: SQLiteStore;
    private isIndexing: boolean = false;

    constructor(store: SQLiteStore) {
        this.store = store;
    }

    public async indexProject(
        rootDir: string, 
        forceReindex: boolean = false,
        onProgress?: (current: number, total: number, currentFile: string) => void
    ): Promise<{ files: number; chunks: number }> {
        if (this.isIndexing) {
            throw new Error('Indexing is already in progress');
        }

        this.isIndexing = true;
        let filesProcessed = 0;
        let chunksProcessed = 0;

        try {
            const files = await getFiles(rootDir);
            const totalFiles = files.length;
            let currentFileIndex = 0;

            for (const file of files) {
                currentFileIndex++;
                if (onProgress) {
                    onProgress(currentFileIndex, totalFiles, path.relative(rootDir, file));
                }

                try {
                    if (await isBinaryFile(file)) {
                        continue; // Automatically skip any binary files (images, compiled blobs, etc.)
                    }

                    // Skip large files (> 1MB) which are usually generated or data files and break the parser/embedder
                    const stat = await fs.stat(file);
                    if (stat.size > 1024 * 1024) {
                        continue;
                    }

                    const content = await fs.readFile(file, 'utf-8');
                    const hash = crypto.createHash('md5').update(content).digest('hex');
                    const existingMeta = this.store.getMetadata(file);

                    // Skip if unchanged unless forced
                    if (!forceReindex && existingMeta && existingMeta.fileHash === hash) {
                        continue;
                    }

                    // Delete old chunks if exists
                    if (existingMeta) {
                        this.store.deleteFileChunks(file);
                    }

                    const ext = path.extname(file).replace('.', '');
                    const chunks = parseAST(content, file, ext);

                    if (chunks.length > 0) {
                        // We embed all chunks for this file
                        const texts = chunks.map(c => c.content);
                        const embeddings = await getEmbeddings(texts);

                        const embeddedChunks = chunks.map((chunk, i) => ({
                            chunk,
                            embedding: embeddings[i]
                        }));

                        this.store.saveChunks(embeddedChunks);
                    }

                    this.store.saveMetadata({
                        filePath: file,
                        fileHash: hash,
                        lastIndexed: Date.now(),
                        chunkCount: chunks.length
                    });

                    filesProcessed++;
                    chunksProcessed += chunks.length;

                } catch (err) {
                    console.error(`Error processing file ${file}:`, err);
                }
            }
        } finally {
            this.isIndexing = false;
        }

        return { files: filesProcessed, chunks: chunksProcessed };
    }

    public getStatus() {
        const status = this.store.getStatus();
        status.isIndexing = this.isIndexing;
        return status;
    }
}
