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
                let k_i = 0; // degree of node i
                let k_i_in = 0; // sum of weights of edges from i to nodes in current community

                for (const neighbor of neighbors) {
                    k_i += neighbor.weight;
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
                
                // Sum of weights of edges incident to nodes in current community
                const sum_tot_curr = this.getCommunityDegreeSum(currentCommunity);

                for (const [neighborComm, k_i_in_new] of neighborCommunities.entries()) {
                    if (neighborComm === currentCommunity) continue;
                    
                    const sum_tot_new = this.getCommunityDegreeSum(neighborComm);
                    
                    // Delta Q calculation for moving node i from currentCommunity to neighborComm
                    const deltaQ = (k_i_in_new - k_i_in) - resolution * (k_i * (sum_tot_new - sum_tot_curr + k_i)) / (2 * this.totalWeight);

                    if (deltaQ > maxDeltaQ) {
                        maxDeltaQ = deltaQ;
                        bestCommunity = neighborComm;
                    }
                }

                if (bestCommunity !== currentCommunity && maxDeltaQ > 0) {
                    // Move node
                    this.nodeToCommunity.set(nodeId, bestCommunity);
                    
                    const oldComm = this.communities.get(currentCommunity)!;
                    const newComm = this.communities.get(bestCommunity)!;
                    
                    oldComm.members = oldComm.members.filter(m => m !== nodeId);
                    newComm.members.push(nodeId);
                    
                    improved = true;
                }
            }
            pass++;
        }

        // Filter empty communities and assign back to nodes
        const activeCommunities = Array.from(this.communities.values()).filter(c => c.members.length > 0);
        
        // Re-index communities
        activeCommunities.forEach((comm, idx) => {
            comm.id = idx;
            // Generate a label based on the most central node or just a number
            // For now just use a generic label
            comm.label = `Community ${idx}`;
            
            // Calculate cohesion (internal edges / total edges incident to community)
            let internalEdges = 0;
            let totalEdges = 0;
            
            for (const member of comm.members) {
                const node = this.nodes.find(n => n.id === member);
                if (node) {
                    node.community = idx;
                }
                
                for (const edge of this.adj.get(member) || []) {
                    totalEdges += edge.weight;
                    if (this.nodeToCommunity.get(edge.target) === comm.id) {
                        internalEdges += edge.weight;
                    }
                }
            }
            
            // Note: internalEdges is double counted since graph is undirected here
            comm.cohesion = totalEdges > 0 ? (internalEdges) / totalEdges : 0;
        });

        return activeCommunities;
    }
    
    private getCommunityDegreeSum(communityId: number): number {
        const comm = this.communities.get(communityId);
        if (!comm) return 0;
        
        let sum = 0;
        for (const memberId of comm.members) {
            const neighbors = this.adj.get(memberId) || [];
            for (const n of neighbors) {
                sum += n.weight;
            }
        }
        return sum;
    }
}
