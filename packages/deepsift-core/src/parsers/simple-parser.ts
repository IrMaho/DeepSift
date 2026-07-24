/**
 * @file simple-parser.ts
 * @description Simple line-based code chunker for plain text and markdown documents.
 *
 * @module parsers/simple-parser
 * @category Core Search & Discovery
 * @since 1.0.0
 */
import { CodeChunk, ChunkType } from '../types/index.js';
import * as crypto from 'crypto';
import path from 'path';

/**
 * Fallback parser that splits text into simple chunks based on lines.
 * Useful for languages without Tree-sitter grammar or plain text files.
 */
export function parseSimple(content: string, filePath: string, language: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');
    
    // Universal import extraction for dependency tracking (Dart, C++, etc)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ') || line.startsWith('require(') || line.startsWith('#include') || line.startsWith('from ')) {
            chunks.push({
                id: generateId(filePath, i + 1, i + 1) + '-imp',
                filePath,
                content: line,
                startLine: i + 1,
                endLine: i + 1,
                type: 'import',
                language
            });
        }
    }
    
    // For config files or very short files, chunk the entire thing
    if (lines.length <= 50 || ['json', 'yaml', 'yml', 'toml', 'xml'].includes(language.toLowerCase())) {
        const type: ChunkType = filePath.includes('config') || filePath.includes('.json') ? 'config' : 'block';
        chunks.push({
            id: generateId(filePath, 1, lines.length),
            filePath,
            content,
            startLine: 1,
            endLine: lines.length,
            type,
            language
        });
        return chunks;
    }

    // Otherwise, split into chunks of ~40 lines with 10 lines overlap
    const CHUNK_SIZE = 40;
    const OVERLAP = 10;
    const STEP = CHUNK_SIZE - OVERLAP;

    for (let i = 0; i < lines.length; i += STEP) {
        const startLine = i + 1;
        const endLine = Math.min(i + CHUNK_SIZE, lines.length);
        const chunkContent = lines.slice(i, endLine).join('\n');
        
        chunks.push({
            id: generateId(filePath, startLine, endLine),
            filePath,
            content: chunkContent,
            startLine,
            endLine,
            type: 'block',
            language
        });

        if (endLine === lines.length) break;
    }

    return chunks;
}

function generateId(filePath: string, startLine: number, endLine: number): string {
    const baseName = path.basename(filePath);
    const raw = `${filePath}:${startLine}-${endLine}`;
    return crypto.createHash('md5').update(raw).digest('hex').substring(0, 12);
}
