import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

export async function cfgCommand(
    projectPath: string, 
    target: string, 
    format: OutputFormat = 'markdown'
): Promise<void> {
    const parts = target.split(':');
    const relFile = parts[0];
    const funcName = parts[1] || 'all';
    const fullPath = path.resolve(projectPath, relFile);

    if (!fs.existsSync(fullPath)) {
        printResult(`File not found: ${relFile}`, format);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    const cfgNodes: Array<{ line: number, type: string, code: string }> = [];

    lines.forEach((l, idx) => {
        const trimmed = l.trim();
        if (/\b(if|else if|else|switch|case|try|catch|finally|for|while|do)\b/.test(trimmed)) {
            cfgNodes.push({
                line: idx + 1,
                type: trimmed.split(' ')[0] || 'branch',
                code: trimmed.substring(0, 80)
            });
        }
    });

    const output: string[] = [];
    output.push(`# 🔀 Control Flow Graph (CFG) Analysis: \`${normalizePath(relFile)}\`\n`);
    output.push(`Target Symbol Scope: \`${funcName}\` | Discovered Branches: **${cfgNodes.length}**\n`);

    output.push(`\`\`\`mermaid`);
    output.push(`graph TD`);
    output.push(`  Start(["Entry: ${funcName}"]) --> B1`);
    cfgNodes.forEach((node, i) => {
        output.push(`  B${i + 1}["Line ${node.line}: ${node.type} (${node.code.replace(/"/g, "'")})"]`);
        if (i < cfgNodes.length - 1) {
            output.push(`  B${i + 1} --> B${i + 2}`);
        }
    });
    output.push(`  B${cfgNodes.length} --> End(["Exit Scope"])`);
    output.push(`\`\`\`\n`);

    output.push(`### 📋 Branch Control Flow Nodes:`);
    cfgNodes.forEach(n => {
        output.push(`  - 🌿 **L${n.line}** [\`${n.type}\`]: \`${n.code}\``);
    });

    const text = output.join('\n');
    await saveSearchLog(projectPath, ['[CFG]'], text, { skipVisuals: true });
    printResult(text, format);
}
