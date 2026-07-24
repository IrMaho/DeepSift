import fs from 'fs';
import path from 'path';

export interface TypeDefinition {
    symbol: string;
    kind: 'interface' | 'type' | 'struct' | 'enum' | 'class' | 'unknown';
    filePath: string;
    startLine: number;
    endLine: number;
    rawCode: string;
    fields: { name: string; type: string; optional: boolean }[];
}

export class TypeResolver {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public resolve(symbolName: string): TypeDefinition | null {
        const files = this.collectSourceFiles(this.projectPath);
        const cleanSymbol = symbolName.trim();

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relFile = path.relative(this.projectPath, file);
                const lines = content.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    const typeMatch = line.match(new RegExp(`(?:export\\s+)?(?:interface|type|enum|struct|class)\\s+(${cleanSymbol})\\b`));
                    if (typeMatch) {
                        const kindMatch = line.match(/\b(interface|type|enum|struct|class)\b/);
                        const kind = (kindMatch ? kindMatch[1] : 'interface') as TypeDefinition['kind'];

                        let endLine = i + 1;
                        let braceCount = 0;
                        let codeLines: string[] = [];

                        for (let j = i; j < Math.min(i + 60, lines.length); j++) {
                            const curLine = lines[j];
                            codeLines.push(curLine);
                            braceCount += (curLine.match(/[\{\(]/g) || []).length - (curLine.match(/[\}\)]/g) || []).length;
                            endLine = j + 1;

                            if (j > i && braceCount <= 0 && (curLine.includes('}') || curLine.includes(';') || curLine.trim() === '')) {
                                break;
                            }
                        }

                        const rawCode = codeLines.join('\n');
                        const fields = this.extractFields(rawCode);

                        return {
                            symbol: cleanSymbol,
                            kind,
                            filePath: relFile,
                            startLine: i + 1,
                            endLine,
                            rawCode,
                            fields
                        };
                    }
                }
            } catch (e) {
            }
        }
        return null;
    }

    private extractFields(code: string): { name: string; type: string; optional: boolean }[] {
        const fields: { name: string; type: string; optional: boolean }[] = [];
        const lines = code.split('\n');

        for (const line of lines) {
            const fieldMatch = line.match(/^\s*([A-Za-z0-9_$]+)(\?)?:\s*(.+?)[;,]?$/);
            if (fieldMatch) {
                fields.push({
                    name: fieldMatch[1],
                    optional: !!fieldMatch[2],
                    type: fieldMatch[3].trim()
                });
            } else {
                const goMatch = line.match(/^\s*([A-Za-z0-9_$]+)\s+([A-Za-z0-9_$\[\]\*\.]+)/);
                if (goMatch && !['type', 'struct', 'interface', 'func', 'package'].includes(goMatch[1])) {
                    fields.push({
                        name: goMatch[1],
                        optional: false,
                        type: goMatch[2].trim()
                    });
                }
            }
        }
        return fields;
    }

    private collectSourceFiles(dir: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage'].includes(entry.name)) {
                    files.push(...this.collectSourceFiles(fullPath));
                }
            } else if (/\.(ts|tsx|js|jsx|dart|go|py|rs|java|cs)$/i.test(entry.name)) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
