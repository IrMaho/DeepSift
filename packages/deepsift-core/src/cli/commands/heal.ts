/**
 * @file heal.ts
 * @description DNA-based auto-refactoring and lint healing command handler.
 *
 * @module cli/commands/heal
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import path from 'path';
import fs from 'fs';
import { InternalGraphBuilder } from '../../intelligence/internal-graph.js';
import { HealEngine } from '../../intelligence/heal-engine.js';
import { printResult, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

export async function healCommand(filePath: string, format: OutputFormat, compress: boolean = true) {
    let targetPath = filePath;
    if (!path.isAbsolute(filePath)) {
        targetPath = path.resolve(process.cwd(), filePath);
    }

    if (!fs.existsSync(targetPath)) {
        console.error(`File not found: ${targetPath}`);
        return;
    }

    const builder = new InternalGraphBuilder(targetPath);
    const graph = builder.build();

    const engine = new HealEngine(graph);
    const proposal = engine.computeProposal(targetPath);

    let output = `# 🩹 Architecture Healer: ${path.basename(targetPath)}\n\n`;
    output += `Total internal nodes (blocks) extracted: ${graph.nodes.length}\n`;
    output += `Total internal edges (dependencies): ${graph.edges.length}\n\n`;

    output += `## 🧩 Proposed File Split\n\n`;
    
    for (const cluster of proposal.clusters) {
        output += `### 📄 ${cluster.suggestedName} (${cluster.totalLines} lines)\n`;
        output += `Contains ${cluster.nodes.length} blocks:\n`;
        
        // Show up to 10 nodes
        const previewNodes = cluster.nodes.slice(0, 10);
        previewNodes.forEach(n => {
            output += `- \`${n.type}\` **${n.name}** (L${n.startLine}-L${n.endLine})\n`;
        });
        
        if (cluster.nodes.length > 10) {
            output += `- ... (+${cluster.nodes.length - 10} more blocks)\n`;
        }
        output += '\n';
    }

    output += `\n> **To AI Agent:** You can use this proposal to write a TOON patch file and split the code into the suggested modules.\n`;

    let finalOutput = output;
    
    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(output).toUnifiedString();
    }
    
    printResult(finalOutput, format);
}
