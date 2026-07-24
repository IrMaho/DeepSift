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
    isOrphan?: boolean;
}

export interface WireTraceResult {
    messages: WireMessage[];
    sendersCount: number;
    receiversCount: number;
    orphanSenders: WireMessage[];
    orphanReceivers: WireMessage[];
    enumMappings: Record<string, string>;
}

export class WireTracer {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public analyze(targetDir?: string): WireTraceResult {
        const searchPath = targetDir ? path.resolve(this.projectPath, targetDir) : this.projectPath;
        const files = this.collectSourceFiles(searchPath);

        const enumMappings = this.extractEnumMappings(files);

        const senders: WireMessage[] = [];
        const receivers: WireMessage[] = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relativePath = path.relative(this.projectPath, file);
                const lines = content.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const lineNum = i + 1;
                    const block = lines.slice(i, Math.min(i + 15, lines.length)).join('\n');

                    const postMessageMatch = block.match(/postMessage\s*\(\s*\{[\s\S]*?(?:type|action|event)\s*:\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))/i);
                    if (postMessageMatch && lines[i].includes('postMessage')) {
                        const rawType = postMessageMatch[1] || postMessageMatch[2];
                        const resolvedType = this.resolveType(rawType, enumMappings);
                        if (resolvedType) {
                            senders.push({
                                type: resolvedType,
                                senderFile: relativePath,
                                senderLine: lineNum,
                                channel: 'postMessage'
                            });
                        }
                    }

                    const electronSendMatch = lines[i].match(/ipcRenderer\.(?:send|invoke|sendSync)\s*\(\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))/i);
                    if (electronSendMatch) {
                        const rawType = electronSendMatch[1] || electronSendMatch[2];
                        const resolvedType = this.resolveType(rawType, enumMappings);
                        if (resolvedType) {
                            senders.push({
                                type: resolvedType,
                                senderFile: relativePath,
                                senderLine: lineNum,
                                channel: 'electron-ipc'
                            });
                        }
                    }

                    const emitMatch = lines[i].match(/\.emit\s*\(\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))/i);
                    if (emitMatch) {
                        const rawType = emitMatch[1] || emitMatch[2];
                        const resolvedType = this.resolveType(rawType, enumMappings);
                        if (resolvedType) {
                            senders.push({
                                type: resolvedType,
                                senderFile: relativePath,
                                senderLine: lineNum,
                                channel: 'event-emitter'
                            });
                        }
                    }

                    const receiverMatch = lines[i].match(/(?:msg|event|e|data)(?:\?\.[a-zA-Z0-9_$]+|\.[a-zA-Z0-9_$]+)*\.(?:type|action|event)\s*===\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))/i) ||
                                          lines[i].match(/case\s+(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))\s*:/i);
                    if (receiverMatch) {
                        const rawType = receiverMatch[1] || receiverMatch[2];
                        const resolvedType = this.resolveType(rawType, enumMappings);
                        if (resolvedType) {
                            receivers.push({
                                type: resolvedType,
                                senderFile: '',
                                senderLine: 0,
                                receiverFile: relativePath,
                                receiverLine: lineNum,
                                channel: 'message-handler'
                            });
                        }
                    }

                    const electronOnMatch = lines[i].match(/ipcMain\.(?:on|handle)\s*\(\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))/i);
                    if (electronOnMatch) {
                        const rawType = electronOnMatch[1] || electronOnMatch[2];
                        const resolvedType = this.resolveType(rawType, enumMappings);
                        if (resolvedType) {
                            receivers.push({
                                type: resolvedType,
                                senderFile: '',
                                senderLine: 0,
                                receiverFile: relativePath,
                                receiverLine: lineNum,
                                channel: 'electron-ipc-handler'
                            });
                        }
                    }

                    const eventOnMatch = lines[i].match(/\.on\s*\(\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?))/i);
                    if (eventOnMatch && !lines[i].includes('ipcMain')) {
                        const rawType = eventOnMatch[1] || eventOnMatch[2];
                        const resolvedType = this.resolveType(rawType, enumMappings);
                        if (resolvedType) {
                            receivers.push({
                                type: resolvedType,
                                senderFile: '',
                                senderLine: 0,
                                receiverFile: relativePath,
                                receiverLine: lineNum,
                                channel: 'event-listener'
                            });
                        }
                    }
                }
            } catch (e) {
            }
        }

        const messages: WireMessage[] = [];
        const matchedReceiverTypes = new Set<string>();
        const matchedSenderTypes = new Set<string>();

        senders.forEach(sender => {
            const matchingReceivers = receivers.filter(r => r.type === sender.type || this.isCompatibleType(sender.type, r.type));
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

        const orphanSenders = senders
            .filter(s => !matchedSenderTypes.has(s.type))
            .map(s => ({ ...s, isOrphan: true }));
        const orphanReceivers = receivers
            .filter(r => !matchedReceiverTypes.has(r.type))
            .map(r => ({ ...r, isOrphan: true }));

        return {
            messages,
            sendersCount: senders.length,
            receiversCount: receivers.length,
            orphanSenders,
            orphanReceivers,
            enumMappings
        };
    }

    private resolveType(rawType: string | undefined, enumMappings: Record<string, string>): string {
        if (!rawType) return '';
        const trimmed = rawType.trim();
        if (enumMappings[trimmed]) return enumMappings[trimmed];
        if (trimmed.includes('.')) {
            const parts = trimmed.split('.');
            const member = parts[parts.length - 1];
            if (enumMappings[member]) return enumMappings[member];
            return member.toLowerCase().replace(/_/g, '-');
        }
        return trimmed;
    }

    private isCompatibleType(typeA: string, typeB: string): boolean {
        if (typeA === typeB) return true;
        const normA = typeA.toLowerCase().replace(/[-_]/g, '');
        const normB = typeB.toLowerCase().replace(/[-_]/g, '');
        return normA === normB;
    }

    private extractEnumMappings(files: string[]): Record<string, string> {
        const mappings: Record<string, string> = {};
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const enumBlocks = content.match(/(?:enum|const)\s+([A-Za-z0-9_$]+)\s*(?:=\s*\{|\{)([\s\S]*?)\}/g);
                if (enumBlocks) {
                    for (const block of enumBlocks) {
                        const enumNameMatch = block.match(/(?:enum|const)\s+([A-Za-z0-9_$]+)/);
                        const enumName = enumNameMatch ? enumNameMatch[1] : '';
                        const memberMatches = block.matchAll(/([A-Za-z0-9_$]+)\s*=\s*['"`]([^'"`]+)['"`]/g);
                        for (const match of memberMatches) {
                            const key = match[1];
                            const val = match[2];
                            mappings[key] = val;
                            if (enumName) {
                                mappings[`${enumName}.${key}`] = val;
                            }
                        }
                    }
                }
            } catch (e) {
            }
        }
        return mappings;
    }

    private collectSourceFiles(dir: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.deepsift'].includes(entry.name)) {
                    files.push(...this.collectSourceFiles(fullPath));
                }
            } else if (/\.(ts|tsx|js|jsx|dart|go|py|rs|java)$/i.test(entry.name)) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
