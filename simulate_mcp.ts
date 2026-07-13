import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function main() {
    console.log("🚀 Starting MCP Live Simulation...");
    console.log("⚠️ Make sure you have STOPPED the manual 'node dist/server.js' in your terminal to free up port 3000.");
    
    // Connect to the MCP Server
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/server.js"]
    });

    const client = new Client(
        { name: "antigravity-simulator", version: "1.0.0" },
        { capabilities: {} }
    );

    console.log("🔗 Connecting to MCP Server via stdio...");
    await client.connect(transport);
    
    console.log("✅ Connected! Dashboard should now be live at http://localhost:3000");
    console.log("⏳ Waiting 3 seconds before sending the first query so you can open the browser...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    const projectPath = process.cwd();

    // 1. Check Status
    console.log("\n📡 Sending: search_status");
    await client.callTool({
        name: "search_status",
        arguments: {}
    });

    // 2. Multi Search (Real speed!)
    console.log("\n📡 Sending: multi_search");
    const multiResult = await client.callTool({
        name: "multi_search",
        arguments: {
            projectPath,
            queries: [
                { query: "How do we parse the AST using tree-sitter?", topK: 2 },
                { query: "Where is the SQLite FTS5 table created?", topK: 2 }
            ]
        }
    });

    console.log("\n✅ Multi-Search Completed! Check the UI dashboard to see the live feed.");
    console.log("Results summary:");
    console.log((multiResult.content as any)[0].text.substring(0, 300) + "...\n");

    console.log("🛑 Simulation will stay alive for 60 seconds so you can browse the UI, then it will close automatically.");
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log("👋 Simulation ended.");
    process.exit(0);
}

main().catch(console.error);
