import fs from 'fs';
import { MemoManifestManager } from './manifest-manager.js';
import { NoteProcessor } from './note-processor.js';
import { MemoEntry, MemoInsightGraph, MemoInsightNode, MemoInsightEdge, MemoEntryType } from '../types/memo-types.js';
import { NativeStore } from '../storage/native-store.js';
import { getEmbedding } from '../core/embedder.js';

interface CachedEmbedding {
    entryId: string;
    vector: Float32Array;
}

export class InsightGraphBuilder {
    private projectPath: string;
    private manifest: MemoManifestManager;
    private noteProcessor: NoteProcessor;

    constructor(projectPath: string, manifest: MemoManifestManager, noteProcessor: NoteProcessor) {
        this.projectPath = projectPath;
        this.manifest = manifest;
        this.noteProcessor = noteProcessor;
    }

    async buildGraph(tagName: string): Promise<MemoInsightGraph> {
        const tag = this.manifest.getTag(tagName);
        if (!tag) {
            throw new Error(`Tag '${tagName}' not found.`);
        }

        const entries = this.noteProcessor.getEntries(tag.id);
        if (entries.length < 2) {
            return { nodes: this.entriesToNodes(entries, tag.id), edges: [] };
        }

        const embeddings = await this.getEntryEmbeddings(entries);
        const edges = this.computeRelations(entries, embeddings);
        const nodes = this.entriesToNodes(entries, tag.id);

        this.applyWeights(nodes, edges);

        return { nodes, edges };
    }

    async getGraphSummary(tagName: string): Promise<string> {
        const graph = await this.buildGraph(tagName);

        const typeCount: Record<string, number> = {};
        for (const node of graph.nodes) {
            typeCount[node.type] = (typeCount[node.type] || 0) + 1;
        }

        const relationCount: Record<string, number> = {};
        for (const edge of graph.edges) {
            relationCount[edge.relation] = (relationCount[edge.relation] || 0) + 1;
        }

        let output = `Graph Summary:\n`;
        output += `  Nodes: ${graph.nodes.length}\n`;
        output += `  Edges: ${graph.edges.length}\n\n`;

        output += `  Node Types:\n`;
        for (const [type, count] of Object.entries(typeCount)) {
            output += `    ${type}: ${count}\n`;
        }

        output += `\n  Relations:\n`;
        for (const [rel, count] of Object.entries(relationCount)) {
            output += `    ${rel}: ${count}\n`;
        }

        const topNodes = [...graph.nodes]
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);

        if (topNodes.length > 0) {
            output += `\n  Most Connected Findings:\n`;
            for (const node of topNodes) {
                output += `    [${node.type}] ${node.label} (weight: ${node.weight})\n`;
            }
        }

        return output;
    }

    private async getEntryEmbeddings(entries: MemoEntry[]): Promise<CachedEmbedding[]> {
        const results: CachedEmbedding[] = [];

        for (const entry of entries) {
            const text = entry.summary || entry.content.substring(0, 500);
            const vector = await getEmbedding(text);
            results.push({ entryId: entry.id, vector });
        }

        return results;
    }

    private computeRelations(entries: MemoEntry[], embeddings: CachedEmbedding[]): MemoInsightEdge[] {
        const edges: MemoInsightEdge[] = [];
        const SIMILARITY_THRESHOLD = 0.65;

        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                const similarity = this.cosineSimilarity(
                    embeddings[i].vector,
                    embeddings[j].vector
                );

                if (similarity < SIMILARITY_THRESHOLD) continue;

                const relation = this.inferRelation(entries[i], entries[j], similarity);
                edges.push({
                    source: entries[i].id,
                    target: entries[j].id,
                    relation,
                    strength: similarity
                });
            }
        }

        return edges;
    }

    private inferRelation(
        a: MemoEntry,
        b: MemoEntry,
        similarity: number
    ): MemoInsightEdge['relation'] {
        if (a.type === 'error_solution' && b.type === 'finding') return 'derived_from';
        if (b.type === 'error_solution' && a.type === 'finding') return 'derived_from';

        if (a.type === 'decision' && b.type === 'decision') {
            if (similarity < 0.8) return 'contradicts';
        }

        if (a.type === 'architecture_note' && b.type === 'code_snippet') return 'supports';
        if (b.type === 'architecture_note' && a.type === 'code_snippet') return 'supports';

        if (a.createdAt > b.createdAt && similarity > 0.8) return 'extends';
        if (b.createdAt > a.createdAt && similarity > 0.8) return 'extends';

        return 'related_to';
    }

    private entriesToNodes(entries: MemoEntry[], tagId: string): MemoInsightNode[] {
        return entries.map(e => ({
            id: e.id,
            label: e.summary || e.content.substring(0, 80),
            type: e.type,
            tagId,
            weight: 1
        }));
    }

    private applyWeights(nodes: MemoInsightNode[], edges: MemoInsightEdge[]): void {
        const connectionCount = new Map<string, number>();
        for (const edge of edges) {
            connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
            connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
        }

        for (const node of nodes) {
            node.weight = 1 + (connectionCount.get(node.id) || 0);
        }
    }

    private cosineSimilarity(a: Float32Array, b: Float32Array): number {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
    }
}
