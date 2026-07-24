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

                lines.forEach((line, index) => {
                    const lineNum = index + 1;

                    // 1. postMessage senders: parent.postMessage({ type: 'create-rect' }, '*') or window.postMessage(...)
                    const postMessageSendMatch = line.match(/(?:parent|window|target|figma\.ui)\.postMessage\(\s*\{[^}]*type:\s*['"`]([^'"`]+)['"`]/i) ||
                                                 line.match(/postMessage\(\s*\{\s*pluginMessage:\s*\{\s*type:\s*['"`]([^'"`]+)['"`]/i);
                    if (postMessageSendMatch) {
                        senders.push({
                            type: postMessageSendMatch[1],
                            senderFile: relativePath,
                            senderLine: lineNum,
                            channel: 'postMessage'
                        });
                    }

                    // 2. Electron IPC senders: ipcRenderer.send('channel', data)
                    const electronSendMatch = line.match(/ipcRenderer\.(?:send|invoke)\(['"`]([^'"`]+)['"`]/i);
                    if (electronSendMatch) {
                        senders.push({
                            type: electronSendMatch[1],
                            senderFile: relativePath,
                            senderLine: lineNum,
                            channel: 'electron-ipc'
                        });
                    }

                    // 3. EventEmitter senders: emitter.emit('event', data)
                    const emitMatch = line.match(/\.emit\(['"`]([^'"`]+)['"`]/i);
                    if (emitMatch) {
                        senders.push({
                            type: emitMatch[1],
                            senderFile: relativePath,
                            senderLine: lineNum,
                            channel: 'event-emitter'
                        });
                    }

                    // 4. Receivers: figma.ui.onmessage = (msg) => { if (msg.type === 'foo') } or addEventListener('message')
                    const receiverMatch = line.match(/(?:msg|event|e)\.type\s*===\s*['"`]([^'"`]+)['"`]/i) ||
                                          line.match(/case\s+['"`]([^'"`]+)['"`]:/i);
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

                    // 5. Electron IPC handlers: ipcMain.on('channel', ...) or handle('channel', ...)
                    const electronOnMatch = line.match(/ipcMain\.(?:on|handle)\(['"`]([^'"`]+)['"`]/i);
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
                    const eventOnMatch = line.match(/\.on\(['"`]([^'"`]+)['"`]/i);
                    if (eventOnMatch && !line.includes('ipcMain')) {
                        receivers.push({
                            type: eventOnMatch[1],
                            senderFile: '',
                            senderLine: 0,
                            receiverFile: relativePath,
                            receiverLine: lineNum,
                            channel: 'event-listener'
                        });
                    }
                });
            } catch (e) {
                // Ignore read errors
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
