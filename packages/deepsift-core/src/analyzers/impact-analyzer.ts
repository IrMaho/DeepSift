/**
 * @file impact-analyzer.ts
 * @description Breaking Change Impact Analyzer Module.
 * Traces symbol references across source files, calculates breaking risk scores,
 * and compiles call-site impact reports before performing refactoring.
 * 
 * @module analyzers/impact-analyzer
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */

import fs from 'fs';
import path from 'path';

/**
 * Report containing calculated impact metrics for a symbol modification.
 */
export interface ImpactReport {
    symbol: string;
    affectedFilesCount: number;
    affectedCallSitesCount: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedCallers: { file: string; line: number; snippet: string }[];
}

/**
 * Analyzer that evaluates breaking change risk for code symbols across the codebase.
 */
export class ImpactAnalyzer {
    private projectPath: string;

    /**
     * Initializes the ImpactAnalyzer.
     * @param projectPath Absolute path to workspace root.
     */
    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Calculates breaking change impact for a symbol by scanning call sites across source files.
     * 
     * @param symbol Symbol name to analyze (function, class, variable).
     * @returns ImpactReport object detailing affected files and risk score.
     * @example
     * ```ts
     * const analyzer = new ImpactAnalyzer(process.cwd());
     * const report = await analyzer.calculateImpact('NativeStore');
     * ```
     */
    public async calculateImpact(symbol: string): Promise<ImpactReport> {
        const files = this.collectFiles(this.projectPath);
        const affectedCallers: { file: string; line: number; snippet: string }[] = [];
        const filesSet = new Set<string>();

        const regex = new RegExp(`\\b${symbol}\\b`);

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relFile = path.relative(this.projectPath, file);
                const lines = content.split('\n');

                lines.forEach((line, idx) => {
                    if (regex.test(line) && !line.includes(`function ${symbol}`) && !line.includes(`const ${symbol}`)) {
                        filesSet.add(relFile);
                        affectedCallers.push({
                            file: relFile,
                            line: idx + 1,
                            snippet: line.trim()
                        });
                    }
                });
            } catch (e) {
                // Safe ignore
            }
        }

        let riskLevel: ImpactReport['riskLevel'] = 'low';
        if (filesSet.size > 10) riskLevel = 'critical';
        else if (filesSet.size > 5) riskLevel = 'high';
        else if (filesSet.size > 2) riskLevel = 'medium';

        return {
            symbol,
            affectedFilesCount: filesSet.size,
            affectedCallSitesCount: affectedCallers.length,
            riskLevel,
            affectedCallers
        };
    }

    /**
     * Synchronously collects all indexable code source files.
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
