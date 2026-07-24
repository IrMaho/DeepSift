import fs from 'fs';
import path from 'path';

export interface ImpactReport {
    symbol: string;
    affectedFilesCount: number;
    affectedCallSitesCount: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedCallers: { file: string; line: number; snippet: string }[];
}

export class ImpactAnalyzer {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

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
                // Ignore
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
