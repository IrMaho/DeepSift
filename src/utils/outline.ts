import fs from 'fs';
import path from 'path';

function extractStructure(content: string): { dependencies: string[], elements: string[] } {
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
        let funcMatch = line.match(/^(?:export\s+|public\s+|private\s+|protected\s+|static\s+|async\s+|default\s+)*(function|const|let|var)\s+([\w_]+)/);
        if (funcMatch) {
            elements.push(`[${funcMatch[1].toUpperCase()}] ${funcMatch[2]}`);
            continue;
        }

        // Methods (heuristic: starts with word, has parens, has brace, inside a class usually)
        let methodMatch = line.match(/^(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([\w_]+)\s*\([^)]*\)\s*(?::\s*[\w_<>[\]]+)?\s*\{/);
        if (methodMatch) {
            const name = methodMatch[1];
            if (!['if', 'for', 'while', 'switch', 'catch', 'return'].includes(name)) {
                elements.push(`  ↳ [Method] ${name}()`);
            }
            continue;
        }
    }
    
    return {
        dependencies: [...new Set(dependencies)],
        elements: elements
    };
}

export function getFeatureOutline(featurePath: string, limit: number = 15, offset: number = 0): string {
    if (!fs.existsSync(featurePath)) return `Path not found: ${featurePath}`;
    
    let result = `### Feature Outline: ${path.basename(featurePath)}\n`;
    result += `(Showing up to ${limit} files, starting from offset ${offset})\n\n`;
    let fileCount = 0;
    let skippedCount = 0;

    function walk(dir: string) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules') continue;
            
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                walk(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.dart', '.py', '.java', '.cpp', '.go', '.tsx', '.jsx'].includes(ext)) {
                    if (fileCount < offset) {
                        fileCount++;
                        continue;
                    }
                    if (fileCount - offset >= limit) {
                        skippedCount++;
                        continue;
                    }
                    fileCount++;
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const struct = extractStructure(content);
                    if (struct.dependencies.length > 0 || struct.elements.length > 0) {
                        const relPath = path.relative(featurePath, fullPath) || item.name;
                        result += `#### 📄 ${relPath}\n`;
                        if (struct.dependencies.length > 0) {
                            result += `  - 🔗 **Dependencies**: ${struct.dependencies.slice(0, 8).join(', ')}${struct.dependencies.length > 8 ? ', ...' : ''}\n`;
                        }
                        if (struct.elements.length > 0) {
                            result += struct.elements.slice(0, 30).map(s => `  - \`${s}\``).join('\n') + '\n';
                            if (struct.elements.length > 30) result += `  - ... (+${struct.elements.length - 30} more)\n`;
                        }
                        result += '\n';
                    }
                }
            }
        }
    }

    if (fs.statSync(featurePath).isDirectory()) {
        walk(featurePath);
    } else {
        // Single file
        const content = fs.readFileSync(featurePath, 'utf8');
        const struct = extractStructure(content);
        result += `#### 📄 ${path.basename(featurePath)}\n`;
        if (struct.dependencies.length > 0) {
            result += `  - 🔗 **Dependencies**: ${struct.dependencies.slice(0, 8).join(', ')}${struct.dependencies.length > 8 ? ', ...' : ''}\n`;
        }
        if (struct.elements.length > 0) {
            result += struct.elements.map(s => `  - \`${s}\``).join('\n') + '\n';
        }
        fileCount = 1;
    }

    if (fileCount === 0) return `No source files found in ${featurePath}`;
    
    if (skippedCount > 0) {
        result += `\n⚠️  [AI NOTE]: ${skippedCount} files were omitted to prevent context explosion. Please run \`deepsift feature\` on a more specific subfolder to see them.\n`;
    }
    
    return result;
}
