import { GraphifyNode, GraphifyEdge } from './graph-types.js';
import { ExtractionResult } from './graph-extractor.js';
import path from 'path';

export class GraphBuilder {
    private nodes = new Map<string, GraphifyNode>();
    private edges: GraphifyEdge[] = [];
    private labelToNodeIds = new Map<string, string[]>();

    public addExtraction(result: ExtractionResult) {
        // Add all nodes
        for (const node of result.nodes) {
            if (!this.nodes.has(node.id)) {
                this.nodes.set(node.id, node);
                
                // Track labels for global resolution
                if (!this.labelToNodeIds.has(node.label)) {
                    this.labelToNodeIds.set(node.label, []);
                }
                this.labelToNodeIds.get(node.label)!.push(node.id);
            }
        }

        // Add all edges (will be resolved in build())
        this.edges.push(...result.edges);
    }

    public build(): { nodes: GraphifyNode[], edges: GraphifyEdge[] } {
        const resolvedEdges: GraphifyEdge[] = [];
        
        for (const edge of this.edges) {
            let targetId = edge.target;
            
            // Resolve INFERRED/AMBIGUOUS targets
            if (edge.confidence !== 'EXTRACTED' && !this.nodes.has(targetId)) {
                // Try to resolve by label
                const potentialTargets = this.labelToNodeIds.get(targetId);
                
                if (potentialTargets && potentialTargets.length > 0) {
                    // Simple heuristic: pick the first one for now, or the one in the same file
                    // Graphify Python does more advanced resolution like checking imports
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
                    // Try to resolve import path
                    const sourceNode = this.nodes.get(edge.source);
                    if (sourceNode) {
                        try {
                            const sourceDir = path.dirname(sourceNode.sourceFile);
                            let resolvedImport = path.resolve(sourceDir, targetId);
                            // Very basic extension appending
                            if (!path.extname(resolvedImport)) {
                                resolvedImport += '.ts'; // Fallback
                            }
                            if (this.nodes.has(resolvedImport)) {
                                targetId = resolvedImport;
                            } else {
                                // Phantom edge to external module
                                this.createPhantomNode(targetId, 'concept');
                            }
                        } catch (e) {
                             this.createPhantomNode(targetId, 'concept');
                        }
                    } else {
                         this.createPhantomNode(targetId, 'concept');
                    }
                } else {
                    // Phantom node for unresolved symbol
                    this.createPhantomNode(targetId, 'concept');
                }
            }

            // Only add edge if target exists
            if (this.nodes.has(targetId) && edge.source !== targetId) {
                resolvedEdges.push({
                    source: edge.source,
                    target: targetId,
                    relation: edge.relation,
                    confidence: edge.confidence,
                    context: edge.context
                });
            }
        }

        // Calculate degrees
        const nodesList = Array.from(this.nodes.values());
        
        for (const edge of resolvedEdges) {
            const sourceNode = this.nodes.get(edge.source);
            const targetNode = this.nodes.get(edge.target);
            if (sourceNode) sourceNode.outDegree++;
            if (targetNode) targetNode.inDegree++;
        }

        return { nodes: nodesList, edges: resolvedEdges };
    }

    private createPhantomNode(id: string, type: 'concept') {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                id: id,
                label: id.split('/').pop() || id,
                sourceFile: '',
                sourceLocation: '',
                community: 0,
                fileType: type,
                inDegree: 0,
                outDegree: 0,
                pageRank: 0
            });
        }
    }
}
