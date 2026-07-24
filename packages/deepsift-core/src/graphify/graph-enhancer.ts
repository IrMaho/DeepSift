/**
 * @file graph-enhancer.ts
 * @description Graph topology enhancer adding metadata and inferring missing cross-file edges.
 *
 * @module graphify/graph-enhancer
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import { SearchResult } from '../types/index.js';
import { GraphifyNode, GraphifyEdge } from './graph-types.js';
import { GraphQueryEngine } from './graph-query-engine.js';
import { LearningOverlay } from './learning-overlay.js';

export class GraphEnhancer {
    private nodes: Map<string, GraphifyNode>;
    private edges: GraphifyEdge[];
    private queryEngine: GraphQueryEngine;
    private learningOverlay: LearningOverlay;

    constructor(nodesList: GraphifyNode[], edges: GraphifyEdge[], learningOverlay: LearningOverlay) {
        this.nodes = new Map();
        for (const node of nodesList) {
            this.nodes.set(node.id, node);
        }
        this.edges = edges;
        this.queryEngine = new GraphQueryEngine(nodesList);
        this.learningOverlay = learningOverlay;
    }

    public enhanceSearchResults(originalResults: SearchResult[], query: string): SearchResult[] {
        if (originalResults.length === 0) return [];
        
        // 1. Query the graph for this question
        const graphScores = this.queryEngine.scoreQuery(query);
        const seeds = this.queryEngine.pickSeeds(graphScores.ranked, 3, 0.2, graphScores.bestSeedByTerm);
        
        // Map original results by file path
        const fileMap = new Map<string, SearchResult[]>();
        for (const res of originalResults) {
            if (!fileMap.has(res.chunk.filePath)) {
                fileMap.set(res.chunk.filePath, []);
            }
            fileMap.get(res.chunk.filePath)!.push(res);
        }

        // Apply boosting
        for (const [filePath, results] of fileMap.entries()) {
            const node = this.nodes.get(filePath);
            if (!node) continue;

            let boost = 0.0;

            // Boost based on graph topological properties
            if (node.inDegree > 50) {
                boost += 0.15; // God node boost
            }

            // Check if this node was picked as a seed by the GraphQueryEngine
            if (seeds.includes(node.id)) {
                boost += 0.20; // Direct graph match boost
            }

            // Check if any seed node is a neighbor
            for (const seedId of seeds) {
                const isNeighbor = this.edges.some(e => 
                    (e.source === seedId && e.target === node.id) ||
                    (e.target === seedId && e.source === node.id)
                );
                
                if (isNeighbor) {
                    // Check if they share a community
                    const seedNode = this.nodes.get(seedId);
                    if (seedNode && seedNode.community === node.community) {
                        boost += 0.10; // Connected neighbor in same community
                    } else {
                        boost += 0.05; // Connected neighbor
                    }
                }
            }

            // Learning Overlay
            const lessons = this.learningOverlay.getLessonsForNode(node.id);
            for (const lesson of lessons) {
                if (lesson.outcome === 'useful') {
                    // Very simple keyword matching to apply lesson boost
                    const terms = query.toLowerCase().split(/\s+/);
                    if (terms.some(t => lesson.question.toLowerCase().includes(t))) {
                        boost += 0.25; 
                    }
                } else if (lesson.outcome === 'dead_end') {
                    const terms = query.toLowerCase().split(/\s+/);
                    if (terms.some(t => lesson.question.toLowerCase().includes(t))) {
                        boost -= 0.20; 
                    }
                }
            }

            // Apply boost to all chunks in this file
            for (const res of results) {
                res.score = Math.max(0, res.score + boost);
            }
        }

        // Sort again based on updated scores
        return originalResults.sort((a, b) => b.score - a.score);
    }
}
