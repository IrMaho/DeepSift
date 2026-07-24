/**
 * @file pipe.ts
 * @description Stdin pipe reader for chaining DeepSift commands with shell pipelines.
 *
 * @module cli/commands/pipe
 * @category Utilities & Dashboard
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { printError, printInfo, printSuccess } from '../cli-output.js';
import ignore from 'ignore';
import { unifiedWalk } from '../../core/unified-walker.js';

export interface SedOperation {
    pattern: string;
    replacement: string;
}

export async function pipeCommand(
    filePatterns: string[],
    operations: SedOperation[],
    options: { all?: boolean; dryRun?: boolean }
) {
    if (!filePatterns || filePatterns.length === 0) {
        printError('No files specified. Use --files "src/**/*.ts"');
        return;
    }

    if (!operations || operations.length === 0) {
        printError('No sed operations specified. Use --sed "old" "new"');
        return;
    }

    printInfo('Scanning files...');
    const projectPath = process.cwd();
    const walkResult = await unifiedWalk(projectPath);
    const allFiles = walkResult.allFiles;

    const ig = ignore().add(filePatterns);
    
    const matchedFiles = allFiles.filter(file => {
        const relPath = path.relative(projectPath, file);
        return ig.ignores(relPath);
    });

    if (matchedFiles.length === 0) {
        printInfo('No files matched the provided pattern.');
        return;
    }

    // Compile regexes for all operations
    const compiledOps = operations.map(op => {
        let isRegex = false;
        let regexObj: RegExp | null = null;
        let regexFlags = options.all ? 'g' : '';

        if (op.pattern.startsWith('/') && op.pattern.lastIndexOf('/') > 0) {
            const lastSlash = op.pattern.lastIndexOf('/');
            const source = op.pattern.substring(1, lastSlash);
            const flagsStr = op.pattern.substring(lastSlash + 1);
            isRegex = true;
            
            const flagsSet = new Set((flagsStr + regexFlags).split(''));
            regexFlags = Array.from(flagsSet).join('');
            
            regexObj = new RegExp(source, regexFlags);
        } else if (options.all) {
            const escaped = op.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            regexObj = new RegExp(escaped, regexFlags);
            isRegex = true;
        }
        
        return { ...op, isRegex, regexObj };
    });

    let filesEdited = 0;
    let totalReplacements = 0;

    for (const file of matchedFiles) {
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            let newContent = content;
            let fileChanged = false;

            for (const op of compiledOps) {
                if (op.isRegex && op.regexObj) {
                    const matches = newContent.match(op.regexObj);
                    if (matches) {
                        totalReplacements += matches.length;
                        newContent = newContent.replace(op.regexObj, op.replacement);
                        fileChanged = true;
                    }
                } else {
                    if (newContent.includes(op.pattern)) {
                        totalReplacements += 1;
                        newContent = newContent.replace(op.pattern, op.replacement);
                        fileChanged = true;
                    }
                }
            }

            if (fileChanged && newContent !== content) {
                filesEdited++;
                if (!options.dryRun) {
                    await fs.promises.writeFile(file, newContent, 'utf-8');
                }
            }
        } catch (err: any) {
            printError(`Error processing file ${file}: ${err.message}`);
        }
    }

    if (options.dryRun) {
        printSuccess(`[DRY-RUN] Would modify ${filesEdited} files with ${totalReplacements} total replacements.`);
    } else {
        printSuccess(`Modified ${filesEdited} files with ${totalReplacements} total replacements.`);
    }
}
