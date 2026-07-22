import fs from 'fs';
import path from 'path';
import { normalizePath } from '../utils/outline.js';

export interface LayerViolation {
    file: string;
    line: number;
    forbiddenImport: string;
    rule: string;
    snippet: string;
}

const FORBIDDEN_SANDBOX_IMPORTS = [
    'window', 'document', 'localStorage', 'sessionStorage',
    'fetch', 'axios', 'firebase', 'react', 'react-dom'
];

export function checkLayerViolations(projectPath: string): LayerViolation[] {
    const violations: LayerViolation[] = [];

    function scan(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scan(fullPath);
            } else {
                const rel = normalizePath(path.relative(projectPath, fullPath));
                const isSandboxFile = rel.includes('figma-core') || rel.includes('code.ts') || rel.includes('sandbox') || rel.includes('core-sandbox');
                
                if (isSandboxFile) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const lines = content.split('\n');
                        lines.forEach((line, idx) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('import') || trimmed.startsWith('require')) {
                                for (const forbidden of FORBIDDEN_SANDBOX_IMPORTS) {
                                    if (trimmed.includes(`from '${forbidden}'`) || trimmed.includes(`from "${forbidden}"`) || trimmed.includes(`require('${forbidden}')`) || trimmed.includes(`require("${forbidden}")`)) {
                                        violations.push({
                                            file: rel,
                                            line: idx + 1,
                                            forbiddenImport: forbidden,
                                            rule: 'Figma Plugin Core Principle: Sandbox environment MUST NOT import browser-only APIs',
                                            snippet: trimmed
                                        });
                                    }
                                }
                            }
                        });
                    } catch {}
                }
            }
        }
    }

    scan(projectPath);
    return violations;
}
