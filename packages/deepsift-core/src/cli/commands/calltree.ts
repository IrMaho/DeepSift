import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { normalizePath } from '../../utils/outline.js';

export async function calltreeCommand(
    projectPath: string, 
    symbol: string, 
    format: OutputFormat = 'markdown', 
    compress: boolean = false
): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🌳 Call Graph Traversal for: \`${symbol}\`\n`);

    const callers: Array<{ file: string, line: number, snippet: string }> = [];
    const callees: Array<{ file: string, line: number, snippet: string }> = [];

    function searchInDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                searchInDir(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.dart', '.py', '.java', '.go', '.cpp'].includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const fileLines = content.split('\n');
                        fileLines.forEach((l, idx) => {
                            if (l.includes(symbol)) {
                                const rel = normalizePath(path.relative(projectPath, fullPath));
                                if (l.match(new RegExp(`\\b(function|const|let|var|def|class)\\s+${symbol}\\b`)) || l.includes(`def ${symbol}`)) {
                                    callees.push({ file: rel, line: idx + 1, snippet: l.trim() });
                                } else {
                                    callers.push({ file: rel, line: idx + 1, snippet: l.trim() });
                                }
                            }
                        });
                    } catch {}
                }
            }
        }
    }

    searchInDir(projectPath);

    lines.push(`## ⬆️ Upstream Callers (Who calls \`${symbol}\`):`);
    if (callers.length > 0) {
        callers.slice(0, 15).forEach(c => {
            lines.push(`- 📄 **${c.file}:${c.line}**: \`${c.snippet}\``);
        });
        if (callers.length > 15) lines.push(`- ... (+${callers.length - 15} more callers)`);
    } else {
        lines.push(`- No upstream callers detected.`);
    }
    lines.push('');

    lines.push(`## ⬇️ Downstream Definitions & Callee Scope:`);
    if (callees.length > 0) {
        callees.forEach(c => {
            lines.push(`- 🎯 **${c.file}:${c.line}**: \`${c.snippet}\``);
        });
    } else {
        lines.push(`- Symbol definition not found in scanned AST.`);
    }

    let finalOutput = lines.join('\n');
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(finalOutput).toUnifiedString();
    }

    await saveSearchLog(projectPath, [`[CallTree] ${symbol}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);
}
