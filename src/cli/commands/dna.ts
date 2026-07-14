import { generateDNA, loadDNA, formatDNASummary } from '../../intelligence/project-dna.js';
import { printError, printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

export async function dnaCommand(
    projectPath: string,
    showOnly: boolean,
    format: OutputFormat,
    section?: string,
    query?: string,
    compress: boolean = true
): Promise<void> {
    if (showOnly || section || query) {
        const dna = loadDNA(projectPath);
        if (!dna) {
            printError('No DNA found. Run `deepsift dna` first to generate.');
            return;
        }
        outputDNAFiltered(dna, format, section, query, compress);
        return;
    }

    process.stdout.write('\x1b[36m🧬 Generating Project DNA...\x1b[0m\n');

    const dna = await generateDNA(projectPath, (phase, detail) => {
        process.stdout.write(`\x1b[33m  [${phase}]\x1b[0m ${detail}\n`);
    });

    outputDNAFiltered(dna, format, undefined, undefined, compress);

    const summary = formatDNASummary(dna);
    saveSearchLog(projectPath, ['[DNA Generation]'], summary);

    process.stdout.write('\x1b[32m✓ DNA saved and compressed to .deepsift/project-dna.toon\x1b[0m\n');
}

function outputDNAFiltered(dna: any, format: OutputFormat, section?: string, query?: string, compress: boolean = true): void {
    let resultObj = dna;

    // Filter by Section
    if (section) {
        const sectionMap: Record<string, string> = {
            identity: 'identity',
            design: 'designSystem',
            tokens: 'designSystem',
            architecture: 'architecture',
            arch: 'architecture',
            components: 'components',
            localization: 'localization',
            i18n: 'localization',
            conventions: 'conventions',
            rules: 'rules',
            assets: 'assets'
        };
        const key = sectionMap[section.toLowerCase()];
        if (key && dna[key]) {
            resultObj = dna[key];
        } else {
            printError(`Unknown section "${section}". Available: ${Object.keys(sectionMap).join(', ')}`);
            return;
        }
    }

    // Filter by Query
    if (query) {
        resultObj = recursiveQueryDna(resultObj, query);
        if (!resultObj) {
            printResult(`No matches found in DNA for query: "${query}"`, format);
            return;
        }
    }

    // Output Formatting
    let outputText = "";
    if (format === 'json') {
        outputText = JSON.stringify(resultObj, null, 2);
    } else {
        if (!section && !query) {
            outputText = formatDNASummary(resultObj);
        } else {
            outputText = `### DNA Query Results (${section || 'all'}:${query || ''})\n` + JSON.stringify(resultObj, null, 2);
        }
    }

    if (compress) {
        const optimizer = new TokenOptimizerService();
        outputText = optimizer.optimize(outputText).toUnifiedString();
    }

    printResult(outputText, format);
}

function recursiveQueryDna(obj: any, term: string): any {
    const t = term.toLowerCase();
    if (typeof obj === 'string') {
        return obj.toLowerCase().includes(t) ? obj : null;
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return String(obj).toLowerCase().includes(t) ? obj : null;
    }
    if (Array.isArray(obj)) {
        const matched = obj.map(item => recursiveQueryDna(item, term)).filter(item => item !== null);
        return matched.length > 0 ? matched : null;
    }
    if (typeof obj === 'object' && obj !== null) {
        const res: any = {};
        let hasMatch = false;
        for (const key of Object.keys(obj)) {
            if (key.toLowerCase().includes(t)) {
                res[key] = obj[key];
                hasMatch = true;
            } else {
                const valMatch = recursiveQueryDna(obj[key], term);
                if (valMatch !== null) {
                    res[key] = valMatch;
                    hasMatch = true;
                }
            }
        }
        return hasMatch ? res : null;
    }
    return null;
}
