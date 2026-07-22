import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

export async function testmapCommand(projectPath: string, format: OutputFormat = 'markdown', langFilter?: string): Promise<void> {
    const lines: string[] = [];
    const langTitle = langFilter ? ` (${langFilter.toUpperCase()} Only)` : '';
    lines.push(`# 🧪 Source-to-Test Coverage Mapping${langTitle}\n`);

    const sourceFiles: string[] = [];
    const testFiles: Set<string> = new Set();

    const normalizedLang = langFilter ? (langFilter.startsWith('.') ? langFilter.toLowerCase() : `.${langFilter.toLowerCase()}`) : null;

    function walkDir(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift', 'coverage', '.dart_tool', 'venv', '.venv'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                walkDir(fullPath);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                if (['.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go'].includes(ext)) {
                    if (normalizedLang) {
                        const isMatch = ext === normalizedLang ||
                            (normalizedLang === '.ts' && (ext === '.tsx' || ext === '.ts')) ||
                            (normalizedLang === '.js' && (ext === '.jsx' || ext === '.js'));
                        if (!isMatch) continue;
                    }

                    const rel = normalizePath(path.relative(projectPath, fullPath));
                    if (item.name.includes('test') || item.name.includes('spec') || item.name.endsWith('_test.go')) {
                        testFiles.add(rel.toLowerCase());
                    } else {
                        sourceFiles.push(rel);
                    }
                }
            }
        }
    }

    walkDir(projectPath);

    lines.push(`## 📊 Test Coverage Summary:`);
    const untested: string[] = [];
    const tested: string[] = [];

    sourceFiles.forEach(src => {
        const baseName = path.basename(src, path.extname(src)).toLowerCase().replace(/_test|\.test|\.spec/, '');
        const hasTest = Array.from(testFiles).some(t => t.includes(baseName));
        if (hasTest) {
            tested.push(src);
        } else {
            untested.push(src);
        }
    });

    lines.push(`- **Tested Modules:** ${tested.length}`);
    lines.push(`- **Untested Modules:** ${untested.length}`);
    lines.push(`- **Total Source Files:** ${sourceFiles.length}\n`);

    if (untested.length > 0) {
        lines.push(`### ⚠️ High Priority Files Lacking Unit Tests:`);
        untested.slice(0, 15).forEach(f => {
            lines.push(`  - 📄 \`${f}\``);
        });
        if (untested.length > 15) lines.push(`  - ... (+${untested.length - 15} more untested files)`);
    }

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, [`[TestMap ${langFilter || 'All'}]`], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
