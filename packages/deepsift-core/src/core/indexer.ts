/**
 * @file indexer.ts
 * @description Codebase Incremental Indexer & AST Vector Embedder Engine.
 * Scans workspace files, generates AST chunks, computes vector embeddings,
 * extracts dependency graphs, and commits metadata to NativeStore SQLite.
 * 
 * @module core/indexer
 * @category Core Search & Discovery
 * @since 1.0.0
 */

import { NativeStore, BatchOperation } from '../storage/native-store.js';
import { parseSkillFile } from '../parsers/skill-parser.js';
import { parseWithAst } from '../parsers/ast-chunker.js';
import { getEmbeddings } from './embedder.js';
import { isBinaryFile } from '../utils/binary-check.js';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { GraphExtractor } from '../graphify/graph-extractor.js';
import { GraphBuilder } from '../graphify/graph-builder.js';
import { GraphClusterer } from '../graphify/graph-cluster.js';

/**
 * Incremental codebase indexer coordinating AST parsing, embeddings, and graph extraction.
 */
export class Indexer {
    private store: NativeStore;
    private isIndexing: boolean = false;
    private parserProfile: 'code' | 'skill' | 'docs';

    /**
     * Initializes the Indexer.
     * 
     * @param store Target NativeStore instance.
     * @param parserProfile Parser mode ('code', 'skill', or 'docs').
     */
    constructor(store: NativeStore, parserProfile: 'code' | 'skill' | 'docs' = 'code') {
        this.store = store;
        this.parserProfile = parserProfile;
    }

    /**
     * Indexes or incrementally updates indexed files within rootDir.
     * 
     * @param rootDir Absolute path to workspace root.
     * @param forceReindex Force full re-indexing of all files.
     * @param onProgress Optional progress callback.
     * @returns Execution stats (files, chunks, newOrUpdated, deleted).
     * @example
     * ```ts
     * const indexer = new Indexer(store);
     * const stats = await indexer.indexProject(process.cwd());
     * ```
     */
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
        let newOrUpdatedCount = 0;
        const batchOperations: any[] = [];

        try {
            const { unifiedWalk } = await import('./unified-walker.js');
            const walkResult = await unifiedWalk(rootDir);
            let allFiles = walkResult.allFiles;
            
            try {
                const ignoreLib = (await import('ignore')).default;
                const ig = ignoreLib();
                ig.add(['node_modules', 'dist', 'build', 'out', 'web-remote', '*.min.js', '*.bundle.js']);
                
                try {
                    const gitignorePath = path.join(rootDir, '.gitignore');
                    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
                    ig.add(gitignoreContent);
                } catch (e) {}

                try {
                    const dsignorePath = path.join(rootDir, '.deepsiftignore');
                    const dsignoreContent = await fs.readFile(dsignorePath, 'utf-8');
                    ig.add(dsignoreContent);
                } catch (e) {}

                allFiles = allFiles.filter((file: string) => {
                    const relPath = path.relative(rootDir, file);
                    return !ig.ignores(relPath);
                });
            } catch(e) {}
            
            const allMetadata = await this.store.getAllMetadata();

            const filesToProcess: string[] = [];
            const fileHashesJsonPath = path.join(rootDir, '.deepsift', 'file-hashes.json');
            let savedHashes: Record<string, string> = {};
            try {
                const data = (await import('fs')).readFileSync(fileHashesJsonPath, 'utf-8');
                savedHashes = JSON.parse(data);
            } catch (e) {}
            const fileHashes = new Map<string, string>();
            const currentFilesSet = new Set(allFiles);

            for (const [file, meta] of allMetadata.entries()) {
                if (!currentFilesSet.has(file)) {
                    batchOperations.push({ action: 'deleteFileChunks', filePath: file });
                    deletedCount++;
                }
            }

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
                    const savedHash = savedHashes[file];
                    if (savedHash === hash || (existingMeta && existingMeta.fileHash === hash)) {
                        continue;
                    }
                    savedHashes[file] = hash;
                    if (false) {
                        continue;
                    }

                    filesToProcess.push(file);
                } catch (err) {
                    // Safe ignore
                }
            }

            const BATCH_SIZE = 100;
            const totalFilesToProcess = filesToProcess.length;

            for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
                const batchFiles = filesToProcess.slice(i, i + BATCH_SIZE);
                const batchBaseIndex = i;
                const batchFilesCount = batchFiles.length;

                try {
                    let allChunks: any[] = [];
                    
                    const mdFiles = batchFiles.filter(f => f.endsWith('.md'));
                    const codeFiles = batchFiles.filter(f => !f.endsWith('.md'));

                    let parsedCount = 0;
                    if (this.parserProfile === 'skill' || this.parserProfile === 'docs') {
                        for (const file of mdFiles) {
                            parsedCount++;
                            if (onProgress) {
                                const currentProgress = batchBaseIndex + (parsedCount / batchFilesCount) * 0.05 * batchFilesCount;
                                onProgress(currentProgress, totalFilesToProcess, path.relative(rootDir, file));
                            }
                            const content = await fs.readFile(file, 'utf-8');
                            allChunks.push(...parseSkillFile(file, content));
                        }
                    } else {
                        codeFiles.push(...mdFiles); 
                    }

                    if (codeFiles.length > 0) {
                        const astChunks: any[] = [];
                        for (const file of codeFiles) {
                            parsedCount++;
                            if (onProgress) {
                                const currentProgress = batchBaseIndex + (parsedCount / batchFilesCount) * 0.05 * batchFilesCount;
                                onProgress(currentProgress, totalFilesToProcess, path.relative(rootDir, file));
                            }
                            if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
                                const content = await fs.readFile(file, 'utf-8');
                                const ext = path.extname(file).replace('.', '');
                                try {
                                    const chunks = await parseWithAst(content, file, ext);
                                    astChunks.push(...chunks);
                                } catch (err) {
                                    console.error(`[DeepSift] Failed to parse AST for ${file}:`, err);
                                    const rawChunks = await this.store.extractChunksBulkNative([file]);
                                    astChunks.push(...rawChunks.map((c:any)=>({id:c.id,filePath:c.file_path,content:c.content,startLine:c.start_line,endLine:c.end_line,type:c.type,family:c.family,language:c.language,semanticKind:3})));
                                }
                            } else {
                                const rawChunks = await this.store.extractChunksBulkNative([file]);
                                astChunks.push(...rawChunks.map((c:any)=>({id:c.id,filePath:c.file_path,content:c.content,startLine:c.start_line,endLine:c.end_line,type:c.type,family:c.family,language:c.language,semanticKind:3})));
                            }
                        }
                        allChunks.push(...astChunks);
                    }

                    for (const file of batchFiles) {
                        if (allMetadata.has(file)) {
                            batchOperations.push({ action: 'deleteFileChunks', filePath: file });
                        }
                    }

                    const validChunks = allChunks.filter(c => typeof c.content === 'string' && c.content.trim().length > 0);
                    if (validChunks.length > 0) {
                        const EMBED_BATCH = 32;
                        for (let j = 0; j < validChunks.length; j += EMBED_BATCH) {
                            const chunkSlice = validChunks.slice(j, j + EMBED_BATCH);
                            const embedFraction = (j + chunkSlice.length) / validChunks.length;
                            const currentProgress = batchBaseIndex + (0.05 + 0.95 * embedFraction) * batchFilesCount;
                            if (onProgress) {
                                const currentFile = chunkSlice[0]?.filePath ? path.relative(rootDir, chunkSlice[0].filePath) : `Embedding chunks (${j + chunkSlice.length}/${validChunks.length})`;
                                onProgress(currentProgress, totalFilesToProcess, currentFile);
                            }
                            const texts = chunkSlice.map(c => c.content);
                            const embeddings = await getEmbeddings(texts);
                            
                            const embeddedChunks = chunkSlice.map((chunk, idx) => ({
                                chunk,
                                embedding: embeddings[idx]
                            }));
                            
                            const formattedChunks = embeddedChunks.map(c => this.store.formatChunkForBatch(c));
                            batchOperations.push({ action: 'saveChunks', chunks: formattedChunks });
                            chunksProcessed += chunkSlice.length;
                        }
                    } else {
                        if (onProgress) {
                            onProgress(batchBaseIndex + batchFilesCount, totalFilesToProcess, `Processed ${batchFilesCount} files`);
                        }
                    }

                    // 5. Update Metadata
                    for (const file of batchFiles) {
                        const fileChunks = allChunks.filter(c => c.filePath === file);
                        batchOperations.push({
                            action: 'saveMetadata',
                            metadata: {
                                file_path: file,
                                file_hash: fileHashes.get(file)!,
                                last_indexed: Date.now(),
                                chunk_count: fileChunks.length
                            }
                        });
                        filesProcessed++;
                        newOrUpdatedCount++;
                    }

                } catch (err) {
                    console.error("Batch processing error:", err);
                }
            }

            const DB_BATCH_LIMIT = 5000;
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
            
            if (filesProcessed > 0 || deletedCount > 0 || forceReindex) {
                try {
                    for (const f of Object.keys(savedHashes)) {
                        if (!currentFilesSet.has(f)) delete savedHashes[f];
                    }
                    (await import('fs')).mkdirSync(path.dirname(fileHashesJsonPath), { recursive: true });
                    (await import('fs')).writeFileSync(fileHashesJsonPath, JSON.stringify(savedHashes, null, 2), 'utf-8');
                } catch (e) { console.error('Failed to save file-hashes.json', e); }
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
                            // Safe ignore
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

    /**
     * Gets index statistics and active indexing state.
     */
    public async getStatus() {
        const status = await this.store.getStatus();
        status.isIndexing = this.isIndexing;
        return status;
    }
}
