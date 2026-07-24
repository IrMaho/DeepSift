import fs from 'fs';
import path from 'path';

export interface FunctionComplexity {
    name: string;
    file: string;
    line: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    status: 'low' | 'moderate' | 'high' | 'critical';
}

export interface ComplexityReport {
    functions: FunctionComplexity[];
    totalFunctions: number;
    highComplexityCount: number;
    averageComplexity: number;
}

export class ComplexityAnalyzer {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public analyze(targetPath?: string): ComplexityReport {
        const searchDir = targetPath ? path.resolve(this.projectPath, targetPath) : this.projectPath;
        const files = this.collectFiles(searchDir);

        const functions: FunctionComplexity[] = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relFile = path.relative(this.projectPath, file);
                const fileFuncs = this.parseFunctionsInFile(content, relFile);
                functions.push(...fileFuncs);
            } catch (e) {
                // Skip read errors
            }
        }

        const highCount = functions.filter(f => f.cyclomaticComplexity > 10).length;
        const sum = functions.reduce((acc, f) => acc + f.cyclomaticComplexity, 0);
        const avg = functions.length > 0 ? parseFloat((sum / functions.length).toFixed(2)) : 0;

        functions.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);

        return {
            functions,
            totalFunctions: functions.length,
            highComplexityCount: highCount,
            averageComplexity: avg
        };
    }

    private parseFunctionsInFile(content: string, relFile: string): FunctionComplexity[] {
        const results: FunctionComplexity[] = [];
        const lines = content.split('\n');

        let currentFunc: { name: string; startLine: number; cyclomatic: number; cognitive: number } | null = null;
        let braceCount = 0;

        lines.forEach((line, idx) => {
            const lineNum = idx + 1;

            // Detect function declaration
            const funcMatch = line.match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(|([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{)/);
            if (funcMatch && !currentFunc) {
                const name = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
                currentFunc = {
                    name,
                    startLine: lineNum,
                    cyclomatic: 1,
                    cognitive: 0
                };
                braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                return;
            }

            if (currentFunc) {
                braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

                // Branching keywords that increase complexity
                const branches = line.match(/\b(if|else\s+if|for|while|switch|case|catch|&&|\|\||\?)\b/g);
                if (branches) {
                    currentFunc.cyclomatic += branches.length;
                    currentFunc.cognitive += branches.length;
                }

                if (braceCount <= 0) {
                    let status: FunctionComplexity['status'] = 'low';
                    if (currentFunc.cyclomatic > 20) status = 'critical';
                    else if (currentFunc.cyclomatic > 10) status = 'high';
                    else if (currentFunc.cyclomatic > 5) status = 'moderate';

                    results.push({
                        name: currentFunc.name,
                        file: relFile,
                        line: currentFunc.startLine,
                        cyclomaticComplexity: currentFunc.cyclomatic,
                        cognitiveComplexity: currentFunc.cognitive,
                        status
                    });
                    currentFunc = null;
                    braceCount = 0;
                }
            }
        });

        return results;
    }

    private collectFiles(dir: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', '.deepsift', 'dist', 'build'].includes(entry.name)) {
                    files.push(...this.collectFiles(full));
                }
            } else if (/\.(ts|js|tsx|jsx|py|go|dart|rs|java|cpp|c)$/i.test(entry.name)) {
                files.push(full);
            }
        }
        return files;
    }
}
