import fs from 'fs';
import path from 'path';
import { loadConfig } from './config.js';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.mcp_search_outputs', 'coverage', '.idea', '.vscode']);

interface FileMeta {
    relativePath: string;
    sizeKb: number;
    score: number;
}

export function getProjectArchitecture(projectPath: string, maxDepth: number = 5): string {
    const config = loadConfig(projectPath);
    const excludeDirs = config.indexer?.excludeDirs || [];
    const ignored = new Set([...IGNORED_DIRS, ...excludeDirs, '.deepsift']);

    let tree = '';
    let fileCount = 0;
    const sourceFiles: FileMeta[] = [];
    
    function walk(dir: string, depth: number, prefix: string) {
        if (depth > maxDepth) return;
        
        let items;
        try {
            items = fs.readdirSync(dir, { withFileTypes: true });
        } catch (err) {
            return;
        }

        items.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (ignored.has(item.name)) continue;
            if (item.name.startsWith('.') && item.name !== '.env.example') continue; // skip hidden files

            const isLast = i === items.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                tree += `${prefix}${marker}📂 ${item.name}/\n`;
                walk(fullPath, depth + 1, prefix + (isLast ? '    ' : '│   '));
            } else {
                fileCount++;
                try {
                    const stats = fs.statSync(fullPath);
                    const sizeKb = stats.size / 1024;
                    tree += `${prefix}${marker}📄 ${item.name} (${sizeKb.toFixed(1)} KB)\n`;

                    // Simple heuristic scoring for core files
                    const ext = path.extname(item.name);
                    const validExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.dart', '.cpp', '.h'];
                    if (validExts.includes(ext) && sizeKb < 1000) { // skip massive generated files
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const importCount = (content.match(/import /g) || []).length + (content.match(/require\(/g) || []).length;
                        const exportCount = (content.match(/export /g) || []).length + (content.match(/module\.exports/g) || []).length;
                        // Score based on connectivity (imports/exports) and size
                        const score = importCount + (exportCount * 2) + sizeKb;
                        sourceFiles.push({ relativePath: path.relative(projectPath, fullPath), sizeKb, score });
                    }
                } catch (err) {
                    // ignore unreadable files
                }
            }
        }
    }

    tree += `📦 Project Root (${path.basename(projectPath)})\n`;
    walk(projectPath, 1, '');
    
    // Determine Top 5 core files
    sourceFiles.sort((a, b) => b.score - a.score);
    const coreFiles = sourceFiles.slice(0, 5).map(f => `  - **${f.relativePath}** (Connectivity Score: ${f.score.toFixed(1)})`);

    return `# Project Architecture Blueprint\n\n## 🌳 Directory Tree\n\`\`\`\n${tree}\n\`\`\`\n\n## 🎯 Top 5 Central/Core Files\n*These files contain the most imports, exports, and logic volume. Start analyzing here if you want to understand the core functionality.*\n${coreFiles.join('\n')}`;
}
