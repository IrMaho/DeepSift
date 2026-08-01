import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';

export class ZigDaemonBridge {
    private daemonProcess: ChildProcess | null = null;
    private socket: net.Socket | null = null;
    private isConnected = false;

    public async startDaemon(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const ext = process.platform === 'win32' ? '.exe' : '';
            // Determine bin path relative to this source file
            const __filename = new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
            const __dirname = path.dirname(__filename);
            const binPath = path.resolve(__dirname, '../../bin', `deepsift-math${ext}`);

            console.log("🚀 [HPC Bridge] Spawning Zig Daemon Process:", binPath);
            
            // Spawn the native engine daemon
            this.daemonProcess = spawn(binPath, ['--daemon'], {
                stdio: ['pipe', 'pipe', 'inherit']
            });

            this.daemonProcess.on('error', (err) => {
                console.error("❌ [HPC Bridge] Failed to spawn Zig Daemon.", err);
                reject(err);
            });

            // Read stdout to wait for the "Server ready" signal
            const onDataReady = (data: Buffer) => {
                const output = data.toString();
                if (output.includes('DeepSift IPC Server listening')) {
                    console.log("✅ [HPC Bridge] Zig Daemon is online and listening.");
                    if (this.daemonProcess?.stdout) {
                        this.daemonProcess.stdout.off('data', onDataReady);
                    }
                    this.connectToDaemon().then(resolve).catch(reject);
                }
            };
            this.daemonProcess.stdout?.on('data', onDataReady);
        });
    }

    private async connectToDaemon(): Promise<boolean> {
        return new Promise((resolve) => {
            // We use STDIN/STDOUT instead of a socket
            this.isConnected = true;
            resolve(true);
        });
    }

    public async getChunkHash(text: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.daemonProcess || !this.isConnected) {
                return reject(new Error("Daemon is not connected"));
            }

            const payload = Buffer.from(text, 'utf-8');
            const header = Buffer.alloc(5);
            header.writeUInt8(0x01, 0); // CMD 0x01 (Hash)
            header.writeUInt32LE(payload.length, 1);

            // Wait for 64 bytes response (the hash hex string)
            let resultBuffer = Buffer.alloc(0);
            const onData = (data: Buffer) => {
                resultBuffer = Buffer.concat([resultBuffer, data]);
                if (resultBuffer.length >= 64) {
                    if (this.daemonProcess?.stdout) {
                        this.daemonProcess.stdout.off('data', onData);
                    }
                    resolve(resultBuffer.subarray(0, 64).toString('ascii'));
                }
            };
            
            if (this.daemonProcess.stdout && this.daemonProcess.stdin) {
                this.daemonProcess.stdout.on('data', onData);
                this.daemonProcess.stdin.write(header);
                this.daemonProcess.stdin.write(payload);
            } else {
                reject(new Error("Daemon stdio pipes not available"));
            }
        });
    }

    public async getEmbeddingsNative(text: string): Promise<Float32Array> {
        return new Promise((resolve, reject) => {
            if (!this.daemonProcess || !this.isConnected) {
                return reject(new Error("Daemon is not connected"));
            }

            const payload = Buffer.from(text, 'utf-8');
            const header = Buffer.alloc(5);
            header.writeUInt8(0x02, 0); // CMD 0x02 (ONNX Inference)
            header.writeUInt32LE(payload.length, 1);

            let resultBuffer = Buffer.alloc(0);

            // We expect exactly 1536 bytes (384 * 4 bytes for float32)
            const onData = (data: Buffer) => {
                resultBuffer = Buffer.concat([resultBuffer, data]);
                if (resultBuffer.length >= 1536) {
                    if (this.daemonProcess?.stdout) {
                        this.daemonProcess.stdout.off('data', onData);
                    }
                    
                    // Convert raw binary back to Float32Array with zero parsing overhead
                    const vector = new Float32Array(resultBuffer.buffer, resultBuffer.byteOffset, 384);
                    resolve(vector);
                }
            };

            if (this.daemonProcess.stdout && this.daemonProcess.stdin) {
                this.daemonProcess.stdout.on('data', onData);
                this.daemonProcess.stdin.write(header);
                this.daemonProcess.stdin.write(payload);
            } else {
                reject(new Error("Daemon stdio pipes not available"));
            }
        });
    }
}

export const nativeBridge = new ZigDaemonBridge();
