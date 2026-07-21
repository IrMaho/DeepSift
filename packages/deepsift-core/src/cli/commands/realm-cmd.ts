import { RealmRouter } from '../../core/realm-router.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { loadConfig, saveConfig, RealmDefinition } from '../../utils/config.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import fs from 'fs';
import path from 'path';

export async function realmCommand(
    projectPath: string, 
    action: string, 
    format: OutputFormat, 
    realmId?: string, 
    options?: { type?: 'code' | 'skill' | 'docs', source?: string }
) {
    const config = loadConfig(projectPath);
    const realms = config.realms || {};

    switch (action) {
        case 'list': {
            if (format === 'json') {
                printResult(JSON.stringify(realms), format);
            } else {
                let output = 'Configured Realms:\n\n';
                for (const [id, def] of Object.entries(realms)) {
                    output += `[${id}] - ${def.displayName}\n`;
                    output += `  Sources: ${def.sourcePaths.join(', ')}\n`;
                    output += `  Parser: ${def.parserProfile}\n`;
                    output += `  Auto-Index: ${def.autoIndex}\n`;
                    if (def.excludeDirs && def.excludeDirs.length > 0) {
                        output += `  Excludes: ${def.excludeDirs.join(', ')}\n`;
                    }
                    output += '\n';
                }
                printResult(output, format);
            }
            break;
        }

        case 'add': {
            if (!realmId) throw new Error('Realm ID is required for add action.');
            if (realms[realmId]) throw new Error(`Realm '${realmId}' already exists.`);
            if (!options?.type) throw new Error('--type <code|skill|docs> is required.');
            if (!options?.source) throw new Error('--source <path> is required.');
            
            const def: RealmDefinition = {
                displayName: `Realm: ${realmId}`,
                sourcePaths: [options.source],
                parserProfile: options.type,
                autoIndex: true
            };
            
            config.realms = config.realms || {};
            config.realms[realmId] = def;
            saveConfig(projectPath, config);
            
            printSuccess(`Realm '${realmId}' added successfully to config.`);
            printInfo(`Run 'deepsift index --realm ${realmId}' to build its knowledge base.`);
            break;
        }

        case 'remove': {
            if (!realmId) throw new Error('Realm ID is required for remove action.');
            if (!realms[realmId]) throw new Error(`Realm '${realmId}' does not exist.`);
            
            delete config.realms![realmId];
            saveConfig(projectPath, config);
            
            printSuccess(`Realm '${realmId}' removed successfully from config.`);
            break;
        }

        case 'mount': {
            const realmsDir = path.join(projectPath, '.deepsift', 'realms');
            if (!fs.existsSync(realmsDir)) {
                printInfo('No realms directory found.');
                break;
            }
            const dirs = fs.readdirSync(realmsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            let mountedCount = 0;
            config.realms = config.realms || {};
            for (const dirName of dirs) {
                if (!config.realms[dirName]) {
                    const dbFile = path.join(realmsDir, dirName, 'cache.db');
                    if (fs.existsSync(dbFile)) {
                        config.realms[dirName] = {
                            displayName: `External Realm: ${dirName}`,
                            sourcePaths: [], // No source paths needed for external
                            parserProfile: 'skill', // Default profile
                            autoIndex: false,
                            isExternalHivemind: true
                        };
                        mountedCount++;
                        printInfo(`Found and mounted external realm: [${dirName}]`);
                    }
                }
            }
            if (mountedCount > 0) {
                saveConfig(projectPath, config);
                printSuccess(`Successfully mounted ${mountedCount} new realm(s).`);
            } else {
                printInfo('No new unmounted realms found.');
            }
            break;
        }

        case 'snapshot': {
            if (!realmId) throw new Error('Realm ID is required for snapshot action.');
            if (!realms[realmId]) throw new Error(`Realm '${realmId}' does not exist. Run 'deepsift realm mount' first.`);
            
            const router = new RealmRouter(projectPath);
            const store = router.getStore(realmId);
            
            const metadata = await store.getAllMetadata();
            
            let output = `--- Snapshot of Realm: [${realmId}] ---\n`;
            output += `Total Indexed Files: ${metadata.size}\n\n`;
            
            if (metadata.size === 0) {
                output += 'This realm is empty or has not been indexed.\n';
            } else {
                let i = 1;
                for (const [filePath, meta] of metadata.entries()) {
                    output += `${i++}. ${filePath} (${meta.chunkCount} chunks)\n`;
                }
            }
            
            let finalOutput = output;
            // Optionally compress if format is text
            if (format !== 'json') {
                const optimizer = new TokenOptimizerService();
                const payload = optimizer.optimize(output);
                finalOutput = payload.toUnifiedString();
            }
            
            printResult(finalOutput, format);
            break;
        }

        default:
            throw new Error(`Unknown realm action: ${action}`);
    }
}
