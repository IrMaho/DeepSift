/**
 * @file graph-cluster.ts
 * @description Louvain community detection and PageRank scoring for code dependency graphs.
 *
 * @module graphify/graph-cluster
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import { GraphifyNode, GraphifyEdge, GraphifyCommunity } from './graph-types.js';

export class GraphClusterer {
    private nodes: GraphifyNode[];
    private edges: GraphifyEdge[];
    private nodeToCommunity: Map<string, number> = new Map();
    private communities: Map<number, GraphifyCommunity> = new Map();
    
    // For fast neighbor lookup
    private adj: Map<string, { target: string, weight: number }[]> = new Map();
    private totalWeight: number = 0;

    constructor(nodes: GraphifyNode[], edges: GraphifyEdge[]) {
        this.nodes = nodes;
        this.edges = edges;
        
        // Build adjacency list
        for (const node of nodes) {
            this.adj.set(node.id, []);
        }

        for (const edge of edges) {
            const weight = 1.0; // Unweighted for now
            this.totalWeight += weight;
            
            // Undirected graph for community detection
            this.adj.get(edge.source)?.push({ target: edge.target, weight });
            this.adj.get(edge.target)?.push({ target: edge.source, weight });
        }
        
        // Initialize: Each node is its own community
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            this.nodeToCommunity.set(node.id, i);
            this.communities.set(i, {
                id: i,
                label: `Community_${i}`,
                members: [node.id],
                cohesion: 0
            });
        }
    }

    public detectCommunities(maxPasses = 10, resolution = 1.0): GraphifyCommunity[] {
        if (this.totalWeight === 0) return Array.from(this.communities.values());
        
        // Optimize: Precompute node degrees and maintain community degree sums
        const nodeDegrees = new Map<string, number>();
        const commDegreeSum = new Map<number, number>();
        
        for (const node of this.nodes) {
            let deg = 0;
            const neighbors = this.adj.get(node.id) || [];
            for (const n of neighbors) {
                deg += n.weight;
            }
            nodeDegrees.set(node.id, deg);
            const comm = this.nodeToCommunity.get(node.id)!;
            commDegreeSum.set(comm, (commDegreeSum.get(comm) || 0) + deg);
        }

        let pass = 0;
        let improved = true;

        while (pass < maxPasses && improved) {
            improved = false;
            
            for (const node of this.nodes) {
                const nodeId = node.id;
                const currentCommunity = this.nodeToCommunity.get(nodeId)!;
                const neighbors = this.adj.get(nodeId) || [];
                
                // Find neighboring communities
                const neighborCommunities = new Map<number, number>();
                let k_i_in = 0; // sum of weights of edges from i to nodes in current community

                for (const neighbor of neighbors) {
                    const neighborComm = this.nodeToCommunity.get(neighbor.target)!;
                    
                    if (neighborComm === currentCommunity) {
                        k_i_in += neighbor.weight;
                    }
                    
                    neighborCommunities.set(
                        neighborComm, 
                        (neighborCommunities.get(neighborComm) || 0) + neighbor.weight
                    );
                }

                // Try to move node to a neighbor community
                let bestCommunity = currentCommunity;
                let maxDeltaQ = 0;
                
                const k_i = nodeDegrees.get(nodeId) || 0;
                const sum_tot_curr = commDegreeSum.get(currentCommunity) || 0;

                for (const [neighborComm, k_i_in_new] of neighborCommunities.entries()) {
                    if (neighborComm === currentCommunity) continue;
                    
                    const sum_tot_new = commDegreeSum.get(neighborComm) || 0;
                    
                    // Delta Q calculation
                    const deltaQ = (k_i_in_new - k_i_in) - resolution * (k_i * (sum_tot_new - sum_tot_curr + k_i)) / (2 * this.totalWeight);

                    if (deltaQ > maxDeltaQ) {
                        maxDeltaQ = deltaQ;
                        bestCommunity = neighborComm;
                    }
                }

                if (bestCommunity !== currentCommunity && maxDeltaQ > 0) {
                    // Move node
                    this.nodeToCommunity.set(nodeId, bestCommunity);
                    
                    // Update degree sums
                    commDegreeSum.set(currentCommunity, sum_tot_curr - k_i);
                    commDegreeSum.set(bestCommunity, (commDegreeSum.get(bestCommunity) || 0) + k_i);
                    
                    improved = true;
                }
            }
            pass++;
        }

        // Reconstruct communities from nodeToCommunity mapping
        const finalComms = new Map<number, string[]>();
        for (const [nodeId, commId] of this.nodeToCommunity.entries()) {
            if (!finalComms.has(commId)) {
                finalComms.set(commId, []);
            }
            finalComms.get(commId)!.push(nodeId);
        }

        const activeCommunities: GraphifyCommunity[] = [];
        let newCommIdx = 0;
        
        // Fast map for node object lookup
        const nodeMap = new Map<string, GraphifyNode>();
        for (const n of this.nodes) {
            nodeMap.set(n.id, n);
        }
        
        for (const [oldCommId, members] of finalComms.entries()) {
            if (members.length === 0) continue;
            
            const comm: GraphifyCommunity = {
                id: newCommIdx,
                label: `Community ${newCommIdx}`,
                members: members,
                cohesion: 0
            };
            
            let internalEdges = 0;
            let totalEdges = 0;
            
            for (const member of members) {
                const node = nodeMap.get(member);
                if (node) {
                    node.community = newCommIdx;
                }
                
                for (const edge of this.adj.get(member) || []) {
                    totalEdges += edge.weight;
                    if (this.nodeToCommunity.get(edge.target) === oldCommId) {
                        internalEdges += edge.weight;
                    }
                }
            }
            
            comm.cohesion = totalEdges > 0 ? (internalEdges) / totalEdges : 0;
            activeCommunities.push(comm);
            newCommIdx++;
        }

        return activeCommunities;
    }
}
