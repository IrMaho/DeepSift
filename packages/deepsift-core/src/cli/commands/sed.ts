/**
 * @file sed.ts
 * @description Stream editor command for in-place line-range file content substitution.
 *
 * @module cli/commands/sed
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { printError, printInfo, printSuccess } from '../cli-output.js';
import ignore from 'ignore';
import { unifiedWalk } from '../../core/unified-walker.js';

export async function sedCommand(
    pattern: string,
    replacement: string,
    filePatterns: string[],
    options: { all?: boolean; dryRun?: boolean }
) {
    if (!filePatterns || filePatterns.length === 0) {
        printError('No files specified. Use --files "src/**/*.ts"');
        return;
    }

    printInfo('Scanning files...');
    const projectPath = process.cwd();
    const walkResult = await unifiedWalk(projectPath);
    const allFiles = walkResult.allFiles;

    const ig = ignore().add(filePatterns);
    
    const matchedFiles = allFiles.filter(file => {
        // file is an absolute path. We need relative path to match globs.
        const relPath = path.relative(projectPath, file);
        return ig.ignores(relPath);
    });

    if (matchedFiles.length === 0) {
        printInfo('No files matched the provided pattern.');
        return;
    }

    let isRegex = false;
    let regexObj: RegExp | null = null;
    let regexFlags = options.all ? 'g' : '';

    if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
        const lastSlash = pattern.lastIndexOf('/');
        const source = pattern.substring(1, lastSlash);
        const flagsStr = pattern.substring(lastSlash + 1);
        isRegex = true;
        
        // merge flags
        const flagsSet = new Set((flagsStr + regexFlags).split(''));
        regexFlags = Array.from(flagsSet).join('');
        
        regexObj = new RegExp(source, regexFlags);
    } else if (options.all) {
        // Escaped raw string pattern
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regexObj = new RegExp(escaped, regexFlags);
        isRegex = true;
    }

    let filesEdited = 0;
    let totalReplacements = 0;

    for (const file of matchedFiles) {
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            let newContent = content;
            let count = 0;

            if (isRegex && regexObj) {
                // To count occurrences, we can use match
                const matches = content.match(regexObj);
                if (matches) {
                    count = matches.length;
                    newContent = content.replace(regexObj, replacement);
                }
            } else {
                if (content.includes(pattern)) {
                    count = 1;
                    newContent = content.replace(pattern, replacement);
                }
            }

            if (count > 0 && newContent !== content) {
                filesEdited++;
                totalReplacements += count;
                
                if (!options.dryRun) {
                    await fs.promises.writeFile(file, newContent, 'utf-8');
                }
            }
        } catch (err: any) {
            printError(`Error processing file ${file}: ${err.message}`);
        }
    }

    if (options.dryRun) {
        printSuccess(`[DRY-RUN] Would modify ${filesEdited} files with ${totalReplacements} replacements.`);
    } else {
        printSuccess(`Modified ${filesEdited} files with ${totalReplacements} replacements.`);
    }
}
