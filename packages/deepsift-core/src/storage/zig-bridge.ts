/**
 * @file zig-bridge.ts
 * @description Native Zig SIMD math bridge for accelerated vector cosine similarity computation.
 *
 * @module storage/zig-bridge
 * @category Core Search & Discovery
 * @since 1.0.3
 */
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXE_PATH = process.platform === 'win32'
    ? path.resolve(__dirname, '../../bin/deepsift-math.exe')
    : path.resolve(__dirname, '../../bin/deepsift-math');

export class ZigBridge {
    private static instance: ZigBridge;
    private process: ChildProcess | null = null;
    private rl: readline.Interface | null = null;
    private nextId = 1;
    private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

    private constructor() {
        if (!fs.existsSync(EXE_PATH)) {
            throw new Error(`Zig database executable not found at ${EXE_PATH}. Please compile it first.`);
        }
        this.startProcess();
    }

    public static getInstance(): ZigBridge {
        if (!ZigBridge.instance) {
            ZigBridge.instance = new ZigBridge();
        }
        return ZigBridge.instance;
    }

    private startProcess() {
        this.process = spawn(EXE_PATH, [], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.process.stderr?.on('data', (data) => {
            // console.error(`[Zig] ${data.toString()}`);
        });

        this.process.on('close', (code) => {
            this.process = null;
            this.rl = null;
            const err = new Error(`Zig process exited with code ${code}`);
            for (const [id, req] of this.pendingRequests.entries()) {
                req.reject(err);
            }
            this.pendingRequests.clear();
        });

        this.rl = readline.createInterface({
            input: this.process.stdout!,
            terminal: false
        });

        this.rl.on('line', (line) => {
            try {
                const response = JSON.parse(line);
                if (response.id !== undefined) {
                    const req = this.pendingRequests.get(response.id);
                    if (req) {
                        if (response.success === false) {
                            req.reject(new Error(response.message || 'Unknown database error'));
                        } else {
                            if (response.data !== undefined) {
                                req.resolve(response.data);
                            } else {
                                req.resolve(response);
                            }
                        }
                    }
                }
            } catch (err) {
                // Not a JSON response, maybe a log
            }
        });
    }

    public sendRequest(request: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.process || this.process.killed) {
                this.startProcess();
            }

            const id = this.nextId++;
            this.pendingRequests.set(id, { resolve, reject });

            const payload = JSON.stringify({ id, ...request }) + '\n';
            this.process!.stdin!.write(payload, (err) => {
                if (err) {
                    this.pendingRequests.delete(id);
                    reject(err);
                }
            });
        });
    }

    public close() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
