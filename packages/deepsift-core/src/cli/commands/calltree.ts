/**
 * @file calltree.ts
 * @description Call Graph & Event-Driven Message Traversal Command.
 * Traces upstream callers, downstream callee scopes, and event-driven message channels (postMessage, IPC, EventEmitters).
 * 
 * @module cli/commands/calltree
 * @category Architecture & Intelligence
 * @since 1.0.3
 */

import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { normalizePath } from '../../utils/outline.js';

import { RealmRouter } from '../../core/realm-router.js';

/**
 * Executes the `deepsift calltree` command to trace call graphs and event channels.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param symbol Target symbol or event type name to trace.
 * @param format Output format ('markdown', 'plain', or 'json').
 * @param compress Whether to apply token compression.
 * @param filterPath Optional path filter to narrow caller search.
 * @example
 * ```ts
 * await calltreeCommand(process.cwd(), 'TokenOptimizerService', 'markdown');
 * ```
 */
export async function calltreeCommand(
    projectPath: string, 
    symbol: string, 
    format: OutputFormat = 'markdown', 
    compress: boolean = false,
    filterPath?: string
): Promise<void> {
    const lines: string[] = [];
    const cleanSymbol = symbol.replace(/['"]/g, '').trim();

    lines.push(`# 🌳 Call Graph & State Mutation Matrix for: \`${cleanSymbol}\`\n`);
    if (filterPath) {
        lines.push(`*(Filtered by path: \`${filterPath}\`)*\n`);
    }

    const callers: Array<{ file: string, line: number, snippet: string }> = [];
    const callees: Array<{ file: string, line: number, snippet: string }> = [];
    const selectors: Array<{ file: string, line: number, snippet: string }> = [];
    const mutators: Array<{ file: string, line: number, snippet: string }> = [];
    const eventSenders: Array<{ file: string, line: number, snippet: string }> = [];
    const eventHandlers: Array<{ file: string, line: number, snippet: string }> = [];

    const router = new RealmRouter(projectPath);
    const store = router.getStore('code');
    
    // Instead of doing regex in JS, gather files and use Zig Native AST
    const filePaths: string[] = [];
    
    function collectFiles(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                collectFiles(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.dart', '.py', '.java', '.go', '.cpp', '.tsx', '.jsx'].includes(ext)) {
                    filePaths.push(fullPath);
                }
            }
        }
    }
    collectFiles(projectPath);
    
    const results = await store.extractCalltreeBulkNative(filePaths, cleanSymbol);
    
    for (const r of results) {
        const rel = normalizePath(path.relative(projectPath, r.file_path));
        if (filterPath) {
            const normFilter = normalizePath(filterPath).toLowerCase();
            if (!rel.toLowerCase().includes(normFilter)) continue;
        }
        
        const data = { file: rel, line: r.line, snippet: r.snippet };
        if (r.role === 'selector') selectors.push(data);
        else if (r.role === 'mutator') mutators.push(data);
        else if (r.role === 'callee') callees.push(data);
        else if (r.role === 'event_sender') eventSenders.push(data);
        else if (r.role === 'event_handler') eventHandlers.push(data);
        else callers.push(data);
    }
    
    if (mutators.length > 0 || selectors.length > 0) {
        lines.push(`## 🔄 State Mutation Matrix (Zustand/Redux/Provider)`);
        
        lines.push(`### 🔴 State Mutators (Dispatchers / Setters):`);
        if (mutators.length > 0) {
            mutators.forEach(m => lines.push(`- 📄 **${m.file}:${m.line}**: \`${m.snippet}\``));
        } else {
            lines.push(`- No state mutators detected.`);
        }
        lines.push('');
        
        lines.push(`### 🟢 State Selectors (Readers / Subscribers):`);
        if (selectors.length > 0) {
            selectors.forEach(s => lines.push(`- 📄 **${s.file}:${s.line}**: \`${s.snippet}\``));
        } else {
            lines.push(`- No state selectors detected.`);
        }
        lines.push('');
    }

    if (eventSenders.length > 0 || eventHandlers.length > 0) {
        lines.push(`## ⚡ Event-Driven Message Link Trace (\`postMessage\` / Events)`);
        
        lines.push(`### 📤 Event Senders / Producers:`);
        if (eventSenders.length > 0) {
            eventSenders.forEach(s => lines.push(`- 📄 **${s.file}:${s.line}**: \`${s.snippet}\``));
        } else {
            lines.push(`- No direct event senders detected.`);
        }
        lines.push('');

        lines.push(`### 📥 Event Handlers / Listeners:`);
        if (eventHandlers.length > 0) {
            eventHandlers.forEach(h => lines.push(`- 🎯 **${h.file}:${h.line}**: \`${h.snippet}\``));
        } else {
            lines.push(`- No direct event handlers detected.`);
        }
        lines.push('');
    }

    lines.push(`## ⬆️ Upstream Callers (Who calls / references \`${cleanSymbol}\`):`);
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
