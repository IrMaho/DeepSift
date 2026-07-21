import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectDNA } from '../types/dna-types.js';

/**
 * Executes a git command safely and returns its stdout.
 * Returns null if the command fails (e.g. not a git repo).
 */
function runGitCmd(cmd: string, cwd: string): string | null {
    try {
        const result = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' });
        return result.trim();
    } catch {
        return null;
    }
}

/**
 * Integrates temporal data (git history) into the project DNA.
 */
export function integrateTemporalMiner(
    projectPath: string,
    dna: ProjectDNA,
    onProgress?: (phase: string, detail: string) => void
): void {
    if (!dna.temporal) {
        dna.temporal = {
            godNodeAges: [],
            bottlenecks: [],
            deadZones: [],
            recentUncommittedAnomalies: []
        };
    }

    // Check if it's a git repo
    const isGit = runGitCmd('git rev-parse --is-inside-work-tree', projectPath);
    if (!isGit) {
        if (onProgress) onProgress('temporal', 'Not a git repository. Skipping temporal analysis.');
        return;
    }

    const godNodes = dna.architecture.coreFiles || [];
    const bottleneckThreshold = 10; // commits in last 30 days
    const deadZoneDaysThreshold = 365;

    let processed = 0;
    
    // Analyze God Nodes
    for (const nodePath of godNodes) {
        processed++;
        if (onProgress && processed % 5 === 0) {
            onProgress('temporal', `Analyzing history... (${processed}/${godNodes.length})`);
        }

        const absPath = path.join(projectPath, nodePath);
        if (!fs.existsSync(absPath)) continue;

        // 1. Creation Date & Total Commits
        const createdAtStr = runGitCmd(`git log --reverse --format="%ad" --date=short -- "${nodePath}" | head -n 1`, projectPath);
        const totalCommitsStr = runGitCmd(`git rev-list --count HEAD -- "${nodePath}"`, projectPath);
        
        // 2. Recent Commits (last 30 days)
        const recentCommitsStr = runGitCmd(`git rev-list --count --since="30 days ago" HEAD -- "${nodePath}"`, projectPath);
        
        // 3. Last Modified Date
        const lastModifiedStr = runGitCmd(`git log -1 --format="%ad" --date=short -- "${nodePath}"`, projectPath);

        const totalCommits = parseInt(totalCommitsStr || '0', 10);
        const recentCommits = parseInt(recentCommitsStr || '0', 10);

        if (createdAtStr && totalCommits > 0) {
            dna.temporal.godNodeAges.push({
                filePath: nodePath,
                createdAt: createdAtStr.split('\n')[0],
                totalCommits,
                recentCommits,
                contributors: [] // could be extracted with git shortlog, but skipped for performance
            });
        }

        if (recentCommits >= bottleneckThreshold) {
            dna.temporal.bottlenecks.push(nodePath);
        }

        if (lastModifiedStr) {
            const lastModifiedDate = new Date(lastModifiedStr.split('\n')[0]);
            const now = new Date();
            const daysSince = Math.floor((now.getTime() - lastModifiedDate.getTime()) / (1000 * 3600 * 24));
            
            if (daysSince >= deadZoneDaysThreshold) {
                dna.temporal.deadZones.push({
                    filePath: nodePath,
                    lastModified: lastModifiedStr.split('\n')[0],
                    daysSinceModified: daysSince
                });
            }
        }
    }

    // 4. AI Regress Healer: Find recent uncommitted anomalies (Git Diff)
    // We look at the diff since HEAD to see if any God Nodes or heavily connected files were touched.
    if (onProgress) onProgress('temporal', 'Analyzing recent unstaged anomalies for AI Regress Healer...');
    
    const diffStat = runGitCmd(`git diff HEAD --numstat`, projectPath);
    if (diffStat) {
        const diffLines = diffStat.split('\n').filter(l => l.trim() !== '');
        for (const line of diffLines) {
            const parts = line.split('\t');
            if (parts.length === 3) {
                const added = parseInt(parts[0], 10);
                const deleted = parseInt(parts[1], 10);
                const filePath = parts[2];

                // Only record significant anomalies (e.g. lots of deletions in a core file)
                if (godNodes.includes(filePath) && (added > 0 || deleted > 0)) {
                    dna.temporal.recentUncommittedAnomalies?.push({
                        filePath,
                        addedLines: added,
                        deletedLines: deleted,
                        warning: deleted > added * 2 ? 'High deletion ratio in a God Node! Possible AI regress.' : 'Uncommitted changes in core file.'
                    });
                }
            }
        }
    }
}
