import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function saveSearchLog(projectPath: string, queries: string[], resultText: string) {
    const outputsDir = path.join(projectPath, '.mcp_search_outputs');
    if (!fs.existsSync(outputsDir)) {
        fs.mkdirSync(outputsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const queriesTitle = queries.join(' | ').substring(0, 100);
    const hash = crypto.createHash('md5').update(queriesTitle + Date.now().toString()).digest('hex').substring(0, 6);
    const filename = `search_${timestamp}_${hash}.md`;
    const filePath = path.join(outputsDir, filename);

    const fileContent = `# Search Queries\n${queriesTitle}\n\n## Results\n${resultText}`;
    fs.writeFileSync(filePath, fileContent, 'utf8');

    // Update index
    const indexPath = path.join(outputsDir, 'INDEX.md');
    const indexEntry = `- [${new Date().toLocaleString()}] Queries: **${queriesTitle}** -> [${filename}](./${filename})\n`;
    
    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, `# MCP Search History Index\n\nThis file tracks past searches. Agents should read this file to find previous answers without re-running searches and wasting tokens.\n\n${indexEntry}`, 'utf8');
    } else {
        fs.appendFileSync(indexPath, indexEntry, 'utf8');
    }
}

export function getSearchHistory(projectPath: string): string {
    const indexPath = path.join(projectPath, '.mcp_search_outputs', 'INDEX.md');
    if (fs.existsSync(indexPath)) {
        return fs.readFileSync(indexPath, 'utf8');
    }
    return "No search history found. You must run a search first.";
}

export function getSearchLog(projectPath: string, filename: string): string {
    const filePath = path.join(projectPath, '.mcp_search_outputs', filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
    }
    return "Log file not found.";
}
