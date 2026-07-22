import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

interface RawHit {
    file: string;
    line: number;
    snippet: string;
}

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

export async function clonesCommand(projectPath: string, format: OutputFormat = 'markdown', minLines: number = 6, limit: number = 20): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 👯 Code Clone Detection (DRY Compliance)\n`);

    const chunkHashes: Map<string, RawHit[]> = new Map();

    function scanDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift', 'coverage', '.dart_tool'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanDir(fullPath);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                if (['.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.java', '.go', '.vue', '.svelte'].includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const fileLines = content.split('\n');
                        for (let i = 0; i <= fileLines.length - minLines; i++) {
                            const window = fileLines.slice(i, i + minLines).map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
                            const chunkText = window.join('\n');
                            if (chunkText.length > 80) {
                                const hash = crypto.createHash('md5').update(chunkText).digest('hex');
                                const rel = normalizePath(path.relative(projectPath, fullPath));
                                if (!chunkHashes.has(hash)) chunkHashes.set(hash, []);
                                const list = chunkHashes.get(hash)!;
                                if (!list.some(x => x.file === rel && Math.abs(x.line - (i + 1)) < 2)) {
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

    // Block-Level Aggregation across matching pairs
    const mergedBlocks: MergedBlock[] = [];
    const pairMap: Map<string, Array<{ lineA: number; lineB: number; snippet: string }>> = new Map();

    for (const hits of chunkHashes.values()) {
        if (hits.length < 2) continue;
        for (let i = 0; i < hits.length; i++) {
            for (let j = i + 1; j < hits.length; j++) {
                const a = hits[i];
                const b = hits[j];
                if (a.file === b.file && Math.abs(a.line - b.line) < minLines) continue;
                
                const pairKey = `${a.file}:::${b.file}`;
                if (!pairMap.has(pairKey)) pairMap.set(pairKey, []);
                pairMap.get(pairKey)!.push({ lineA: a.line, lineB: b.line, snippet: a.snippet });
            }
        }
    }

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
                // If this match continues the current block in both files
                if (m.lineA <= currentBlock.endA + 2 && Math.abs((m.lineB - currentBlock.startB) - (m.lineA - currentBlock.startA)) <= 2) {
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

    // Sort by largest duplicated blocks
    mergedBlocks.sort((b1, b2) => b2.lines - b1.lines);

    // Deduplicate sub-blocks
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
