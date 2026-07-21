import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MemoManifest, MemoTag, MemoTagStatus } from '../types/memo-types.js';

const MEMO_DIR = 'memo';
const TAGS_DIR = 'tags';
const ARCHIVE_DIR = 'archive';
const MANIFEST_FILE = 'manifest.json';
const MANIFEST_BACKUP = 'manifest.backup.json';

export class MemoManifestManager {
    private projectPath: string;
    private memoRoot: string;
    private manifestPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.memoRoot = path.join(projectPath, '.deepsift', MEMO_DIR);
        this.manifestPath = path.join(this.memoRoot, MANIFEST_FILE);
    }

    private ensureDirectories(): void {
        const dirs = [
            this.memoRoot,
            path.join(this.memoRoot, TAGS_DIR),
            path.join(this.memoRoot, ARCHIVE_DIR)
        ];
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    private loadManifest(): MemoManifest {
        if (!fs.existsSync(this.manifestPath)) {
            return { version: 1, tags: {}, lastUpdated: Date.now() };
        }
        const raw = fs.readFileSync(this.manifestPath, 'utf-8');
        return JSON.parse(raw) as MemoManifest;
    }

    private saveManifest(manifest: MemoManifest): void {
        this.ensureDirectories();

        if (fs.existsSync(this.manifestPath)) {
            const backupPath = path.join(this.memoRoot, MANIFEST_BACKUP);
            fs.copyFileSync(this.manifestPath, backupPath);
        }

        manifest.lastUpdated = Date.now();
        const content = JSON.stringify(manifest, null, 2);
        const tmpPath = this.manifestPath + '.tmp';
        fs.writeFileSync(tmpPath, content, 'utf-8');
        fs.renameSync(tmpPath, this.manifestPath);
    }

    private generateTagId(name: string): string {
        const hash = crypto.createHash('md5')
            .update(name + Date.now().toString())
            .digest('hex')
            .substring(0, 8);
        return `memo_${hash}`;
    }

    private getTagDir(tagId: string): string {
        return path.join(this.memoRoot, TAGS_DIR, tagId);
    }

    private getArchiveDir(tagId: string): string {
        return path.join(this.memoRoot, ARCHIVE_DIR, tagId);
    }

    createTag(name: string, description?: string): MemoTag {
        const trimmedName = name.trim();
        if (trimmedName.length < 3) {
            throw new Error(`Tag name '${name}' is too short. Choose a descriptive, task-specific name (at least 3 characters).`);
        }

        const genericNames = ['temp', 'test', 'a', 'memo', 'task', 'tag', 'default', 'new', 'research', 'my-research', 'fix', 'bug', 'todo', 'notes'];
        if (genericNames.includes(trimmedName.toLowerCase()) || /^(task|tag|memo|test)[_-]?\d+$/i.test(trimmedName)) {
            throw new Error(`Tag name '${name}' is too generic. Choose a meaningful, task-specific name representing the actual feature or bug (e.g., 'grid-presets-fix', 'jwt-auth-refactor').`);
        }

        const manifest = this.loadManifest();

        const existing = Object.values(manifest.tags).find(t => t.name === trimmedName);
        if (existing) {
            throw new Error(`Tag '${name}' already exists (id: ${existing.id}, status: ${existing.status}).`);
        }

        const tagId = this.generateTagId(name);
        const tagDir = this.getTagDir(tagId);
        this.ensureDirectories();
        fs.mkdirSync(tagDir, { recursive: true });

        const entriesFile = path.join(tagDir, 'entries.json');
        fs.writeFileSync(entriesFile, JSON.stringify({
            tagId,
            entries: [],
            lastUpdated: Date.now()
        }, null, 2), 'utf-8');

        const tag: MemoTag = {
            id: tagId,
            name,
            status: 'open',
            createdAt: Date.now(),
            description,
            entryCount: 0,
            realmId: `memo_${tagId}`
        };

        manifest.tags[tagId] = tag;
        this.saveManifest(manifest);

        return tag;
    }

    closeTag(tagIdOrName: string): MemoTag {
        const manifest = this.loadManifest();
        const tag = this.resolveTag(manifest, tagIdOrName);

        if (tag.status !== 'open') {
            throw new Error(`Tag '${tag.name}' is already ${tag.status}. Only open tags can be closed.`);
        }

        tag.status = 'closed';
        tag.closedAt = Date.now();
        this.saveManifest(manifest);
        return tag;
    }

    archiveTag(tagIdOrName: string): MemoTag {
        const manifest = this.loadManifest();
        const tag = this.resolveTag(manifest, tagIdOrName);

        if (tag.status === 'archived') {
            throw new Error(`Tag '${tag.name}' is already archived.`);
        }
        if (tag.status === 'open') {
            tag.status = 'closed';
            tag.closedAt = Date.now();
        }

        const sourceDir = this.getTagDir(tag.id);
        const archiveDir = this.getArchiveDir(tag.id);

        if (fs.existsSync(sourceDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
            this.copyDirSync(sourceDir, archiveDir);
            fs.rmSync(sourceDir, { recursive: true, force: true });
        }

        tag.status = 'archived';
        this.saveManifest(manifest);
        return tag;
    }

    purgeTag(tagIdOrName: string): string {
        const manifest = this.loadManifest();
        const tag = this.resolveTag(manifest, tagIdOrName);
        const tagName = tag.name;

        const tagDir = this.getTagDir(tag.id);
        if (fs.existsSync(tagDir)) {
            fs.rmSync(tagDir, { recursive: true, force: true });
        }

        const archiveDir = this.getArchiveDir(tag.id);
        if (fs.existsSync(archiveDir)) {
            fs.rmSync(archiveDir, { recursive: true, force: true });
        }

        delete manifest.tags[tag.id];
        this.saveManifest(manifest);
        return tagName;
    }

    getOpenTags(): MemoTag[] {
        const manifest = this.loadManifest();
        return Object.values(manifest.tags).filter(t => t.status === 'open');
    }

    getAllTags(): MemoTag[] {
        const manifest = this.loadManifest();
        return Object.values(manifest.tags);
    }

    getTag(tagIdOrName: string): MemoTag | undefined {
        const manifest = this.loadManifest();
        try {
            return this.resolveTag(manifest, tagIdOrName);
        } catch {
            return undefined;
        }
    }

    getTagDbPath(tagId: string): string {
        return path.join(this.getTagDir(tagId), 'cache.db');
    }

    getTagGraphPath(tagId: string): string {
        return path.join(this.getTagDir(tagId), 'graph.db');
    }

    getTagEntriesPath(tagId: string): string {
        return path.join(this.getTagDir(tagId), 'entries.json');
    }

    getTagSummaryPath(tagId: string): string {
        return path.join(this.getTagDir(tagId), 'summary.md');
    }

    updateEntryCount(tagId: string, count: number): void {
        const manifest = this.loadManifest();
        if (manifest.tags[tagId]) {
            manifest.tags[tagId].entryCount = count;
            this.saveManifest(manifest);
        }
    }

    private resolveTag(manifest: MemoManifest, tagIdOrName: string): MemoTag {
        if (manifest.tags[tagIdOrName]) {
            return manifest.tags[tagIdOrName];
        }

        const byName = Object.values(manifest.tags).find(t => t.name === tagIdOrName);
        if (byName) {
            return byName;
        }

        throw new Error(`Tag '${tagIdOrName}' not found. Run 'deepsift memo list' to see available tags.`);
    }

    private copyDirSync(src: string, dest: string): void {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                this.copyDirSync(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}
