import { generateDNA, loadDNA, formatDNASummary } from '../../intelligence/project-dna.js';
import { printError } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';

export async function dnaCommand(
    projectPath: string,
    showOnly: boolean,
    format: string
): Promise<void> {
    if (showOnly) {
        const dna = loadDNA(projectPath);
        if (!dna) {
            printError('No DNA found. Run `deepsift dna` first to generate.');
            return;
        }
        outputDNA(dna, format);
        return;
    }

    process.stdout.write('\x1b[36m🧬 Generating Project DNA...\x1b[0m\n');

    const dna = await generateDNA(projectPath, (phase, detail) => {
        process.stdout.write(`\x1b[33m  [${phase}]\x1b[0m ${detail}\n`);
    });

    outputDNA(dna, format);

    const summary = formatDNASummary(dna);
    saveSearchLog(projectPath, ['[DNA Generation]'], summary);

    process.stdout.write('\x1b[32m✓ DNA saved to .deepsift/project-dna.json\x1b[0m\n');
}

function outputDNA(dna: any, format: string): void {
    if (format === 'json') {
        process.stdout.write(JSON.stringify(dna, null, 2) + '\n');
    } else {
        process.stdout.write('\n' + formatDNASummary(dna) + '\n');
    }
}
