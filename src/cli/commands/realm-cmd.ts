import { RealmRouter } from '../../core/realm-router.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { loadConfig, saveConfig, RealmDefinition } from '../../utils/config.js';

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

        default:
            throw new Error(`Unknown realm action: ${action}`);
    }
}
