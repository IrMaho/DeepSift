import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createRequire } from 'module';
import { CodeChunk, ChunkType } from '../types/index.js';

const require = createRequire(import.meta.url);
const _ws = require('web-tree-sitter');
const Parser = _ws.Parser || _ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let parser: any = null;
let tsLanguage: any = null;
let tsxLanguage: any = null;

export async function initAstParser() {
    if (parser) return;
    await Parser.init();
    parser = new Parser();
    const wasmsDir = path.join(path.dirname(require.resolve('tree-sitter-wasms/package.json')), 'out');
    
    const tsWasm = path.join(wasmsDir, 'tree-sitter-typescript.wasm');
    const tsxWasm = path.join(wasmsDir, 'tree-sitter-tsx.wasm');
    
    if (fs.existsSync(tsWasm) && fs.existsSync(tsxWasm)) {
        tsLanguage = await _ws.Language.load(tsWasm);
        tsxLanguage = await _ws.Language.load(tsxWasm);
    } else {
        throw new Error(`Tree-sitter WASM files not found in ${wasmsDir}`);
    }
}

export async function parseWithAst(content: string, filePath: string, language: string): Promise<CodeChunk[]> {
    await initAstParser();
    if (!parser) throw new Error("Parser not initialized");
    
    const isTsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    parser.setLanguage(isTsx ? tsxLanguage! : tsLanguage!);
    
    const tree = parser.parse(content);
    const chunks: CodeChunk[] = [];
    
    const lines = content.split('\n');
    const seenRanges = new Set<string>();

    function traverse(node: any) {
        let type: ChunkType | null = null;
        let isImportant = false;
        
        switch (node.type) {
            case 'function_declaration':
            case 'method_definition':
            case 'arrow_function':
                type = 'function';
                isImportant = true;
                break;
            case 'class_declaration':
                type = 'class';
                isImportant = true;
                break;
            case 'interface_declaration':
            case 'type_alias_declaration':
                type = 'config';
                isImportant = true;
                break;
            case 'import_statement':
                type = 'import';
                isImportant = true;
                break;
        }

        // Variable declarations holding an arrow function
        if (node.type === 'lexical_declaration' || node.type === 'variable_declaration') {
            const text = node.text;
            if (text.includes('=>') && (text.includes('const ') || text.includes('let '))) {
                type = 'function';
                isImportant = true;
            }
        }
        
        if (isImportant) {
            const startLine = node.startPosition.row + 1;
            const endLine = node.endPosition.row + 1;
            const lineCount = endLine - startLine + 1;
            
            // Do not emit duplicate ranges
            const rangeKey = `${startLine}-${endLine}`;
            
            // Large classes should be broken down into methods, not kept as a single chunk
            if (type === 'class' && lineCount > 50) {
                if (!seenRanges.has(rangeKey)) {
                    seenRanges.add(rangeKey);
                    const chunkContent = lines.slice(startLine - 1, Math.min(startLine + 10, endLine)).join('\n');
                    chunks.push({
                        id: crypto.randomUUID(),
                        filePath,
                        content: chunkContent + '\n  // ... (Class body chunked separately)',
                        startLine,
                        endLine: Math.min(startLine + 10, endLine),
                        type,
                        language
                    });
                }
                for (let i = 0; i < node.childCount; i++) {
                    traverse(node.child(i)!);
                }
                return; 
            }
            
            // For other important nodes, emit the chunk
            if (!seenRanges.has(rangeKey)) {
                seenRanges.add(rangeKey);
                const chunkContent = lines.slice(startLine - 1, endLine).join('\n');
                chunks.push({
                    id: crypto.randomUUID(),
                    filePath,
                    content: chunkContent,
                    startLine,
                    endLine,
                    type: type!,
                    language
                });
            }
            
            if (type === 'function') {
                return;
            }
        }
        
        for (let i = 0; i < node.childCount; i++) {
            traverse(node.child(i)!);
        }
    }
    
    traverse(tree.rootNode);
    
    if (chunks.length === 0) {
        const CHUNK_SIZE = 50;
        for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
            const startLine = i + 1;
            const endLine = Math.min(i + CHUNK_SIZE, lines.length);
            const chunkContent = lines.slice(i, endLine).join('\n');
            chunks.push({
                id: crypto.randomUUID(),
                filePath,
                content: chunkContent,
                startLine,
                endLine,
                type: 'block',
                language
            });
        }
    }
    
    return chunks;
}
