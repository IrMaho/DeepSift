import fs from 'fs';
import crypto from 'crypto';
import { MemoManifestManager } from './manifest-manager.js';
import { MemoEntry, MemoEntryType, MemoEntriesFile } from '../types/memo-types.js';
import { NativeStore } from '../storage/native-store.js';
import { getEmbedding, getEmbeddings } from '../core/embedder.js';
import { EmbeddedChunk, CodeChunk } from '../types/index.js';

const MAX_CHUNK_LENGTH = 1500;
const MAX_ENTRY_SIZE = 50 * 1024;

export class NoteProcessor {
    private projectPath: string;
    private manifest: MemoManifestManager;

    constructor(projectPath: string, manifest: MemoManifestManager) {
        this.projectPath = projectPath;
        this.manifest = manifest;
    }

    async addEntry(
        tagName: string,
        content: string,
        options?: {
            type?: MemoEntryType;
            source?: string;
            summary?: string;
            metadata?: Record<string, string>;
        }
    ): Promise<MemoEntry> {
        const tag = this.manifest.getTag(tagName);
        if (!tag) {
            throw new Error(`Tag '${tagName}' not found.`);
        }
        if (tag.status !== 'open') {
            throw new Error(`Tag '${tag.name}' is ${tag.status}. Only open tags accept new entries.`);
        }

        if (content.length > MAX_ENTRY_SIZE) {
            throw new Error(`Entry content exceeds ${MAX_ENTRY_SIZE / 1024}KB limit. Split into smaller entries.`);
        }

        const entryId = this.generateEntryId(content);
        const detectedType = options?.type || this.detectEntryType(content);

        const entry: MemoEntry = {
            id: entryId,
            tagId: tag.id,
            type: detectedType,
            content,
            summary: options?.summary || this.generateQuickSummary(content),
            source: options?.source,
            createdAt: Date.now(),
            metadata: options?.metadata
        };

        const chunks = this.chunkContent(entry);
        const texts = chunks.map(c => c.content);
        const embeddings = await getEmbeddings(texts);

        const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, idx) => ({
            chunk,
            embedding: embeddings[idx]
        }));

        const dbPath = this.manifest.getTagDbPath(tag.id);
        const graphPath = this.manifest.getTagGraphPath(tag.id);
        const store = new NativeStore(dbPath, graphPath, tag.realmId, this.projectPath);

        const DB_BATCH_LIMIT = 200;
        for (let i = 0; i < embeddedChunks.length; i += DB_BATCH_LIMIT) {
            const batch = embeddedChunks.slice(i, i + DB_BATCH_LIMIT);
            await store.saveChunks(batch);
        }

        await store.saveMetadata({
            filePath: `memo://${tag.name}/${entryId}`,
            fileHash: entryId,
            lastIndexed: Date.now(),
            chunkCount: chunks.length
        });

        this.appendToEntriesFile(tag.id, entry);
        this.manifest.updateEntryCount(tag.id, this.getEntryCount(tag.id));

        return entry;
    }

    async addBatch(
        tagName: string,
        items: { content: string; type?: MemoEntryType; source?: string }[]
    ): Promise<MemoEntry[]> {
        const results: MemoEntry[] = [];
        for (const item of items) {
            const entry = await this.addEntry(tagName, item.content, {
                type: item.type,
                source: item.source
            });
            results.push(entry);
        }
        return results;
    }

    getEntries(tagId: string): MemoEntry[] {
        const entriesPath = this.manifest.getTagEntriesPath(tagId);
        if (!fs.existsSync(entriesPath)) return [];
        const raw = fs.readFileSync(entriesPath, 'utf-8');
        const data: MemoEntriesFile = JSON.parse(raw);
        return data.entries;
    }

    private generateEntryId(content: string): string {
        return crypto.createHash('md5')
            .update(content + Date.now().toString())
            .digest('hex')
            .substring(0, 12);
    }

    private detectEntryType(content: string): MemoEntryType {
        const lower = content.toLowerCase();

        if (/```[\s\S]*```/.test(content)) return 'code_snippet';
        if (/\b(error|exception|fix|solution|resolved|workaround)\b/.test(lower)) return 'error_solution';
        if (/\b(https?:\/\/|reference|doc|link|see also)\b/.test(lower)) return 'reference';
        if (/\b(decided|chose|approach|strategy|trade-?off|option)\b/.test(lower)) return 'decision';
        if (/\b(endpoint|api|status\s*code|response|request|header)\b/.test(lower)) return 'api_response';
        if (/\b(layer|module|pattern|architecture|structure|component|service)\b/.test(lower)) return 'architecture_note';

        return 'finding';
    }

    private generateQuickSummary(content: string): string {
        const firstLine = content.split('\n')[0].trim();
        if (firstLine.length <= 120) return firstLine;
        return firstLine.substring(0, 117) + '...';
    }

    private chunkContent(entry: MemoEntry): CodeChunk[] {
        const content = entry.content;
        const chunks: CodeChunk[] = [];

        if (content.length <= MAX_CHUNK_LENGTH) {
            chunks.push({
                id: `${entry.id}_0`,
                filePath: `memo://${entry.tagId}/${entry.id}`,
                content,
                startLine: 1,
                endLine: content.split('\n').length,
                type: 'block',
                language: 'memo',
                metadata: {
                    memoEntryType: entry.type,
                    memoTagId: entry.tagId,
                    memoEntryId: entry.id
                }
            });
            return chunks;
        }

        const paragraphs = content.split(/\n\n+/);
        let currentChunk = '';
        let chunkIndex = 0;
        let currentStartLine = 1;

        for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length + 2 > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
                const endLine = currentStartLine + currentChunk.split('\n').length - 1;
                chunks.push({
                    id: `${entry.id}_${chunkIndex}`,
                    filePath: `memo://${entry.tagId}/${entry.id}`,
                    content: currentChunk,
                    startLine: currentStartLine,
                    endLine,
                    type: 'block',
                    language: 'memo',
                    metadata: {
                        memoEntryType: entry.type,
                        memoTagId: entry.tagId,
                        memoEntryId: entry.id
                    }
                });
                chunkIndex++;
                currentStartLine = endLine + 1;
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push({
                id: `${entry.id}_${chunkIndex}`,
                filePath: `memo://${entry.tagId}/${entry.id}`,
                content: currentChunk,
                startLine: currentStartLine,
                endLine: currentStartLine + currentChunk.split('\n').length - 1,
                type: 'block',
                language: 'memo',
                metadata: {
                    memoEntryType: entry.type,
                    memoTagId: entry.tagId,
                    memoEntryId: entry.id
                }
            });
        }

        return chunks;
    }

    private appendToEntriesFile(tagId: string, entry: MemoEntry): void {
        const entriesPath = this.manifest.getTagEntriesPath(tagId);
        let data: MemoEntriesFile;

        if (fs.existsSync(entriesPath)) {
            const raw = fs.readFileSync(entriesPath, 'utf-8');
            data = JSON.parse(raw);
        } else {
            data = { tagId, entries: [], lastUpdated: Date.now() };
        }

        const lightEntry: MemoEntry = {
            ...entry,
            content: entry.content.substring(0, 300)
        };

        data.entries.push(lightEntry);
        data.lastUpdated = Date.now();
        fs.writeFileSync(entriesPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    private getEntryCount(tagId: string): number {
        const entriesPath = this.manifest.getTagEntriesPath(tagId);
        if (!fs.existsSync(entriesPath)) return 0;
        const raw = fs.readFileSync(entriesPath, 'utf-8');
        const data: MemoEntriesFile = JSON.parse(raw);
        return data.entries.length;
    }
}
