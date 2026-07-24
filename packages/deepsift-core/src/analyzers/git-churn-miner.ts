import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface GitChurnItem {
    file: string;
    commitCount: number;
    lineCount: number;
    riskScore: number;
}

export class GitChurnMiner {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public analyze(): GitChurnItem[] {
        const results: GitChurnItem[] = [];

        try {
            // Get git log shortstat summary per file
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
                    // Risk Score = commit count * sqrt(line count)
                    const riskScore = parseFloat((commitCount * Math.sqrt(lineCount)).toFixed(1));

                    results.push({
                        file,
                        commitCount,
                        lineCount,
                        riskScore
                    });
                } catch (e) {
                    // Ignore
                }
            });
        } catch (e) {
            // Git command not available or not a git repository
        }

        results.sort((a, b) => b.riskScore - a.riskScore);
        return results.slice(0, 30);
    }
}
