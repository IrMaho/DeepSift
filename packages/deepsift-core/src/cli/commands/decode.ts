import { printResult, OutputFormat } from '../cli-output.js';

export function decodeCommand(compressedToken: string, format: OutputFormat = 'markdown'): void {
    try {
        const decoded = Buffer.from(compressedToken, 'base64').toString('utf8');
        printResult(`### 🔓 Decoded DEC_v2 Token:\n\n\`\`\`\n${decoded || compressedToken}\n\`\`\``, format);
    } catch (e: any) {
        printResult(`Decoded raw token: ${compressedToken}`, format);
    }
}
