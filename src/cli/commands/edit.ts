import fs from 'fs';
import path from 'path';
import { printResult, printSuccess, printError, printInfo, OutputFormat } from '../cli-output.js';

export interface EditOperation {
    type: 'search' | 'line';
    search?: string;
    replace: string;
    startLine?: number;
    endLine?: number;
}

export interface FileEdit {
    file: string;
    edits: EditOperation[];
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
    let currentStartLine: number | undefined;
    let currentEndLine: number | undefined;
    let currentType: 'search' | 'line' = 'search';

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

        // Line range match: L10-L15 or L10-15 or L10
        const lineMatch = line.match(/^L(\d+)(?:-L?(\d+))?(?::<<<<)?$/);
        if (lineMatch) {
            currentType = 'line';
            currentStartLine = parseInt(lineMatch[1], 10);
            currentEndLine = lineMatch[2] ? parseInt(lineMatch[2], 10) : currentStartLine;
            inSearch = line.endsWith('<<<<'); // If it's a targeted search L10:<<<< it starts the search block
            inReplace = false;
            currentSearch = [];
            currentReplace = [];
            continue;
        }

        if (line.startsWith('<<<<')) {
            currentType = 'search';
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
                if (currentType === 'line' && currentStartLine) {
                    if (currentSearch.length > 0) {
                        // Targeted search L10:<<<< ... ==== ... >>>>
                        currentFile.edits.push({
                            type: 'search',
                            search: currentSearch.join('\n'),
                            replace: currentReplace.join('\n'),
                            startLine: currentStartLine,
                            endLine: currentEndLine
                        });
                    } else {
                        // Line replacement
                        currentFile.edits.push({
                            type: 'line',
                            replace: currentReplace.join('\n'),
                            startLine: currentStartLine,
                            endLine: currentEndLine
                        });
                    }
                } else {
                    currentFile.edits.push({
                        type: 'search',
                        search: currentSearch.join('\n'),
                        replace: currentReplace.join('\n')
                    });
                }
            }
            // reset
            currentType = 'search';
            currentStartLine = undefined;
            currentEndLine = undefined;
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
    let fullPatchPath = path.resolve(process.cwd(), patchFilePath);
    if (!fs.existsSync(fullPatchPath)) {
        fullPatchPath = path.resolve(projectPath, patchFilePath);
    }
    
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
        let expanded = text;

        // 1. Resolve Block-Level Clipboard (captures indentation)
        // Matches: ^<indentation>📋<filepath>:L<start>-L<end>
        expanded = expanded.replace(/^([ \t]*)📋\s*([^:\s]+):L(\d+)(?:-L?(\d+))?\s*$/gm, (match, indent, filepath, start, end) => {
            let fullPath = path.resolve(process.cwd(), filepath.trim());
            if (!fs.existsSync(fullPath)) {
                fullPath = path.resolve(projectPath, filepath.trim());
            }
            if (!fs.existsSync(fullPath)) return match;
            
            const startLine = parseInt(start, 10);
            const endLine = end ? parseInt(end, 10) : startLine;
            
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            const lines = fileContent.split('\n');
            const startIdx = startLine - 1;
            const endIdx = endLine - 1;
            
            if (startIdx < 0 || endIdx >= lines.length || startIdx > endIdx) return match;
            
            const copiedLines = lines.slice(startIdx, endIdx + 1);
            return copiedLines.map(l => indent + l).join('\n');
        });

        // 2. Resolve Inline Clipboard
        expanded = expanded.replace(/📋\s*([^:\s]+):L(\d+)(?:-L?(\d+))?/g, (match, filepath, start, end) => {
            let fullPath = path.resolve(process.cwd(), filepath.trim());
            if (!fs.existsSync(fullPath)) {
                fullPath = path.resolve(projectPath, filepath.trim());
            }
            if (!fs.existsSync(fullPath)) return match;
            
            const startLine = parseInt(start, 10);
            const endLine = end ? parseInt(end, 10) : startLine;
            
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            const lines = fileContent.split('\n');
            const startIdx = startLine - 1;
            const endIdx = endLine - 1;
            
            if (startIdx < 0 || endIdx >= lines.length || startIdx > endIdx) return match;
            
            return lines.slice(startIdx, endIdx + 1).join('\n');
        });

        // 3. Apply Dictionary
        if (dictionary && dictKeys.length > 0) {
            for (const key of dictKeys) {
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedKey, 'g');
                expanded = expanded.replace(regex, dictionary[key]);
            }
        }
        
        return expanded;
    }

    let totalFilesEdited = 0;
    let totalReplacements = 0;
    const errors: string[] = [];

    for (const filePatch of patchData) {
        let fullFilePath = path.resolve(process.cwd(), filePatch.file);
        if (!fs.existsSync(fullFilePath)) {
            fullFilePath = path.resolve(projectPath, filePatch.file);
        }
        
        if (!fs.existsSync(fullFilePath)) {
            errors.push(`[Skipped] File not found: ${filePatch.file}`);
            continue;
        }

        try {
            let fileContent = fs.readFileSync(fullFilePath, 'utf-8');
            let modified = false;

            const editsWithLines = filePatch.edits.filter(e => e.startLine !== undefined);
            const globalSearches = filePatch.edits.filter(e => e.startLine === undefined);

            editsWithLines.sort((a, b) => b.startLine! - a.startLine!);

            let fileLines = fileContent.split('\n');

            for (let i = 0; i < editsWithLines.length; i++) {
                const edit = editsWithLines[i];
                const startLine = edit.startLine!;
                const endLine = edit.endLine || startLine;
                const replaceStr = expandText(edit.replace);
                
                const startIdx = startLine - 1;
                const endIdx = endLine - 1;

                if (startIdx < 0 || startIdx >= fileLines.length || endIdx >= fileLines.length || startIdx > endIdx) {
                    errors.push(`[Warning] Invalid line range ${startLine}-${endLine} in ${filePatch.file}`);
                    continue;
                }

                if (edit.type === 'search' || edit.search) {
                    const searchStr = expandText(edit.search || '');
                    const chunk = fileLines.slice(startIdx, endIdx + 1).join('\n');
                    if (chunk.includes(searchStr)) {
                        const newChunk = chunk.replace(searchStr, replaceStr);
                        const newChunkLines = newChunk.split('\n');
                        fileLines.splice(startIdx, endIdx - startIdx + 1, ...newChunkLines);
                        modified = true;
                        totalReplacements++;
                    } else {
                        errors.push(`[Warning] Targeted search not found at lines ${startLine}-${endLine} in ${filePatch.file}`);
                    }
                } else {
                    // Line replacement
                    const newChunkLines = replaceStr.split('\n');
                    fileLines.splice(startIdx, endIdx - startIdx + 1, ...newChunkLines);
                    modified = true;
                    totalReplacements++;
                }
            }

            fileContent = fileLines.join('\n');

            for (let i = 0; i < globalSearches.length; i++) {
                const edit = globalSearches[i];
                if (!edit.search) continue;
                const searchStr = expandText(edit.search);
                const replaceStr = expandText(edit.replace);

                if (fileContent.includes(searchStr)) {
                    fileContent = fileContent.replace(searchStr, replaceStr);
                    modified = true;
                    totalReplacements++;
                } else {
                    errors.push(`[Warning] Exact match not found in ${filePatch.file}`);
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
