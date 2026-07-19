import readline from 'readline';
import { MemoEngine } from '../../memo/memo-engine.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';

export async function promptForResearchFindings(projectPath: string, format: string): Promise<void> {
    if (format === 'json') return;

    let engine: MemoEngine;
    try {
        engine = new MemoEngine(projectPath);
    } catch {
        return; // Safe fallback if no project/memo config
    }

    const openTags = engine.getOpenTags();
    if (openTags.length === 0) return;

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
        // Safe catch for any readline errors
    } finally {
        rl.close();
    }
}
