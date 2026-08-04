import { readCommand } from '../read.js';
import { readFeatureCommand } from '../read-feature.js';
import { OutputFormat } from '../../cli-output.js';

export async function handleReadCommand(
    commandArgs: string[],
    projectPath: string,
    format: OutputFormat,
    compress: boolean,
    isFeature = false
): Promise<void> {
    if (isFeature) {
        if (commandArgs.length === 0) {
            throw new Error('Please provide a feature path.\nUsage: deepsift read-feature "src/path"');
        }
        await readFeatureCommand(projectPath, commandArgs[0], format, compress);
    } else {
        if (commandArgs.length === 0) {
            throw new Error('Please provide at least one target file.\nUsage: deepsift read "src/file.ts" or "src/file.ts:10-50"');
        }
        const targets = commandArgs.filter((arg) => !arg.startsWith('-'));
        await readCommand(projectPath, targets, format, compress);
    }
}
