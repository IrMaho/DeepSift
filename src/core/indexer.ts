import { NativeStore, BatchOperation } from '../storage/native-store.js';
import { getFiles } from '../utils/file-walker.js';
import { parseAST } from '../parsers/tree-sitter-parser.js';
import { getEmbeddings } from './embedder.js';
import { isBinaryFile } from '../utils/binary-check.js';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export class Indexer {
    private store: NativeStore;
    private isIndexing: boolean = false;

    constructor(store: NativeStore) {
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
            const allFiles = await getFiles(rootDir);
            
            // Phase 1: Fetch all metadata in a SINGLE call!
            const allMetadata = forceReindex ? new Map() : this.store.getAllMetadata();

            const filesToProcess: string[] = [];
            const fileHashes = new Map<string, string>();

            // Phase 2: Rapid file scanning (No DB spawn!)
            for (let i = 0; i < allFiles.length; i++) {
                const file = allFiles[i];
                if (onProgress) {
                    onProgress(i + 1, allFiles.length, "Scanning: " + path.relative(rootDir, file));
                }

                try {
                    if (await isBinaryFile(file)) continue;

                    const stat = await fs.stat(file);
                    if (stat.size > 1024 * 1024) continue;

                    const content = await fs.readFile(file, 'utf-8');
                    const hash = crypto.createHash('md5').update(content).digest('hex');
                    fileHashes.set(file, hash);

                    const existingMeta = allMetadata.get(file);
                    if (!forceReindex && existingMeta && existingMeta.fileHash === hash) {
                        continue;
                    }

                    filesToProcess.push(file);
                } catch (err) {
                    // ignore unreadable files
                }
            }

            // Phase 3: Parsing and Embedding in parallel (batched)
            const BATCH_SIZE = 5;
            let currentFileIndex = 0;
            const totalFilesToProcess = filesToProcess.length;

            const batchOperations: BatchOperation[] = [];

            for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
                const batchFiles = filesToProcess.slice(i, i + BATCH_SIZE);
                
                await Promise.all(batchFiles.map(async (file) => {
                    currentFileIndex++;
                    if (onProgress) {
                        onProgress(currentFileIndex, totalFilesToProcess, "Embedding: " + path.relative(rootDir, file));
                    }

                    try {
                        const content = await fs.readFile(file, 'utf-8');
                        const ext = path.extname(file).replace('.', '');
                        const chunks = parseAST(content, file, ext);
                        
                        const existingMeta = allMetadata.get(file);
                        if (existingMeta) {
                            batchOperations.push({ action: 'deleteFileChunks', filePath: file });
                        }

                        if (chunks.length > 0) {
                            const texts = chunks.map(c => c.content);
                            const embeddings = await getEmbeddings(texts);

                            const embeddedChunks = chunks.map((chunk, idx) => ({
                                chunk,
                                embedding: embeddings[idx]
                            }));

                            // Format them for the batch API
                            const formattedChunks = embeddedChunks.map(c => this.store.formatChunkForBatch(c));
                            batchOperations.push({ action: 'saveChunks', chunks: formattedChunks });
                        }

                        batchOperations.push({
                            action: 'saveMetadata',
                            metadata: {
                                file_path: file,
                                file_hash: fileHashes.get(file)!,
                                last_indexed: Date.now(),
                                chunk_count: chunks.length
                            }
                        });

                        filesProcessed++;
                        chunksProcessed += chunks.length;

                    } catch (err) {
                        console.error(`Error processing file ${file}:`, err);
                    }
                }));
            }

            // Phase 4: SINGLE database call to write everything!
            if (batchOperations.length > 0) {
                if (onProgress) onProgress(totalFilesToProcess, totalFilesToProcess, "Saving to database...");
                this.store.executeBatch(batchOperations);
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
