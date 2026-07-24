/**
 * @file git-churn-miner.ts
 * @description Git Hotspot Heatmap & Churn Risk Miner Engine.
 * Combines commit change frequency with file size complexity to calculate refactoring risk scores.
 * 
 * @module analyzers/git-churn-miner
 * @category Security & Diagnostics
 * @since 1.0.3
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Single git churn hotspot item with commit counts and calculated risk score.
 */
export interface GitChurnItem {
    file: string;
    commitCount: number;
    lineCount: number;
    riskScore: number;
}

/**
 * Miner that extracts commit frequency and churn hotspots from Git repository history.
 */
export class GitChurnMiner {
    private projectPath: string;

    /**
     * Initializes the GitChurnMiner.
     * @param projectPath Absolute path to workspace root.
     */
    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Analyzes Git commit history and calculates risk score heatmaps for source files.
     * 
     * @returns Array of ranked GitChurnItem hotspot records.
     * @example
     * ```ts
     * const miner = new GitChurnMiner(process.cwd());
     * const hotspots = miner.analyze();
     * ```
     */
    public analyze(): GitChurnItem[] {
        const results: GitChurnItem[] = [];

        try {
            const output = execSync('git log --name-only --format=""', {
                cwd: this.projectPath,
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'ignore']
            });

            const counts = new Map<string, number>();
            const lines = output.split('\n');

            lines.forEach(l => {
                const trimmed = l.trim();
                if (trimmed && fs.existsSync(path.join(this.projectPath, trimmed))) {
                    counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
                }
            });

            counts.forEach((commitCount, file) => {
                try {
                    const content = fs.readFileSync(path.join(this.projectPath, file), 'utf-8');
                    const lineCount = content.split('\n').length;
                    const riskScore = parseFloat((commitCount * Math.sqrt(lineCount)).toFixed(1));

                    results.push({
                        file,
                        commitCount,
                        lineCount,
                        riskScore
                    });
                } catch (e) {
                    // Safe ignore
                }
            });
        } catch (e) {
            // Safe ignore if git is absent
        }

        results.sort((a, b) => b.riskScore - a.riskScore);
        return results.slice(0, 30);
    }
}
