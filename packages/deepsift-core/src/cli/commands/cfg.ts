/**
 * @file cfg.ts
 * @description Control Flow Graph (CFG) Generator Command.
 * Extracts function boundaries, decision branches, switch statements, and try/catch blocks
 * to generate Mermaid and ASCII control flow diagrams.
 * 
 * @module cli/commands/cfg
 * @category Architecture & Intelligence
 * @since 1.0.3
 */

import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';

/**
 * Node within a Control Flow Graph diagram.
 */
export interface CFGNode {
    id: string;
    label: string;
    type: 'start' | 'decision' | 'action' | 'error' | 'end';
}

/**
 * Edge connection between nodes in a Control Flow Graph.
 */
export interface CFGEdge {
    from: string;
    to: string;
    label?: string;
}

/**
 * Executes the `deepsift cfg` command to analyze a function's control flow and print a Mermaid branch diagram.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param targetSpec Target specification in format 'file.ts:functionName'.
 * @param format Output format ('markdown' or 'json').
 * @example
 * ```ts
 * await cfgCommand(process.cwd(), 'src/utils/config.ts:loadConfig', 'markdown');
 * ```
 */
export async function cfgCommand(projectPath: string, targetSpec: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🔀 Control Flow Graph (CFG Analyzer)\n`);

    if (!targetSpec || !targetSpec.includes(':')) {
        lines.push(`❌ Error: Please specify target in format \`file.ts:functionName\` or \`path/to/file.ts:symbolName\`.`);
        printResult(lines.join('\n'), format);
        return;
    }

    const [filePart, funcName] = targetSpec.split(':');
    let fullPath = filePart;
    if (!path.isAbsolute(filePart)) {
        fullPath = path.resolve(projectPath, filePart);
    }

    if (!fs.existsSync(fullPath)) {
        lines.push(`❌ Error: File not found: \`${filePart}\``);
        printResult(lines.join('\n'), format);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const fileLines = content.split('\n');

    let funcStart = -1;
    let funcEnd = -1;
    let braceCount = 0;
    let insideFunc = false;

    for (let i = 0; i < fileLines.length; i++) {
        const line = fileLines[i];
        if (!insideFunc && (line.includes(`function ${funcName}`) || line.includes(`${funcName}(`) || line.includes(`${funcName} =`))) {
            funcStart = i;
            insideFunc = true;
        }
        if (insideFunc) {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount === 0 && i > funcStart) {
                funcEnd = i;
                break;
            }
        }
    }

    if (funcStart === -1) {
        lines.push(`⚠️ Symbol \`${funcName}\` not found in \`${path.basename(fullPath)}\`. Displaying top-level file structure CFG.\n`);
        funcStart = 0;
        funcEnd = fileLines.length - 1;
    }

    const funcBody = fileLines.slice(funcStart, funcEnd + 1);

    const nodes: CFGNode[] = [{ id: 'N0', label: `Start: ${funcName}`, type: 'start' }];
    const edges: CFGEdge[] = [];
    let nodeIdx = 1;
    let lastNodeId = 'N0';

    funcBody.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('if') || trimmed.startsWith('else if')) {
            const match = trimmed.match(/\((.*)\)/);
            const cond = match ? match[1].substring(0, 40) : 'condition';
            const decisionId = `N${nodeIdx++}`;
            const actionId = `N${nodeIdx++}`;
            nodes.push({ id: decisionId, label: `If: ${cond}`, type: 'decision' });
            nodes.push({ id: actionId, label: `Then Block (L${funcStart + idx + 1})`, type: 'action' });
            edges.push({ from: lastNodeId, to: decisionId });
            edges.push({ from: decisionId, to: actionId, label: 'true' });
            lastNodeId = decisionId;
        } else if (trimmed.startsWith('switch')) {
            const switchId = `N${nodeIdx++}`;
            nodes.push({ id: switchId, label: `Switch Statement (L${funcStart + idx + 1})`, type: 'decision' });
            edges.push({ from: lastNodeId, to: switchId });
            lastNodeId = switchId;
        } else if (trimmed.startsWith('try')) {
            const tryId = `N${nodeIdx++}`;
            nodes.push({ id: tryId, label: `Try Block (L${funcStart + idx + 1})`, type: 'action' });
            edges.push({ from: lastNodeId, to: tryId });
            lastNodeId = tryId;
        } else if (trimmed.startsWith('catch')) {
            const catchId = `N${nodeIdx++}`;
            nodes.push({ id: catchId, label: `Catch Exception (L${funcStart + idx + 1})`, type: 'error' });
            edges.push({ from: lastNodeId, to: catchId, label: 'exception' });
            lastNodeId = catchId;
        } else if (trimmed.startsWith('return')) {
            const retId = `N${nodeIdx++}`;
            nodes.push({ id: retId, label: `Return: ${trimmed.substring(0, 30)}`, type: 'end' });
            edges.push({ from: lastNodeId, to: retId });
        }
    });

    const endId = `N${nodeIdx++}`;
    nodes.push({ id: endId, label: `End: ${funcName}`, type: 'end' });
    edges.push({ from: lastNodeId, to: endId });

    lines.push(`### 📄 Symbol Scope: \`${funcName}\` in \`${path.basename(fullPath)}:${funcStart + 1}-${funcEnd + 1}\`\n`);

    lines.push(`#### 🧜‍♂️ Mermaid Control Flow Diagram:`);
    lines.push('```mermaid');
    lines.push('flowchart TD');
    nodes.forEach(n => {
        lines.push(`    ${n.id}["${n.label}"]`);
    });
    edges.forEach(e => {
        const edgeLabel = e.label ? ` -- "${e.label}" --> ` : ' --> ';
        lines.push(`    ${e.from}${edgeLabel}${e.to}`);
    });
    lines.push('```\n');

    lines.push(`#### 🌲 Branch Summary:`);
    lines.push(`  - **Total Branching Points**: ${nodes.filter(n => n.type === 'decision').length}`);
    lines.push(`  - **Exception Handlers**: ${nodes.filter(n => n.type === 'error').length}`);
    lines.push(`  - **Return Points**: ${nodes.filter(n => n.label.startsWith('Return')).length}`);

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, [`[CFG] ${targetSpec}`], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
