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
    compress: boolean = false,
    filterPath?: string
): Promise<void> {
    const lines: string[] = [];
    const cleanSymbol = symbol.replace(/['"]/g, '').trim();

    lines.push(`# 🌳 Call Graph & Event Traversal for: \`${cleanSymbol}\`\n`);
    if (filterPath) {
        lines.push(`*(Filtered by path: \`${filterPath}\`)*\n`);
    }

    const callers: Array<{ file: string, line: number, snippet: string }> = [];
    const callees: Array<{ file: string, line: number, snippet: string }> = [];
    const eventSenders: Array<{ file: string, line: number, snippet: string }> = [];
    const eventHandlers: Array<{ file: string, line: number, snippet: string }> = [];

    const isEventPattern = /[\-_:A-Z0-9]/i.test(cleanSymbol);

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
                if (['.ts', '.js', '.dart', '.py', '.java', '.go', '.cpp', '.tsx', '.jsx'].includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const fileLines = content.split('\n');
                        fileLines.forEach((l, idx) => {
                            if (l.includes(cleanSymbol) || l.includes(symbol)) {
                                const rel = normalizePath(path.relative(projectPath, fullPath));
                                if (filterPath) {
                                    const normFilter = normalizePath(filterPath).toLowerCase();
                                    if (!rel.toLowerCase().includes(normFilter)) return;
                                }

                                const lineSnippet = l.trim();
                                if (lineSnippet.length > 120) return; // Ignore minified/huge lines

                                // Check for Event-Driven / postMessage / Redux dispatch senders
                                const isSender = /(?:postMessage|dispatch|emit|sendMessage|broadcast|ws\.send)\s*\(/i.test(lineSnippet) ||
                                                 /(?:type|action|event)\s*:\s*['"][^'"]*$/i.test(lineSnippet);

                                // Check for Event Handlers / Listeners
                                const isHandler = /(?:onmessage|addEventListener|case\s+['"]|msg\.type|action\.type|\.on\s*\()/i.test(lineSnippet);

                                if (isSender && !isHandler) {
                                    eventSenders.push({ file: rel, line: idx + 1, snippet: lineSnippet });
                                } else if (isHandler) {
                                    eventHandlers.push({ file: rel, line: idx + 1, snippet: lineSnippet });
                                } else if (l.match(new RegExp(`\\b(function|const|let|var|def|class|interface|type)\\s+${cleanSymbol}\\b`)) || l.includes(`def ${cleanSymbol}`)) {
                                    callees.push({ file: rel, line: idx + 1, snippet: lineSnippet });
                                } else {
                                    callers.push({ file: rel, line: idx + 1, snippet: lineSnippet });
                                }
                            }
                        });
                    } catch {}
                }
            }
        }
    }

    searchInDir(projectPath);

    // 1. Render Event-Driven Message Link Trace (if present)
    if (eventSenders.length > 0 || eventHandlers.length > 0) {
        lines.push(`## ⚡ Event-Driven Message Link Trace (\`postMessage\` / Redux / Events)`);
        lines.push(`*Linked event producers (senders) and handlers (receivers) across UI and Sandbox/Backend environments:*\n`);
        
        lines.push(`### 📤 Event Senders / Producers (UI Environment):`);
        if (eventSenders.length > 0) {
            eventSenders.forEach(s => {
                lines.push(`- 📄 **${s.file}:${s.line}**: \`${s.snippet}\``);
            });
        } else {
            lines.push(`- No direct event senders detected.`);
        }
        lines.push('');

        lines.push(`### 📥 Event Handlers / Listeners (Core Sandbox):`);
        if (eventHandlers.length > 0) {
            eventHandlers.forEach(h => {
                lines.push(`- 🎯 **${h.file}:${h.line}**: \`${h.snippet}\``);
            });
        } else {
            lines.push(`- No direct event handlers detected.`);
        }
        lines.push('');
    }

    // 2. Render Upstream Callers
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

    // 3. Render Downstream Definitions
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
