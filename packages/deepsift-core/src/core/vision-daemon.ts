import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { VisionConfig, VisionSearchResult, VisionRenderResponse, VisionStatusResponse } from '../types/vision-types.js';

export class VisionDaemonController {
    private static instance: VisionDaemonController | null = null;
    private process: ChildProcess | null = null;
    private port: number;
    private projectPath: string;
    private config: VisionConfig;

    private constructor(projectPath: string, config: VisionConfig) {
        this.projectPath = projectPath;
        this.config = config;
        this.port = config.daemonPort || 8264;
    }

    public static getInstance(projectPath: string, config: VisionConfig): VisionDaemonController {
        if (!VisionDaemonController.instance) {
            VisionDaemonController.instance = new VisionDaemonController(projectPath, config);
        }
        return VisionDaemonController.instance;
    }

    public async isDaemonAlive(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const response = await fetch(`http://127.0.0.1:${this.port}/status`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }

    public async ensureDaemonRunning(): Promise<boolean> {
        if (await this.isDaemonAlive()) {
            return true;
        }

        const visionPkgPath = path.resolve(this.projectPath, 'packages', 'deepsift-vision', 'PixelRAG-main');
        const daemonScript = path.join(visionPkgPath, 'serve', 'daemon.py');

        if (!fs.existsSync(daemonScript)) {
            return false;
        }

        const venvPython = process.platform === 'win32'
            ? path.join(visionPkgPath, 'venv', 'Scripts', 'python.exe')
            : path.join(visionPkgPath, 'venv', 'bin', 'python');

        const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python';

        this.process = spawn(pythonExecutable, [daemonScript, '--port', String(this.port)], {
            cwd: visionPkgPath,
            detached: false,
            stdio: 'ignore'
        });

        for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            if (await this.isDaemonAlive()) {
                return true;
            }
        }

        return false;
    }

    public async search(query: string, topK: number = 5): Promise<VisionSearchResult[]> {
        const isRunning = await this.ensureDaemonRunning();
        if (!isRunning) {
            return [];
        }

        try {
            const response = await fetch(`http://127.0.0.1:${this.port}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queries: [{ text: query }], n_docs: topK })
            });

            if (!response.ok) return [];
            const data: any = await response.json();
            const rawResults = data.results || data.docs || [];

            return rawResults.map((item: any, idx: number) => ({
                docId: item.doc_id || item.id || `doc_${idx}`,
                score: item.score || 0.0,
                title: item.title || item.doc_id || `Visual Match ${idx + 1}`,
                url: item.url,
                tilePath: item.tile_path,
                snippet: item.snippet || item.text
            }));
        } catch {
            return [];
        }
    }

    public async render(target: string, outputDir?: string): Promise<VisionRenderResponse> {
        const isRunning = await this.ensureDaemonRunning();
        if (!isRunning) {
            return {
                status: 'error',
                target,
                tiles: [],
                tileCount: 0,
                visualHash: '',
                error: 'Vision daemon service could not be started.'
            };
        }

        try {
            const response = await fetch(`http://127.0.0.1:${this.port}/render`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, output_dir: outputDir || this.config.cacheDir })
            });

            if (!response.ok) {
                return {
                    status: 'error',
                    target,
                    tiles: [],
                    tileCount: 0,
                    visualHash: '',
                    error: `HTTP error ${response.status}`
                };
            }

            const data: any = await response.json();
            return {
                status: 'success',
                target,
                tiles: data.tiles || [],
                tileCount: (data.tiles || []).length,
                visualHash: data.visual_hash || ''
            };
        } catch (e: any) {
            return {
                status: 'error',
                target,
                tiles: [],
                tileCount: 0,
                visualHash: '',
                error: e.message
            };
        }
    }

    public async status(): Promise<VisionStatusResponse> {
        const isAlive = await this.isDaemonAlive();
        return {
            status: isAlive ? 'ok' : 'stopped',
            daemonRunning: isAlive,
            pid: this.process?.pid || null,
            port: this.port,
            indexedPages: 0,
            cacheSizeMb: 0
        };
    }

    public stopDaemon() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
