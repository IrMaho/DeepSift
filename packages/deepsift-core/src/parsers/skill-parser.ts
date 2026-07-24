/**
 * @file skill-parser.ts
 * @description SKILL.md and markdown knowledge document parser for agent knowledge realms.
 *
 * @module parsers/skill-parser
 * @category Core Search & Discovery
 * @since 1.0.3
 */
import { CodeChunk } from '../types/index.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export function parseSkillFile(filePath: string, content: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split('\n');
    let currentChunkType = 'markdown';
    let currentChunkStart = 1;
    let currentContent: string[] = [];
    let inFrontmatter = false;

    // Simple markdown parsing based on headers and frontmatter
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (i === 0 && line.trim() === '---') {
            inFrontmatter = true;
            currentChunkType = 'frontmatter';
            currentContent.push(line);
            continue;
        }

        if (inFrontmatter && line.trim() === '---') {
            inFrontmatter = false;
            currentContent.push(line);
            
            const chunkId = crypto.randomUUID();
            chunks.push({
                id: chunkId,
                filePath,
                content: currentContent.join('\n'),
                startLine: currentChunkStart,
                endLine: i + 1,
                type: 'config',
                language: 'yaml'
            });
            
            currentContent = [];
            currentChunkStart = i + 2;
            currentChunkType = 'markdown';
            continue;
        }

        if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
            if (currentContent.length > 0 && currentContent.join('').trim().length > 0) {
                const chunkId = crypto.randomUUID();
                chunks.push({
                    id: chunkId,
                    filePath,
                    content: currentContent.join('\n'),
                    startLine: currentChunkStart,
                    endLine: i,
                    type: 'block',
                    language: 'markdown'
                });
            }
            currentContent = [line];
            currentChunkStart = i + 1;
        } else {
            currentContent.push(line);
        }
    }

    if (currentContent.length > 0 && currentContent.join('').trim().length > 0) {
        const chunkId = crypto.randomUUID();
        chunks.push({
            id: chunkId,
            filePath,
            content: currentContent.join('\n'),
            startLine: currentChunkStart,
            endLine: lines.length,
            type: 'block',
            language: 'markdown'
        });
    }

    return chunks;
}
