import { RealmRouter } from '../../core/realm-router.js';
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
        
        try {
            const stats = await router.indexRealm(realmId, undefined, options.force, (current, total, file) => {
                if (options.verbose && options.format !== 'json') {
                    process.stdout.write(`\r[${realmId}] Indexing: ${current}/${total} files (Processing: ${file})`);
                    process.stdout.write('\x1b[K');
                }
            });

            if (options.verbose && options.format !== 'json') {
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
