/**
 * @file graph-builder.ts
 * @description Graphify Topology & Graph Construction Engine.
 * Resolves symbol labels, cross-file imports, and node edges to construct code dependency graphs.
 * 
 * @module graphify/graph-builder
 * @category Architecture & Intelligence
 * @since 1.0.3
 */

import { GraphifyNode, GraphifyEdge } from './graph-types.js';
import { ExtractionResult } from './graph-extractor.js';
import path from 'path';

/**
 * Builder class that accumulates extracted graph elements and resolves edge references into a clean network graph.
 */
export class GraphBuilder {
    private nodes = new Map<string, GraphifyNode>();
    private edges: GraphifyEdge[] = [];
    private labelToNodeIds = new Map<string, string[]>();

    /**
     * Adds AST nodes and edges extracted from a single source file.
     * 
     * @param result ExtractionResult from GraphExtractor.
     */
    public addExtraction(result: ExtractionResult): void {
        for (const node of result.nodes) {
            if (!this.nodes.has(node.id)) {
                this.nodes.set(node.id, node);
                
                if (!this.labelToNodeIds.has(node.label)) {
                    this.labelToNodeIds.set(node.label, []);
                }
                this.labelToNodeIds.get(node.label)!.push(node.id);
            }
        }

        this.edges.push(...result.edges);
    }

    /**
     * Resolves ambiguous symbol targets and builds the final Graphify node and edge lists.
     * 
     * @returns Object containing nodes and resolved edges arrays.
     * @example
     * ```ts
     * const builder = new GraphBuilder();
     * builder.addExtraction(result);
     * const { nodes, edges } = builder.build();
     * ```
     */
    public build(): { nodes: GraphifyNode[], edges: GraphifyEdge[] } {
        const resolvedEdges: GraphifyEdge[] = [];
        
        for (const edge of this.edges) {
            let targetId = edge.target;
            
            if (edge.confidence !== 'EXTRACTED' && !this.nodes.has(targetId)) {
                const potentialTargets = this.labelToNodeIds.get(targetId);
                
                if (potentialTargets && potentialTargets.length > 0) {
                    const sourceNode = this.nodes.get(edge.source);
                    let bestTarget = potentialTargets[0];
                    
                    if (sourceNode) {
                         const sameFileTarget = potentialTargets.find(t => this.nodes.get(t)?.sourceFile === sourceNode.sourceFile);
                         if (sameFileTarget) {
                             bestTarget = sameFileTarget;
                         }
                    }
                    targetId = bestTarget;
                } else if (edge.relation === 'imports') {
                    const sourceNode = this.nodes.get(edge.source);
                    if (sourceNode) {
                        try {
                            const sourceDir = path.dirname(sourceNode.sourceFile);
                            let resolvedImport = path.resolve(sourceDir, targetId);
                            if (!path.extname(resolvedImport)) {
                                resolvedImport += '.ts';
                            }
                            if (this.nodes.has(resolvedImport)) {
                                targetId = resolvedImport;
                            }
                        } catch {
                            // Safe ignore
                        }
                    }
                }
            }

            if (this.nodes.has(edge.source) && this.nodes.has(targetId)) {
                resolvedEdges.push({
                    ...edge,
                    target: targetId
                });
            }
        }

        const nodesList = Array.from(this.nodes.values());
        
        for (const node of nodesList) {
            node.inDegree = 0;
            node.outDegree = 0;
        }

        for (const edge of resolvedEdges) {
            const sourceNode = this.nodes.get(edge.source);
            const targetNode = this.nodes.get(edge.target);

            if (sourceNode) sourceNode.outDegree++;
            if (targetNode) targetNode.inDegree++;
        }

        return { nodes: nodesList, edges: resolvedEdges };
    }
}
