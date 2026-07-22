import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

export async function clonesCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 👯 Code Clone Detection (DRY Compliance)\n`);

    const chunkHashes: Map<string, Array<{ file: string, line: number, snippet: string }>> = new Map();

    function scanDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scanDir(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.dart', '.py', '.java', '.go'].includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const fileLines = content.split('\n');
                        for (let i = 0; i < fileLines.length - 6; i++) {
                            const chunk = fileLines.slice(i, i + 6).map(l => l.trim()).filter(l => l && !l.startsWith('//')).join('\n');
                            if (chunk.length > 80) {
                                const hash = crypto.createHash('md5').update(chunk).digest('hex');
                                const rel = normalizePath(path.relative(projectPath, fullPath));
                                if (!chunkHashes.has(hash)) chunkHashes.set(hash, []);
                                const list = chunkHashes.get(hash)!;
                                if (!list.some(x => x.file === rel)) {
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

    const duplicateGroups = Array.from(chunkHashes.values()).filter(group => group.length > 1);

    lines.push(`Found **${duplicateGroups.length}** code duplication clusters across the codebase:\n`);

    duplicateGroups.slice(0, 10).forEach((group, idx) => {
        lines.push(`### ⚠️ Duplicate Cluster #${idx + 1}`);
        group.forEach(loc => {
            lines.push(`  - 📄 **${loc.file}:${loc.line}**: \`${loc.snippet.substring(0, 60)}...\``);
        });
        lines.push('');
    });

    if (duplicateGroups.length === 0) {
        lines.push(`- 🎉 No significant code clone duplicates detected! Codebase follows DRY principles.`);
    }

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[Clones]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
