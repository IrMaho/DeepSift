import { generateDNA } from '../../intelligence/project-dna.js';
import { minePatterns } from '../../analyzers/pattern-miner.js';
import { printError, printResult } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import fs from 'fs';
import path from 'path';

export async function learnCommand(projectPath: string, target: string): Promise<void> {
    if (target !== 'patterns') {
        printError(`Unknown target for scan: ${target}. Try 'deepsift scan patterns'.`);
        return;
    }

    try {
        process.stdout.write(`\x1b[36m🧠 Scanning codebase for auto-discoverable patterns...\x1b[0m\n`);
        
        const { unifiedWalk } = await import('../../core/unified-walker.js');
        const walkResult = await unifiedWalk(projectPath);

        // We generate a lightweight DNA to get the SimilarityGroups
        const dna = await generateDNA(projectPath, walkResult, (phase: string, detail: string) => {
            if (phase === 'similarity' || phase === 'graph') {
                process.stdout.write(`  \x1b[33m[${phase}]\x1b[0m ${detail}\n`);
            }
        });

        const patterns = minePatterns(dna, projectPath);

        if (patterns.length === 0) {
            process.stdout.write(`\n\x1b[33mNo dominant patterns discovered.\x1b[0m\n`);
            return;
        }

        process.stdout.write(`\n\x1b[32m✨ Discovered the following dominant coding patterns:\x1b[0m\n\n`);
        patterns.forEach(p => {
            process.stdout.write(`- \x1b[1m${p.category}\x1b[0m: ${p.name} (Confidence: ${(p.evidence.frequency * 100).toFixed(0)}%)\n`);
            process.stdout.write(`  ↳ ${p.description}\n`);
        });

        process.stdout.write(`\n\x1b[36m[DRAFT PREVIEW ONLY]\x1b[0m\n`);
        process.stdout.write(`Agent: Please review these patterns with the user. If approved, add them to \`.deepsift/learned-patterns.json\`.\n`);

        await saveSearchLog(projectPath, ['[Pattern Auto-Discovery]'], JSON.stringify(patterns, null, 2));

    } catch (e) {
        printError(`Failed to scan patterns: ${e}`);
    }
}
