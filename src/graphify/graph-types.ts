export interface GraphifyNode {
    id: string;
    label: string;
    sourceFile: string;
    sourceLocation: string; // e.g. "line:10"
    community: number;
    fileType: 'code' | 'document' | 'config' | 'concept';
    inDegree: number;
    outDegree: number;
    pageRank: number;
}

export interface GraphifyEdge {
    source: string;
    target: string;
    relation: 'calls' | 'imports' | 'uses' | 'inherits' | 'contains' | 'field' | 'export';
    confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
    context?: string;
}

export interface GraphifyCommunity {
    id: number;
    label: string;
    members: string[];
    cohesion: number;
}

export interface GraphAnalysis {
    godNodes: { id: string; label: string; degree: number }[];
    surprises: { source: string; target: string; reason: string }[];
    questions: string[];
}

export interface SubgraphResult {
    nodes: GraphifyNode[];
    edges: GraphifyEdge[];
    text: string;
    tokenCount: number;
}

export interface LearningEntry {
    question: string;
    sourceNodes: string[];
    outcome: 'useful' | 'dead_end' | 'corrected';
    timestamp: number;
    correction?: string;
}

export interface GraphifyEnrichment {
    godNodes: string[];
    surprises: string[];
    lessons: string[];
    relatedCommunities: number[];
}
