/**
 * @file dead-code.ts
 * @description Dead Code Elimination & Unreferenced Export Audit Command.
 * Scans exported symbols, classes, functions, and interfaces to identify unused or dead code.
 * 
 * @module cli/commands/dead-code
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */

import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

/**
 * Executes the `deepsift dead-code` command to identify unreferenced export symbols.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param format Output format ('markdown' or 'json').
 * @example
 * ```ts
 * await deadCodeCommand(process.cwd(), 'markdown');
 * ```
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

export async function deadCodeCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const zigExePath = path.resolve(__dirname, '..', '..', '..', 'bin', 'deepsift-math.exe');
    
    try {
        const output = execSync(`"${zigExePath}" find-dead-code`, { cwd: projectPath, encoding: 'utf-8' });
        printResult(output, format);
        await saveSearchLog(projectPath, ['[DeadCode]'], output, { skipVisuals: true });
    } catch (e: any) {
        const out = e.stdout ? e.stdout.toString() : e.message;
        printResult(out, format);
    }
}
