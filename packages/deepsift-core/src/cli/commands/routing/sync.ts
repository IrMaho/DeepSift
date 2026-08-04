import path from 'path';
import { syncIgnoreCommand } from '../sync-ignore.js';
import { OutputFormat } from '../../cli-output.js';

export async function handleSyncCommand(
    command: string,
    commandArgs: string[],
    projectPath: string,
    format: OutputFormat
): Promise<void> {
    if (command === 'sync-ignore') {
        const verboseSync = commandArgs.includes('--verbose') || commandArgs.includes('-v');
        await syncIgnoreCommand(projectPath, { format, verbose: verboseSync });
    } else if (command === 'sync-hashes') {
        const { unifiedWalk } = await import('../../../core/unified-walker.js');
        const cryptoSync = await import('crypto');
        const fsSync = await import('fs');
        const fileHashesJsonPath = path.join(projectPath, '.deepsift', 'file-hashes.json');
        console.log('Generating file-hashes.json...');
        const walkResultSync = await unifiedWalk(projectPath);
        let newHashes: Record<string, string> = {};
        let count = 0;
        for (const file of walkResultSync.allFiles) {
            try {
                const stat = fsSync.statSync(file);
                if (stat.size > 1024 * 1024) continue;
                const fileContent = fsSync.readFileSync(file, 'utf-8');
                newHashes[file] = cryptoSync.createHash('md5').update(fileContent).digest('hex');
                count++;
            } catch(e) {}
        }
        fsSync.mkdirSync(path.dirname(fileHashesJsonPath), { recursive: true });
        fsSync.writeFileSync(fileHashesJsonPath, JSON.stringify(newHashes, null, 2), 'utf-8');
        console.log(`? file-hashes.json successfully generated with ${count} files without re-indexing!`);
    }
}
