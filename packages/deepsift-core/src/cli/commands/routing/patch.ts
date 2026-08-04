import { editCommand } from '../edit.js';
import { OutputFormat } from '../../cli-output.js';

export async function handlePatchCommand(
    commandArgs: string[],
    projectPath: string,
    format: OutputFormat
): Promise<void> {
    if (commandArgs.length === 0) {
        throw new Error('Please provide a path to a patch file.\nUsage: deepsift patch "patch.json"');
    }
    await editCommand(projectPath, commandArgs[0], format);
}
