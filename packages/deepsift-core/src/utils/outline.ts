import fs from 'fs';
import path from 'path';

export function normalizePath(p: string): string {
    return p.replace(/\\/g, '/');
}

function extractPurpose(content: string, fileName: string): string {
    const lines = content.split('\n');
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i].trim();
        const jsdocMatch = line.match(/^\*\s+(.{10,80})/);
        if (jsdocMatch && !jsdocMatch[1].startsWith('@')) return jsdocMatch[1].trim();
        const commentMatch = line.match(/^\/\/\s+(.{10,80})/);
        if (commentMatch && !commentMatch[1].startsWith('ts-ignore') && !commentMatch[1].startsWith('eslint')) return commentMatch[1].trim();
    }

    const mainClassMatch = content.match(/\bexport\s+(?:default\s+)?class\s+([\w_]+)/);
    if (mainClassMatch) {
        return `${mainClassMatch[1]} core class implementation`;
    }

    const dartClassMatch = content.match(/\bclass\s+([\w_]+)/);
    const isDart = fileName.endsWith('.dart');
    if (isDart && dartClassMatch) {
        return `${dartClassMatch[1]} Dart logic`;
    }

    const mainFuncMatch = content.match(/\bexport\s+(?:default\s+)?function\s+([\w_]+)/);
    if (mainFuncMatch) {
        return `${mainFuncMatch[1]} main function export`;
    }

    const testCount = (content.match(/\b(describe|it|test)\s*\(/g) || []).length;
    const hookCount = (content.match(/\buse[A-Z]\w+/g) || []).length;
    const routeCount = (content.match(/\b(router|route|app\.(get|post|put|delete))/gi) || []).length;
    const exportCount = (content.match(/\bexport\s+(default\s+)?(function|const|class)/g) || []).length;

    if (testCount > 2) return `Test suite (${testCount} test cases)`;
    if (hookCount > 2) return `React hooks module (${hookCount} hooks)`;
    if (routeCount > 1) return `Route/API handler (${routeCount} routes)`;
    if (exportCount > 5) return `Utility/helper barrel (${exportCount} exports)`;

    // Clean numeric prefixes (e.g. "1.optimized" -> "optimized")
    let baseName = path.basename(fileName, path.extname(fileName));
    baseName = baseName.replace(/^\d+[\._-]?/, ''); 
    const words = baseName.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().trim();

    if (fileName.includes('deploy')) return 'Deployment and automation script';
    if (fileName.includes('handler')) return 'Message & event handler module';
    if (fileName.includes('asset')) return 'Static assets & resource mapping';
    if (fileName.includes('optimiz')) return 'Performance optimization module';
    if (fileName.includes('config')) return 'Configuration management module';

    const ext = path.extname(fileName).slice(1).toUpperCase();
    return `${words ? words : 'Core'} module (${ext || 'code'})`;
}

function extractStructure(content: string): { dependencies: string[], elements: string[], purpose: string } {
    const lines = content.split('\n');
    const dependencies: string[] = [];
    const elements: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('//')) continue;
        
        // Match imports
        if (line.match(/^(?:import|export\s+.*\s+from|require)/)) {
            const match = line.match(/(?:from|require\s*\()\s*['"]([^'"]+)['"]/);
            if (match) dependencies.push(match[1]);
            continue;
        }
        
        // Match classes / interfaces
        let classMatch = line.match(/^(?:export\s+|public\s+|abstract\s+|default\s+)*(class|interface|enum|struct|type)\s+([\w_]+)/);
        if (classMatch) {
            elements.push(`[${classMatch[1].toUpperCase()}] ${classMatch[2]}`);
            continue;
        }
        
        // Match functions / constants
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

export function getFeatureOutline(
    featurePath: string, 
    limit: number = 20, 
    offset: number = 0, 
    summarizeOnly: boolean = false, 
    maxDepth?: number,
    groupByFeature: boolean = false
): string {
    let result = '';
    const baseDir = path.basename(featurePath);
    result += `### Feature Outline: ${baseDir}\n`;
    
    if (limit !== undefined && offset !== undefined) {
        result += `*(Showing up to ${limit} files, starting from offset ${offset}${maxDepth !== undefined ? `, maxDepth ${maxDepth}` : ''}${summarizeOnly ? ', summary-only' : ''}${groupByFeature ? ', grouped-by-feature' : ''})*\n\n`;
    } else {
        result += '\n';
    }

    let fileCount = 0;
    const skippedFiles: string[] = [];
    const featureGroups: Map<string, Array<{ relPath: string, purpose: string, deps: string[], elements: string[] }>> = new Map();

    function walk(dir: string, currentDepth: number = 0) {
        if (!fs.existsSync(dir)) return;
        if (maxDepth !== undefined && currentDepth > maxDepth) return;

        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'dist' || item.name === 'build') continue;
            
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                walk(fullPath, currentDepth + 1);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.dart', '.py', '.java', '.cpp', '.go', '.tsx', '.jsx'].includes(ext)) {
                    if (fileCount < offset) {
                        fileCount++;
                        continue;
                    }
                    if (fileCount - offset >= limit) {
                        skippedFiles.push(normalizePath(path.relative(featurePath, fullPath)) || item.name);
                        continue;
                    }
                    fileCount++;
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const struct = extractStructure(content);
                    struct.purpose = extractPurpose(content, item.name);
                    
                    let elementsToPrint = struct.elements;
                    if (summarizeOnly) {
                        elementsToPrint = struct.elements.filter(e => e.startsWith('[CLASS]') || e.startsWith('[INTERFACE]') || e.startsWith('[TYPE]') || e.startsWith('[STRUCT]'));
                        if (elementsToPrint.length === 0) {
                            elementsToPrint = struct.elements.slice(0, 2);
                        } else {
                            elementsToPrint = elementsToPrint.slice(0, 5);
                        }
                    }

                    const relPath = normalizePath(path.relative(featurePath, fullPath)) || item.name;

                    if (groupByFeature) {
                        const parts = relPath.split('/');
                        const groupKey = parts.length > 1 ? parts[0] : 'root';
                        if (!featureGroups.has(groupKey)) {
                            featureGroups.set(groupKey, []);
                        }
                        featureGroups.get(groupKey)!.push({
                            relPath,
                            purpose: struct.purpose,
                            deps: struct.dependencies,
                            elements: elementsToPrint
                        });
                    } else if (struct.dependencies.length > 0 || elementsToPrint.length > 0 || summarizeOnly) {
                        result += `#### 📄 ${relPath}\n`;
                        result += `  - 🎯 **Purpose**: ${struct.purpose}\n`;
                        if (struct.dependencies.length > 0) {
                            result += `  - 🔗 **Dependencies**: ${struct.dependencies.slice(0, 8).join(', ')}${struct.dependencies.length > 8 ? ', ...' : ''}\n`;
                        }
                        if (elementsToPrint.length > 0) {
                            const maxItems = summarizeOnly ? 5 : 30;
                            result += elementsToPrint.slice(0, maxItems).map(s => `  - \`${s}\``).join('\n') + '\n';
                            if (elementsToPrint.length > maxItems) result += `  - ... (+${elementsToPrint.length - maxItems} more)\n`;
                        }
                        result += '\n';
                    }
                }
            }
        }
    }

    if (fs.statSync(featurePath).isDirectory()) {
        walk(featurePath, 0);
        if (groupByFeature && featureGroups.size > 0) {
            featureGroups.forEach((files, group) => {
                result += `### 📂 Feature Group: \`${group}\` (${files.length} files)\n`;
                files.forEach(f => {
                    result += `  - 📄 **${f.relPath}**: ${f.purpose}\n`;
                    if (f.elements.length > 0) {
                        result += `    ↳ ${f.elements.slice(0, 3).map(e => `\`${e}\``).join(', ')}\n`;
                    }
                });
                result += '\n';
            });
        }
    } else {
        // Single file
        const content = fs.readFileSync(featurePath, 'utf8');
        const struct = extractStructure(content);
        struct.purpose = extractPurpose(content, path.basename(featurePath));
        const relPath = normalizePath(path.basename(featurePath));
        result += `#### 📄 ${relPath}\n`;
        result += `  - 🎯 **Purpose**: ${struct.purpose}\n`;
        if (struct.dependencies.length > 0) {
            result += `  - 🔗 **Dependencies**: ${struct.dependencies.slice(0, 8).join(', ')}${struct.dependencies.length > 8 ? ', ...' : ''}\n`;
        }
        if (struct.elements.length > 0) {
            result += struct.elements.map(s => `  - \`${s}\``).join('\n') + '\n';
        }
        fileCount = 1;
    }

    if (fileCount === 0) return `No source files found in ${featurePath}`;
    
    if (skippedFiles.length > 0) {
        result += `\n⚠️  [AI NOTE]: ${skippedFiles.length} files were omitted to prevent context explosion.\n`;
        result += `**Omitted Files Summary (use --offset or --group-by-feature to view details):**\n`;
        result += skippedFiles.map(f => `  - 📁 \`${normalizePath(f)}\``).join('\n') + '\n';
    }
    
    return result;
}
