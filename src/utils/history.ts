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
    
    let indexEntry = `\n---\n## Search: ${queriesTitle}\n*Date: ${new Date().toLocaleString()}*\n\n`;
    const generatedImages: string[] = [];

    try {
        if (options?.skipVisuals) {
            throw new Error('Visual cache skipped by request');
        }
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
        if (options?.skipVisuals) {
            indexEntry += '*Visual cache generation skipped for this log.*\n\n';
        } else {
            console.error('Pxpipe rendering failed, falling back to raw text index:', e.message);
        }
        indexEntry += `\`\`\`json\n${fileContent}\n\`\`\`\n\n`;
    }

    const indexPath = path.join(outputsDir, 'INDEX.md');

    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, `# DeepSift Search History Index\n\nThis file tracks past searches. Agents must visually read the compressed PNGs in this file to understand the deeply compressed codebase context.\n\n${indexEntry}`, 'utf8');
    } else {
        fs.appendFileSync(indexPath, indexEntry, 'utf8');
    }

    // Return INDEX.md as the main reference point for CLI or other callers
    return { filename: 'INDEX.md', filePath: indexPath, images: generatedImages };
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
