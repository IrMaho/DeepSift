import fs from 'fs';
import path from 'path';

function extractPurpose(content: string, fileName: string): string {
    const lines = content.split('\n');
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i].trim();
        const jsdocMatch = line.match(/^\*\s+(.{10,80})/);
        if (jsdocMatch && !jsdocMatch[1].startsWith('@')) return jsdocMatch[1].trim();
        const commentMatch = line.match(/^\/\/\s+(.{10,80})/);
        if (commentMatch) return commentMatch[1].trim();
    }

    const classCount = (content.match(/\bclass\s+/g) || []).length;
    const hookCount = (content.match(/\buse[A-Z]\w+/g) || []).length;
    const testCount = (content.match(/\b(describe|it|test)\s*\(/g) || []).length;
    const routeCount = (content.match(/\b(router|route|app\.(get|post|put|delete))/gi) || []).length;
    const exportCount = (content.match(/\bexport\s+(default\s+)?(function|const|class)/g) || []).length;

    if (testCount > 2) return `Test suite (${testCount} test cases)`;
    if (hookCount > 2) return `React hooks module (${hookCount} hooks)`;
    if (routeCount > 1) return `Route/API handler (${routeCount} routes)`;
    if (classCount > 1) return `Multi-class module (${classCount} classes)`;
    if (exportCount > 5) return `Utility/helper barrel (${exportCount} exports)`;

    const baseName = path.basename(fileName, path.extname(fileName));
    const words = baseName.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    return `${words} module`;
}

function extractStructure(content: string): { dependencies: string[], elements: string[], purpose: string } {
    const lines = content.split('\n');
    const dependencies: string[] = [];
    const elements: string[] = [];
    
    let currentClass = '';

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
            currentClass = classMatch[2];
            elements.push(`[${classMatch[1].toUpperCase()}] ${currentClass}`);
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

        // Methods (heuristic: starts with word, has parens, has brace, inside a class usually)
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

export function getFeatureOutline(featurePath: string, limit: number = 20, offset: number = 0, summarizeOnly: boolean = false, maxDepth?: number): string {
    let result = '';
    const baseDir = path.basename(featurePath);
    result += `### Feature Outline: ${baseDir}\n`;
    
    if (limit !== undefined && offset !== undefined) {
        result += `*(Showing up to ${limit} files, starting from offset ${offset}${maxDepth !== undefined ? `, maxDepth ${maxDepth}` : ''}${summarizeOnly ? ', summary-only' : ''})*\n\n`;
    } else {
        result += '\n';
    }

    let fileCount = 0;
    const skippedFiles: string[] = [];

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
                        skippedFiles.push(path.relative(featurePath, fullPath) || item.name);
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

                    if (struct.dependencies.length > 0 || elementsToPrint.length > 0 || summarizeOnly) {
                        const relPath = path.relative(featurePath, fullPath) || item.name;
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
    } else {
        // Single file
        const content = fs.readFileSync(featurePath, 'utf8');
        const struct = extractStructure(content);
        struct.purpose = extractPurpose(content, path.basename(featurePath));
        result += `#### 📄 ${path.basename(featurePath)}\n`;
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
        result += `**Omitted Files Summary (use --offset to view details):**\n`;
        result += skippedFiles.map(f => `  - 📁 \`${f}\``).join('\n') + '\n';
    }
    
    return result;
}
