import fs from 'fs';
import path from 'path';

export function normalizePath(p: string): string {
    return p.replace(/\\/g, '/');
}

export type FileCategory = 'core-logic' | 'ui-component' | 'service-domain' | 'config-schema' | 'asset';

export interface FileWeightInfo {
    category: FileCategory;
    weight: number;
    badge: string;
    isCoreLogic: boolean;
}

export function classifyFile(fileName: string, content: string): FileWeightInfo {
    const ext = path.extname(fileName).toLowerCase();
    const nameLower = fileName.toLowerCase();

    if (['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.min.js', '.map', '.wasm'].includes(ext)) {
        return { category: 'asset', weight: 1, badge: '📦 Asset', isCoreLogic: false };
    }

    const isStore = nameLower.includes('store') || nameLower.includes('state') || nameLower.includes('slice') || /use[A-Z]\w+Store/.test(fileName) || content.includes('create(') || content.includes('createSlice(');
    const isHandler = nameLower.includes('handler') || nameLower.includes('controller') || nameLower.includes('listener') || content.includes('onmessage') || content.includes('postMessage');
    const isService = nameLower.includes('service') || nameLower.includes('repository') || nameLower.includes('domain') || nameLower.includes('provider') || nameLower.includes('usecase');
    const isApiRoute = nameLower.includes('route') || nameLower.includes('api') || nameLower.includes('endpoint');

    if (isStore || isHandler || isService || isApiRoute) {
        let badge = '⭐ Core Logic';
        if (isStore) badge = '⭐ State Store';
        else if (isHandler) badge = '⚡ Handler / Controller';
        else if (isService) badge = '🏛️ Domain Service';
        return { category: 'core-logic', weight: 10, badge, isCoreLogic: true };
    }

    const isJsx = ext === '.tsx' || ext === '.jsx' || ext === '.svelte' || ext === '.vue';
    const hasJsxContent = /<[A-Z][\w.]*/.test(content) || /return\s*\(\s*</.test(content);
    if (isJsx || hasJsxContent) {
        return { category: 'ui-component', weight: 8, badge: '🎨 Component', isCoreLogic: false };
    }

    if (nameLower.includes('config') || nameLower.includes('schema') || ext === '.json' || ext === '.yaml' || ext === '.yml' || ext.endsWith('.d.ts')) {
        return { category: 'config-schema', weight: 4, badge: '⚙️ Config', isCoreLogic: false };
    }

    return { category: 'service-domain', weight: 6, badge: '⚙️ Logic', isCoreLogic: false };
}

function isTrivialComment(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (!lower) return true;
    if (lower.startsWith('eslint') || lower.startsWith('ts-ignore') || lower.startsWith('prettier') || lower.startsWith('@ts-nocheck')) return true;
    if (lower.includes('copyright') || lower.includes('license') || lower.includes('spdx')) return true;
    if (/^(svg|image|png|jpeg|jpg|css|style|asset|icon|font)s?\s+(import|file|path|asset|resource)s?/i.test(lower)) return true;
    if (/^(import|require|helper|utility|interface|type|constant|variable|local)s?\s*(section|block|import|definition|declare|file)?$/i.test(lower)) return true;
    if (lower.startsWith('todo') || lower.startsWith('fixme') || lower.startsWith('note:')) return true;
    return false;
}

function pascalToWords(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').trim();
}

function extractPurpose(content: string, fileName: string): string {
    const lines = content.split('\n');

    for (let i = 0; i < Math.min(lines.length, 35); i++) {
        const line = lines[i].trim();
        const tagMatch = line.match(/@(?:purpose|description|component|file)\s+(.{5,100})/i);
        if (tagMatch) return tagMatch[1].trim();
    }

    for (let i = 0; i < Math.min(lines.length, 25); i++) {
        const line = lines[i].trim();
        const jsdocMatch = line.match(/^\*\s+(.{12,100})/);
        if (jsdocMatch && !jsdocMatch[1].startsWith('@') && !isTrivialComment(jsdocMatch[1])) {
            return jsdocMatch[1].trim();
        }
        const commentMatch = line.match(/^\/\/\s+(.{12,100})/);
        if (commentMatch && !isTrivialComment(commentMatch[1])) {
            return commentMatch[1].trim();
        }
    }

    const ext = path.extname(fileName).toLowerCase();
    const isJsxTsx = ext === '.tsx' || ext === '.jsx';

    const defaultExportMatch = content.match(/\bexport\s+default\s+(?:function|class|const)?\s*([\w_]+)/);
    const mainClassMatch = content.match(/\bexport\s+(?:default\s+)?class\s+([\w_]+)/);
    const mainFuncMatch = content.match(/\bexport\s+(?:default\s+)?(?:async\s+)?function\s+([\w_]+)/);
    const mainConstFuncMatch = content.match(/\bexport\s+(?:default\s+)?const\s+([\w_]+)\s*=\s*(?:React\.(?:memo|forwardRef)\s*\()?\(?/);
    
    const primarySymbol = (defaultExportMatch && defaultExportMatch[1] !== 'function') ? defaultExportMatch[1] :
                          (mainClassMatch ? mainClassMatch[1] : 
                          (mainFuncMatch ? mainFuncMatch[1] : 
                          (mainConstFuncMatch ? mainConstFuncMatch[1] : '')));

    if (primarySymbol && primarySymbol.length > 2) {
        const words = pascalToWords(primarySymbol);
        
        if (primarySymbol.startsWith('use') && primarySymbol.length > 3 && /[A-Z]/.test(primarySymbol[3])) {
            return `${words} custom React hook`;
        }
        if (primarySymbol.endsWith('Store') || primarySymbol.endsWith('State') || primarySymbol.endsWith('Slice')) {
            return `${words} state management store`;
        }
        if (primarySymbol.endsWith('Handler') || primarySymbol.endsWith('Controller')) {
            return `${words} event & message handler`;
        }
        if (primarySymbol.endsWith('Repository') || primarySymbol.endsWith('Service')) {
            return `${words} business logic & data service`;
        }
        if (isJsxTsx || /<[A-Z][\w.]*/.test(content) || /return\s*\(\s*</.test(content)) {
            return `${words} UI component`;
        }
        return `${words} module implementation`;
    }

    const testCount = (content.match(/\b(describe|it|test)\s*\(/g) || []).length;
    const hookCount = (content.match(/\buse[A-Z]\w+/g) || []).length;
    const routeCount = (content.match(/\b(router|route|app\.(get|post|put|delete))/gi) || []).length;
    const typeCount = (content.match(/\b(interface|type)\s+[\w_]+/g) || []).length;
    const exportCount = (content.match(/\bexport\s+/g) || []).length;

    if (testCount > 1) return `Test suite (${testCount} test cases)`;
    if (hookCount > 2) return `React hooks module (${hookCount} hooks used)`;
    if (routeCount > 1) return `Route/API handler (${routeCount} routes)`;
    if (typeCount > 3 && exportCount > 3) return `TypeScript types and interface definitions`;

    let baseName = path.basename(fileName, path.extname(fileName));
    baseName = baseName.replace(/^\d+[\._-]?/, ''); 
    const words = pascalToWords(baseName.replace(/[-_]/g, ' ')).toLowerCase();

    if (fileName.includes('deploy')) return 'Deployment and build automation script';
    if (fileName.includes('handler')) return 'Message & event handler module';
    if (fileName.includes('asset')) return 'Static assets & resource mapping';
    if (fileName.includes('optimiz')) return 'Performance optimization module';
    if (fileName.includes('config')) return 'Configuration management module';

    const extName = ext.slice(1).toUpperCase();
    return `${words ? words : 'Core'} ${isJsxTsx ? 'UI component' : 'module'} (${extName || 'code'})`;
}

function extractStructure(content: string): { dependencies: string[], elements: string[], purpose: string } {
    const lines = content.split('\n');
    const dependencies: string[] = [];
    const elements: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('//')) continue;
        
        if (line.match(/^(?:import|export\s+.*\s+from|require)/)) {
            const match = line.match(/(?:from|require\s*\()\s*['"]([^'"]+)['"]/);
            if (match) dependencies.push(match[1]);
            continue;
        }
        
        let classMatch = line.match(/^(?:export\s+|public\s+|abstract\s+|default\s+)*(class|interface|enum|struct|type)\s+([\w_]+)/);
        if (classMatch) {
            elements.push(`[${classMatch[1].toUpperCase()}] ${classMatch[2]}`);
            continue;
        }
        
        let funcMatch = line.match(/^(?:export\s+|public\s+|private\s+|protected\s+|static\s+|async\s+|default\s+)*(function|const|let|var)\s+([\w_]+)(.*)/);
        if (funcMatch) {
            let signature = funcMatch[3].split('{')[0].trim();
            if (signature.endsWith('=>')) signature = signature.slice(0, -2).trim();
            if (signature.endsWith('=')) signature = signature.slice(0, -1).trim();
            if (signature.length > 50) signature = signature.substring(0, 47) + '...';
            elements.push(`[${funcMatch[1].toUpperCase()}] ${funcMatch[2]} ${signature}`.trim());
            continue;
        }

        let methodMatch = line.match(/^(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([\w_]+)\s*(\([^)]*\)\s*(?::\s*[\w_<>[\]]+)?)/);
        if (methodMatch) {
            const name = methodMatch[1];
            let signature = methodMatch[2].trim();
            if (signature.length > 50) signature = signature.substring(0, 47) + '...';
            if (!['if', 'for', 'while', 'switch', 'catch', 'return'].includes(name)) {
                elements.push(`  ↳ [Method] ${name}${signature}`);
            }
            continue;
        }
    }
    
    return {
        dependencies: [...new Set(dependencies)],
        elements: elements,
        purpose: ''
    };
}

export interface DiscoveredFileItem {
    fullPath: string;
    relPath: string;
    purpose: string;
    deps: string[];
    elements: string[];
    classification: FileWeightInfo;
}

export function getFeatureOutline(
    featurePath: string, 
    limit: number = 25, 
    offset: number = 0, 
    summarizeOnly: boolean = false, 
    maxDepth: number = 6,
    groupByFeature: boolean = false,
    format: string = 'markdown',
    compact: boolean = false
): string {
    if (!fs.existsSync(featurePath)) {
        return format === 'json'
            ? JSON.stringify({ error: `Path not found: ${featurePath}` }, null, 2)
            : `Path not found: ${featurePath}`;
    }

    const isDir = fs.statSync(featurePath).isDirectory();
    const baseDir = path.basename(featurePath);
    const discoveredFiles: DiscoveredFileItem[] = [];
    let maxDepthReached = false;

    function walk(dir: string, currentDepth: number = 0) {
        if (!fs.existsSync(dir)) return;
        if (currentDepth > maxDepth) {
            maxDepthReached = true;
            return;
        }

        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'dist' || item.name === 'build' || item.name === '.deepsift') continue;
            
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                walk(fullPath, currentDepth + 1);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                const validExts = ['.ts', '.js', '.dart', '.py', '.java', '.cpp', '.go', '.tsx', '.jsx', '.json'];
                if (validExts.includes(ext)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const classification = classifyFile(item.name, content);
                    const struct = extractStructure(content);
                    const purpose = extractPurpose(content, item.name);
                    const relPath = normalizePath(path.relative(featurePath, fullPath)) || item.name;

                    discoveredFiles.push({
                        fullPath,
                        relPath,
                        purpose,
                        deps: struct.dependencies,
                        elements: struct.elements,
                        classification
                    });
                }
            }
        }
    }

    if (isDir) {
        walk(featurePath, 0);
    } else {
        const content = fs.readFileSync(featurePath, 'utf8');
        const classification = classifyFile(path.basename(featurePath), content);
        const struct = extractStructure(content);
        const purpose = extractPurpose(content, path.basename(featurePath));
        const relPath = normalizePath(path.basename(featurePath));

        discoveredFiles.push({
            fullPath: featurePath,
            relPath,
            purpose,
            deps: struct.dependencies,
            elements: struct.elements,
            classification
        });
    }

    discoveredFiles.sort((a, b) => {
        if (b.classification.weight !== a.classification.weight) {
            return b.classification.weight - a.classification.weight;
        }
        return a.relPath.localeCompare(b.relPath);
    });

    const totalFiles = discoveredFiles.length;
    if (totalFiles === 0) {
        return format === 'json'
            ? JSON.stringify({ error: `No source files found in ${featurePath}`, totalFiles: 0 }, null, 2)
            : `No source files found in ${featurePath}`;
    }

    const pageFiles = discoveredFiles.slice(offset, offset + limit);
    const skippedFiles = discoveredFiles.slice(offset + limit).map(f => f.relPath);
    const hasNextPage = offset + limit < totalFiles;
    const nextOffset = offset + limit;
    const relTargetDir = normalizePath(path.relative(process.cwd(), featurePath)) || baseDir;
    const nextCommand = `deepsift feature "${relTargetDir}" --offset ${nextOffset}`;

    if (format === 'json') {
        return JSON.stringify({
            feature: baseDir,
            targetPath: relTargetDir,
            totalFiles,
            offset,
            limit,
            hasNextPage,
            nextCommand: hasNextPage ? nextCommand : null,
            coreLogicCount: discoveredFiles.filter(f => f.classification.isCoreLogic).length,
            files: pageFiles.map(f => ({
                path: f.relPath,
                category: f.classification.category,
                badge: f.classification.badge,
                isCoreLogic: f.classification.isCoreLogic,
                purpose: f.purpose,
                dependencies: f.deps,
                elements: f.elements
            }))
        }, null, 2);
    }

    let result = `### Feature Outline: ${baseDir}\n`;
    result += `*(Total: ${totalFiles} files, ${discoveredFiles.filter(f => f.classification.isCoreLogic).length} ⭐ Core Logic | Showing offset ${offset}-${Math.min(offset + limit, totalFiles)}, maxDepth ${maxDepth}${summarizeOnly ? ', summary-only' : ''}${groupByFeature ? ', grouped-by-feature' : ''})*\n\n`;

    if (groupByFeature) {
        const featureGroups: Map<string, DiscoveredFileItem[]> = new Map();
        pageFiles.forEach(f => {
            const parts = f.relPath.split('/');
            const groupKey = parts.length > 1 ? parts[0] : 'root';
            if (!featureGroups.has(groupKey)) {
                featureGroups.set(groupKey, []);
            }
            featureGroups.get(groupKey)!.push(f);
        });

        featureGroups.forEach((files, group) => {
            result += `### 📂 Feature Group: \`${group}\` (${files.length} files)\n`;
            files.forEach(f => {
                let elementsToPrint = f.elements;
                if (summarizeOnly) {
                    elementsToPrint = f.elements.filter(e => e.startsWith('[CLASS]') || e.startsWith('[INTERFACE]') || e.startsWith('[TYPE]') || e.startsWith('[FUNCTION]')).slice(0, 3);
                } else {
                    elementsToPrint = f.elements.slice(0, 3);
                }
                result += `  - 📄 **${f.relPath}** [${f.classification.badge}]: ${f.purpose}\n`;
                if (elementsToPrint.length > 0) {
                    result += `    ↳ ${elementsToPrint.map(e => `\`${e}\``).join(', ')}\n`;
                }
            });
            result += '\n';
        });
    } else {
        pageFiles.forEach(f => {
            let elementsToPrint = compact ? [] : f.elements;
            if (compact) {
                elementsToPrint = [];
            } else if (summarizeOnly) {
                elementsToPrint = f.elements.filter(e => 
                    e.startsWith('[CLASS]') || 
                    e.startsWith('[INTERFACE]') || 
                    e.startsWith('[TYPE]') || 
                    e.startsWith('[STRUCT]') || 
                    e.startsWith('[FUNCTION]') || 
                    (e.startsWith('[CONST]') && !e.includes('↳'))
                ).slice(0, 6);
            } else if (isDir) {
                const nonMethods = elementsToPrint.filter(e => !e.includes('↳ [Method]'));
                const methods = elementsToPrint.filter(e => e.includes('↳ [Method]'));
                if (methods.length > 6) {
                    elementsToPrint = [...nonMethods, ...methods.slice(0, 6), `  ↳ [Method] ... (+${methods.length - 6} more internal methods)`];
                }
            }

            result += `#### 📄 ${f.relPath} [${f.classification.badge}]\n`;
            result += `  - 🎯 **Purpose**: ${f.purpose}\n`;
            if (f.deps.length > 0) {
                result += `  - 🔗 **Dependencies**: ${f.deps.slice(0, 8).join(', ')}${f.deps.length > 8 ? ', ...' : ''}\n`;
            }
            if (elementsToPrint.length > 0) {
                const maxItems = summarizeOnly ? 6 : 15;
                result += elementsToPrint.slice(0, maxItems).map(s => `  - \`${s}\``).join('\n') + '\n';
                if (elementsToPrint.length > maxItems) result += `  - ... (+${elementsToPrint.length - maxItems} more)\n`;
            }
            result += '\n';
        });
    }

    if (maxDepthReached) {
        result += `📁 [Depth Notice]: Deep subdirectories exist beyond depth ${maxDepth}. Pass \`--depth ${maxDepth + 2}\` to inspect deeper.\n\n`;
    }

    if (hasNextPage) {
        result += `💡 **Pagination [Showing ${offset + 1}-${Math.min(offset + limit, totalFiles)} of ${totalFiles} files]**\n`;
        result += `👉 **Next Command**: \`${nextCommand}\`\n\n`;
    }

    if (skippedFiles.length > 0) {
        result += `⚠️  [AI NOTE]: ${skippedFiles.length} files were omitted to prevent context explosion.\n`;
        result += `**Omitted Files Cluster Summarization:**\n`;
        
        const folderClusters: Map<string, { count: number, exts: Set<string> }> = new Map();
        skippedFiles.forEach(f => {
            const parts = f.split('/');
            const folder = parts.length > 1 ? parts.slice(0, parts.length - 1).join('/') + '/' : 'root/';
            const ext = path.extname(f) || '.file';
            if (!folderClusters.has(folder)) {
                folderClusters.set(folder, { count: 0, exts: new Set() });
            }
            const cluster = folderClusters.get(folder)!;
            cluster.count++;
            cluster.exts.add(ext);
        });

        folderClusters.forEach((info, folder) => {
            const extList = Array.from(info.exts).join(', ');
            result += `  - 📁 \`${folder}\` (${info.count} files: ${extList})\n`;
        });

        result += `\n*(Tip: Run \`deepsift feature "<folder>"\` or use \`--offset\` / \`--group-by-feature\` to inspect specific clusters)*\n`;
    }

    return result;
}
