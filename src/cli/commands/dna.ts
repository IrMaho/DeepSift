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
    compress: boolean = true,
    limit?: number,
    offset?: number,
    pathFilter?: string,
    showMetaOnly: boolean = false
): Promise<void> {
    if (showOnly || section || query || pathFilter || showMetaOnly || limit !== undefined || offset !== undefined) {
        const dna = loadDNA(projectPath);
        if (!dna) {
            printError('No DNA found. Run `deepsift dna` first to generate.');
            return;
        }
        outputDNAFiltered(dna, format, section, query, compress, limit, offset, pathFilter, showMetaOnly);
        return;
    }

    process.stdout.write('\x1b[36m🧬 Generating Project DNA...\x1b[0m\n');

    const dna = await generateDNA(projectPath, (phase, detail) => {
        process.stdout.write(`\x1b[33m  [${phase}]\x1b[0m ${detail}\n`);
    });

    outputDNAFiltered(dna, format, undefined, undefined, compress, undefined, undefined, undefined, false);

    const summary = formatDNASummary(dna);
    saveSearchLog(projectPath, ['[DNA Generation]'], summary);

    process.stdout.write('\x1b[32m✓ DNA saved and compressed to .deepsift/project-dna.toon\x1b[0m\n');
}

function outputDNAFiltered(
    dna: any, 
    format: OutputFormat, 
    section?: string, 
    query?: string, 
    compress: boolean = true,
    limit?: number,
    offset?: number,
    pathFilter?: string,
    showMetaOnly: boolean = false
): void {
    let resultObj = dna;

    // 1. Filter by Section
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

    // 2. Filter by Query (Keyword Pruning)
    if (query) {
        resultObj = recursiveQueryDna(resultObj, query);
        if (!resultObj || (typeof resultObj === 'object' && Object.keys(resultObj).length === 0)) {
            printResult(`No matches found in DNA for query: "${query}"`, format);
            return;
        }
    }

    // 3. Process Path-Filtering, Pagination, and Metadata
    resultObj = processDnaFilters(resultObj, pathFilter, undefined, limit, offset, showMetaOnly);

    if (!resultObj || (typeof resultObj === 'object' && Object.keys(resultObj).length === 0)) {
        printResult(`No matches found in DNA after filtering.`, format);
        return;
    }

    // Output Formatting
    let outputText = "";
    if (format === 'json') {
        outputText = JSON.stringify(resultObj, null, 2);
    } else {
        if (!section && !query && !pathFilter && !showMetaOnly && limit === undefined && offset === undefined) {
            outputText = formatDNASummary(resultObj);
        } else {
            outputText = `### DNA Query Results (section: ${section || 'all'}, limit: ${limit ?? 'none'}, offset: ${offset ?? 0}, pathFilter: ${pathFilter || 'none'}, metaOnly: ${showMetaOnly})\n` + JSON.stringify(resultObj, null, 2);
        }
    }

    if (compress) {
        const optimizer = new TokenOptimizerService();
        outputText = optimizer.optimize(outputText).toUnifiedString();
    }

    printResult(outputText, format);
}

export function processDnaFilters(
    obj: any, 
    pathFilter?: string, 
    query?: string, 
    limit?: number, 
    offset: number = 0, 
    showMetaOnly: boolean = false
): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        let processed = [...obj];

        // 1. Path Filtering (if items have filePath)
        if (pathFilter) {
            const pf = pathFilter.toLowerCase();
            processed = processed.filter(item => {
                if (item && typeof item === 'object' && typeof item.filePath === 'string') {
                    return item.filePath.toLowerCase().includes(pf);
                }
                return true;
            });
        }

        // 2. Keyword Query Filtering
        if (query) {
            const q = query.toLowerCase();
            processed = processed.filter(item => {
                return JSON.stringify(item).toLowerCase().includes(q);
            });
        }

        const totalCount = processed.length;

        if (showMetaOnly) {
            return {
                _type: "array",
                _totalCount: totalCount
            };
        }

        // 3. Pagination
        if (limit !== undefined) {
            processed = processed.slice(offset, offset + limit);
        }

        // Recursively process each item
        processed = processed.map(item => processDnaFilters(item, pathFilter, query, limit, offset, showMetaOnly));

        // Add pagination metadata
        if (processed.length < totalCount || limit !== undefined) {
            return {
                _totalCount: totalCount,
                _offset: offset,
                _limit: limit,
                items: processed
            };
        }

        return processed;
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            result[key] = processDnaFilters(obj[key], pathFilter, query, limit, offset, showMetaOnly);
        }
        return result;
    }

    return obj;
}

export function recursiveQueryDna(obj: any, term: string): any {
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
