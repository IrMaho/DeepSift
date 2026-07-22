import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

export async function deadCodeCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🧹 Dead Code Elimination Audit\n`);

    const exportsMap: Map<string, string> = new Map(); // exportName -> filePath
    const importsSet: Set<string> = new Set();

    function scan(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scan(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.tsx', '.jsx', '.dart'].includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const rel = normalizePath(path.relative(projectPath, fullPath));
                        
                        // Collect exports
                        const exportMatches = content.matchAll(/\bexport\s+(?:const|function|class|type|interface)\s+([\w_]+)/g);
                        for (const match of exportMatches) {
                            if (match[1] && !['default', 'main'].includes(match[1])) {
                                exportsMap.set(match[1], rel);
                            }
                        }

                        // Collect imports & references
                        const words = content.match(/\b[A-Za-z_]\w*\b/g) || [];
                        words.forEach(w => importsSet.add(w));
                    } catch {}
                }
            }
        }
    }

    scan(projectPath);

    const unusedSymbols: Array<{ symbol: string, file: string }> = [];

    exportsMap.forEach((filePath, symbol) => {
        // If symbol appears only once (its own export definition)
        const usages = Array.from(importsSet).filter(w => w === symbol).length;
        if (usages <= 1) {
            unusedSymbols.push({ symbol, file: filePath });
        }
    });

    lines.push(`Discovered **${unusedSymbols.length}** potentially unreferenced/dead export symbols:\n`);

    if (unusedSymbols.length > 0) {
        unusedSymbols.slice(0, 15).forEach(s => {
            lines.push(`- 🗑️ \`${s.symbol}\` in 📄 **${s.file}**`);
        });
        if (unusedSymbols.length > 15) lines.push(`- ... (+${unusedSymbols.length - 15} more dead code symbols)`);
    } else {
        lines.push(`- 🎉 No dead export code detected.`);
    }

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[DeadCode]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
