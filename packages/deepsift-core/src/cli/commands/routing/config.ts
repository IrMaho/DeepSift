import { configCommand } from '../config.js';
import { cfgCommand } from '../cfg.js';
import { learnCommand } from '../learn.js';
import { zoomCommand } from '../zoom.js';
import { OutputFormat } from '../../cli-output.js';

export async function handleConfigCommand(
    command: string,
    commandArgs: string[],
    projectPath: string,
    format: OutputFormat,
    compress: boolean
): Promise<void> {
    if (command === 'config') {
        await configCommand(projectPath);
    } else if (command === 'cfg') {
        if (commandArgs.length === 0) {
            throw new Error('Please provide a file:symbol target.\nUsage: deepsift cfg "file.ts:myFunction"');
        }
        await cfgCommand(projectPath, commandArgs[0], format);
    } else if (command === 'learn') {
        await learnCommand(projectPath, commandArgs[0] || '');
    } else if (command === 'zoom') {
        await zoomCommand(commandArgs[0], { json: format === 'json' });
    }
}
