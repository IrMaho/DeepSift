import { MemoEngine } from '../../memo/memo-engine.js';
import { printResult, printSuccess, printInfo, printError, OutputFormat } from '../cli-output.js';
import { MemoEntryType } from '../../types/memo-types.js';

export async function memoCommand(
    projectPath: string,
    action: string,
    target: string | undefined,
    extraArgs: string[],
    format: OutputFormat
) {
    const engine = new MemoEngine(projectPath);

    switch (action) {
        case 'open': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo open "my-research"');
            
            // Auto-close any previously open tags
            const openTags = engine.getOpenTags();
            for (const tag of openTags) {
                if (tag.name !== target) {
                    engine.closeTag(tag.name);
                    printInfo(`⚠️ Auto-closed previously open tag: '${tag.name}'`);
                }
            }

            const desc = extractFlag(extraArgs, '--desc');
            const tag = engine.openTag(target, desc);
            if (format === 'json') {
                printResult(JSON.stringify(tag), format);
            } else {
                printSuccess(`Tag '${tag.name}' created (status: OPEN, id: ${tag.id})`);
                printInfo(`Use: deepsift memo add "${tag.name}" --data "your findings"`);
            }
            break;
        }

        case 'close': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo close "my-research"');
            const tag = engine.closeTag(target);
            if (format === 'json') {
                printResult(JSON.stringify(tag), format);
            } else {
                printSuccess(`Tag '${tag.name}' closed.`);
            }
            break;
        }

        case 'archive': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo archive "my-research"');
            const tag = engine.archiveTag(target);
            if (format === 'json') {
                printResult(JSON.stringify(tag), format);
            } else {
                printSuccess(`Tag '${tag.name}' archived.`);
            }
            break;
        }

        case 'purge': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo purge "my-research"');
            const tagName = engine.purgeTag(target);
            if (format === 'json') {
                printResult(JSON.stringify({ status: 'purged', tag: tagName }), format);
            } else {
                printSuccess(`Tag '${tagName}' purged. All data deleted.`);
            }
            break;
        }

        case 'list': {
            const onlyOpen = extraArgs.includes('--open');
            const tags = onlyOpen ? engine.getOpenTags() : engine.getAllTags();

            if (format === 'json') {
                printResult(JSON.stringify(tags), format);
            } else {
                if (tags.length === 0) {
                    printInfo('No memo tags found.');
                    break;
                }
                let output = 'Memo Tags:\n\n';
                for (const tag of tags) {
                    const statusIcon = tag.status === 'open' ? '🟢' : tag.status === 'closed' ? '🔴' : '📦';
                    output += `${statusIcon} [${tag.name}] — ${tag.status.toUpperCase()}\n`;
                    output += `   Entries: ${tag.entryCount}`;
                    if (tag.description) output += ` | ${tag.description}`;
                    output += `\n   Created: ${new Date(tag.createdAt).toLocaleString()}\n\n`;
                }
                printResult(output, format);
            }
            break;
        }

        case 'add': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo add "tag" --data "content"');
            const data = extractFlag(extraArgs, '--data');
            const filePath = extractFlag(extraArgs, '--file');
            const typeStr = extractFlag(extraArgs, '--type');

            let content: string;
            if (data) {
                content = data;
            } else if (filePath) {
                const fs = await import('fs');
                if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
                content = fs.readFileSync(filePath, 'utf-8');
            } else {
                throw new Error('Content required. Use --data "content" or --file "path"');
            }

            const type = typeStr ? (typeStr as MemoEntryType) : undefined;
            const entry = await engine.addEntry(target, content, { type });

            if (format === 'json') {
                printResult(JSON.stringify(entry), format);
            } else {
                printSuccess(`Entry added to '${target}' (type: ${entry.type}, id: ${entry.id})`);
            }
            break;
        }

        case 'query': {
            const allMode = extraArgs.includes('--all');
            const typeStr = extractFlag(extraArgs, '--type');
            const topKStr = extractFlag(extraArgs, '--topk');
            const topK = topKStr ? parseInt(topKStr, 10) : 10;

            if (allMode) {
                const query = target;
                if (!query) throw new Error('Query is required. Usage: deepsift memo query --all "search term"');
                const results = await engine.queryAll(query, topK);
                formatQueryResults(results, format);
            } else {
                if (!target) throw new Error('Tag name is required. Usage: deepsift memo query "tag" "search term"');
                const query = extraArgs.find(a => !a.startsWith('--'));
                if (!query) throw new Error('Search query is required after tag name.');

                const filterType = typeStr ? [typeStr as MemoEntryType] : undefined;
                const results = await engine.query(target, query, { topK, filterType });
                formatQueryResults(results, format);
            }
            break;
        }

        case 'show': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo show "tag"');
            const stats = engine.getTagStats(target);
            if (!stats) {
                printError(`Tag '${target}' not found.`);
                break;
            }

            if (format === 'json') {
                printResult(JSON.stringify(stats), format);
            } else {
                let output = `📋 Tag: ${stats.name} (${stats.status.toUpperCase()})\n`;
                output += `   Created: ${stats.createdAt}\n`;
                if (stats.closedAt) output += `   Closed: ${stats.closedAt}\n`;
                output += `   Entries: ${stats.entryCount}\n\n`;
                output += `   Type Breakdown:\n`;
                for (const [type, count] of Object.entries(stats.typeBreakdown)) {
                    output += `     ${type}: ${count}\n`;
                }
                printResult(output, format);
            }
            break;
        }

        case 'graph': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo graph "tag"');
            const summary = await engine.getGraphSummary(target);
            printResult(summary, format);
            break;
        }

        case 'export': {
            if (!target) throw new Error('Tag name is required. Usage: deepsift memo export "tag"');
            const entries = engine.getEntries(target);
            const stats = engine.getTagStats(target);

            if (entries.length === 0) {
                printInfo(`Tag '${target}' has no entries to export.`);
                break;
            }

            let md = `# Research Memo: ${target}\n\n`;
            if (stats) {
                md += `> Status: ${stats.status} | Entries: ${stats.entryCount} | Created: ${stats.createdAt}\n\n`;
            }
            md += `---\n\n`;

            for (const entry of entries) {
                const icon = getTypeIcon(entry.type);
                md += `## ${icon} ${entry.type.replace(/_/g, ' ').toUpperCase()}\n`;
                md += `*${new Date(entry.createdAt).toLocaleString()}*\n\n`;
                md += `${entry.content}\n\n`;
                if (entry.source) md += `> Source: ${entry.source}\n\n`;
                md += `---\n\n`;
            }

            printResult(md, format);
            break;
        }

        case 'prompt': {
            const openTags = engine.getOpenTags();
            if (openTags.length === 0) {
                printInfo('No open memo tags. Create one with: deepsift memo open "tag-name"');
            } else {
                let output = '📝 Open memo tags:\n\n';
                for (const tag of openTags) {
                    output += `  🟢 [${tag.name}] — ${tag.entryCount} entries\n`;
                }
                output += `\n💡 Record findings: deepsift memo add "<tag>" --data "<your findings>"`;
                printResult(output, format);
            }
            break;
        }

        default:
            throw new Error(
                `Unknown memo action: '${action}'. Available: open, close, archive, purge, list, add, query, show, graph, export, prompt`
            );
    }
}

function extractFlag(args: string[], flag: string): string | undefined {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
        return args[idx + 1];
    }
    return undefined;
}

function formatQueryResults(results: import('../../types/memo-types.js').MemoQueryResult[], format: OutputFormat) {
    if (format === 'json') {
        printResult(JSON.stringify(results), format);
        return;
    }

    if (results.length === 0) {
        printInfo('No matching entries found.');
        return;
    }

    let output = `Found ${results.length} relevant entries:\n\n`;
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const icon = getTypeIcon(r.entry.type);
        output += `  [${i + 1}] ${icon} (score: ${r.score.toFixed(2)}, type: ${r.entry.type}, tag: ${r.tagName})\n`;
        output += `  ${r.entry.content.substring(0, 200)}\n\n`;
    }

    printResult(output, format);
}

function getTypeIcon(type: MemoEntryType): string {
    const icons: Record<MemoEntryType, string> = {
        finding: '🔍',
        code_snippet: '💻',
        api_response: '🌐',
        architecture_note: '🏗️',
        decision: '⚖️',
        reference: '📎',
        error_solution: '🩹'
    };
    return icons[type] || '📝';
}
