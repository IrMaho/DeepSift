import fs from 'fs';
import path from 'path';
import { DependencyGraphData, GraphNode, GraphEdge, FileCluster } from '../types/dna-types.js';

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next', '.nuxt',
]);

const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs',
    '.java', '.kt', '.swift', '.php', '.rb', '.vue', '.svelte',
]);

const IMPORT_PATTERNS = [
    // ES6 / TS / Dart / Python
    /^(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/m,
    // CJS / Node
    /(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/m,
    // Python
    /^from\s+([\w.]+)\s+import/m,
    /^import\s+([\w.]+)/m,
    // Go / Rust / Java
    /^(?:use|import)\s+([^;\s]+)/m,
    // PHP / Ruby
    /^(?:include|require|require_once|include_once)\s+['"]([^'"]+)['"]/m,
];

export interface GraphResult {
    topology: string;
    clusters: FileCluster[];
    coreFiles: string[];
    graph: {
        nodeCount: number;
        edgeCount: number;
        modularity: number;
        layerViolations: string[];
        godNodes: string[];
        communities: { id: number; label: string; size: number; cohesion: number }[];
    };
}

export function analyzeArchitecture(
    projectPath: string,
    onProgress?: (current: number, total: number) => void
): GraphResult {
    const files = findSourceFiles(projectPath);
    const edges = extractEdges(files, projectPath, onProgress);
    const nodes = buildNodes(files, edges);

    computePageRank(nodes, edges);
    const clusters = detectCommunities(nodes, edges);
    const modularity = calculateModularity(nodes, edges, clusters);
    const topology = classifyTopology(nodes, edges, clusters);
    const layerViolations = detectLayerViolations(edges);

    const sortedNodes = Array.from(nodes.values()).sort((a, b) => b.pageRank - a.pageRank);
    const coreFiles = sortedNodes.slice(0, 10).map(n => n.filePath);

    return {
        topology,
        clusters: formatClusters(clusters, nodes, edges),
        coreFiles,
        graph: {
            nodeCount: nodes.size,
            edgeCount: edges.length,
            modularity,
            layerViolations,
            godNodes: coreFiles.slice(0, 5),
            communities: []
        },
    };
}

function findSourceFiles(projectPath: string): string[] {
    const files: string[] = [];
    function walk(dir: string, depth: number) {
        if (depth > 8) return;
        let items: fs.Dirent[];
        try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

        for (const item of items) {
            if (item.name.startsWith('.') || IGNORED_DIRS.has(item.name)) continue;
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
                walk(full, depth + 1);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                if (SOURCE_EXTENSIONS.has(ext)) files.push(full);
            }
        }
    }
    walk(projectPath, 0);
    return files;
}

function extractEdges(
    files: string[],
    projectPath: string,
    onProgress?: (current: number, total: number) => void
): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Quick path normalization for matching
    const fileBasePaths = new Map<string, string>(); // base name -> full relative path
    for (const f of files) {
        const rel = path.relative(projectPath, f).replace(/\\/g, '/');
        const base = path.basename(rel, path.extname(rel));
        fileBasePaths.set(base, rel);
        fileBasePaths.set(rel, rel);
        
        // For dart package: imports
        const parts = rel.split('/');
        if (parts.length > 1) {
            fileBasePaths.set(parts.slice(1).join('/'), rel);
        }
    }

    for (let i = 0; i < files.length; i++) {
        if (onProgress && i % 50 === 0) onProgress(i, files.length);
        const file = files[i];
        const relFrom = path.relative(projectPath, file).replace(/\\/g, '/');

        try {
            const stats = fs.statSync(file);
            if (stats.size > 500_000) continue;
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

                for (const pattern of IMPORT_PATTERNS) {
                    const match = trimmed.match(pattern);
                    if (match && match[1]) {
                        const rawTarget = match[1];
                        const targetBase = path.basename(rawTarget, path.extname(rawTarget));
                        
                        let targetRel = fileBasePaths.get(rawTarget) || fileBasePaths.get(targetBase);
                        
                        // Try resolving relative path
                        if (!targetRel && (rawTarget.startsWith('./') || rawTarget.startsWith('../'))) {
                             const resolved = path.resolve(path.dirname(file), rawTarget);
                             const resolvedRel = path.relative(projectPath, resolved).replace(/\\/g, '/');
                             for (const [k, v] of fileBasePaths.entries()) {
                                 if (v.startsWith(resolvedRel)) {
                                     targetRel = v;
                                     break;
                                 }
                             }
                        }

                        if (targetRel && targetRel !== relFrom) {
                            edges.push({
                                from: relFrom,
                                to: targetRel,
                                importStatement: trimmed.substring(0, 100),
                            });
                        }
                        break;
                    }
                }
            }
        } catch { /* skip */ }
    }

    return edges;
}

function buildNodes(files: string[], edges: GraphEdge[]): Map<string, GraphNode> {
    const nodes = new Map<string, GraphNode>();

    for (const f of files) {
        // Only include files that have edges to save space, or all files?
        // Let's include files involved in the graph.
    }

    for (const edge of edges) {
        if (!nodes.has(edge.from)) {
            nodes.set(edge.from, { filePath: edge.from, inDegree: 0, outDegree: 0, pageRank: 1, cluster: '0' });
        }
        if (!nodes.has(edge.to)) {
            nodes.set(edge.to, { filePath: edge.to, inDegree: 0, outDegree: 0, pageRank: 1, cluster: '0' });
        }
        nodes.get(edge.from)!.outDegree++;
        nodes.get(edge.to)!.inDegree++;
    }

    return nodes;
}

function computePageRank(nodes: Map<string, GraphNode>, edges: GraphEdge[], iterations = 10): void {
    const d = 0.85;
    const N = nodes.size;
    if (N === 0) return;

    for (let iter = 0; iter < iterations; iter++) {
        const newRanks = new Map<string, number>();
        for (const [id] of nodes) {
            newRanks.set(id, (1 - d) / N);
        }

        for (const edge of edges) {
            const outDegree = nodes.get(edge.from)?.outDegree || 1;
            const currentRank = nodes.get(edge.from)?.pageRank || 0;
            const targetRank = newRanks.get(edge.to) || 0;
            newRanks.set(edge.to, targetRank + d * (currentRank / outDegree));
        }

        for (const [id, rank] of newRanks) {
            nodes.get(id)!.pageRank = rank;
        }
    }
}

function detectCommunities(nodes: Map<string, GraphNode>, edges: GraphEdge[]): Map<string, string[]> {
    // A simplified directory-based modularity heuristic since true Louvain is heavy.
    // Group by top-level directory or feature module.
    const clusters = new Map<string, string[]>();

    for (const [id, node] of nodes) {
        const parts = id.split('/');
        // e.g. src/features/auth/file.ts -> cluster: src/features/auth
        // e.g. lib/ui/components/file.dart -> cluster: lib/ui
        let clusterName = 'root';
        if (parts.length > 2) {
            clusterName = parts.slice(0, Math.min(parts.length - 1, 3)).join('/');
        } else if (parts.length === 2) {
            clusterName = parts[0];
        }

        node.cluster = clusterName;
        if (!clusters.has(clusterName)) clusters.set(clusterName, []);
        clusters.get(clusterName)!.push(id);
    }

    return clusters;
}

function calculateModularity(nodes: Map<string, GraphNode>, edges: GraphEdge[], clusters: Map<string, string[]>): number {
    if (edges.length === 0) return 0;
    let intraClusterEdges = 0;
    
    for (const edge of edges) {
        const nodeA = nodes.get(edge.from);
        const nodeB = nodes.get(edge.to);
        if (nodeA && nodeB && nodeA.cluster === nodeB.cluster) {
            intraClusterEdges++;
        }
    }

    return intraClusterEdges / edges.length;
}

function classifyTopology(nodes: Map<string, GraphNode>, edges: GraphEdge[], clusters: Map<string, string[]>): string {
    if (nodes.size < 10) return 'Trivial';
    const modularity = calculateModularity(nodes, edges, clusters);
    
    // Check if there is a massive core node (God object)
    const sortedByInDegree = Array.from(nodes.values()).sort((a, b) => b.inDegree - a.inDegree);
    const maxInDegree = sortedByInDegree[0]?.inDegree || 0;
    const isGodObjectPresent = maxInDegree > nodes.size * 0.4;

    if (modularity > 0.7) return 'Highly Modular / Component-Based';
    if (modularity > 0.4) return 'Layered / Feature-Based Architecture';
    if (isGodObjectPresent) return 'Monolith with God Object';
    return 'Spaghetti / Tightly Coupled Monolith';
}

function detectLayerViolations(edges: GraphEdge[]): string[] {
    const violations: string[] = [];
    const layerRegexes = [
        { name: 'domain', regex: /\bdomain\b/ },
        { name: 'data', regex: /\b(?:data|repositories|infrastructure)\b/ },
        { name: 'presentation', regex: /\b(?:ui|presentation|views|components)\b/ },
    ];

    for (const edge of edges) {
        const fromData = edge.from.match(layerRegexes[1].regex);
        const toPresentation = edge.to.match(layerRegexes[2].regex);
        if (fromData && toPresentation) {
            violations.push(`Data layer imports Presentation: ${edge.from} -> ${edge.to}`);
        }

        const fromDomain = edge.from.match(layerRegexes[0].regex);
        const toData = edge.to.match(layerRegexes[1].regex);
        if (fromDomain && toData) {
            violations.push(`Domain layer imports Data: ${edge.from} -> ${edge.to}`);
        }
    }

    return violations.slice(0, 10);
}

function formatClusters(clusters: Map<string, string[]>, nodes: Map<string, GraphNode>, edges: GraphEdge[]): FileCluster[] {
    const result: FileCluster[] = [];

    for (const [id, files] of clusters) {
        if (files.length < 3) continue;

        const importedBy = new Set<string>();
        const imports = new Set<string>();

        for (const f of files) {
            const node = nodes.get(f);
            if (!node) continue;
            // Scan edges for external connections
            for (const edge of edges) {
                if (edge.to === f && nodes.get(edge.from)?.cluster !== id) importedBy.add(nodes.get(edge.from)!.cluster);
                if (edge.from === f && nodes.get(edge.to)?.cluster !== id) imports.add(nodes.get(edge.to)!.cluster);
            }
        }

        result.push({
            id,
            files: files.slice(0, 10), // Limit payload size
            role: 'module',
            importedBy: Array.from(importedBy),
            imports: Array.from(imports),
        });
    }

    return result.sort((a, b) => b.importedBy.length - a.importedBy.length).slice(0, 20);
}
