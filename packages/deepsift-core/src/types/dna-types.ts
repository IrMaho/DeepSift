export type PropertyType =
    | 'color'
    | 'dimension'
    | 'duration'
    | 'font'
    | 'shadow'
    | 'radius'
    | 'opacity'
    | 'breakpoint'
    | 'z-index'
    | 'path'
    | 'unknown';

export type ChunkFamily =
    | 'logic'
    | 'structure'
    | 'dependency'
    | 'data'
    | 'style'
    | 'test'
    | 'config'
    | 'unknown';

export interface DiscoveredToken {
    name: string;
    value: string;
    propertyType: PropertyType;
    filePath: string;
    line: number;
    usageCount: number;
    confidence: number;
}

export interface TokenCluster {
    category: string;
    tokens: DiscoveredToken[];
    sourceFiles: string[];
    isDesignSystem: boolean;
    confidence: number;
}

export interface SimilarityMember {
    filePath: string;
    chunkId: string;
    name: string;
    startLine: number;
    endLine: number;
}

export interface SimilarityGroup {
    groupId: string;
    avgSimilarity: number;
    members: SimilarityMember[];
    recommendation: string;
}

export interface L10nSignals {
    translationFiles: string[];
    translationFunctions: string[];
    translationWrappers: string[];
    localeDirectories: string[];
}

export interface HardcodedString {
    filePath: string;
    line: number;
    content: string;
    context: string;
}

export interface L10nReport {
    hasI18n: boolean;
    signals: L10nSignals;
    hardcodedStrings: HardcodedString[];
    supportedLocales: string[];
    confidence: number;
}

export interface NamingDistribution {
    dominant: string;
    distribution: Record<string, number>;
    deviations: string[];
}

export interface NamingConventions {
    files: NamingDistribution;
    directories: NamingDistribution;
    classes: NamingDistribution;
    functions: NamingDistribution;
    variables: NamingDistribution;
    constants: NamingDistribution;
}

export interface StructureTemplate {
    pattern: string;
    examples: string[];
    commonSubfolders: string[];
    confidence: number;
}

export interface LearnedPattern {
    category: 'StateManagement' | 'Networking' | 'ComponentStructure' | 'Styling' | 'ErrorHandling' | 'Other';
    name: string;
    description: string;
    evidence: {
        filePaths: string[];
        frequency: number;
    };
    snippets: string[];
}

export interface GraphNode {
    filePath: string;
    inDegree: number;
    outDegree: number;
    pageRank: number;
    cluster: string;
}

export interface GraphEdge {
    from: string;
    to: string;
    importStatement: string;
}

export interface FileCluster {
    id: string;
    files: string[];
    role: string;
    importedBy: string[];
    imports: string[];
}

export interface DependencyGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    metrics: {
        modularity: number;
        couplingScore: number;
        layerViolations: string[];
    };
    clusters: FileCluster[];
}

export interface ResourceMap {
    imageFiles: string[];
    fontFiles: string[];
    iconUsagePattern: {
        type: string;
        importSource: string;
        exampleUsages: string[];
    };
    unusedAssets: string[];
}

export interface ContextBlock {
    category: string;
    relevance: number;
    content: string;
    actionable: boolean;
}

export interface CreationContext {
    targetPath: string;
    namingSuggestion: string;
    similarExisting: SimilarityMember[];
    requiredTokens: DiscoveredToken[];
    i18nRequired: boolean;
    templateStructure: string[];
    conventionReminders: string[];
}

export interface TemporalDNA {
    godNodeAges: {
        filePath: string;
        createdAt: string;
        totalCommits: number;
        recentCommits: number;
        contributors: string[];
    }[];
    bottlenecks: string[];
    deadZones: {
        filePath: string;
        lastModified: string;
        daysSinceModified: number;
    }[];
    recentUncommittedAnomalies?: any[];
}

export interface FileCoverage {
    filePath: string;
    lineCoverage: number;
    statementCoverage?: number;
    branchCoverage?: number;
    functionCoverage?: number;
    uncoveredLines: number[];
}

export interface TimeBomb {
    filePath: string;
    inDegree: number;
    pageRank: number;
    coveragePercent: number;
    riskSeverity: 'Critical' | 'High' | 'Medium';
    reason: string;
}

export interface TestDNA {
    hasCoverageData: boolean;
    frameworksDetected: string[];
    globalCoverage: number;
    fileCoverages: FileCoverage[];
    timeBombs: TimeBomb[];
    safeCores: string[];
}

export interface PlanRisk {
    file: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
}

export interface PlanMilestone {
    id: number;
    title: string;
    description: string;
    files: { path: string; action: 'create' | 'modify' | 'delete' }[];
    estimatedComplexity: 'low' | 'medium' | 'high';
    dependencies: number[];
}

export interface SmartPlan {
    id: string;
    createdAt: string;
    request: string;
    requestType: 'ui' | 'feature' | 'refactor' | 'bugfix' | 'api' | 'other';
    executiveSummary: string;
    visualDescription?: string;
    structureMap: string;
    milestones: PlanMilestone[];
    dependencies: string[];
    risks: PlanRisk[];
    skillsUsed: string[];
    dnaConstraints: string[];
    realmInsights: string[];
    drmInsights?: string[];
}

export interface ProjectDNA {
    version: string;
    generatedAt: string;
    fingerprint: string;

    identity: {
        name: string;
        languages: Record<string, number>;
        framework: string;
        packageManager: string;
    };

    designSystem: {
        tokenSources: string[];
        tokens: {
            colors: DiscoveredToken[];
            dimensions: DiscoveredToken[];
            typography: DiscoveredToken[];
            shadows: DiscoveredToken[];
            radii: DiscoveredToken[];
            durations: DiscoveredToken[];
            opacities: DiscoveredToken[];
        };
        themes: string[];
        confidence: number;
    };

    architecture: {
        topology: string;
        clusters: FileCluster[];
        templatePatterns: StructureTemplate[];
        coreFiles: string[];
        graph: {
            nodeCount: number;
            edgeCount: number;
            modularity: number;
            layerViolations: string[];
            godNodes: string[];
            communities: { id: number; label: string; size: number; cohesion: number }[];
        };
    };

    components: {
        totalCount: number;
        similarityGroups: SimilarityGroup[];
        reusableBases: string[];
    };

    localization: L10nReport;

    conventions: {
        naming: NamingConventions;
        structureTemplate: StructureTemplate | null;
        importPatterns: string[];
        learnedPatterns?: LearnedPattern[];
    };

    assets: ResourceMap;

    temporal?: TemporalDNA;
    testing?: TestDNA;

    rules: string[];
}

export function createEmptyNamingDistribution(): NamingDistribution {
    return { dominant: 'unknown', distribution: {}, deviations: [] };
}

export function createEmptyDNA(projectName: string): ProjectDNA {
    return {
        version: '2.0',
        generatedAt: new Date().toISOString(),
        fingerprint: '',
        identity: {
            name: projectName,
            languages: {},
            framework: 'unknown',
            packageManager: 'unknown',
        },
        designSystem: {
            tokenSources: [],
            tokens: {
                colors: [], dimensions: [], typography: [],
                shadows: [], radii: [], durations: [], opacities: [],
            },
            themes: [],
            confidence: 0,
        },
        architecture: {
            topology: 'unknown',
            clusters: [],
            templatePatterns: [],
            coreFiles: [],
            graph: { nodeCount: 0, edgeCount: 0, modularity: 0, layerViolations: [], godNodes: [], communities: [] },
        },
        components: {
            totalCount: 0,
            similarityGroups: [],
            reusableBases: [],
        },
        localization: {
            hasI18n: false,
            signals: {
                translationFiles: [], translationFunctions: [],
                translationWrappers: [], localeDirectories: [],
            },
            hardcodedStrings: [],
            supportedLocales: [],
            confidence: 0,
        },
        conventions: {
            naming: {
                files: createEmptyNamingDistribution(),
                directories: createEmptyNamingDistribution(),
                classes: createEmptyNamingDistribution(),
                functions: createEmptyNamingDistribution(),
                variables: createEmptyNamingDistribution(),
                constants: createEmptyNamingDistribution(),
            },
            structureTemplate: null,
            importPatterns: [],
        },
        assets: {
            imageFiles: [],
            fontFiles: [],
            iconUsagePattern: { type: 'unknown', importSource: '', exampleUsages: [] },
            unusedAssets: [],
        },
        temporal: {
            godNodeAges: [],
            bottlenecks: [],
            deadZones: [],
            recentUncommittedAnomalies: []
        },
        rules: [],
    };
}
