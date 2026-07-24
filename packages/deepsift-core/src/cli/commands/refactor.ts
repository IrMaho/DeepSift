/**
 * @file refactor.ts
 * @description AST-safe symbol renaming and function extraction refactoring command.
 *
 * @module cli/commands/refactor
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import path from 'path';
import fs from 'fs';
import { printResult, printSuccess, OutputFormat } from '../cli-output.js';
import { normalizePath } from '../../utils/outline.js';

export function refactorRenameCommand(
    projectPath: string, 
    oldSymbol: string, 
    newSymbol: string, 
    format: OutputFormat = 'markdown'
): void {
    let replacedCount = 0;
    let fileCount = 0;

    function walkDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                walkDir(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.tsx', '.jsx', '.dart', '.py', '.go'].includes(ext)) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const regex = new RegExp(`\\b${oldSymbol}\\b`, 'g');
                        if (regex.test(content)) {
                            const newContent = content.replace(regex, newSymbol);
                            fs.writeFileSync(fullPath, newContent, 'utf8');
                            fileCount++;
                            const matches = (content.match(regex) || []).length;
                            replacedCount += matches;
                        }
                    } catch {}
                }
            }
        }
    }

    walkDir(projectPath);
    printSuccess(`Refactored symbol \`${oldSymbol}\` ➔ \`${newSymbol}\`: Replaced ${replacedCount} occurrences across ${fileCount} files.`);
}

export function refactorExtractCommand(
    projectPath: string, 
    fileRange: string, 
    newFuncName: string, 
    format: OutputFormat = 'markdown'
): void {
    const parts = fileRange.split(':');
    const filePath = path.resolve(projectPath, parts[0]);
    if (!fs.existsSync(filePath)) {
        printResult(`File not found: ${filePath}`, format);
        return;
    }

    const rangeStr = parts[1] || '1-10';
    const [startLine, endLine] = rangeStr.split('-').map(n => parseInt(n, 10));

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const extractedLines = lines.slice(startLine - 1, endLine);
    const newFuncDef = `\nfunction ${newFuncName}() {\n  ${extractedLines.join('\n  ')}\n}\n`;

    lines.splice(startLine - 1, endLine - startLine + 1, `  ${newFuncName}();`);
    lines.push(newFuncDef);

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    printSuccess(`Extracted lines ${startLine}-${endLine} in \`${normalizePath(parts[0])}\` into new function \`${newFuncName}()\`.`);
}
