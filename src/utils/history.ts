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

export function saveSearchLog(projectPath: string, queries: string[], resultText: string) {
    const outputsDir = resolveOutputsDir(projectPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const queriesTitle = queries.join(' | ').substring(0, 100);
    const hash = crypto.createHash('md5').update(queriesTitle + Date.now().toString()).digest('hex').substring(0, 6);
    const filename = `search_${timestamp}_${hash}.md`;
    const filePath = path.join(outputsDir, filename);

    const fileContent = `# Search Queries\n${queriesTitle}\n\n## Results\n${resultText}`;
    fs.writeFileSync(filePath, fileContent, 'utf8');

    const indexPath = path.join(outputsDir, 'INDEX.md');
    const indexEntry = `- [${new Date().toLocaleString()}] Queries: **${queriesTitle}** -> [${filename}](./${filename})\n`;

    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, `# DeepSift Search History Index\n\nThis file tracks past searches. Agents should read this file to find previous answers without re-running searches and wasting tokens.\n\n${indexEntry}`, 'utf8');
    } else {
        fs.appendFileSync(indexPath, indexEntry, 'utf8');
    }
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
