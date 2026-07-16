import fs from 'fs';
import path from 'path';
import { GraphifyNode, GraphifyEdge } from './graph-types.js';

export interface ExtractionResult {
    nodes: GraphifyNode[];
    edges: GraphifyEdge[];
    sourceFile: string;
}

export class GraphExtractor {
    public extractFromFile(filePath: string): ExtractionResult {
        const ext = path.extname(filePath).toLowerCase();
        let fileType: 'code' | 'document' | 'config' | 'concept' = 'document';
        
        if (['.ts', '.js', '.dart', '.py', '.java', '.cpp', '.c', '.go', '.rs'].includes(ext)) {
            fileType = 'code';
        } else if (['.json', '.yaml', '.yml', '.toml', '.xml', '.ini'].includes(ext)) {
            fileType = 'config';
        } else if (['.md', '.txt', '.csv'].includes(ext)) {
            fileType = 'document';
        }

        const content = fs.readFileSync(filePath, 'utf8');
        
        if (fileType === 'code') {
            return this.extractCodeGraph(filePath, content);
        } else {
            return this.extractBasicNode(filePath, fileType);
        }
    }

    private extractBasicNode(filePath: string, fileType: 'code' | 'document' | 'config' | 'concept'): ExtractionResult {
        const basename = path.basename(filePath);
        const fileNode: GraphifyNode = {
            id: filePath,
            label: basename,
            sourceFile: filePath,
            sourceLocation: 'line:1',
            community: 0,
            fileType,
            inDegree: 0,
            outDegree: 0,
            pageRank: 0
        };
        return { nodes: [fileNode], edges: [], sourceFile: filePath };
    }

    private extractCodeGraph(filePath: string, content: string): ExtractionResult {
        const lines = content.split('\n');
        const nodes: GraphifyNode[] = [];
        const edges: GraphifyEdge[] = [];
        
        const basename = path.basename(filePath);
        const fileNodeId = filePath;

        // Base file node
        nodes.push({
            id: fileNodeId,
            label: basename,
            sourceFile: filePath,
            sourceLocation: 'line:1',
            community: 0,
            fileType: 'code',
            inDegree: 0,
            outDegree: 0,
            pageRank: 0
        });

        const importRegex = /^(?:import|from)\s+.*['"]([^'"]+)['"]/i;
        const classRegex = /^(?:export\s+)?(?:default\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w\s,]+))?/i;
        const funcRegex = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/i;
        const constFuncRegex = /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]+)\s*=>/i;
        const dartClassRegex = /^(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w\s,]+))?/i;
        const pythonDefRegex = /^def\s+(\w+)\s*\(/;
        const pythonClassRegex = /^class\s+(\w+)(?:\(([^)]+)\))?:/;

        let currentClass: string | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Imports
            const importMatch = line.match(importRegex);
            if (importMatch) {
                const target = importMatch[1];
                edges.push({
                    source: fileNodeId,
                    target: target, // Will be resolved to actual file path during graph build phase
                    relation: 'imports',
                    confidence: 'EXTRACTED'
                });
                continue;
            }

            // Classes (TS/JS/Dart)
            const classMatch = line.match(classRegex) || line.match(dartClassRegex);
            if (classMatch) {
                const className = classMatch[1];
                const parentClass = classMatch[2];
                const nodeId = `${filePath}::${className}`;
                currentClass = nodeId;

                nodes.push({
                    id: nodeId,
                    label: className,
                    sourceFile: filePath,
                    sourceLocation: `line:${i + 1}`,
                    community: 0,
                    fileType: 'code',
                    inDegree: 0,
                    outDegree: 0,
                    pageRank: 0
                });

                edges.push({
                    source: fileNodeId,
                    target: nodeId,
                    relation: 'contains',
                    confidence: 'EXTRACTED'
                });

                if (parentClass) {
                    edges.push({
                        source: nodeId,
                        target: `${filePath}::${parentClass}`, // Assumes parent is in same file, otherwise graph-builder will resolve
                        relation: 'inherits',
                        confidence: 'INFERRED'
                    });
                }
                continue;
            }

            // Python Classes
            const pyClassMatch = line.match(pythonClassRegex);
            if (pyClassMatch) {
                const className = pyClassMatch[1];
                const parentClass = pyClassMatch[2];
                const nodeId = `${filePath}::${className}`;
                currentClass = nodeId;

                nodes.push({
                    id: nodeId,
                    label: className,
                    sourceFile: filePath,
                    sourceLocation: `line:${i + 1}`,
                    community: 0,
                    fileType: 'code',
                    inDegree: 0,
                    outDegree: 0,
                    pageRank: 0
                });

                edges.push({
                    source: fileNodeId,
                    target: nodeId,
                    relation: 'contains',
                    confidence: 'EXTRACTED'
                });

                if (parentClass && parentClass !== 'object') {
                     edges.push({
                        source: nodeId,
                        target: parentClass, // Needs global resolution
                        relation: 'inherits',
                        confidence: 'INFERRED'
                    });
                }
                continue;
            }

            // Functions / Methods
            const funcMatch = line.match(funcRegex) || line.match(constFuncRegex) || line.match(pythonDefRegex);
            if (funcMatch) {
                const funcName = funcMatch[1];
                const nodeId = currentClass ? `${currentClass}::${funcName}` : `${filePath}::${funcName}`;
                
                nodes.push({
                    id: nodeId,
                    label: funcName,
                    sourceFile: filePath,
                    sourceLocation: `line:${i + 1}`,
                    community: 0,
                    fileType: 'code',
                    inDegree: 0,
                    outDegree: 0,
                    pageRank: 0
                });

                edges.push({
                    source: currentClass ? currentClass : fileNodeId,
                    target: nodeId,
                    relation: 'contains',
                    confidence: 'EXTRACTED'
                });
                continue;
            }

            // Calls (Simple Regex Heuristic)
            // Look for words followed by '(' but not common keywords
            const callRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
            let callMatch;
            while ((callMatch = callRegex.exec(line)) !== null) {
                const callName = callMatch[1];
                const ignoreKeywords = ['if', 'while', 'for', 'switch', 'catch', 'function', 'super'];
                if (!ignoreKeywords.includes(callName)) {
                     edges.push({
                        source: currentClass || fileNodeId,
                        target: callName, // Target needs global resolution in graph-builder
                        relation: 'calls',
                        confidence: 'INFERRED'
                    });
                }
            }
        }

        return { nodes, edges, sourceFile: filePath };
    }
}
