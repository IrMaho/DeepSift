/**
 * @file zoom.ts
 * @description Deep inspection command for a specific file, class, or symbol scope.
 *
 * @module cli/commands/zoom
 * @category Core Search & Discovery
 * @since 1.0.3
 */
import path from 'path';
import { featureCommand } from './feature.js';
import { printError, OutputFormat } from '../cli-output.js';

export async function zoomCommand(folderPath: string, options: { json?: boolean; summary?: boolean } = {}) {
    if (!folderPath) {
        printError('Please specify a folder path to zoom into (e.g. deepsift zoom "src/components")');
        return;
    }
    const projectPath = process.cwd();
    const resolvedPath = path.normalize(folderPath);
    const format: OutputFormat = options.json ? 'json' : 'markdown';
    await featureCommand(projectPath, resolvedPath, format, false, undefined, undefined, options.summary !== false, 4, true);
}
