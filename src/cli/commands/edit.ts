import fs from 'fs';
import path from 'path';
import { printResult, printSuccess, printError, printInfo, OutputFormat } from '../cli-output.js';

export interface FileEdit {
    file: string;
    edits: {
        search: string;
        replace: string;
    }[];
}

export interface PatchPayload {
    dictionary?: Record<string, string>;
    files: FileEdit[];
}

function parseToonPatch(content: string): PatchPayload {
    const dictionary: Record<string, string> = {};
    const files: FileEdit[] = [];
    
    const lines = content.split('\n');
    let currentFile: FileEdit | null = null;
    let inSearch = false;
    let inReplace = false;
    let currentSearch: string[] = [];
    let currentReplace: string[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('[') && line.trim().endsWith(']') && Object.keys(dictionary).length === 0 && files.length === 0) {
            const dictStr = line.trim().slice(1, -1);
            if (dictStr) {
                const pairs = dictStr.split(',');
                for (const pair of pairs) {
                    const colonIdx = pair.indexOf(':');
                    if (colonIdx !== -1) {
                        dictionary[pair.slice(0, colonIdx).trim()] = pair.slice(colonIdx + 1).trim();
                    }
                }
            }
            continue;
        }

        if (line.startsWith('📄')) {
            currentFile = { file: line.replace('📄', '').trim(), edits: [] };
            files.push(currentFile);
            continue;
        }

        if (line.startsWith('<<<<')) {
            inSearch = true;
            inReplace = false;
            currentSearch = [];
            currentReplace = [];
            continue;
        }

        if (line.startsWith('====')) {
            inSearch = false;
            inReplace = true;
            continue;
        }

        if (line.startsWith('>>>>')) {
            inSearch = false;
            inReplace = false;
            if (currentFile) {
                currentFile.edits.push({
                    search: currentSearch.join('\n'),
                    replace: currentReplace.join('\n')
                });
            }
            continue;
        }

        if (inSearch) {
            currentSearch.push(line);
        } else if (inReplace) {
            currentReplace.push(line);
        }
    }

    return { dictionary, files };
}

export async function editCommand(
    projectPath: string,
    patchFilePath: string,
    format: OutputFormat
) {
    const fullPatchPath = path.resolve(projectPath, patchFilePath);
    
    if (!fs.existsSync(fullPatchPath)) {
        throw new Error(`Patch file not found: ${fullPatchPath}`);
    }

    let patchData: FileEdit[] = [];
    let dictionary: Record<string, string> | undefined;

    const content = fs.readFileSync(fullPatchPath, 'utf-8');
    try {
        const parsedData = JSON.parse(content);
        if (Array.isArray(parsedData)) {
            patchData = parsedData;
        } else if (parsedData && Array.isArray(parsedData.files)) {
            patchData = parsedData.files;
            dictionary = parsedData.dictionary;
        } else {
            throw new Error('Invalid JSON schema');
        }
    } catch (e: any) {
        // Fallback to TOON-Patch custom parser if JSON parsing fails
        try {
            const parsedToon = parseToonPatch(content);
            patchData = parsedToon.files;
            dictionary = parsedToon.dictionary;
        } catch (err: any) {
            throw new Error(`Failed to parse patch file as JSON or TOON format: ${err.message}`);
        }
    }

    if (patchData.length === 0) {
        throw new Error('Patch file contains no valid file edits.');
    }

    // Sort dictionary keys by length descending to safely expand longer tokens first
    const dictKeys = dictionary ? Object.keys(dictionary).sort((a, b) => b.length - a.length) : [];

    function expandText(text: string): string {
        if (!dictionary || dictKeys.length === 0) return text;
        let expanded = text;
        for (const key of dictKeys) {
            // Escape key for regex
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedKey, 'g');
            expanded = expanded.replace(regex, dictionary[key]);
        }
        return expanded;
    }

    let totalFilesEdited = 0;
    let totalReplacements = 0;
    const errors: string[] = [];

    for (const filePatch of patchData) {
        const fullFilePath = path.resolve(projectPath, filePatch.file);
        
        if (!fs.existsSync(fullFilePath)) {
            errors.push(`[Skipped] File not found: ${filePatch.file}`);
            continue;
        }

        try {
            let fileContent = fs.readFileSync(fullFilePath, 'utf-8');
            let modified = false;

            for (let i = 0; i < filePatch.edits.length; i++) {
                const edit = filePatch.edits[i];
                const searchStr = expandText(edit.search);
                const replaceStr = expandText(edit.replace);

                if (fileContent.includes(searchStr)) {
                    // Replace all occurrences just in case, or just the first?
                    // Typically search & replace should be exact.
                    fileContent = fileContent.replace(searchStr, replaceStr);
                    modified = true;
                    totalReplacements++;
                } else {
                    errors.push(`[Warning] Exact match not found in ${filePatch.file} for edit #${i + 1}`);
                }
            }

            if (modified) {
                fs.writeFileSync(fullFilePath, fileContent, 'utf-8');
                totalFilesEdited++;
            }
        } catch (e: any) {
            errors.push(`[Error] Failed to process ${filePatch.file}: ${e.message}`);
        }
    }

    const report = [
        `--- Edit Batch Complete ---`,
        `Files modified: ${totalFilesEdited} / ${patchData.length}`,
        `Total replacements applied: ${totalReplacements}`,
    ];

    if (errors.length > 0) {
        report.push(`\nIssues Encountered:\n${errors.join('\n')}`);
    }

    if (format === 'json') {
        console.log(JSON.stringify({ 
            success: true, 
            filesModified: totalFilesEdited, 
            replacements: totalReplacements, 
            errors 
        }));
    } else {
        if (errors.length > 0) {
            printInfo(report.join('\n'));
        } else {
            printSuccess(report.join('\n'));
        }
    }
}
