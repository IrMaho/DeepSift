/**
 * @file architecture.ts
 * @description Directory tree architecture blueprint generator with Graphify community pruning.
 *
 * @module utils/architecture
 * @category Architecture & Intelligence
 * @since 1.0.0
 */
import fs from 'fs';
import path from 'path';
import { loadConfig } from './config.js';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.mcp_search_outputs', 'coverage', '.idea', '.vscode']);

interface FileMeta {
    relativePath: string;
    sizeKb: number;
    score: number;
}

export interface ArchTreeNode {
    name: string;
    type: 'dir' | 'file';
    sizeKb?: number;
    children?: ArchTreeNode[];
}

export function getProjectArchitecture(projectPath: string, maxDepth: number = 5, format: string = 'markdown'): string {
    const config = loadConfig(projectPath);
    const excludeDirs = config.indexer?.excludeDirs || [];
    const ignored = new Set([...IGNORED_DIRS, ...excludeDirs, '.deepsift']);

    let tree = '';
    const sourceFiles: FileMeta[] = [];

    const jsonTree: ArchTreeNode = {
        name: path.basename(projectPath),
        type: 'dir',
        children: []
    };

    function walk(dir: string, depth: number, prefix: string, parentJsonNode?: ArchTreeNode) {
        if (depth > maxDepth) return;
        
        let items;
        try {
            items = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
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
            if (item.name.startsWith('.') && item.name !== '.env.example') continue;

            const ext = path.extname(item.name).toLowerCase();
            const dataExts = ['.csv', '.tsv', '.xlsx', '.parquet', '.sqlite', '.db', '.log', '.lock', '.zip', '.tar', '.gz', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.min.js', '.map', '.wasm'];
            if (!item.isDirectory() && dataExts.includes(ext)) continue;

            const isLast = i === items.length - 1;
            const marker = isLast ? '└── ' : '├── ';
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                tree += `${prefix}${marker}📂 ${item.name}/\n`;
                const dirJsonNode: ArchTreeNode = { name: item.name, type: 'dir', children: [] };
                if (parentJsonNode && parentJsonNode.children) {
                    parentJsonNode.children.push(dirJsonNode);
                }
                walk(fullPath, depth + 1, prefix + (isLast ? '    ' : '│   '), dirJsonNode);
            } else {
                try {
                    const stats = fs.statSync(fullPath);
                    const sizeKb = stats.size / 1024;
                    tree += `${prefix}${marker}📄 ${item.name} (${sizeKb.toFixed(1)} KB)\n`;

                    if (parentJsonNode && parentJsonNode.children) {
                        parentJsonNode.children.push({ name: item.name, type: 'file', sizeKb: parseFloat(sizeKb.toFixed(1)) });
                    }

                    const validExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.dart', '.cpp', '.h'];
                    if (validExts.includes(ext) && sizeKb < 1000) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const importCount = (content.match(/import /g) || []).length + (content.match(/require\(/g) || []).length;
                        const exportCount = (content.match(/export /g) || []).length + (content.match(/module\.exports/g) || []).length;
                        const score = importCount + (exportCount * 2) + sizeKb;
                        const relPath = path.relative(projectPath, fullPath).replace(/\\/g, '/');
                        sourceFiles.push({ relativePath: relPath, sizeKb, score });
                    }
                } catch {
                }
            }
        }
    }

    tree += `📦 Project Root (${path.basename(projectPath)})\n`;
    walk(projectPath, 1, '', jsonTree);
    
    sourceFiles.sort((a, b) => b.score - a.score);
    const topFiles = sourceFiles.slice(0, 5);

    if (format === 'json') {
        return JSON.stringify({
            root: path.basename(projectPath),
            maxDepth,
            topCoreFiles: topFiles,
            tree: jsonTree
        }, null, 2);
    }

    const coreFiles = topFiles.map(f => `  - **${f.relativePath}** (Connectivity Score: ${f.score.toFixed(1)})`);
    return `# Project Architecture Blueprint\n\n## 🌳 Directory Tree\n\`\`\`\n${tree}\n\`\`\`\n\n## 🎯 Top 5 Central/Core Files\n*These files contain the most imports, exports, and logic volume. Start analyzing here if you want to understand the core functionality.*\n${coreFiles.join('\n')}`;
}
