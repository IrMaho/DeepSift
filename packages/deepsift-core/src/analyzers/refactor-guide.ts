import fs from 'fs';
import path from 'path';

export interface RefactorStep {
    step: number;
    title: string;
    description: string;
    proposedFile: string;
}

export interface RefactorGuideReport {
    godNodeFile: string;
    lineCount: number;
    recommendation: string;
    steps: RefactorStep[];
}

export class RefactorGuideEngine {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public generateGuide(godNodeFile: string): RefactorGuideReport {
        const fullPath = path.resolve(this.projectPath, godNodeFile);
        const relPath = path.relative(this.projectPath, fullPath);
        let lineCount = 0;
        let content = '';

        if (fs.existsSync(fullPath)) {
            content = fs.readFileSync(fullPath, 'utf-8');
            lineCount = content.split('\n').length;
        }

        const baseName = path.basename(relPath, path.extname(relPath));
        const dir = path.dirname(relPath);

        const steps: RefactorStep[] = [
            {
                step: 1,
                title: 'Extract Types & Interfaces',
                description: `Move all interface definitions and type aliases out of ${baseName} into a dedicated types module.`,
                proposedFile: path.join(dir, `${baseName}-types.ts`)
            },
            {
                step: 2,
                title: 'Extract Pure Service Logic',
                description: `Isolate data processing, helper math, and stateless algorithms into a decoupled domain service class.`,
                proposedFile: path.join(dir, `${baseName}-service.ts`)
            },
            {
                step: 3,
                title: 'Extract Event & Network Handlers',
                description: `Separate network API requests, IPC message listeners, and async side-effects into a dedicated handler module.`,
                proposedFile: path.join(dir, `${baseName}-handlers.ts`)
            },
            {
                step: 4,
                title: 'Lean Controller Facade',
                description: `Convert ${baseName} into a thin delegate facade that coordinates the sub-services without holding heavy state logic.`,
                proposedFile: relPath
            }
        ];

        return {
            godNodeFile: relPath,
            lineCount,
            recommendation: `Split ${relPath} (${lineCount} lines) into 3 targeted sub-modules following Clean Architecture (SoC).`,
            steps
        };
    }
}
