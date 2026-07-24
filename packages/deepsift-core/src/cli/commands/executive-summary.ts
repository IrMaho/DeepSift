import path from 'path';
import fs from 'fs';
import { loadDNA } from '../../intelligence/project-dna.js';
import { printHeader } from '../cli-output.js';

export async function executiveSummaryCommand(options: { json?: boolean } = {}) {
    const projectPath = process.cwd();
    const dna = loadDNA(projectPath);
    const pkgPath = path.join(projectPath, 'package.json');
    let pkgName = path.basename(projectPath);
    let version = '1.0.0';

    if (fs.existsSync(pkgPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            pkgName = parsed.name || pkgName;
            version = parsed.version || version;
        } catch {
        }
    }

    const languages = dna?.identity?.languages ? Object.keys(dna.identity.languages) : ['TypeScript'];
    const godNodes = dna?.architecture?.graph?.godNodes || [];

    const summary = {
        projectName: dna?.identity?.name || pkgName,
        version,
        primaryLanguages: languages,
        godNodesCount: godNodes.length,
        godNodesTop3: godNodes.slice(0, 3),
        totalFiles: dna?.architecture?.topology ? dna.architecture.topology.split('\n').length : 0,
        hasTests: (dna?.testing?.timeBombs || []).length > 0
    };

    if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
    }

    printHeader(`🚀 Executive Summary: ${summary.projectName} v${summary.version}`);
    console.log(`\x1b[33mPrimary Languages:\x1b[0m ${summary.primaryLanguages.join(', ')}`);
    console.log(`\x1b[33mGod Nodes (Core Logic Hubs):\x1b[0m ${summary.godNodesCount}`);
    summary.godNodesTop3.forEach((g: string) => console.log(`  ⭐ ${g}`));
    console.log(`\x1b[33mTest Coverage Status:\x1b[0m ${summary.hasTests ? '✅ Tests present' : '⚠️ Untested codebase'}\n`);
}
