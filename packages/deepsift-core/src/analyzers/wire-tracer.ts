import fs from 'fs';
import path from 'path';

export interface WireMessage {
    type: string;
    senderFile: string;
    senderLine: number;
    receiverFile?: string;
    receiverLine?: number;
    payloadHint?: string;
    channel?: string;
}

export interface WireTraceResult {
    messages: WireMessage[];
    sendersCount: number;
    receiversCount: number;
    orphanSenders: WireMessage[];
    orphanReceivers: WireMessage[];
}

export class WireTracer {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public analyze(targetDir?: string): WireTraceResult {
        const searchPath = targetDir ? path.resolve(this.projectPath, targetDir) : this.projectPath;
        const files = this.collectSourceFiles(searchPath);

        const senders: WireMessage[] = [];
        const receivers: WireMessage[] = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relativePath = path.relative(this.projectPath, file);
                const lines = content.split('\n');

                // Multi-line sliding window parsing for nested payloads
                for (let i = 0; i < lines.length; i++) {
                    const lineNum = i + 1;
                    const block = lines.slice(i, Math.min(i + 15, lines.length)).join('\n');

                    // 1. Nested postMessage senders (e.g. parent.postMessage({ pluginMessage: { type: 'create-rect' } }, '*'))
                    const postMessageMatch = block.match(/postMessage\s*\(\s*\{[\s\S]*?(?:type|action|event)\s*:\s*['"`]([^'"`]+)['"`]/i);
                    if (postMessageMatch && lines[i].includes('postMessage')) {
                        senders.push({
                            type: postMessageMatch[1],
                            senderFile: relativePath,
                            senderLine: lineNum,
                            channel: 'postMessage'
                        });
                    }

                    // 2. Electron IPC senders: ipcRenderer.send / invoke / sendSync
                    const electronSendMatch = lines[i].match(/ipcRenderer\.(?:send|invoke|sendSync)\s*\(\s*['"`]([^'"`]+)['"`]/i);
                    if (electronSendMatch) {
                        senders.push({
                            type: electronSendMatch[1],
                            senderFile: relativePath,
                            senderLine: lineNum,
                            channel: 'electron-ipc'
                        });
                    }

                    // 3. EventEmitter senders: .emit('event', ...)
                    const emitMatch = lines[i].match(/\.emit\s*\(\s*['"`]([^'"`]+)['"`]/i);
                    if (emitMatch) {
                        senders.push({
                            type: emitMatch[1],
                            senderFile: relativePath,
                            senderLine: lineNum,
                            channel: 'event-emitter'
                        });
                    }

                    // 4. Receivers: if (msg.type === 'x') or case 'x': or msg?.pluginMessage?.type === 'x'
                    const receiverMatch = lines[i].match(/(?:msg|event|e|data)(?:\?\.[a-zA-Z0-9_$]+|\.[a-zA-Z0-9_$]+)*\.(?:type|action|event)\s*===\s*['"`]([^'"`]+)['"`]/i) ||
                                          lines[i].match(/case\s+['"`]([^'"`]+)['"`]\s*:/i);
                    if (receiverMatch) {
                        receivers.push({
                            type: receiverMatch[1],
                            senderFile: '',
                            senderLine: 0,
                            receiverFile: relativePath,
                            receiverLine: lineNum,
                            channel: 'message-handler'
                        });
                    }

                    // 5. Electron IPC handlers: ipcMain.on / handle
                    const electronOnMatch = lines[i].match(/ipcMain\.(?:on|handle)\s*\(\s*['"`]([^'"`]+)['"`]/i);
                    if (electronOnMatch) {
                        receivers.push({
                            type: electronOnMatch[1],
                            senderFile: '',
                            senderLine: 0,
                            receiverFile: relativePath,
                            receiverLine: lineNum,
                            channel: 'electron-ipc-handler'
                        });
                    }

                    // 6. EventEmitter on handlers: .on('event', ...)
                    const eventOnMatch = lines[i].match(/\.on\s*\(\s*['"`]([^'"`]+)['"`]/i);
                    if (eventOnMatch && !lines[i].includes('ipcMain')) {
                        receivers.push({
                            type: eventOnMatch[1],
                            senderFile: '',
                            senderLine: 0,
                            receiverFile: relativePath,
                            receiverLine: lineNum,
                            channel: 'event-listener'
                        });
                    }
                }
            } catch (e) {
                // Skip read error
            }
        }

        const messages: WireMessage[] = [];
        const matchedReceiverTypes = new Set<string>();
        const matchedSenderTypes = new Set<string>();

        senders.forEach(sender => {
            const matchingReceivers = receivers.filter(r => r.type === sender.type);
            if (matchingReceivers.length > 0) {
                matchedSenderTypes.add(sender.type);
                matchingReceivers.forEach(rcv => {
                    matchedReceiverTypes.add(rcv.type);
                    messages.push({
                        type: sender.type,
                        senderFile: sender.senderFile,
                        senderLine: sender.senderLine,
                        receiverFile: rcv.receiverFile,
                        receiverLine: rcv.receiverLine,
                        channel: sender.channel
                    });
                });
            }
        });

        const orphanSenders = senders.filter(s => !matchedSenderTypes.has(s.type));
        const orphanReceivers = receivers.filter(r => !matchedReceiverTypes.has(r.type));

        return {
            messages,
            sendersCount: senders.length,
            receiversCount: receivers.length,
            orphanSenders,
            orphanReceivers
        };
    }

    private collectSourceFiles(dir: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', '.deepsift', 'dist', 'build', 'coverage'].includes(entry.name)) {
                    files.push(...this.collectSourceFiles(fullPath));
                }
            } else if (/\.(ts|js|tsx|jsx|py|go|dart|rs|java|c|cpp|cs)$/i.test(entry.name)) {
                files.push(fullPath);
            }
        }

        return files;
    }
}
