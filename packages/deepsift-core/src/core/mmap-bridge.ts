import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as net from 'net';
import { AutoTokenizer } from '@xenova/transformers';

export class ZigDaemonBridge {
    private daemonProcess: ChildProcess | null = null;
    private socket: net.Socket | null = null;
    private isConnected = false;
    private tokenizer: any = null;
    private requestQueue: Promise<void> = Promise.resolve();

    private async ensureTokenizer() {
        if (!this.tokenizer) {
            this.tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-base-en-v1.5');
        }
    }

    public async startDaemon(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const ext = process.platform === 'win32' ? '.exe' : '';
            // Determine bin path relative to this source file
            const __filename = new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
            const __dirname = path.dirname(__filename);
            const binPath = path.resolve(__dirname, '../../bin', `deepsift-math${ext}`);

            console.log("🚀 [HPC Bridge] Spawning Zig Daemon Process:", binPath);
            
            const modelPath = path.resolve(__dirname, '../../bin', 'bge-base-en-v1.5.onnx');
            // Spawn the native engine daemon
            this.daemonProcess = spawn(binPath, ['--daemon', '--model', modelPath], {
                stdio: ['pipe', 'pipe', 'inherit']
            });

            this.daemonProcess.on('error', (err) => {
                console.error("❌ [HPC Bridge] Failed to spawn Zig Daemon.", err);
                reject(err);
            });

            this.daemonProcess.on('exit', (code, signal) => {
                console.error(`❌ [HPC Bridge] Zig Daemon exited with code ${code}, signal ${signal}`);
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
            this.requestQueue = this.requestQueue.then(async () => {
                if (!this.daemonProcess || !this.isConnected) {
                    return reject(new Error("Daemon is not connected"));
                }

                const payload = Buffer.from(text, 'utf-8');
                const header = Buffer.alloc(5);
                header.writeUInt8(0x01, 0); // CMD 0x01 (Hash)
                header.writeUInt32LE(payload.length, 1);

                await new Promise<void>((innerResolve) => {
                    let resultBuffer = Buffer.alloc(0);
                    const onData = (data: Buffer) => {
                        resultBuffer = Buffer.concat([resultBuffer, data]);
                        if (resultBuffer.length >= 64) {
                            if (this.daemonProcess?.stdout) {
                                this.daemonProcess.stdout.off('data', onData);
                            }
                            resolve(resultBuffer.subarray(0, 64).toString('ascii'));
                            innerResolve();
                        }
                    };
                    
                    if (this.daemonProcess?.stdout && this.daemonProcess?.stdin) {
                        this.daemonProcess.stdout.on('data', onData);
                        this.daemonProcess.stdin.write(header);
                        this.daemonProcess.stdin.write(payload);
                    } else {
                        reject(new Error("Daemon stdio pipes not available"));
                        innerResolve();
                    }
                });
            }).catch(reject);
        });
    }

    public async getEmbeddingsNative(text: string): Promise<Float32Array> {
        return new Promise((resolve, reject) => {
            this.requestQueue = this.requestQueue.then(async () => {
                if (!this.daemonProcess || !this.isConnected) {
                    return reject(new Error("Daemon is not connected"));
                }

                try {
                    await this.ensureTokenizer();
                    const tokenOutput = await this.tokenizer(text, { max_length: 512, truncation: true, padding: false });
                    const tokenData = tokenOutput.input_ids.data;
                    const tokenIds = new BigInt64Array(tokenData.length);
                    for (let i = 0; i < tokenData.length; i++) {
                        tokenIds[i] = BigInt(tokenData[i]);
                    }
                    const payload = Buffer.from(tokenIds.buffer, tokenIds.byteOffset, tokenIds.byteLength);

                    const header = Buffer.alloc(5);
                    header.writeUInt8(0x02, 0); // CMD 0x02 (ONNX Inference)
                    header.writeUInt32LE(payload.length, 1);

                    let resultBuffer = Buffer.alloc(0);

                    // We expect exactly 3072 bytes (768 * 4 bytes for float32)
                    await new Promise<void>((innerResolve) => {
                        const onData = (data: Buffer) => {
                            resultBuffer = Buffer.concat([resultBuffer, data]);
                            if (resultBuffer.length >= 3072) {
                                if (this.daemonProcess?.stdout) {
                                    this.daemonProcess.stdout.off('data', onData);
                                }
                                
                                // Convert raw binary back to Float32Array with zero parsing overhead
                                const vector = new Float32Array(resultBuffer.buffer, resultBuffer.byteOffset, 768);
                                resolve(vector);
                                innerResolve();
                            }
                        };
                        
                        if (this.daemonProcess?.stdout && this.daemonProcess?.stdin) {
                            this.daemonProcess.stdout.on('data', onData);
                            this.daemonProcess.stdin.write(header);
                            this.daemonProcess.stdin.write(payload);
                        } else {
                            reject(new Error("Daemon stdio pipes not available"));
                            innerResolve();
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            }).catch(reject);
        });
    }

    public async getEmbeddingsNativeBatch(texts: string[]): Promise<Float32Array[]> {
        if (texts.length === 0) return [];
        if (!this.daemonProcess || !this.isConnected) {
            throw new Error("Daemon is not connected");
        }

        const batchSize = texts.length;
        const lengths = texts.map(t => Buffer.byteLength(t));
        const totalLen = lengths.reduce((a, b) => a + b, 0);
        const payload = Buffer.alloc(totalLen + 4 * batchSize);

        let offset = 0;
        for (let i = 0; i < batchSize; i++) {
            payload.writeUInt32LE(lengths[i], offset);
            offset += 4;
            payload.write(texts[i], offset);
            offset += lengths[i];
        }

        const header = Buffer.alloc(9);
        header.writeUInt8(0x04, 0);
        header.writeUInt32LE(payload.length, 1);
        header.writeUInt32LE(batchSize, 5);

        let resultBuffer = Buffer.alloc(0);
        const expectedBytes = batchSize * 768 * 4;

        return new Promise<Float32Array[]>((resolve, reject) => {
            const onData = (data: Buffer) => {
                resultBuffer = Buffer.concat([resultBuffer, data]);
                if (resultBuffer.length >= expectedBytes) {
                    this.daemonProcess?.stdout?.off('data', onData);
                    const vectors: Float32Array[] = [];
                    for (let b = 0; b < batchSize; b++) {
                        vectors.push(new Float32Array(resultBuffer.buffer, resultBuffer.byteOffset + b * 768 * 4, 768));
                    }
                    resolve(vectors);
                }
            };

            if (this.daemonProcess?.stdout && this.daemonProcess?.stdin) {
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
