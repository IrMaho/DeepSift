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

    const { unifiedWalk } = await import('../../core/unified-walker.js');
    const walkResult = await unifiedWalk(projectPath, (phase, detail) => {
        process.stdout.write(`\x1b[33m  [${phase}]\x1b[0m ${detail}\n`);
    });

    const dna = await generateDNA(projectPath, walkResult, (phase, detail) => {
        process.stdout.write(`\x1b[33m  [${phase}]\x1b[0m ${detail}\n`);
    });

    outputDNAFiltered(dna, format, undefined, undefined, compress, undefined, undefined, undefined, false);

    const summary = formatDNASummary(dna);
    await saveSearchLog(projectPath, ['[DNA Generation]'], summary, { skipVisuals: !compress });

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
            outputText = formatCleanMarkdownDNA(resultObj, section || 'custom');
        }
    }

    if (compress && format !== 'json') {
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
    const t = term.toLowerCase().replace(/\\/g, '/');
    if (typeof obj === 'string') {
        return obj.toLowerCase().replace(/\\/g, '/').includes(t) ? obj : null;
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

export function formatCleanMarkdownDNA(data: any, sectionName: string): string {
    const lines: string[] = [];
    lines.push(`### 🧬 DNA Section: ${sectionName.toUpperCase()}`);
    lines.push('');

    function renderNode(val: any, depth: number = 0): void {
        const indent = '  '.repeat(depth);
        if (val === null || val === undefined) return;

        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            lines.push(`${indent}- ${String(val)}`);
            return;
        }

        if (Array.isArray(val)) {
            val.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    const title = item.name || item.filePath || item.id || item.pattern || item.category || 'Item';
                    lines.push(`${indent}- **${title}**`);
                    for (const [k, v] of Object.entries(item)) {
                        if (['name', 'id'].includes(k)) continue;
                        if (typeof v === 'object' && v !== null) {
                            lines.push(`${indent}  - **${k}**:`);
                            renderNode(v, depth + 2);
                        } else {
                            lines.push(`${indent}  - **${k}**: ${String(v)}`);
                        }
                    }
                } else {
                    lines.push(`${indent}- ${String(item)}`);
                }
            });
            return;
        }

        if (typeof val === 'object') {
            for (const [k, v] of Object.entries(val)) {
                if (k === 'graph' || k === 'raw') continue; // Hide raw node graphs in MD summary
                if (typeof v === 'object' && v !== null) {
                    lines.push(`${indent}- **${k}**:`);
                    renderNode(v, depth + 1);
                } else {
                    lines.push(`${indent}- **${k}**: ${String(v)}`);
                }
            }
        }
    }

    renderNode(data, 0);
    return lines.join('\n');
}
