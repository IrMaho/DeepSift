/**
 * @file heal-engine.ts
 * @description Self-healing refactoring engine applying DNA-aware patches to resolve lint and type errors.
 *
 * @module intelligence/heal-engine
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import { InternalGraph, InternalNode } from './internal-graph.js';

export interface HealCluster {
    id: string;
    suggestedName: string;
    nodes: InternalNode[];
    totalLines: number;
}

export interface HealProposal {
    originalFile: string;
    clusters: HealCluster[];
    orphanNodes: InternalNode[];
}

export class HealEngine {
    private graph: InternalGraph;
    private maxLinesPerCluster: number;

    constructor(graph: InternalGraph, maxLinesPerCluster: number = 800) {
        this.graph = graph;
        this.maxLinesPerCluster = maxLinesPerCluster;
    }

    public computeProposal(originalFile: string): HealProposal {
        const clusters = this.detectCommunities();
        
        // Name clusters
        clusters.forEach((cluster, index) => {
            cluster.suggestedName = this.guessClusterName(cluster, index);
        });

        // Any nodes not in a cluster? (Should be 0 with this algorithm)
        const orphanNodes: InternalNode[] = [];

        return {
            originalFile,
            clusters,
            orphanNodes
        };
    }

    private detectCommunities(): HealCluster[] {
        const nodeMap = new Map<string, InternalNode>();
        this.graph.nodes.forEach(n => nodeMap.set(n.name, n));

        // Initial: each node is its own cluster
        const clusterMap = new Map<string, string>(); // nodeName -> clusterId
        const clusters = new Map<string, HealCluster>();

        this.graph.nodes.forEach(n => {
            const lines = n.endLine - n.startLine + 1;
            clusterMap.set(n.name, n.name);
            clusters.set(n.name, {
                id: n.name,
                suggestedName: '',
                nodes: [n],
                totalLines: lines
            });
        });

        // Sort edges by weight desc
        const sortedEdges = [...this.graph.edges].sort((a, b) => b.weight - a.weight);

        for (const edge of sortedEdges) {
            const c1Id = clusterMap.get(edge.source);
            const c2Id = clusterMap.get(edge.target);

            if (c1Id && c2Id && c1Id !== c2Id) {
                const c1 = clusters.get(c1Id)!;
                const c2 = clusters.get(c2Id)!;

                // Merge if total lines within limit
                if (c1.totalLines + c2.totalLines <= this.maxLinesPerCluster) {
                    // Merge c2 into c1
                    c1.nodes.push(...c2.nodes);
                    c1.totalLines += c2.totalLines;

                    c2.nodes.forEach(n => clusterMap.set(n.name, c1Id));
                    clusters.delete(c2Id);
                }
            }
        }

        // Filter out block_ clusters that only have 1 small node (these are just orphaned comments/imports)
        // Actually, keep them, but group them if possible
        
        return Array.from(clusters.values());
    }

    private guessClusterName(cluster: HealCluster, index: number): string {
        // Find the node with the most incoming edges within the cluster? 
        // Or just the longest node.
        const sortedNodes = [...cluster.nodes].sort((a, b) => 
            (b.endLine - b.startLine) - (a.endLine - a.startLine)
        );

        if (sortedNodes.length > 0) {
            const mainNode = sortedNodes[0];
            if (!mainNode.name.startsWith('block_')) {
                // If it's a class "UserService", name is "user-service"
                return this.toKebabCase(mainNode.name) + '.ts';
            }
        }

        return `module-${index + 1}.ts`;
    }

    private toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
}
