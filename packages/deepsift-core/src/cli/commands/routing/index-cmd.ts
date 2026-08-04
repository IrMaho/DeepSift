import { indexCommand } from '../index-cmd.js';
import { OutputFormat } from '../../cli-output.js';

export async function handleIndexCommand(
    commandArgs: string[],
    projectPath: string,
    format: OutputFormat,
    compress: boolean
): Promise<void> {
    const force = commandArgs.includes('--force') || commandArgs.includes('-f');
    const verboseIndex = commandArgs.includes('--verbose') || commandArgs.includes('-v');
    const clean = commandArgs.includes('--clean') || commandArgs.includes('-c');
    
    const allRealmsIdx = commandArgs.indexOf('--all-realms');
    const allRealms = allRealmsIdx !== -1;
    
    const realmFlagIdx = commandArgs.indexOf('--realm');
    let realm: string | undefined = undefined;
    if (realmFlagIdx !== -1 && realmFlagIdx + 1 < commandArgs.length) {
        realm = commandArgs[realmFlagIdx + 1];
    }

    await indexCommand(projectPath, { 
        force, 
        format, 
        verbose: verboseIndex,
        realm,
        allRealms,
        clean
    });
}
