import { NativeStore, BatchOperation } from '../storage/native-store.js';
import { getFiles } from '../utils/file-walker.js';
import { parseAST } from '../parsers/tree-sitter-parser.js';
import { parseSkillFile } from '../parsers/skill-parser.js';
import { getEmbeddings } from './embedder.js';
import { isBinaryFile } from '../utils/binary-check.js';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { GraphExtractor } from '../graphify/graph-extractor.js';
import { GraphBuilder } from '../graphify/graph-builder.js';
import { GraphClusterer } from '../graphify/graph-cluster.js';

export class Indexer {
    private store: NativeStore;
    private isIndexing: boolean = false;
    private parserProfile: 'code' | 'skill' | 'docs';

    constructor(store: NativeStore, parserProfile: 'code' | 'skill' | 'docs' = 'code') {
        this.store = store;
        this.parserProfile = parserProfile;
    }

    public async indexProject(
        rootDir: string, 
        forceReindex: boolean = false,
        onProgress?: (current: number, total: number, currentFile: string) => void
    ): Promise<{ files: number; chunks: number; newOrUpdated: number; deleted: number }> {
        if (this.isIndexing) {
            throw new Error('Indexing is already in progress');
        }

        this.isIndexing = true;
        let filesProcessed = 0;
        let deletedCount = 0;
        let chunksProcessed = 0;
        const batchOperations: any[] = [];

        try {
            const { unifiedWalk } = await import('./unified-walker.js');
            const walkResult = await unifiedWalk(rootDir);
            const allFiles = walkResult.allFiles;
            
            // Phase 1: Fetch all metadata in a SINGLE call!
            const allMetadata = forceReindex ? new Map() : await this.store.getAllMetadata();

            const filesToProcess: string[] = [];
            const fileHashes = new Map<string, string>();
            const currentFilesSet = new Set(allFiles);

            
            for (const [file, meta] of allMetadata.entries()) {
                if (!currentFilesSet.has(file)) {
                    batchOperations.push({ action: 'deleteFileChunks', filePath: file });
                    deletedCount++;
                }
            }

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
                        
                        let chunks;
                        if ((this.parserProfile === 'skill' || this.parserProfile === 'docs') && ext === 'md') {
                            chunks = parseSkillFile(file, content);
                        } else {
                            chunks = parseAST(content, file, ext);
                        }
                        
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

            const DB_BATCH_LIMIT = 200;
            if (batchOperations.length > 0) {
                const totalBatches = Math.ceil(batchOperations.length / DB_BATCH_LIMIT);
                for (let b = 0; b < batchOperations.length; b += DB_BATCH_LIMIT) {
                    const subBatch = batchOperations.slice(b, b + DB_BATCH_LIMIT);
                    const batchNum = Math.floor(b / DB_BATCH_LIMIT) + 1;
                    if (onProgress) {
                        onProgress(totalFilesToProcess, totalFilesToProcess, `Saving to database... (${batchNum}/${totalBatches})`);
                    }
                    await this.store.executeBatch(subBatch);
                }
            }
            
            // Phase 4: Graph Building
            if (filesProcessed > 0 || deletedCount > 0 || forceReindex) {
                if (onProgress) {
                    onProgress(totalFilesToProcess, totalFilesToProcess, "Building dependency graph...");
                }
                try {
                    const extractor = new GraphExtractor();
                    const builder = new GraphBuilder();
                    
                    for (const file of allFiles) {
                        if (await isBinaryFile(file)) continue;
                        try {
                            const result = extractor.extractFromFile(file);
                            builder.addExtraction(result);
                        } catch (err) {
                            // ignore unparseable for graph
                        }
                    }
                    
                    const { nodes, edges } = builder.build();
                    
                    if (onProgress) {
                        onProgress(totalFilesToProcess, totalFilesToProcess, "Detecting communities...");
                    }
                    const clusterer = new GraphClusterer(nodes, edges);
                    clusterer.detectCommunities(10, 1.0);
                    
                    if (onProgress) {
                        onProgress(totalFilesToProcess, totalFilesToProcess, "Saving graph database...");
                    }
                    await this.store.saveGraph(nodes, edges);
                    
                } catch (err) {
                    console.error("Failed to build graph:", err);
                }
            }

        } finally {
            this.isIndexing = false;
        }

        return { files: filesProcessed, chunks: chunksProcessed, newOrUpdated: filesProcessed, deleted: deletedCount };
    }

    public async getStatus() {
        const status = await this.store.getStatus();
        status.isIndexing = this.isIndexing;
        return status;
    }
}
