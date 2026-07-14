# 🔍 DeepSift — Local Semantic Codebase Search Engine & AI Agent Bridge

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Model](https://img.shields.io/badge/Embedder-Ternlight%20%3C7MB-orange.svg)](https://github.com/ternlight/base)
[![MCP](https://img.shields.io/badge/MCP-Supported-brightgreen.svg)](https://modelcontextprotocol.io)

**DeepSift** is an ultra-fast, local semantic codebase search engine and AI agent bridge. It runs 100% offline using the lightweight **Ternlight** transformer model (384-dimensional vector embeddings, <7MB footprint) to process queries and codebase chunks in milliseconds without any external API calls or internet connection.

It is designed to work in two modes:
1. **MCP Server Mode:** Seamlessly connects to AI-driven IDEs (like Cursor, VSCode with Antigravity, or Claude Desktop) providing rich codebase analysis tools.
2. **CLI Bridge Mode:** Acts as a standalone terminal utility for manual queries, scripting, or environments without native MCP support.

---

## 🏗️ System Architecture

DeepSift coordinates AST-aware parsing, local vector generation, and hybrid index searching into a single pipeline:

```
                               ┌────────────────────────┐
                               │     Target Project     │
                               └──────────┬─────────────┘
                                          │
                            [deepsift init / index]
                                          ▼
                         ┌────────────────────────────────┐
                         │      DeepSift Core Engine      │
                         │ ┌────────────────────────────┐ │
                         │ │ AST Parser (Tree-sitter)   │ │
                         │ ├────────────────────────────┤ │
                         │ │ Embedder (Ternlight Model) │ │
                         │ ├────────────────────────────┤ │
                         │ │ Store (SQLite + FTS5)      │ │
                         │ └────────────────────────────┘ │
                         └────────────────┬───────────────┘
                                          │
                                 ┌────────┴────────┐
                                 ▼                 ▼
                       ┌──────────────────┐ ┌─────────────┐
                       │    CLI Bridge    │ │ MCP Server  │
                       │   (deepsift s)   │ │  (Stdio)    │
                       └──────────────────┘ └──────┬──────┘
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │   Web UI     │
                                           │ (Port 3000)  │
                                           └──────────────┘
```

---

## ✨ Key Features

*   **100% Offline & Local:** Code privacy is fully respected. Embeddings are generated locally using the `@ternlight/base` library. No data ever leaves your machine.
*   **AST-Aware Code Chunking:** Uses `tree-sitter` parsers to break code down into logical constructs (such as classes, functions, and imports) while maintaining correct scope. Falls back to intelligent line-based chunking for unsupported formats.
*   **Hybrid Search Engine (Vector + BM25 + RRF):** Combines dense vector search (Cosine Similarity) with sparse lexical search (SQLite FTS5 BM25 scoring) using **Reciprocal Rank Fusion (RRF)** to deliver highly relevant results.
*   **Antigravity Brain Protocol (Drill-Down & Dependencies):** Equips AI agents to analyze very large repositories (100MB+) in steps. Agents can scan the project architecture, map dependencies, search globally, and then "drill down" strictly within cached logs—reducing context window consumption from megabytes to kilobytes.
*   **Advanced Config System (`deepsift.config.json`):** Allows fine-grained control over directories to index or ignore (interactive configuration via `deepsift config`), file extensions to include/exclude, and default search options.
*   **Incremental Indexing:** Stores file hashes in SQLite. DeepSift only re-indexes modified or new files during runs, making index synchronizations complete in milliseconds.
*   **Smart Token Compression (DEC_v2):** Includes a custom n-gram compression utility that minimizes LLM token usage. Important structural details (file paths, line references, code block fences, and search scores) are automatically kept uncompressed to avoid AI hallucinations.
*   **Web Dashboard UI:** Spins up a local web server (running on `http://localhost:3000`) using Server-Sent Events (SSE) to stream indexing progress, search triggers, and MCP tool invocations in real-time.

---

## 🚀 Quick Start (CLI Mode)

To use DeepSift globally in your terminal:

### 1. Installation

Clone the repository and build the project:
```bash
git clone https://github.com/IrMaho/DeepSift.git
cd DeepSift
npm install
npm run build
npm link
```

### 2. Initialization & Configuration in Target Project

Navigate to your target codebase and initialize DeepSift:
```bash
cd /path/to/your/work-project
deepsift init
```
This command will:
1. Create a local `.deepsift/` directory to store the SQLite database and output history.
2. Ingest the workspace and trigger the initial index generation.
3. Automatically copy the AI agent guidelines into your `.agents/rules/deepsift.md` file to configure any LLM IDE extensions inside that workspace.

To customize folders or file types to index (e.g. ignoring massive platform folders in Flutter or mobile projects):
```bash
deepsift config
```
This opens an interactive CLI checklist where you can select or deselect directories, writing the preferences into `deepsift.config.json`.

### 3. Searching the Codebase
```bash
# Semantic search with surrounding context lines
deepsift search "JWT token verification handler" --context-lines 15

# Search strictly within a folder
deepsift search "database config" --include "src/config"

# Multi-query search (saves time by running multiple queries at once)
deepsift search "auth check" "user schema" "password hashing"
```

---

## ⚙️ MCP Server Configuration

You can plug DeepSift directly into AI editors or LLM tools supporting the Model Context Protocol (Stdio transport).

### 1. Build the Server
Ensure the project is compiled:
```bash
cd /path/to/DeepSift
npm run build
```

### 2. Configure Your IDE / Client

Add the following to your MCP settings file (e.g., `mcp_settings.json` in Cursor, Claude Desktop, or your IDE's workspace configuration):

```json
{
  "mcpServers": {
    "deepsift": {
      "command": "node",
      "args": [
        "C:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\dist\\server.js"
      ],
      "env": {}
    }
  }
}
```
> **Note:** Replace the path in `args` with the absolute path to your built `dist/server.js` file.

Once running, the server also starts the **Web Dashboard** at **[http://localhost:3000](http://localhost:3000)** for monitoring queries.

---

## 🛠️ Commands & Tools Reference

### CLI Commands

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| **`init`** | None | Initializes `.deepsift/` and executes the initial indexing scan. |
| **`config`** | None | Launches an interactive console checklist to configure directories to index, generating a customizable `deepsift.config.json`. |
| **`search`** | `"query1"` `["query2"...]` | Executes one or more hybrid semantic search queries. <br>Flags: `--include <path>`, `--no-sync` (skips file hashing updates), `--verbose`, `--context-lines <N>` (or `-C <N>`) |
| **`index`** | None | Re-indexes the project (incremental). Add `--force` to rebuild from scratch. |
| **`status`** | None | Prints database size, total files indexed, and total chunk counts. |
| **`arch`** | `--depth <N>` | Prints a formatted directory layout and highlights the top-5 central core files. |
| **`deps`** | `"target_module"` | Traces files that import or reference the target module. |
| **`feature`** | `"dir_path"` | Analyzes code surface, returning class/function declarations without full implementation. |
| **`history`**| None | Prints a list of previously saved search logs. |
| **`drill`** | `"logfile.md"` `"keyword"` | Isolates and extracts matching context lines from a past search history log. |
| **`resolve`**| `"token"` | Decodes an abbreviated token (e.g. `0A`) generated by DEC_v2 compression by looking up the cached dictionary. |
| **`clean`** | None | Empties the database, cached indexes, and history logs. |

*Global Flags:*
*   `--json`: Outputs results in JSON format.
*   `--plain`: Outputs plain text without Markdown colors/decorations.
*   `--no-compress`: Disables payload n-gram token compression (DEC_v2 is enabled by default to conserve context window).

---

### MCP Tools List

When connected via MCP, the LLM agent gains access to these 10 tools:

1.  **`search_code`**: Semantic and lexical hybrid search for code chunks.
2.  **`multi_search`**: Runs multiple queries simultaneously.
3.  **`index_project`**: Manually requests a full or incremental project index run.
4.  **`search_status`**: Provides the current indexing status and details.
5.  **`get_search_history`**: Reads `INDEX.md` containing the cached logs of all queries.
6.  **`read_search_log`**: Fetches the full contents of a specific query log.
7.  **`project_architecture`**: Maps the project structure and highlights core files.
8.  **`analyze_dependencies`**: Identifies dependent modules and imports.
9.  **`deep_isolated_search`**: Filters context from a previous query log (Drill-Down).
10. **`explore_feature`**: Outlines API surfaces (functions/classes) of a specific directory.

---

## 📂 Project Directory Structure

```
DeepSift /
├── src/
│   ├── cli/                  # CLI Commands, formatting, and path resolver
│   │   ├── commands/         # Implementation of CLI endpoints (search, index, arch...)
│   │   ├── cli-entry.ts      # Main CLI entry point
│   │   └── cli-output.ts     # Terminal printer and option parser
│   │
│   ├── core/                 # Engine logic
│   │   ├── embedder.ts       # Ternlight local model integration
│   │   ├── indexer.ts        # AST parsing and DB persistence orchestrator
│   │   └── searcher.ts       # Hybrid search and Reciprocal Rank Fusion (RRF) matching
│   │
│   ├── parsers/              # Code structure parsing
│   │   ├── simple-parser.ts  # Fallback line-by-line scanner
│   │   └── tree-sitter-parser.ts # AST parser for JS/TS structure chunking
│   │
│   ├── storage/              # Database drivers
│   │   └── sqlite-store.ts   # SQLite schemas, FTS5 indexes, and vector operations
│   │
│   ├── ui/                   # Real-time SSE Dashboard HTML, JS, and CSS
│   │
│   ├── utils/                # General utilities
│   │   ├── architecture.ts   # Central file and hierarchy computation
│   │   ├── binary-check.ts   # Skips processing binaries
│   │   ├── file-walker.ts    # Walks paths obeying project .gitignore rules
│   │   ├── history.ts        # Manages search logs and cache indexes
│   │   ├── outline.ts        # Parses directory signatures (Feature surface)
│   │   ├── similarity.ts     # Consine similarity & BM25 scorers
│   │   └── token-compressor.ts # N-gram compression logic for context optimization
│   │
│   └── server.ts             # MCP server entry point and SSE server initializer
│
├── tsconfig.json             # TypeScript compiler settings
└── package.json              # Node packages and build script configs
```

---

## 📄 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.