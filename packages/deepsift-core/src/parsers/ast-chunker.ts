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
        let semanticKind = 0;
        
        switch (node.type) {
            case 'function_declaration':
            case 'method_definition':
            case 'arrow_function':
            case 'function':
            case 'method':
                type = 'function';
                semanticKind = 1;
                isImportant = true;
                break;
            case 'class_declaration':
            case 'class_definition':
            case 'class':
                type = 'class';
                semanticKind = 1;
                isImportant = true;
                break;
            case 'interface_declaration':
            case 'type_alias_declaration':
            case 'struct_item':
            case 'type_definition':
            case 'type_declaration':
            case 'interface_item':
                type = 'config';
                semanticKind = 2;
                isImportant = true;
                break;
            case 'import_statement':
            case 'import_declaration':
            case 'use_declaration':
                type = 'import';
                semanticKind = 3;
                isImportant = true;
                break;
        }

        // Variable declarations holding an arrow function
        if (node.type === 'lexical_declaration' || node.type === 'variable_declaration') {
            const text = node.text;
            if (text.includes('=>') && (text.includes('const ') || text.includes('let '))) {
                type = 'function';
                semanticKind = 1;
                isImportant = true;
            }
        }
        
        if (isImportant && type === 'function') {
            const firstLine = node.text.split('\n')[0] || '';
            if (/\b(use[A-Z][a-zA-Z0-9_]*)\b/.test(firstLine)) {
                type = 'hook_definition' as any;
                semanticKind = 1;
            }
        }
        
        if (isImportant) {
            const startLine = node.startPosition.row + 1;
            const endLine = node.endPosition.row + 1;
            const lineCount = endLine - startLine + 1;
            
            // Do not emit duplicate ranges
            const rangeKey = `${startLine}-${endLine}`;
            
            // Extract identifiers and comments as context for vector embedding
            const identifiers = new Set<string>();
            const comments = new Set<string>();
            let astOperators = 0;
            
            function collectMetadata(n: any) {
                if (n.type === 'identifier' || n.type === 'property_identifier' || n.type === 'type_identifier' || n.type === 'class_declaration' || n.type === 'function_declaration') {
                    if (n.text && n.text.length > 2) {
                        identifiers.add(n.text);
                    }
                }
                const opTypes = ['+', '-', '*', '/', '==', '===', '!=', '!==', '>', '<', '>=', '<=', '&&', '||', '=', '+=', '-=', '++', '--', 'call_expression', 'if_statement', 'for_statement', 'while_statement', 'return_statement', 'await_expression'];
                if (opTypes.includes(n.type)) {
                    astOperators++;
                }
                if (n.type === 'comment' || n.type === 'document_comment' || n.type === 'jsdoc') {
                    if (n.text) {
                        comments.add(n.text.replace(/[\/*]/g, '').trim());
                    }
                }
                for (let i = 0; i < n.childCount; i++) {
                    collectMetadata(n.child(i));
                }
            }
            collectMetadata(node);
            
            let metaContext = '';
            if (identifiers.size > 0 || comments.size > 0) {
                const idList = Array.from(identifiers).filter(id => !['const', 'let', 'var', 'function', 'class', 'interface', 'type'].includes(id));
                metaContext = `\n/* DEEPSIFT CONTEXT:\nIdentifiers: ${idList.join(', ')}`;
                if (comments.size > 0) {
                    metaContext += `\nComments: ${Array.from(comments).join(' ')}`;
                }
                metaContext += `\n*/`;
            }

            const astDensity = astOperators / (identifiers.size + 1);
            if (semanticKind === 0 && identifiers.size > 0) {
                semanticKind = (astDensity > 0.15) ? 1 : 2;
            }
            
            // Large classes should be broken down into methods, not kept as a single chunk
            if (type === 'class' && lineCount > 50) {
                if (!seenRanges.has(rangeKey)) {
                    seenRanges.add(rangeKey);
                    const chunkContent = lines.slice(startLine - 1, Math.min(startLine + 10, endLine)).join('\n');
                    chunks.push({
                        id: crypto.randomUUID(),
                        filePath,
                        content: chunkContent + '\n  // ... (Class body chunked separately)' + metaContext,
                        startLine,
                        endLine: Math.min(startLine + 10, endLine),
                        type,
                        language,
                        semanticKind,
                        astDensity
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
                    content: chunkContent + metaContext,
                    startLine,
                    endLine,
                    type: type!,
                    language,
                    semanticKind,
                    astDensity
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
