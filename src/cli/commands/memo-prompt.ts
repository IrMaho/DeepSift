import readline from 'readline';
import fs from 'fs';
import { MemoEngine } from '../../memo/memo-engine.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';

export interface AutoSaveContext {
    query?: string;
    resultCount?: number;
    topFiles?: string[];
    contentSummary?: string;
    logFilePath?: string;
}

export async function promptForResearchFindings(
    projectPath: string,
    format: string,
    context?: AutoSaveContext
): Promise<void> {
    if (format === 'json') return;

    let engine: MemoEngine;
    try {
        engine = new MemoEngine(projectPath);
    } catch {
        return;
    }

    const openTags = engine.getOpenTags();
    if (openTags.length === 0) return;

    const isInteractive = process.stdin.isTTY === true;

    if (!isInteractive) {
        await autoSaveFindings(engine, openTags, context);
        return;
    }

    await interactivePrompt(engine, openTags);
}

async function autoSaveFindings(
    engine: MemoEngine,
    openTags: ReturnType<MemoEngine['getOpenTags']>,
    context?: AutoSaveContext
): Promise<void> {
    const selectedTag = openTags[0];

    if (!context) {
        printInfo(`\n\x1b[33m⚠️  [DRM] Active tag: [${selectedTag.name}] — no context to auto-save.\x1b[0m`);
        return;
    }

    const parts: string[] = [];

    if (context.query) {
        parts.push(`Query: "${context.query}"`);
    }

    if (context.resultCount !== undefined) {
        parts.push(`Results: ${context.resultCount} matches`);
    }

    if (context.topFiles && context.topFiles.length > 0) {
        parts.push(`Key Files:\n${context.topFiles.map(f => `  - ${f}`).join('\n')}`);
    }

    if (context.contentSummary) {
        parts.push(`Content:\n${context.contentSummary}`);
    }

    if (context.logFilePath) {
        const fileUrl = context.logFilePath.startsWith('file://')
            ? context.logFilePath
            : `file:///${context.logFilePath.replace(/\\/g, '/')}`;
        parts.push(`Full Log: ${fileUrl}`);
    }

    if (parts.length === 0) {
        printInfo(`\n\x1b[33m⚠️  [DRM] Active tag: [${selectedTag.name}] — empty context, skipping.\x1b[0m`);
        return;
    }

    const content = parts.join('\n');

    try {
        const entryType = context.contentSummary ? 'code_snippet' as const : 'finding' as const;
        const entry = await engine.addEntry(selectedTag.name, content, { type: entryType });
        printSuccess(`\n[DRM Auto-Save] Recorded to '${selectedTag.name}' (id: ${entry.id}, type: ${entryType})`);
    } catch (err: any) {
        printError(`\n[DRM Auto-Save] Failed: ${err.message || err}`);
    }
}

async function interactivePrompt(
    engine: MemoEngine,
    openTags: ReturnType<MemoEngine['getOpenTags']>
): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
        return new Promise((resolve) => rl.question(query, resolve));
    };

    const showHelp = () => {
        printInfo('\n=== Dynamic Research Memory (DRM) Prompt Guide ===');
        printInfo('You just performed a successful search or read operation.');
        printInfo('This prompt lets you record findings immediately into your active research tags.');
        printInfo('Instructions:');
        printInfo('  - [Any Text] : Saves the text as a new finding entry inside the active tag.');
        printInfo('  - [Enter]    : Skips recording and exits cleanly.');
        printInfo('  - "help"     : Shows this help message.');
        printInfo('  - "راهنما"   : راهنمای استفاده از حافظه تحقیقاتی پویا را نشان می‌دهد.');
        printInfo('==================================================\n');
    };

    try {
        while (true) {
            const promptText = `\n\x1b[33m[DRM] Enter research findings to record (Press Enter to skip, type 'help' for guide):\x1b[0m\n> `;
            const answer = (await askQuestion(promptText)).trim();

            if (!answer) {
                break;
            }

            const lowerAns = answer.toLowerCase();
            if (lowerAns === 'help' || answer === 'راهنما') {
                showHelp();
                continue;
            }

            let selectedTag = openTags[0];
            if (openTags.length > 1) {
                printInfo('\nMultiple open tags found:');
                openTags.forEach((t, idx) => {
                    printInfo(`  [${idx + 1}] ${t.name} (${t.entryCount} entries)`);
                });

                while (true) {
                    const tagSelectText = `Select tag number (1-${openTags.length}, default 1): `;
                    const tagAns = (await askQuestion(tagSelectText)).trim();
                    if (!tagAns) {
                        selectedTag = openTags[0];
                        break;
                    }
                    const num = parseInt(tagAns, 10);
                    if (!isNaN(num) && num >= 1 && num <= openTags.length) {
                        selectedTag = openTags[num - 1];
                        break;
                    }
                    printError('Invalid selection. Please choose a number from the list.');
                }
            }

            try {
                const entry = await engine.addEntry(selectedTag.name, answer, { type: 'finding' });
                printSuccess(`Successfully recorded finding to tag '${selectedTag.name}' (id: ${entry.id})`);
            } catch (err: any) {
                printError(`Failed to save finding: ${err.message || err}`);
            }
            break;
        }
    } catch (e) {
    } finally {
        rl.close();
    }
}
