import fs from 'fs';
import path from 'path';

function extractSignatures(content: string): string[] {
    const lines = content.split('\n');
    const signatures: string[] = [];
    let captureMode = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match class or function definitions broadly
        if (line.match(/^(class|interface|enum|mixin|extension|struct)\s+\w+/) || 
            line.match(/^(public|private|protected|static|async|Future|void|int|String|bool|Widget)\s+.*\(.*\)/) ||
            line.match(/^(export|function|const|let|var)\s+\w+/) ||
            line.startsWith('import ')) {
            
            // Only take the signature line, not the body
            let signature = line.replace(/\{.*$/, '').trim();
            if (signature.endsWith('{')) signature = signature.substring(0, signature.length - 1).trim();
            signatures.push(signature);
        }
    }
    
    // Remove duplicate imports
    return [...new Set(signatures)];
}

export function getFeatureOutline(featurePath: string): string {
    if (!fs.existsSync(featurePath)) return `Path not found: ${featurePath}`;
    
    let result = `### Feature Outline: ${path.basename(featurePath)}\n\n`;
    let fileCount = 0;

    function walk(dir: string) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules') continue;
            
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                walk(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.js', '.dart', '.py', '.java', '.cpp', '.go'].includes(ext)) {
                    fileCount++;
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const sigs = extractSignatures(content);
                    if (sigs.length > 0) {
                        const relPath = path.relative(featurePath, fullPath) || item.name;
                        result += `#### 📄 ${relPath}\n`;
                        result += sigs.slice(0, 30).map(s => `  - \`${s}\``).join('\n');
                        if (sigs.length > 30) result += `\n  - ... (+${sigs.length - 30} more)`;
                        result += '\n\n';
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
        const sigs = extractSignatures(content);
        result += `#### 📄 ${path.basename(featurePath)}\n`;
        result += sigs.map(s => `  - \`${s}\``).join('\n');
        fileCount = 1;
    }

    if (fileCount === 0) return `No source files found in ${featurePath}`;
    return result;
}
