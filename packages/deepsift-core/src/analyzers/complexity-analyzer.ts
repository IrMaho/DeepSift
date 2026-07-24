/**
 * @file complexity-analyzer.ts
 * @description Cyclomatic & Cognitive Complexity Heatmap Analyzer Engine.
 * Calculates branch complexity scores for functions, methods, and modules to flag high-risk refactoring targets.
 * 
 * @module analyzers/complexity-analyzer
 * @category Security & Diagnostics
 * @since 1.0.3
 */

import fs from 'fs';
import path from 'path';
import { isBundledOrMinifiedFile } from './entropy-filter.js';

/**
 * Calculated complexity metrics for a single function or method.
 */
export interface FunctionComplexity {
    name: string;
    file: string;
    line: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    status: 'low' | 'moderate' | 'high' | 'critical';
}

/**
 * Summary report containing complexity metrics across target codebase directory.
 */
export interface ComplexityReport {
    functions: FunctionComplexity[];
    totalFunctions: number;
    highComplexityCount: number;
    averageComplexity: number;
}

/**
 * Analyzer that scans source code and calculates Cyclomatic and Cognitive complexity scores.
 */
export class ComplexityAnalyzer {
    private projectPath: string;

    /**
     * Initializes the ComplexityAnalyzer.
     * @param projectPath Absolute path to workspace root.
     */
    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Scans source files and generates a complexity report highlighting refactoring hotspots.
     * 
     * @param targetPath Target folder or file path to analyze.
     * @param includeBundled Whether to include minified or bundled files.
     * @returns ComplexityReport containing ranked function complexity metrics.
     * @example
     * ```ts
     * const analyzer = new ComplexityAnalyzer(process.cwd());
     * const report = analyzer.analyze('src/core');
     * ```
     */
    public analyze(targetPath?: string, includeBundled = false): ComplexityReport {
        const searchDir = targetPath ? path.resolve(this.projectPath, targetPath) : this.projectPath;
        const files = this.collectFiles(searchDir);

        const functions: FunctionComplexity[] = [];

        for (const file of files) {
            try {
                const relFile = path.relative(this.projectPath, file);
                const content = fs.readFileSync(file, 'utf-8');
                if (!includeBundled && isBundledOrMinifiedFile(relFile, content)) {
                    continue;
                }
                const fileFuncs = this.parseFunctionsInFile(content, relFile);
                functions.push(...fileFuncs);
            } catch (e) {
                // Safe ignore
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

    /**
     * Parses function declarations and branch complexity in a single file content.
     */
    private parseFunctionsInFile(content: string, relFile: string): FunctionComplexity[] {
        const results: FunctionComplexity[] = [];
        const lines = content.split('\n');

        let currentFunc: { name: string; startLine: number; cyclomatic: number; cognitive: number } | null = null;
        let braceCount = 0;

        lines.forEach((line, idx) => {
            const lineNum = idx + 1;

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
                }
            }
        });

        return results;
    }

    /**
     * Recursively collects code source files.
     */
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
            } else if (/\.(ts|js|tsx|jsx|py|go|dart|rs|java|c|cpp)$/i.test(entry.name)) {
                files.push(full);
            }
        }
        return files;
    }
}
