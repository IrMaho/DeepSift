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

export async function editCommand(
    projectPath: string,
    patchFilePath: string,
    format: OutputFormat
) {
    const fullPatchPath = path.resolve(projectPath, patchFilePath);
    
    if (!fs.existsSync(fullPatchPath)) {
        throw new Error(`Patch file not found: ${fullPatchPath}`);
    }

    let patchData: FileEdit[];
    try {
        const content = fs.readFileSync(fullPatchPath, 'utf-8');
        patchData = JSON.parse(content);
    } catch (e: any) {
        throw new Error(`Invalid JSON in patch file: ${e.message}`);
    }

    if (!Array.isArray(patchData)) {
        throw new Error('Patch file must contain an array of FileEdit objects.');
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
                if (fileContent.includes(edit.search)) {
                    // Replace all occurrences just in case, or just the first?
                    // Typically search & replace should be exact.
                    fileContent = fileContent.replace(edit.search, edit.replace);
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
