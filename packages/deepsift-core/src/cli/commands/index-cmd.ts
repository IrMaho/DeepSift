import { RealmRouter } from '../../core/realm-router.js';
import readline from 'readline';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { DEFAULT_REALM } from '../cli-paths.js';

export interface IndexOptions {
    force: boolean;
    format: OutputFormat;
    verbose?: boolean;
    realm?: string;
    allRealms?: boolean;
}

export async function indexCommand(projectPath: string, options: IndexOptions) {
    const router = new RealmRouter(projectPath);
    const realmsToSchema = router.listRealms();
    
    let targetRealms: string[] = [];
    if (options.allRealms) {
        targetRealms = Object.keys(realmsToSchema);
    } else if (options.realm) {
        if (!realmsToSchema[options.realm] && options.realm !== DEFAULT_REALM) {
            throw new Error(`Realm '${options.realm}' is not defined in config.`);
        }
        targetRealms = [options.realm];
    } else {
        targetRealms = [DEFAULT_REALM];
    }

    let totalFiles = 0;
    let totalChunks = 0;

    for (const realmId of targetRealms) {
        printInfo(options.force ? `Force re-indexing realm [${realmId}]...` : `Indexing realm [${realmId}] (incremental)...`);
        
        const startTime = Date.now();
        try {
            const stats = await router.indexRealm(realmId, undefined, options.force, (current, total, file) => {
                if (options.format !== 'json') {
                    const elapsedMs = Date.now() - startTime;
                    const elapsedSec = Math.floor(elapsedMs / 1000);
                    let itemsPerSec = current / (elapsedSec || 1);
                    if (itemsPerSec === 0) itemsPerSec = 1;
                    const remainingItems = total - current;
                    const etaSec = Math.floor(remainingItems / itemsPerSec);
                    
                    const formatTime = (s: number) => {
                        if (!isFinite(s) || isNaN(s)) return '...';
                        const m = Math.floor(s / 60);
                        const sec = Math.floor(s % 60);
                        return m > 0 ? `${m}m${sec}s` : `${sec}s`;
                    };

                    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
                    
                    const shortFile = file.length > 35 ? '...' + file.substring(file.length - 35) : file;
                    
                    const msg = `[${realmId}] ⏳ ${percent}% | ${current}/${total} files | Elapsed: ${formatTime(elapsedSec)} | ETA: ${formatTime(etaSec)} | ${shortFile}`;
                    
                    const termWidth = process.stdout.columns || 80;
                    const displayMsg = msg.length > termWidth ? msg.substring(0, termWidth - 1) : msg;
                    
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(displayMsg);
                }
            });

            if (options.format !== 'json') {
                process.stdout.write('\n');
            }

            totalFiles += stats.files;
            totalChunks += stats.chunks;
            
            if (options.format !== 'json') {
                printResult(`[${realmId}] Indexing complete. Processed ${stats.files} files and ${stats.chunks} chunks.`, options.format);
            }
        } catch (e: any) {
            printInfo(`[${realmId}] Error indexing realm: ${e.message}`);
        }
    }

    if (options.format === 'json') {
        printResult(JSON.stringify({ files: totalFiles, chunks: totalChunks, realms: targetRealms }), options.format);
    }

    printSuccess('Indexing process finished.');
}
