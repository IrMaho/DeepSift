export interface VisionConfig {
    enabled: boolean;
    autoRender: boolean;
    daemonPort: number;
    maxTileResolution: number;
    tokenCompression: 'dec_v2' | 'raw' | 'roi';
    cacheDir: string;
    apiEndpoint?: string;
}

export interface VisionSearchResult {
    docId: string;
    score: number;
    title: string;
    url?: string;
    tilePath?: string;
    bbox?: [number, number, number, number];
    snippet?: string;
}

export interface VisionSearchResponse {
    status: 'success' | 'error';
    results: VisionSearchResult[];
    queryTimeMs: number;
    error?: string;
}

export interface VisionRenderRequest {
    target: string;
    outputDir?: string;
    resolution?: number;
}

export interface VisionRenderResponse {
    status: 'success' | 'error';
    target: string;
    tiles: string[];
    tileCount: number;
    visualHash: string;
    error?: string;
}

export interface VisionStatusResponse {
    status: 'ok' | 'error' | 'stopped';
    daemonRunning: boolean;
    pid: number | null;
    port: number;
    indexedPages: number;
    cacheSizeMb: number;
}
