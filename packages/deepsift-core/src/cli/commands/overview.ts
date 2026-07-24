/**
 * @file overview.ts
 * @description Single-Step Project Blueprint Overview Super-Command.
 * Consolidates directory trees, Central God Nodes, feature summaries, and AST outlines into a single output.
 * 
 * @module cli/commands/overview
 * @category Core Search & Discovery
 * @since 1.0.3
 */

import path from 'path';
import fs from 'fs';
import { getProjectArchitecture } from '../../utils/architecture.js';
import { getFeatureOutline } from '../../utils/outline.js';
import { loadDNA } from '../../intelligence/project-dna.js';
import { mineFeatureRegistries } from '../../analyzers/registry-miner.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

/**
 * Executes the `deepsift overview` command to generate a project blueprint.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param targetPath Optional target path to limit overview depth.
 * @param format Output format ('markdown', 'plain', or 'json').
 * @param compress Whether to apply token compression.
 * @param depth Max folder depth to traverse (default: 2).
 * @example
 * ```ts
 * await overviewCommand(process.cwd(), undefined, 'markdown', false, 3);
 * ```
 */
export async function overviewCommand(
    projectPath: string,
    targetPath?: string,
    format: OutputFormat = 'markdown',
    compress: boolean = false,
    depth: number = 2
): Promise<void> {
    let focusDir = targetPath ? path.resolve(projectPath, targetPath) : projectPath;
    if (!fs.existsSync(focusDir)) {
        focusDir = projectPath;
    }

    const relFocusPath = path.relative(projectPath, focusDir).replace(/\\/g, '/');
    const lines: string[] = [];
    lines.push(`# 🌐 DeepSift Project Overview`);
    lines.push(`Path: \`${relFocusPath || '.'}\` | Target Depth: ${depth}\n`);

    lines.push(`## 🎯 Central / God Nodes`);
    const dna = loadDNA(projectPath);
    if (dna && dna.architecture) {
        const rawCoreFiles = dna.architecture.coreFiles || (dna.architecture.graph && dna.architecture.graph.godNodes) || [];
        const validCoreFiles = rawCoreFiles.filter((file: string) => {
            if (!file) return false;
            const abs = path.resolve(projectPath, file);
            const lower = file.toLowerCase();
            const isLockfile = lower.endsWith('-lock.json') || lower.endsWith('-lock.yaml') || lower.endsWith('.lock');
            return fs.existsSync(abs) && !isLockfile;
        });

        if (validCoreFiles.length > 0) {
            validCoreFiles.slice(0, 8).forEach((file: string) => {
                lines.push(`- \`${file}\` ⭐`);
            });
        } else {
            lines.push(`*(No god nodes found)*`);
        }
    } else {
        lines.push(`- Run \`deepsift dna\` to analyze graph topology & core files.`);
    }
    lines.push('');

    const featureTabs = (dna && dna.featureTabs && dna.featureTabs.length > 0)
        ? dna.featureTabs
        : mineFeatureRegistries(projectPath);

    if (featureTabs && featureTabs.length > 0) {
        lines.push(`## 🌐 Discovered Core Features, UI Tabs & API Endpoints`);
        featureTabs.forEach((tab, idx) => {
            const capStr = tab.capabilities ? ` (${tab.capabilities.slice(0, 3).join(', ')})` : '';
            const descStr = tab.description ? `: ${tab.description}` : '';
            lines.push(`${idx + 1}. **${tab.title}** (\`${tab.id}\` via \`${tab.sourceFile}\`)${descStr}${capStr}`);
        });
        lines.push('');
    }

    lines.push(`## 🌳 Architecture Blueprint`);
    try {
        const archText = getProjectArchitecture(focusDir, depth);
        const cleanedArch = archText.replace('# Project Architecture Blueprint', '').trim();
        lines.push(cleanedArch);
    } catch (e: any) {
        lines.push(`*(Could not generate tree: ${e.message})*`);
    }
    lines.push('');

    lines.push(`## 📦 Feature & Module Summary`);
    try {
        const featText = getFeatureOutline(focusDir, 15, 0, true, depth);
        lines.push(featText);
    } catch (e: any) {
        lines.push(`*(Could not generate feature summary: ${e.message})*`);
    }

    let finalOutput = lines.join('\n');

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(finalOutput).toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`[Overview] ${targetPath || '.'}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);

    if (format !== 'json') {
        if (logInfo.images && logInfo.images.length > 0) {
            logInfo.images.forEach((img: string, idx: number) => {
                const link = `file:///${img.replace(/\\/g, '/')}`;
                printSuccess(`Overview results cached in (Page ${idx + 1}): ${link}`);
            });
        } else {
            const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
            printSuccess(`Overview results cached in: ${link}`);
        }
    }
}
