/**
 * @file heuristic-parser.ts
 * @description Heuristic regex-based code chunker for languages without tree-sitter grammars.
 *
 * @module parsers/heuristic-parser
 * @category Core Search & Discovery
 * @since 1.0.2
 */
import * as crypto from 'crypto';
import path from 'path';
import { CodeChunk } from '../types/index.js';
import { ChunkFamily } from '../types/dna-types.js';

const FUNCTION_PATTERN = /^(?:export\s+|public\s+|private\s+|protected\s+|static\s+|async\s+)*(?:function|func|fn|def|fun|sub)\s+([\w_]+)\s*\(/m;
const CLASS_PATTERN = /^(?:export\s+|public\s+|abstract\s+)*(?:class|struct|interface|enum|trait)\s+([\w_]+)/m;
const CONSTANT_PATTERN = /^(?:export\s+|public\s+)*(?:const|final|static\s+const|val)\s+([\w_]+)\s*[=:]/m;
const IMPORT_BLOCK_START = /^(?:import|export|from|require|include|use|proxy_pass)\b|^<\s*(?:script|link|img|iframe)/i;

export function parseHeuristic(content: string, filePath: string, language: string): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];
    
    let currentBlockType: 'import' | 'function' | 'class' | 'constant' | 'unknown' | null = null;
    let blockStartLine = -1;
    let braceDepth = 0;
    let blockContent: string[] = [];

    const flushBlock = (endLine: number) => {
        if (!currentBlockType || blockContent.length === 0) return;
        
        const text = blockContent.join('\n');
        
        let type: CodeChunk['type'] = 'block';
        let family: ChunkFamily = 'unknown';
        
        if (currentBlockType === 'import') {
            type = 'import';
            family = 'dependency';
        } else if (currentBlockType === 'class') {
            type = 'class';
            family = 'structure';
        } else if (currentBlockType === 'function') {
            type = 'function';
            family = 'logic';
        } else if (currentBlockType === 'constant') {
            type = 'block';
            family = 'data';
        }

        chunks.push({
            id: generateChunkId(filePath, blockStartLine, endLine),
            filePath,
            content: text,
            startLine: blockStartLine,
            endLine,
            type,
            family,
            language,
        });

        currentBlockType = null;
        blockStartLine = -1;
        blockContent = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Very naive brace counting for block delineation (C-like languages)
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        
        if (currentBlockType === 'import') {
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
                // Keep adding imports, tolerate blank lines
                blockContent.push(line);
                continue;
            } else if (!IMPORT_BLOCK_START.test(trimmed) && !trimmed.startsWith('}')) {
                // End of imports block
                flushBlock(i);
            }
        }

        if (currentBlockType === null) {
            if (IMPORT_BLOCK_START.test(trimmed)) {
                currentBlockType = 'import';
                blockStartLine = i + 1;
            } else if (CLASS_PATTERN.test(trimmed)) {
                currentBlockType = 'class';
                blockStartLine = i + 1;
            } else if (FUNCTION_PATTERN.test(trimmed)) {
                currentBlockType = 'function';
                blockStartLine = i + 1;
            } else if (CONSTANT_PATTERN.test(trimmed)) {
                currentBlockType = 'constant';
                blockStartLine = i + 1;
            } else if (trimmed) {
                // Start a generic block
                currentBlockType = 'unknown';
                blockStartLine = i + 1;
            }
        }

        if (currentBlockType) {
            blockContent.push(line);
            braceDepth += (openBraces - closeBraces);

            // Heuristic to close block
            if (currentBlockType !== 'import' && braceDepth === 0 && closeBraces > 0) {
                flushBlock(i + 1);
            } else if (currentBlockType === 'unknown' && trimmed === '') {
                // Generic blocks end on empty lines
                flushBlock(i + 1);
            }
        }
    }

    if (currentBlockType) {
        flushBlock(lines.length);
    }

    return chunks;
}

function generateChunkId(filePath: string, startLine: number, endLine: number): string {
    const hash = crypto.createHash('md5').update(`${filePath}:${startLine}-${endLine}`).digest('hex');
    return `${path.basename(filePath)}_${startLine}_${hash.substring(0, 8)}`;
}
