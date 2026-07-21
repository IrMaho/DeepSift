import fs from 'fs';
import path from 'path';
import { checkbox } from '@inquirer/prompts';
import { loadConfig, saveConfig, DEFAULT_CONFIG, DeepSiftConfig } from '../../utils/config.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';

export async function configCommand(projectPath: string) {
    printInfo(`Configuring DeepSift for: ${projectPath}`);

    const config = loadConfig(projectPath);
    
    // 1. Get top level directories
    let dirs: string[] = [];
    try {
        const entries = fs.readdirSync(projectPath, { withFileTypes: true });
        dirs = entries.filter(e => e.isDirectory() && e.name !== '.git' && e.name !== '.deepsift').map(e => e.name);
    } catch (err: any) {
        printError(`Failed to read project directories: ${err.message}`);
        return;
    }

    if (dirs.length === 0) {
        printInfo('No directories found to configure.');
        return;
    }

    // 2. Prepare choices
    const currentExcludes = config.indexer?.excludeDirs || DEFAULT_CONFIG.indexer!.excludeDirs!;
    
    const choices = dirs.map(dir => {
        // Checked means we WANT to index it. Unchecked means EXCLUDE.
        const isExcluded = currentExcludes.includes(dir);
        return {
            name: dir,
            value: dir,
            checked: !isExcluded
        };
    });

    try {
        const selectedToInclude = await checkbox({
            message: 'Select top-level directories to INDEX (uncheck to IGNORE):',
            choices: choices,
            loop: false,
        });

        // The ones NOT in selectedToInclude are excluded.
        const newExcludes = dirs.filter(d => !selectedToInclude.includes(d));

        // We merge with default excludes to preserve standard ignores that might not be in root
        const finalExcludes = Array.from(new Set([
            ...DEFAULT_CONFIG.indexer!.excludeDirs!,
            ...newExcludes
        ]));

        const newConfig: DeepSiftConfig = {
            ...config,
            indexer: {
                ...config.indexer,
                excludeDirs: finalExcludes
            }
        };

        saveConfig(projectPath, newConfig);
        printSuccess('Successfully saved configuration to deepsift.config.json');
        printInfo('Run `deepsift index --force` to apply changes immediately.');

    } catch (err: any) {
        if (err.name === 'ExitPromptError') {
            printInfo('Configuration cancelled.');
        } else {
            printError(`Configuration error: ${err.message}`);
        }
    }
}
