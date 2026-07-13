import { SQLiteStore } from './src/storage/sqlite-store.js';
import { Indexer } from './src/core/indexer.js';
import { Searcher } from './src/core/searcher.js';
import path from 'path';

async function runTest() {
    console.log("🚀 Starting MCP Server Test...");
    
    const projectPath = process.cwd();
    // Use a local db for testing
    const dbPath = path.join(projectPath, 'test.db');
    
    console.log("📦 Initializing database at:", dbPath);
    const store = new SQLiteStore(dbPath);
    const indexer = new Indexer(store);
    const searcher = new Searcher(store);

    console.log("🔍 Indexing project...");
    console.time("Indexing Time");
    const stats = await indexer.indexProject(projectPath, true);
    console.timeEnd("Indexing Time");
    console.log(`✅ Indexed ${stats.files} files and ${stats.chunks} chunks.\n`);

    const queries = [
        "How is AST parsed?",
        "Where is SQLite connection handled?",
        "How do we combine keyword and semantic search?"
    ];

    for (const query of queries) {
        console.log(`\n==========================================`);
        console.log(`🤖 Search Query: "${query}"`);
        console.time("Search Time");
        const results = await searcher.search({ query, topK: 3 });
        console.timeEnd("Search Time");
        
        console.log(`Found ${results.length} results:`);
        results.forEach((res, i) => {
            console.log(`\n[${i + 1}] File: ${path.basename(res.chunk.filePath)} (Lines ${res.chunk.startLine}-${res.chunk.endLine})`);
            console.log(`   Type: ${res.chunk.type}`);
            console.log(`   Match Type: ${res.matchType}`);
            console.log(`   Score (RRF): ${res.score.toFixed(4)}`);
            // truncate content for display
            const contentPrev = res.chunk.content.split('\n').slice(0, 3).join('\n');
            console.log(`   Snippet:\n${contentPrev}\n...`);
        });
    }
}

runTest().catch(console.error);
