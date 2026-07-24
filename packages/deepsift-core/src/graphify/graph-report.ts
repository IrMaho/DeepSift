/**
 * @file graph-report.ts
 * @description Markdown graph report generator for community clusters and god node summaries.
 *
 * @module graphify/graph-report
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { GraphifyNode, GraphifyEdge, GraphifyCommunity } from './graph-types.js';

export class GraphReportGenerator {
    private nodes: GraphifyNode[];
    private edges: GraphifyEdge[];
    private communities: GraphifyCommunity[];

    constructor(nodes: GraphifyNode[], edges: GraphifyEdge[], communities: GraphifyCommunity[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.communities = communities;
    }

    public generateArchitectureReport(outputPath: string) {
        let content = `# Project Architecture Blueprint (Graphify)\n\n`;

        // 1. God Nodes (Highest PageRank / InDegree)
        content += `## Core Dependencies (God Nodes)\n\n`;
        const godNodes = [...this.nodes]
            .filter(n => !n.isPhantom && n.sourceFile && fs.existsSync(n.sourceFile))
            .sort((a, b) => b.inDegree - a.inDegree)
            .slice(0, 10);
        for (const node of godNodes) {
            content += `- **${node.label}** (${node.sourceFile}) - Used by ${node.inDegree} nodes\n`;
        }
        content += `\n`;

        // 2. Communities (Subsystems)
        content += `## Detected Subsystems (Communities)\n\n`;
        for (const comm of this.communities) {
            if (comm.members.length > 3) { // Only show significant communities
                content += `### ${comm.label} (Size: ${comm.members.length}, Cohesion: ${comm.cohesion.toFixed(2)})\n`;
                
                // Show top 5 members by in-degree within community
                const members = comm.members.map(id => this.nodes.find(n => n.id === id)!).filter(Boolean);
                members.sort((a, b) => b.inDegree - a.inDegree);
                
                for (const member of members.slice(0, 5)) {
                    content += `- ${member.label} (${member.sourceFile})\n`;
                }
                if (members.length > 5) {
                    content += `- *... and ${members.length - 5} more*\n`;
                }
                content += `\n`;
            }
        }

        // 3. Central Orchestrators (Highest OutDegree)
        content += `## Central Orchestrators\n\n`;
        const orchestrators = [...this.nodes]
            .filter(n => !n.isPhantom && n.sourceFile && fs.existsSync(n.sourceFile))
            .sort((a, b) => b.outDegree - a.outDegree)
            .slice(0, 10);
        for (const node of orchestrators) {
            content += `- **${node.label}** (${node.sourceFile}) - Depends on ${node.outDegree} nodes\n`;
        }

        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, content);
    }
}
