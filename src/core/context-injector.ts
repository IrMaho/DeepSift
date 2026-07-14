import fs from 'fs';
import path from 'path';
import { ProjectDNA, ContextBlock } from '../types/dna-types.js';
import { loadDNA } from '../intelligence/project-dna.js';

export class ContextInjector {
    private dna: ProjectDNA | null = null;

    constructor(projectPath: string) {
        this.dna = loadDNA(projectPath);
    }

    public inject(queries: string[]): ContextBlock[] {
        if (!this.dna) return [];

        const blocks: ContextBlock[] = [];
        const fullQuery = queries.join(' ').toLowerCase();

        // 1. Rules Context (Always injected but truncated if too long)
        if (this.dna.rules && this.dna.rules.length > 0) {
            blocks.push({
                category: 'Rules',
                relevance: 1.0,
                content: `Project Rules:\n` + this.dna.rules.map(r => `- ${r}`).join('\n'),
                actionable: true,
            });
        }

        // 2. Conventions Context
        if (this.dna.conventions && this.dna.conventions.naming) {
            blocks.push({
                category: 'Conventions',
                relevance: 0.8,
                content: `Naming Conventions:\n` +
                    `- Files: ${this.dna.conventions.naming.files?.dominant || 'unknown'}\n` +
                    `- Classes: ${this.dna.conventions.naming.classes?.dominant || 'unknown'}\n` +
                    `- Functions: ${this.dna.conventions.naming.functions?.dominant || 'unknown'}`,
                actionable: true,
            });
        }

        // 3. Component / Similarity Context (Query Specific)
        if (fullQuery.includes('component') || fullQuery.includes('similar')) {
            if (this.dna.components && this.dna.components.similarityGroups.length > 0) {
                blocks.push({
                    category: 'Similarity',
                    relevance: 0.9,
                    content: `Similar Components Detected (Cosine > 0.90): ${this.dna.components.similarityGroups.length} groups found. Reuse components where possible.`,
                    actionable: true,
                });
            }
        }

        // 4. Design System Context (Query Specific)
        if (fullQuery.includes('design') || fullQuery.includes('theme') || fullQuery.includes('color') || fullQuery.includes('style')) {
            if (this.dna.designSystem && this.dna.designSystem.tokens) {
                const colors = this.dna.designSystem.tokens.colors?.slice(0, 5).map(c => `${c.name}: ${c.value}`) || [];
                const spacing = this.dna.designSystem.tokens.dimensions?.slice(0, 5).map(c => `${c.name}: ${c.value}`) || [];
                blocks.push({
                    category: 'Design System',
                    relevance: 0.9,
                    content: `Design Tokens (Sample):\nColors: ${colors.join(', ')}\nSpacing: ${spacing.join(', ')}`,
                    actionable: true,
                });
            }
        }

        // 5. Architecture Context (Query Specific)
        if (fullQuery.includes('arch') || fullQuery.includes('structure') || fullQuery.includes('topology')) {
            if (this.dna.architecture) {
                blocks.push({
                    category: 'Architecture',
                    relevance: 0.9,
                    content: `Topology: ${this.dna.architecture.topology}\n` +
                        `Core Files: ${this.dna.architecture.coreFiles?.slice(0, 3).join(', ')}`,
                    actionable: false,
                });
            }
        }

        return blocks;
    }

    public formatForOutput(blocks: ContextBlock[]): string {
        if (blocks.length === 0) return '';
        
        let output = `--- DEEPSIFT CONTEXT INJECTION ---\n`;
        for (const block of blocks.sort((a, b) => b.relevance - a.relevance)) {
            output += `[${block.category}] ${block.content}\n`;
        }
        output += `----------------------------------\n\n`;
        
        // Limit total context size to ~2KB max
        if (output.length > 2048) {
            output = output.substring(0, 2045) + '...';
        }
        return output;
    }
}
