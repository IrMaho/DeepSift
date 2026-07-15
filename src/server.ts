import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { NativeStore } from './storage/native-store.js';
import { Indexer } from './core/indexer.js';
import { Searcher } from './core/searcher.js';
import path from 'path';
import os from 'os';
import * as fs from 'fs';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { saveSearchLog, getSearchHistory, getSearchLog } from './utils/history.js';
import { getProjectArchitecture } from './utils/architecture.js';
import { getFeatureOutline } from './utils/outline.js';
import { generateDNA, loadDNA } from './intelligence/project-dna.js';
import { getContextText } from './cli/commands/context.js';
import { processDnaFilters, recursiveQueryDna } from './cli/commands/dna.js';
import { TokenOptimizerService } from './utils/token-compressor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SSE Broadcaster Setup ---
const clients = new Set<http.ServerResponse>();

function broadcastEvent(type: string, payload: any) {
    const data = JSON.stringify({ type, payload });
    for (const client of clients) {
        client.write(`data: ${data}\n\n`);
    }
}

// --- UI Web Server Setup ---
const UI_PORT = 3000;
const uiServer = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        
        clients.add(res);
        
        // Send initial status
        res.write(`data: ${JSON.stringify({ type: 'status_update', payload: indexer.getStatus() })}\n\n`);
        
        req.on('close', () => {
            clients.delete(res);
        });
        return;
    }

    // Static file serving
    let filePath = path.join(__dirname, '../src/ui', req.url === '/' ? 'index.html' : req.url!);
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

uiServer.listen(UI_PORT, () => {
    console.error(`UI Dashboard running at http://localhost:${UI_PORT}`);
});

// --- MCP Core ---
const dbPath = path.join(os.homedir(), '.ternlight_mcp_search.db');
const store = new NativeStore(dbPath);
const indexer = new Indexer(store);
const searcher = new Searcher(store);

const server = new McpServer({
    name: "codebase-semantic-search",
    version: "1.0.0"
});

// Tool 1: search_code
(server as any).tool(
    "search_code",
    "Semantic search for code snippets, functions, classes and dependencies in the workspace",
    {
        query: z.string().describe("The semantic query or intent you are looking for"),
        projectPath: z.string().describe("Absolute path to the root of the project to search in"),
        topK: z.number().optional().describe("Number of results to return (default 10)"),
        filterType: z.array(z.enum(['function', 'class', 'import', 'config', 'block', 'comment'])).optional()
    },
    async (args: any) => {
        const { query, projectPath, topK = 10, filterType } = args;
        broadcastEvent('tool_call', { tool: 'search_code', args, response: 'Processing...' });
        
        // Auto-sync index before search to guarantee 100% up-to-date results
        await indexer.indexProject(projectPath);
        broadcastEvent('status_update', indexer.getStatus());

        const results = await searcher.search(args);
        
        let responseContent;
        if (results.length === 0) {
            responseContent = { content: [{ type: "text", text: "No relevant code found." }] };
        } else {
            const formattedResults = results.map((res: any, i: number) => {
                return `${i + 1}. [${res.chunk.filePath}:${res.chunk.startLine}-${res.chunk.endLine}] (score: ${res.score.toFixed(3)}, match: ${res.matchType})\n   Type: ${res.chunk.type}\n   \`\`\`${res.chunk.language}\n${res.chunk.content}\n   \`\`\``;
            }).join('\n\n');
            responseContent = { content: [{ type: "text", text: `Found ${results.length} relevant code sections:\n\n${formattedResults}` }] };
        }

        broadcastEvent('tool_call', { tool: 'search_code', args, response: responseContent.content[0].text });
        
        // Save to history
        if (results.length > 0) {
            await saveSearchLog(projectPath, [query], responseContent.content[0].text);
        }

        return responseContent;
    }
);

// Tool 2: index_project
(server as any).tool(
    "index_project",
    "Index or re-index the project to enable semantic search.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        forceReindex: z.boolean().optional()
    },
    async (args: any) => {
        const { projectPath, forceReindex = false } = args;
        broadcastEvent('tool_call', { tool: 'index_project', args, response: 'Processing...' });
        
        try {
            const stats = await indexer.indexProject(projectPath, forceReindex);
            broadcastEvent('status_update', indexer.getStatus());
            
            const response = { content: [{ type: "text", text: `Indexing complete. Processed ${stats.files} files and ${stats.chunks} chunks.` }] };
            broadcastEvent('tool_call', { tool: 'index_project', args, response: stats });
            return response;
        } catch (err: any) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
        }
    }
);

// Tool 3: multi_search
(server as any).tool(
    "multi_search",
    "Run multiple semantic searches in a single request to save time and tokens. Use this when you have multiple questions about the codebase.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        queries: z.array(
            z.object({
                query: z.string(),
                topK: z.number().optional(),
                filterType: z.array(z.enum(['function', 'class', 'import', 'config', 'block', 'comment'])).optional()
            })
        ).describe("List of search queries to execute")
    },
    async (args: any) => {
        const { projectPath, queries } = args;
        broadcastEvent('tool_call', { tool: 'multi_search', args, response: 'Processing multiple queries...' });
        
        // Auto-sync index before search to guarantee 100% up-to-date results
        await indexer.indexProject(projectPath);
        broadcastEvent('status_update', indexer.getStatus());

        const allResults: any[] = [];
        let totalHits = 0;

        for (let i = 0; i < queries.length; i++) {
            const q = queries[i];
            const results = await searcher.search({ query: q.query, topK: q.topK || 5, filterType: q.filterType });
            totalHits += results.length;
            
            const formattedResults = results.map((res: any, j: number) => {
                return `    ${j + 1}. [${res.chunk.filePath}:${res.chunk.startLine}-${res.chunk.endLine}] (score: ${res.score.toFixed(3)}, match: ${res.matchType})\n       \`\`\`${res.chunk.language}\n${res.chunk.content}\n       \`\`\``;
            }).join('\n\n');
            
            allResults.push(`--- Query ${i + 1}: "${q.query}" ---\nFound ${results.length} results:\n${formattedResults}`);
        }

        const responseContent = { 
            content: [{ type: "text", text: `Multi-Search Complete. Processed ${queries.length} queries, found ${totalHits} total results.\n\n${allResults.join('\n\n')}` }] 
        };

        broadcastEvent('tool_call', { tool: 'multi_search', args, response: responseContent.content[0].text });
        
        // Save to history
        if (totalHits > 0) {
            await saveSearchLog(projectPath, queries.map((q: any) => q.query), responseContent.content[0].text);
        }

        return responseContent;
    }
);

// Tool 4: search_status
(server as any).tool(
    "search_status",
    "Get the current status of the vector index",
    {},
    async (args: any) => {
        const status = indexer.getStatus();
        broadcastEvent('tool_call', { tool: 'search_status', args, response: status });
        
        const lastUpdatedDate = status.lastUpdated > 0 ? new Date(status.lastUpdated).toLocaleString() : 'Never';
        return {
            content: [{ 
                type: "text", 
                text: `Index Status:\n- Total Files Indexed: ${status.totalFiles}\n- Total Chunks: ${status.totalChunks}\n- Last Updated: ${lastUpdatedDate}\n- Currently Indexing: ${status.isIndexing}` 
            }]
        };
    }
);

// Tool 5: get_search_history
(server as any).tool(
    "get_search_history",
    "Read the INDEX.md file containing the history of all previous searches. Use this to find if a question was already answered.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project")
    },
    async (args: any) => {
        const { projectPath } = args;
        broadcastEvent('tool_call', { tool: 'get_search_history', args, response: 'Reading history...' });
        
        const historyText = getSearchHistory(projectPath);
        
        broadcastEvent('tool_call', { tool: 'get_search_history', args, response: historyText });
        return { content: [{ type: "text", text: historyText }] };
    }
);

// Tool 6: read_search_log
(server as any).tool(
    "read_search_log",
    "Read a specific search log file from the history index to get the cached results.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        filename: z.string().describe("The name of the log file (e.g. search_2026-07-13...md)")
    },
    async (args: any) => {
        const { projectPath, filename } = args;
        broadcastEvent('tool_call', { tool: 'read_search_log', args, response: 'Reading log file...' });
        
        const logText = getSearchLog(projectPath, filename);
        
        broadcastEvent('tool_call', { tool: 'read_search_log', args, response: logText });
        return { content: [{ type: "text", text: logText }] };
    }
);

// Tool 7: project_architecture
(server as any).tool(
    "project_architecture",
    "Get the structural blueprint of the project. Returns a directory tree and identifies the most central/core files.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        maxDepth: z.number().optional().describe("Max folder depth to scan (default 5)")
    },
    async (args: any) => {
        const { projectPath, maxDepth = 5 } = args;
        broadcastEvent('tool_call', { tool: 'project_architecture', args, response: 'Scanning project architecture...' });
        
        const architectureText = getProjectArchitecture(projectPath, maxDepth);
        
        await saveSearchLog(projectPath, ['[Architecture Scan]'], architectureText);
        broadcastEvent('tool_call', { tool: 'project_architecture', args, response: architectureText });
        return { content: [{ type: "text", text: architectureText }] };
    }
);

// Tool 8: analyze_dependencies
(server as any).tool(
    "analyze_dependencies",
    "Find which files depend on (import or reference) a specific file, class, or module.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        targetName: z.string().describe("The name of the file or module to trace dependencies for")
    },
    async (args: any) => {
        const { projectPath, targetName } = args;
        broadcastEvent('tool_call', { tool: 'analyze_dependencies', args, response: `Tracing dependencies for ${targetName}...` });
        
        await indexer.indexProject(projectPath);
        
        const results = await searcher.search({ query: targetName, topK: 20, filterType: ['import'] });
        
        let responseContent;
        if (results.length === 0) {
            responseContent = `No files found that explicitly import '${targetName}'.`;
        } else {
            const deps = results.map((r: any) => `- ${r.chunk.filePath} (Score: ${r.score.toFixed(3)}) \n  \`\`\`ts\n${r.chunk.content}\n  \`\`\``).join('\n\n');
            responseContent = `The following files depend on '${targetName}':\n\n${deps}`;
        }

        await saveSearchLog(projectPath, [`[Dependencies] ${targetName}`], responseContent);
        broadcastEvent('tool_call', { tool: 'analyze_dependencies', args, response: responseContent });
        return { content: [{ type: "text", text: responseContent }] };
    }
);

// Tool 9: deep_isolated_search
(server as any).tool(
    "deep_isolated_search",
    "Search strictly within the results of a previous search log (Drill Down). Extracts only the relevant lines and context from a large previous result.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        logFilename: z.string().describe("The history log file to search within (e.g. search_2026-07-13...md)"),
        keyword: z.string().describe("The exact keyword or concept to filter the log file by")
    },
    async (args: any) => {
        const { projectPath, logFilename, keyword } = args;
        broadcastEvent('tool_call', { tool: 'deep_isolated_search', args, response: `Drilling down for '${keyword}'...` });
        
        const logContent = getSearchLog(projectPath, logFilename);
        if (logContent.startsWith("Log file not found")) {
            return { content: [{ type: "text", text: logContent }] };
        }
        
        const lines = logContent.split('\n');
        const matchedChunks: string[] = [];
        const contextLines = 4;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
                const start = Math.max(0, i - contextLines);
                const end = Math.min(lines.length - 1, i + contextLines);
                matchedChunks.push(`--- Context (Lines ${start+1} to ${end+1}) ---\n${lines.slice(start, end + 1).join('\n')}`);
                i = end; // skip the context we just added
            }
        }
        
        let responseContent = matchedChunks.length === 0 
            ? `Keyword '${keyword}' not found in ${logFilename}.`
            : `Found ${matchedChunks.length} occurrences in isolated context:\n\n${matchedChunks.join('\n\n')}`;
            
        await saveSearchLog(projectPath, [`[Deep Search] ${keyword} in ${logFilename}`], responseContent);
        broadcastEvent('tool_call', { tool: 'deep_isolated_search', args, response: responseContent });
        return { content: [{ type: "text", text: responseContent }] };
    }
);

// Tool 10: explore_feature
(server as any).tool(
    "explore_feature",
    "Get a high-level 30% overview of a feature or directory. Returns class signatures, functions, and imports without the heavy implementation details.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        featureDir: z.string().describe("Relative or absolute path to the feature directory (e.g., 'lib/presentation/screens/task')")
    },
    async (args: any) => {
        const { projectPath, featureDir } = args;
        broadcastEvent('tool_call', { tool: 'explore_feature', args, response: `Analyzing feature surface for '${featureDir}'...` });
        
        let targetPath = featureDir;
        if (!path.isAbsolute(featureDir)) {
            targetPath = path.join(projectPath, featureDir);
        }
        
        const outlineText = getFeatureOutline(targetPath);
        
        await saveSearchLog(projectPath, [`[Feature Outline] ${featureDir}`], outlineText);
        broadcastEvent('tool_call', { tool: 'explore_feature', args, response: outlineText });
        return { content: [{ type: "text", text: outlineText }] };
    }
);

// Tool 11: generate_project_dna
(server as any).tool(
    "generate_project_dna",
    "Generates or regenerates the Project DNA context intelligence for the specified project.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project")
    },
    async (args: any) => {
        const { projectPath } = args;
        broadcastEvent('tool_call', { tool: 'generate_project_dna', args, response: 'Generating DNA...' });
        
        try {
            const dna = await generateDNA(projectPath);
            const msg = `Successfully generated Project DNA for ${dna.identity.name}.`;
            broadcastEvent('tool_call', { tool: 'generate_project_dna', args, response: msg });
            return { content: [{ type: "text", text: msg }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Error generating DNA: ${e.message}` }] };
        }
    }
);

// Tool 12: get_project_dna
(server as any).tool(
    "get_project_dna",
    "Retrieves the Project DNA context intelligence. Supports section filtering, query filtering, pagination (limit/offset), and path filtering to minimize tokens.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        section: z.string().optional().describe("Optional: Filter DNA to a specific section (e.g. tokens, conventions, architecture, rules, assets, identity)"),
        query: z.string().optional().describe("Optional: Search DNA and return only matching JSON structures"),
        limit: z.number().optional().describe("Optional: Limit the number of array items returned"),
        offset: z.number().optional().describe("Optional: Start index for pagination of array items"),
        pathFilter: z.string().optional().describe("Optional: Filter DNA records by file path prefix"),
        showMetaOnly: z.boolean().optional().describe("Optional: Only return metadata and record counts (no content) to analyze size first")
    },
    async (args: any) => {
        const { projectPath, section, query, limit, offset, pathFilter, showMetaOnly } = args;
        broadcastEvent('tool_call', { tool: 'get_project_dna', args, response: 'Retrieving DNA...' });
        
        const dna = loadDNA(projectPath);
        if (!dna) {
            return { content: [{ type: "text", text: "Project DNA not found. Run `generate_project_dna` first." }] };
        }
        
        let resultObj: any = dna;
        if (section) {
            const sectionMap: Record<string, string> = {
                identity: 'identity',
                design: 'designSystem',
                tokens: 'designSystem',
                architecture: 'architecture',
                arch: 'architecture',
                components: 'components',
                localization: 'localization',
                i18n: 'localization',
                conventions: 'conventions',
                rules: 'rules',
                assets: 'assets'
            };
            const key = sectionMap[section.toLowerCase()];
            if (key && (dna as any)[key]) {
                resultObj = (dna as any)[key];
            } else {
                return { content: [{ type: "text", text: `Unknown section "${section}". Available: ${Object.keys(sectionMap).join(', ')}` }] };
            }
        }

        // Apply filters, path-filtering, limit/offset, and metaOnly
        if (query) {
            resultObj = recursiveQueryDna(resultObj, query);
            if (!resultObj || (typeof resultObj === 'object' && Object.keys(resultObj).length === 0)) {
                return { content: [{ type: "text", text: `No matches found in DNA for query: "${query}"` }] };
            }
        }

        resultObj = processDnaFilters(resultObj, pathFilter, undefined, limit, offset, showMetaOnly);

        if (!resultObj || (typeof resultObj === 'object' && Object.keys(resultObj).length === 0)) {
            return { content: [{ type: "text", text: `No matches found in DNA after filtering.` }] };
        }

        let outputText = JSON.stringify(resultObj, null, 2);
        
        // Always compress using TokenOptimizerService to save tokens
        const optimizer = new TokenOptimizerService();
        outputText = optimizer.optimize(outputText).toUnifiedString();

        broadcastEvent('tool_call', { tool: 'get_project_dna', args, response: 'DNA retrieved successfully.' });
        return { content: [{ type: "text", text: outputText }] };
    }
);


// Tool 13: get_creation_context
(server as any).tool(
    "get_creation_context",
    "Get a pre-generation checklist (context rules, similar components, required tokens) before writing a new file/component.",
    {
        projectPath: z.string().describe("Absolute path to the root of the project"),
        targetPath: z.string().describe("The relative path of the file you are about to create (e.g. src/components/button.tsx)")
    },
    async (args: any) => {
        const { projectPath, targetPath } = args;
        broadcastEvent('tool_call', { tool: 'get_creation_context', args, response: 'Generating creation context...' });
        
        try {
            const contextText = getContextText(projectPath, targetPath, false);
            broadcastEvent('tool_call', { tool: 'get_creation_context', args, response: contextText });
            return { content: [{ type: "text", text: contextText }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Error generating context: ${e.message}` }] };
        }
    }
);

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Semantic Search Server running on stdio");
}

main().catch(console.error);
