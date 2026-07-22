import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

export async function schemaDriftCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🔄 DOM & Schema Drift Synchronization Audit\n`);

    const schemas: Array<{ file: string, type: string }> = [];

    function scan(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scan(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.json', '.prisma', '.sql', '.dart'].includes(ext)) {
                    if (item.name.includes('schema') || item.name.includes('config') || item.name.includes('dto') || item.name.includes('model')) {
                        schemas.push({ file: normalizePath(path.relative(projectPath, fullPath)), type: ext });
                    }
                }
            }
        }
    }

    scan(projectPath);

    lines.push(`Discovered **${schemas.length}** schema and config definitions across workspace:\n`);
    schemas.forEach(s => {
        lines.push(`- 📄 **${s.file}** (\`${s.type}\`)`);
    });

    lines.push(`\n> [!NOTE]`);
    lines.push(`> Always update backend API mappings and server definitions whenever client DOM selectors or database schemas change.`);

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[SchemaDrift]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
