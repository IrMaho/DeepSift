import { sedCommand } from '../sed.js';

export async function handleSedCommand(commandArgs: string[]): Promise<void> {
    const searchIdx = commandArgs.indexOf('--search');
    const replaceIdx = commandArgs.indexOf('--replace');
    
    if (searchIdx === -1 || replaceIdx === -1) {
        throw new Error('Usage: deepsift sed <file_pattern> --search "text" --replace "replacement"');
    }
    
    const searchStr = commandArgs[searchIdx + 1];
    const replaceStr = commandArgs[replaceIdx + 1];
    
    const filePatterns = commandArgs.slice(0, searchIdx).filter(arg => !arg.startsWith('-'));
    
    const sedOptions = {
        all: commandArgs.includes('--all') || commandArgs.includes('-a'),
        dryRun: commandArgs.includes('--dry-run')
    };
    
    await sedCommand(searchStr, replaceStr, filePatterns, sedOptions);
}
