/**
 * @file similarity-engine.ts
 * @description AST code clone and duplication detection engine using token hash fingerprinting.
 *
 * @module analyzers/similarity-engine
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import { SimilarityGroup, SimilarityMember } from '../types/dna-types.js';
import { NativeStore } from '../storage/native-store.js';
import { EmbeddedChunk } from '../types/index.js';
import path from 'path';

function cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function detectSimilarities(
    projectPath: string,
    onProgress?: (current: number, total: number) => void
): Promise<SimilarityGroup[]> {
    const dbPath = path.join(projectPath, '.deepsift', 'deepsift.db');
    let allChunks: EmbeddedChunk[] = [];
    try {
        const store = new NativeStore(dbPath);
        allChunks = await store.getAllChunks();
    } catch {
        return [];
    }

    // Filter to meaningful logic blocks
    const candidates = allChunks.filter(c => 
        (c.chunk.type === 'function' || c.chunk.type === 'class') &&
        c.chunk.content.length > 100
    );

    const groups: SimilarityGroup[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
        if (onProgress && i % 50 === 0) onProgress(i, candidates.length);
        
        const a = candidates[i];
        if (visited.has(a.chunk.id)) continue;

        const groupMembers: SimilarityMember[] = [{
            chunkId: a.chunk.id,
            filePath: a.chunk.filePath,
            startLine: a.chunk.startLine,
            endLine: a.chunk.endLine,
            name: extractName(a.chunk.content, a.chunk.type)
        }];

        let totalSimilarity = 0;
        visited.add(a.chunk.id);

        for (let j = i + 1; j < candidates.length; j++) {
            const b = candidates[j];
            if (visited.has(b.chunk.id)) continue;

            const sim = cosineSimilarity(a.embedding, b.embedding);
            if (sim > 0.90) { // Highly similar threshold
                groupMembers.push({
                    chunkId: b.chunk.id,
                    filePath: b.chunk.filePath,
                    startLine: b.chunk.startLine,
                    endLine: b.chunk.endLine,
                    name: extractName(b.chunk.content, b.chunk.type)
                });
                totalSimilarity += sim;
                visited.add(b.chunk.id);
            }
        }

        if (groupMembers.length > 1) {
            groups.push({
                groupId: `sim_${groups.length + 1}`,
                avgSimilarity: totalSimilarity / (groupMembers.length - 1),
                members: groupMembers,
                recommendation: 'Consider extracting into a shared generic function or base class.',
            });
        }
    }

    // Sort by largest groups first
    return groups.sort((a, b) => b.members.length - a.members.length).slice(0, 50); // Limit to top 50 groups
}

function extractName(content: string, type: string): string {
    const firstLine = content.split('\n')[0];
    if (type === 'class') {
        const match = firstLine.match(/(?:class|struct|interface|enum)\s+([\w_]+)/);
        return match ? match[1] : 'UnnamedClass';
    }
    if (type === 'function') {
        const match = firstLine.match(/(?:function|func|fn|def)\s+([\w_]+)/) || firstLine.match(/([\w_]+)\s*\(/);
        return match ? match[1] : 'UnnamedFunction';
    }
    return 'Unknown';
}
