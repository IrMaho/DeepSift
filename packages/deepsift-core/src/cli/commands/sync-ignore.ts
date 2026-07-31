/**
 * @file sync-ignore.ts
 * @description Differentially purges ignored files and indexes new files based on updated ignore rules across all realms.
 *
 * @module cli/commands/sync-ignore
 * @category Core Search & Discovery
 * @since 1.0.0
 */
import { getRealmDbPath, getRealmGraphPath, DEFAULT_REALM } from '../cli-paths.js';
import { NativeStore, BatchOperation } from '../../storage/native-store.js';
import { RealmRouter } from '../../core/realm-router.js';
import path from 'path';
import fs from 'fs';
import { printSuccess, printError, printInfo } from '../cli-output.js';
import { indexCommand } from './index-cmd.js';

export async function syncIgnoreCommand(projectPath: string, options: any) {
    printInfo('Synchronizing Ignore Rules (Differential Purge)...');
    const startMs = Date.now();

    const ignoreLib = (await import('ignore')).default;
    const ig = ignoreLib();
    ig.add(['node_modules', 'dist', 'build', 'out', 'web-remote', '*.min.js', '*.bundle.js']);
    
    try {
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            ig.add(fs.readFileSync(gitignorePath, 'utf-8'));
        }
    } catch(e) {}
    try {
        const dsignorePath = path.join(projectPath, '.deepsiftignore');
        if (fs.existsSync(dsignorePath)) {
            ig.add(fs.readFileSync(dsignorePath, 'utf-8'));
        }
    } catch(e) {}

    const router = new RealmRouter(projectPath);
    const realmsToSchema = router.listRealms();
    let targetRealms = Object.keys(realmsToSchema);
    if (targetRealms.length === 0) {
        targetRealms = [DEFAULT_REALM];
    }
    
    let totalPurged = 0;
    
    for (const realmId of targetRealms) {
        const dbPath = getRealmDbPath(projectPath, realmId);
        const graphPath = getRealmGraphPath(projectPath, realmId);
        
        if (!fs.existsSync(dbPath)) continue;
        
        const store = new NativeStore(dbPath, graphPath, realmId, projectPath);
        const allMetadata = await store.getAllMetadata();
        const batchOperations: BatchOperation[] = [];
        let purgedCount = 0;
        
        console.log(`[DEBUG] Realm ${realmId} metadata size: ${allMetadata.size}`);
        for (const file of allMetadata.keys()) {
            const relPath = path.relative(projectPath, file);
            const normalizedPath = relPath.replace(/\\/g, '/');
            if (ig.ignores(normalizedPath)) {
                batchOperations.push({ action: 'deleteFileChunks', filePath: file });
                purgedCount++;
            }
        }
        
        if (batchOperations.length > 0) {
            await store.executeBatch(batchOperations);
            totalPurged += purgedCount;
        }
        store.close();
    }
    
    const elapsedMs = Date.now() - startMs;
    if (totalPurged > 0) {
        printSuccess(`Purged ${totalPurged} zombie files from index matching ignore rules in ${elapsedMs}ms.`);
    } else {
        printSuccess(`No zombie chunks found in any realms in ${elapsedMs}ms.`);
    }

    // After purging, trigger a quick incremental index to catch any newly un-ignored files
    await indexCommand(projectPath, {
        force: false,
        format: options.format || 'text',
        verbose: options.verbose,
        allRealms: true
    });
}
