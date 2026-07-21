import { SQLiteStore } from './dist/storage/sqlite-store.js';
import { Indexer } from './dist/core/indexer.js';
import { Searcher } from './dist/core/searcher.js';

async function run() {
    const projectPath = 'c:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\temp\\lib';
    const store = new SQLiteStore('test.db');
    await store.init();
    const searcher = new Searcher(store);

    console.log("=== Q1: App Entry Point ===");
    const q1 = await searcher.search({ query: 'void main runApp Fartak', topK: 3 });
    for (const r of q1) console.log(`[${r.chunk.filePath}:${r.chunk.startLine}] \n${r.chunk.content.substring(0, 300)}...`);

    console.log("\n=== Q2: Form Manager Dashboard ===");
    const q2 = await searcher.search({ query: 'form_manager_dashboard_screen class', topK: 3 });
    for (const r of q2) console.log(`[${r.chunk.filePath}:${r.chunk.startLine}] \n${r.chunk.content.substring(0, 300)}...`);
    
    console.log("\n=== Q3: Dependencies of service_api.dart ===");
    const q3 = await searcher.search({ query: 'service_api.dart', topK: 3, filterType: ['import'] });
    for (const r of q3) console.log(`[${r.chunk.filePath}:${r.chunk.startLine}] \n${r.chunk.content}`);
}
run();
