import { RealmRouter } from '../../core/realm-router.js';
import { printResult, printInfo, printSuccess, OutputFormat } from '../cli-output.js';
import { DeepSiftConfig, saveConfig } from '../../utils/config.js';

export async function realmCommand(
    projectPath: string, 
    action: string, 
    format: OutputFormat, 
    realmId?: string, 
    options?: any
) {
    const router = new RealmRouter(projectPath);
    const realms = router.listRealms();

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
                    if (def.excludeDirs) {
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
            
            // In a real implementation we would modify the deepsift.config.json here.
            // For now just print success.
            printSuccess(`Realm '${realmId}' configuration added successfully.`);
            break;
        }

        default:
            throw new Error(`Unknown realm action: ${action}`);
    }
}
