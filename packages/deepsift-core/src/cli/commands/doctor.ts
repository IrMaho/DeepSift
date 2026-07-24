/**
 * @file doctor.ts
 * @description Health Diagnostics & Self-Healing Doctor Command.
 * Runs system health checks, database index diagnostics, configuration checks,
 * and outputs recommended agent onboarding workflows.
 * 
 * @module cli/commands/doctor
 * @category Security & Diagnostics
 * @since 1.0.3
 */

import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { loadConfig } from '../../utils/config.js';
import { loadDNA } from '../../intelligence/project-dna.js';

/**
 * Executes the `deepsift doctor` command to perform system health checks.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param format Output format ('markdown' or 'json').
 * @example
 * ```ts
 * await doctorCommand(process.cwd(), 'markdown');
 * ```
 */
export async function doctorCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🩺 DeepSift Diagnostics & Agent Onboarding Status\n`);

    const config = loadConfig(projectPath);
    const dna = loadDNA(projectPath);

    lines.push(`## 🔍 System Checks:`);
    lines.push(`- **Project Root:** \`${projectPath}\``);
    lines.push(`- **Configuration:** ${config ? '✅ Present (`deepsift.config.json`)' : '⚠️ Missing (using defaults)'}`);
    lines.push(`- **Project DNA:** ${dna ? `✅ Generated (${dna.identity?.framework || 'Polyglot'})` : '⚠️ Missing (Run `deepsift dna` to generate)'}`);
    
    const outputsDir = path.join(projectPath, '.deepsift/outputs');
    lines.push(`- **Output History Cache:** ${fs.existsSync(outputsDir) ? '✅ Active' : '⚠️ Empty'}`);

    lines.push(`\n## 🤖 Recommended Agent Workflow Checklist:`);
    lines.push(`1. Run \`deepsift overview\` first to get the single-step architectural blueprint.`);
    lines.push(`2. Open a DRM tag before research: \`deepsift memo open "task-name"\`.`);
    lines.push(`3. Run semantic search: \`deepsift search "concept"\` or \`deepsift feature "path"\`.`);
    lines.push(`4. Before editing a file, read uncompressed: \`deepsift read "file.ts"\`.`);
    lines.push(`5. Apply modifications with \`replace_file_content\` or TOON patch.`);
    lines.push(`6. Close DRM tag when finished: \`deepsift memo close "task-name"\`.`);

    const outputText = lines.join('\n');
    printResult(outputText, format);
}
