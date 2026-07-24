/**
 * @file clones.ts
 * @description AST Code Clone Detector & DRY Compliance Command.
 * Scans files for structural code duplicates, copy-paste clusters, and block-level redundancies.
 * 
 * @module cli/commands/clones
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

/**
 * Raw hash hit for duplicate code chunk.
 */
interface RawHit {
    file: string;
    line: number;
    snippet: string;
}

/**
 * Merged duplicate block cluster spanning across two files.
 */
interface MergedBlock {
    fileA: string;
    startA: number;
    endA: number;
    fileB: string;
    startB: number;
    endB: number;
    lines: number;
    snippet: string;
}

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next',
    '.npm-cache', '.tools', 'pxpipe-main', 'temp_directive', 'bin', 'models', 'docs',
    'venv', '.venv', 'site-packages', 'assets'
]);

/**
 * Executes the `deepsift clones` command to audit code duplication and DRY compliance.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param format Output format ('markdown' or 'json').
 * @param minLines Minimum contiguous lines to qualify as a clone (default: 6).
 * @param limit Max clone clusters to display (default: 20).
 * @example
 * ```ts
 * await clonesCommand(process.cwd(), 'markdown', 6, 20);
 * ```
 */
export async function clonesCommand(projectPath: string, format: OutputFormat = 'markdown', minLines: number = 6, limit: number = 20): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 👯 Code Clone Detection (DRY Compliance)\n`);

    const chunkHashes: Map<string, RawHit[]> = new Map();

    function scanDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        let items: fs.Dirent[];
        try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

        for (const item of items) {
            const nameLower = item.name.toLowerCase();
            if (item.name.startsWith('.') || IGNORED_DIRS.has(nameLower)) continue;
            
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanDir(fullPath);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                if (['.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.java', '.go', '.vue', '.svelte'].includes(ext)) {
                    try {
                        const stats = fs.statSync(fullPath);
                        if (stats.size > 150_000) continue;

                        const content = fs.readFileSync(fullPath, 'utf8');
                        const fileLines = content.split('\n');
                        if (fileLines.length > 2500) continue;

                        for (let i = 0; i <= fileLines.length - minLines; i += 2) {
                            const window = fileLines.slice(i, i + minLines)
                                .map(l => l.trim())
                                .filter(l => l && !l.startsWith('//') && !l.startsWith('#') && !l.startsWith('import ') && !l.startsWith('require(') && l !== '}' && l !== '{');
                            
                            const chunkText = window.join('\n');
                            if (chunkText.length > 100) {
                                const hash = crypto.createHash('md5').update(chunkText).digest('hex');
                                const rel = normalizePath(path.relative(projectPath, fullPath));
                                if (!chunkHashes.has(hash)) chunkHashes.set(hash, []);
                                const list = chunkHashes.get(hash)!;
                                if (list.length < 20 && !list.some(x => x.file === rel && Math.abs(x.line - (i + 1)) < 2)) {
                                    list.push({ file: rel, line: i + 1, snippet: fileLines[i].trim() });
                                }
                            }
                        }
                    } catch {}
                }
            }
        }
    }

    scanDir(projectPath);

    const mergedBlocks: MergedBlock[] = [];
    const pairMap: Map<string, Array<{ lineA: number; lineB: number; snippet: string }>> = new Map();

    for (const hits of chunkHashes.values()) {
        if (hits.length < 2 || hits.length > 20) continue;

        for (let i = 0; i < hits.length; i++) {
            for (let j = i + 1; j < hits.length; j++) {
                const a = hits[i];
                const b = hits[j];
                if (a.file === b.file && Math.abs(a.line - b.line) < minLines) continue;
                
                const pairKey = `${a.file}:::${b.file}`;
                if (!pairMap.has(pairKey)) pairMap.set(pairKey, []);
                const matchArr = pairMap.get(pairKey)!;
                if (matchArr.length < 200) {
                    matchArr.push({ lineA: a.line, lineB: b.line, snippet: a.snippet });
                }
            }
        }
    }

    chunkHashes.clear();

    for (const [pairKey, matches] of pairMap.entries()) {
        const [fileA, fileB] = pairKey.split(':::');
        matches.sort((m1, m2) => m1.lineA - m2.lineA);

        let currentBlock: MergedBlock | null = null;

        for (const m of matches) {
            if (!currentBlock) {
                currentBlock = {
                    fileA,
                    startA: m.lineA,
                    endA: m.lineA + minLines - 1,
                    fileB,
                    startB: m.lineB,
                    endB: m.lineB + minLines - 1,
                    lines: minLines,
                    snippet: m.snippet
                };
            } else {
                if (m.lineA <= currentBlock.endA + 3 && Math.abs((m.lineB - currentBlock.startB) - (m.lineA - currentBlock.startA)) <= 3) {
                    currentBlock.endA = Math.max(currentBlock.endA, m.lineA + minLines - 1);
                    currentBlock.endB = Math.max(currentBlock.endB, m.lineB + minLines - 1);
                    currentBlock.lines = currentBlock.endA - currentBlock.startA + 1;
                } else {
                    mergedBlocks.push(currentBlock);
                    currentBlock = {
                        fileA,
                        startA: m.lineA,
                        endA: m.lineA + minLines - 1,
                        fileB,
                        startB: m.lineB,
                        endB: m.lineB + minLines - 1,
                        lines: minLines,
                        snippet: m.snippet
                    };
                }
            }
        }
        if (currentBlock) {
            mergedBlocks.push(currentBlock);
        }
    }

    pairMap.clear();
    mergedBlocks.sort((b1, b2) => b2.lines - b1.lines);

    const finalBlocks: MergedBlock[] = [];
    for (const b of mergedBlocks) {
        const isSubBlock = finalBlocks.some(existing => 
            existing.fileA === b.fileA && existing.fileB === b.fileB &&
            existing.startA <= b.startA && existing.endA >= b.endA &&
            existing.startB <= b.startB && existing.endB >= b.endB
        );
        if (!isSubBlock) {
            finalBlocks.push(b);
        }
    }

    const totalDuplicatedLines = finalBlocks.reduce((acc, b) => acc + b.lines, 0);

    lines.push(`Found **${finalBlocks.length}** block-level duplicate clusters (${totalDuplicatedLines} total duplicated lines):\n`);

    finalBlocks.slice(0, limit).forEach((block, idx) => {
        lines.push(`### ⚠️ Duplicate Block Cluster #${idx + 1} (${block.lines} lines)`);
        lines.push(`  - 📄 **${block.fileA}:${block.startA}-${block.endA}** ↔ 📄 **${block.fileB}:${block.startB}-${block.endB}**`);
        lines.push(`    \`${block.snippet.substring(0, 70)}...\``);
        lines.push('');
    });

    if (finalBlocks.length === 0) {
        lines.push(`- 🎉 No significant block-level code clones detected! Codebase strictly adheres to DRY principles.`);
    }

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[Clones]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
