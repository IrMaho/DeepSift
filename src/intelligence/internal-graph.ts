import fs from 'fs';
import path from 'path';

export interface InternalNode {
    id: string;
    name: string;
    type: 'class' | 'function' | 'variable' | 'unknown';
    startLine: number;
    endLine: number;
    content: string;
}

export interface InternalEdge {
    source: string;
    target: string;
    weight: number;
}

export interface InternalGraph {
    nodes: InternalNode[];
    edges: InternalEdge[];
}

export class InternalGraphBuilder {
    private filePath: string;
    private content: string;
    private lines: string[];

    constructor(filePath: string) {
        this.filePath = filePath;
        this.content = fs.readFileSync(filePath, 'utf8');
        this.lines = this.content.split('\n');
    }

    public build(): InternalGraph {
        const nodes = this.extractNodes();
        const edges = this.buildEdges(nodes);
        return { nodes, edges };
    }

    private extractNodes(): InternalNode[] {
        const nodes: InternalNode[] = [];
        let inBlock = false;
        let braceCount = 0;
        let currentBlockLines: string[] = [];
        let currentBlockStart = 0;
        let currentBlockName = '';
        let currentBlockType: InternalNode['type'] = 'unknown';

        const nameRegex = /(?:class|interface|struct|def|function|const|let|var|func|export\s+const|export\s+function|export\s+class)\s+([a-zA-Z0-9_]+)/;

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const trimmed = line.trim();

            if (!inBlock) {
                if (trimmed.length === 0 || trimmed.startsWith('import ') || trimmed.startsWith('//') || trimmed.startsWith('export *')) continue;
                
                // Start of a block
                const match = line.match(nameRegex);
                if (match || line.includes('{') || trimmed.endsWith(':')) {
                    inBlock = true;
                    currentBlockStart = i;
                    currentBlockLines = [line];
                    currentBlockName = match ? match[1] : `block_${i}`;
                    currentBlockType = this.guessType(line);
                    
                    if (line.includes('{')) braceCount += (line.match(/\{/g) || []).length;
                    if (line.includes('}')) braceCount -= (line.match(/\}/g) || []).length;
                    
                    if (braceCount <= 0 && line.includes('}') && line.includes('{')) {
                        // Single line block (e.g. const x = () => {};)
                        nodes.push({
                            id: currentBlockName,
                            name: currentBlockName,
                            type: currentBlockType,
                            startLine: currentBlockStart + 1,
                            endLine: i + 1,
                            content: currentBlockLines.join('\n')
                        });
                        inBlock = false;
                        braceCount = 0;
                    }
                }
            } else {
                currentBlockLines.push(line);
                
                if (line.includes('{')) braceCount += (line.match(/\{/g) || []).length;
                if (line.includes('}')) braceCount -= (line.match(/\}/g) || []).length;

                if (braceCount <= 0 && line.includes('}')) {
                    nodes.push({
                        id: currentBlockName,
                        name: currentBlockName,
                        type: currentBlockType,
                        startLine: currentBlockStart + 1,
                        endLine: i + 1,
                        content: currentBlockLines.join('\n')
                    });
                    inBlock = false;
                    braceCount = 0;
                }
            }
        }

        if (inBlock) {
            nodes.push({
                id: currentBlockName,
                name: currentBlockName,
                type: currentBlockType,
                startLine: currentBlockStart + 1,
                endLine: this.lines.length,
                content: currentBlockLines.join('\n')
            });
        }

        return nodes;
    }

    private guessType(line: string): InternalNode['type'] {
        if (line.includes('class ') || line.includes('interface ') || line.includes('struct ')) return 'class';
        if (line.includes('function ') || line.includes('def ') || line.includes('func ')) return 'function';
        if (line.includes('const ') || line.includes('let ') || line.includes('var ')) return 'variable';
        if (line.includes('=>') || line.includes('(')) return 'function';
        return 'unknown';
    }

    private buildEdges(nodes: InternalNode[]): InternalEdge[] {
        const edges: InternalEdge[] = [];
        const nodeNames = new Set(nodes.map(n => n.name).filter(n => !n.startsWith('block_')));

        for (const source of nodes) {
            for (const targetName of nodeNames) {
                if (source.name === targetName) continue;

                const regex = new RegExp(`\\b${targetName}\\b`, 'g');
                const matches = source.content.match(regex);
                
                if (matches && matches.length > 0) {
                    edges.push({
                        source: source.name,
                        target: targetName,
                        weight: matches.length
                    });
                }
            }
        }

        return edges;
    }
}
