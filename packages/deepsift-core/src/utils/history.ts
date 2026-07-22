import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OUTPUTS_DIR_NAMES = ['.deepsift/outputs', '.mcp_search_outputs'];

function resolveOutputsDir(projectPath: string): string {
    for (const dirName of OUTPUTS_DIR_NAMES) {
        const candidate = path.join(projectPath, dirName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    const defaultDir = path.join(projectPath, OUTPUTS_DIR_NAMES[0]);
    fs.mkdirSync(defaultDir, { recursive: true });
    return defaultDir;
}

export interface SearchLogResult {
    filename: string;
    filePath: string;
    images?: string[];
}

export interface SaveLogOptions {
    skipVisuals?: boolean;
}

export async function saveSearchLog(projectPath: string, queries: string[], resultText: string, options?: SaveLogOptions): Promise<SearchLogResult> {
    const outputsDir = resolveOutputsDir(projectPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const queriesTitle = queries.join(' | ').substring(0, 100);
    const hash = crypto.createHash('md5').update(queriesTitle + Date.now().toString()).digest('hex').substring(0, 6);
    const filename = `search_${timestamp}_${hash}.md`;
    const filePath = path.join(outputsDir, filename);

    const lines = resultText
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trimEnd());

    const cleanedLines: string[] = [];
    let emptyLineCount = 0;
    for (const line of lines) {
        if (line === '') {
            emptyLineCount++;
            if (emptyLineCount <= 1) {
                cleanedLines.push(line);
            }
        } else {
            emptyLineCount = 0;
            cleanedLines.push(line);
        }
    }
    const cleanedResultText = cleanedLines.join('\n');

    const fileContent = `# Search Queries\n${queriesTitle}\n\n## Results\n${cleanedResultText}`;
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    let indexEntry = `\n---\n## Search: ${queriesTitle}\n*Date: ${new Date().toLocaleString()}*\n\n`;
    const generatedImages: string[] = [];

    if (options?.skipVisuals) {
        indexEntry += `*Result saved to text file: \`${filename}\` (Visuals skipped to save tokens)*\n\n`;
    } else {
        try {
            // @ts-ignore
            const pxpipe = await import('pxpipe-proxy');
            if (pxpipe && pxpipe.renderTextToImages) {
                // Use pxpipe-main's native defaults exactly to achieve the intended dense layout
                // with native anti-aliasing for the token-saving "blur" effect.
                const { pages } = await pxpipe.renderTextToImages(fileContent, {
                    reflow: true
                });
                
                pages.forEach((page: any, idx: number) => {
                    const imgName = `search_${timestamp}_${hash}_page_${idx}.png`;
                    const imgPath = path.join(outputsDir, imgName);
                    fs.writeFileSync(imgPath, page.png);
                    indexEntry += `![${imgName}](${imgName})\n\n`;
                    generatedImages.push(imgPath);
                });
            } else {
                throw new Error('pxpipe not found');
            }
        } catch (e: any) {
            console.error('Pxpipe rendering failed, fallback to text reference:', e.message);
            indexEntry += `*Rendering failed. Result saved to text file: \`${filename}\`*\n\n`;
        }
    }

    const indexPath = path.join(outputsDir, 'INDEX.md');

    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, `# DeepSift Search History Index\n\nThis file tracks past searches. Agents must visually read the compressed PNGs in this file to understand the deeply compressed codebase context.\n\n${indexEntry}`, 'utf8');
    } else {
        fs.appendFileSync(indexPath, indexEntry, 'utf8');
    }

    // Auto-cleanup old log outputs to prevent output folder bloat
    try {
        cleanupOldOutputs(projectPath, 30, 7);
    } catch {
        // Safe ignore
    }

    // Return INDEX.md as the main reference point for CLI or other callers
    return { filename: 'INDEX.md', filePath: indexPath, images: generatedImages };
}

export function cleanupOldOutputs(projectPath: string, maxFiles: number = 30, maxAgeDays: number = 7): number {
    const outputsDir = resolveOutputsDir(projectPath);
    if (!fs.existsSync(outputsDir)) return 0;

    const files = fs.readdirSync(outputsDir);
    const logFiles = files.filter(f => f.startsWith('search_') && f.endsWith('.md'));
    
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    const fileStats = logFiles.map(f => {
        const fullPath = path.join(outputsDir, f);
        const stat = fs.statSync(fullPath);
        return { filename: f, fullPath, mtime: stat.mtimeMs };
    });

    // Sort by mtime descending (newest first)
    fileStats.sort((a, b) => b.mtime - a.mtime);

    fileStats.forEach((file, idx) => {
        const age = now - file.mtime;
        const isExceedingCount = idx >= maxFiles;
        const isTooOld = age > maxAgeMs;

        if (isExceedingCount || isTooOld) {
            try {
                fs.unlinkSync(file.fullPath);
                deletedCount++;
                // Also remove associated PNG images if any
                const basePrefix = file.filename.replace('.md', '');
                files.filter(img => img.startsWith(basePrefix) && img.endsWith('.png')).forEach(img => {
                    try { fs.unlinkSync(path.join(outputsDir, img)); } catch {}
                });
            } catch {}
        }
    });

    return deletedCount;
}

export function getSearchHistory(projectPath: string): string {
    for (const dirName of OUTPUTS_DIR_NAMES) {
        const indexPath = path.join(projectPath, dirName, 'INDEX.md');
        if (fs.existsSync(indexPath)) {
            return fs.readFileSync(indexPath, 'utf8');
        }
    }
    return 'No search history found. You must run a search first.';
}

export function getSearchLog(projectPath: string, filename: string): string {
    for (const dirName of OUTPUTS_DIR_NAMES) {
        const filePath = path.join(projectPath, dirName, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
    }
    return 'Log file not found.';
}
