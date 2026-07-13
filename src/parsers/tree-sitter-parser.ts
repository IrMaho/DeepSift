import Parser from 'tree-sitter';
// tree-sitter-typescript exports two grammars: typescript and tsx
import * as TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import { CodeChunk, ChunkType } from '../types/index.js';
import * as crypto from 'crypto';
import path from 'path';
import { parseSimple } from './simple-parser.js';

const parsers = new Map<string, Parser>();

function getParser(language: string): Parser | null {
    if (parsers.has(language)) {
        return parsers.get(language)!;
    }

    const parser = new Parser();
    try {
        switch (language.toLowerCase()) {
            case 'typescript':
            case 'ts':
                parser.setLanguage(TypeScript.typescript as any);
                break;
            case 'tsx':
                parser.setLanguage(TypeScript.tsx as any);
                break;
            case 'python':
            case 'py':
                parser.setLanguage(Python as any);
                break;
            default:
                return null;
        }
        parsers.set(language, parser);
        return parser;
    } catch (err) {
        // Fallback to simple parser silently
        return null;
    }
}

/**
 * Parses code using Tree-sitter and returns meaningful semantic chunks.
 * Falls back to simple parsing if the language is unsupported.
 */
export function parseAST(content: string, filePath: string, language: string): CodeChunk[] {
    const parser = getParser(language);
    if (!parser) {
        return parseSimple(content, filePath, language);
    }

    try {
        const tree = parser.parse(content);
        const chunks: CodeChunk[] = [];
        
        walkTree(tree.rootNode, content, filePath, language, chunks);
        
        // If we didn't extract any meaningful chunks, fallback
        if (chunks.length === 0) {
            return parseSimple(content, filePath, language);
        }
        
        return chunks;
    } catch (err) {
        console.error(`Error parsing ${filePath} with tree-sitter:`, err);
        return parseSimple(content, filePath, language);
    }
}

function walkTree(node: Parser.SyntaxNode, content: string, filePath: string, language: string, chunks: CodeChunk[]) {
    // Determine if this node is worth chunking
    const chunkType = determineChunkType(node.type, language);
    
    if (chunkType) {
        const startLine = node.startPosition.row + 1;
        const endLine = node.endPosition.row + 1;
        
        // Skip tiny one-liners unless they are imports
        if (endLine - startLine > 1 || chunkType === 'import') {
            chunks.push({
                id: generateId(filePath, startLine, endLine),
                filePath,
                content: node.text,
                startLine,
                endLine,
                type: chunkType,
                language
            });
        }
        
        // We don't want to extract children of a function as separate chunks (avoid overlaps)
        // But for classes, we might want to extract methods.
        if (chunkType === 'class' || chunkType === 'block') {
            for (let i = 0; i < node.namedChildCount; i++) {
                walkTree(node.namedChild(i)!, content, filePath, language, chunks);
            }
        }
    } else {
        // Keep digging
        for (let i = 0; i < node.namedChildCount; i++) {
            walkTree(node.namedChild(i)!, content, filePath, language, chunks);
        }
    }
}

function determineChunkType(nodeType: string, language: string): ChunkType | null {
    if (language.includes('ts') || language.includes('js')) {
        if (nodeType === 'function_declaration' || nodeType === 'method_definition' || nodeType === 'arrow_function') return 'function';
        if (nodeType === 'class_declaration') return 'class';
        if (nodeType === 'import_statement') return 'import';
        if (nodeType === 'comment') return 'comment';
    } else if (language.includes('py')) {
        if (nodeType === 'function_definition') return 'function';
        if (nodeType === 'class_definition') return 'class';
        if (nodeType === 'import_statement' || nodeType === 'import_from_statement') return 'import';
        if (nodeType === 'comment') return 'comment';
    }
    return null;
}

function generateId(filePath: string, startLine: number, endLine: number): string {
    const raw = `${filePath}:${startLine}-${endLine}`;
    return crypto.createHash('md5').update(raw).digest('hex').substring(0, 12);
}
