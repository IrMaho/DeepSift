import { getProjectArchitecture } from './dist/utils/architecture.js';
import { SQLiteStore } from './dist/storage/sqlite-store.js';
import { Indexer } from './dist/core/indexer.js';
import { Searcher } from './dist/core/searcher.js';

async function run() {
    const projectPath = 'c:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\temp\\lib';
    
    console.log("=== STEP 2: DEPENDENCIES ===");
    const store = new SQLiteStore('test.db');
    
    const indexer = new Indexer(store);
    console.log("Indexing project...");
    await indexer.indexProject(projectPath, true);
    
    const searcher = new Searcher(store);
    console.log("Searching for dependencies of 'service_api.dart'...");
    const deps = await searcher.search({ query: 'service_api.dart', topK: 10, filterType: ['import'] });
    
    console.log(`Found ${deps.length} files that depend on 'service_api.dart':`);
    for (const d of deps) {
        console.log(`- ${d.chunk.filePath}:${d.chunk.startLine} -> ${d.chunk.content}`);
    }
}
run();
