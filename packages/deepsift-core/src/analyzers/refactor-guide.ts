/**
 * @file refactor-guide.ts
 * @description God Node Decomposition Roadmap Generator Engine.
 * Analyzes large monolithic files and auto-generates step-by-step Clean Architecture (SoC) refactoring roadmaps.
 * 
 * @module analyzers/refactor-guide
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */

import fs from 'fs';
import path from 'path';

/**
 * Step detail in a refactoring guide roadmap.
 */
export interface RefactorStep {
    step: number;
    title: string;
    description: string;
    proposedFile: string;
}

/**
 * Complete decomposition roadmap report for a monolithic file.
 */
export interface RefactorGuideReport {
    godNodeFile: string;
    lineCount: number;
    recommendation: string;
    steps: RefactorStep[];
}

/**
 * Engine that generates architectural decomposition blueprints for large God Nodes.
 */
export class RefactorGuideEngine {
    private projectPath: string;

    /**
     * Initializes the RefactorGuideEngine.
     * @param projectPath Absolute path to workspace root.
     */
    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Generates a step-by-step Clean Architecture refactoring roadmap for a targeted God Node file.
     * 
     * @param godNodeFile Relative or absolute path to the target file.
     * @returns RefactorGuideReport object containing actionable decomposition steps.
     * @example
     * ```ts
     * const engine = new RefactorGuideEngine(process.cwd());
     * const guide = engine.generateGuide('src/server.ts');
     * ```
     */
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
