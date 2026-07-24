/**
 * @file watch.ts
 * @description File system watcher for incremental auto-indexing on source changes.
 *
 * @module cli/commands/watch
 * @category Core Search & Discovery
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { NativeStore } from '../../storage/native-store.js';
import { Indexer } from '../../core/indexer.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';

/**
 * Starts a directory watcher that automatically and incrementally keeps the DeepSift
 * semantic index updated in real-time as the developer saves files.
 */
export async function watchCommand(projectPath: string) {
    const store = new NativeStore(getDbPath(projectPath));
    const indexer = new Indexer(store);

    printInfo(`Starting DeepSift watcher for: ${projectPath}`);
    printInfo('Performing initial index sync...');
    try {
        await indexer.indexProject(projectPath);
        printSuccess('Initial index sync complete.');
    } catch (err: any) {
        printError(`Initial indexing failed: ${err.message}`);
    }

    let debounceTimer: NodeJS.Timeout | null = null;
    const ignorePatterns = [
        'node_modules', '.git', '.deepsift', 'dist', 'build', '.dart_tool', '.gradle', '.idea', '.vscode'
    ];

    printInfo('Watcher is active. Press Ctrl+C to stop.');

    fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const normalized = filename.replace(/\\/g, '/');

        // Check if the change is in an ignored folder
        const shouldIgnore = ignorePatterns.some(pattern => 
            normalized === pattern || 
            normalized.startsWith(pattern + '/') || 
            normalized.includes('/' + pattern + '/')
        );

        if (shouldIgnore) return;

        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
            printInfo(`Change detected: ${normalized}. Updating index...`);
            try {
                const stats = await indexer.indexProject(projectPath);
                if (stats.files > 0) {
                    printSuccess(`Incremental sync complete: ${stats.files} files, ${stats.chunks} chunks.`);
                }
            } catch (err: any) {
                printError(`Incremental indexing failed: ${err.message}`);
            }
        }, 500);
    });
}
