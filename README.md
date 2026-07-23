# 🌌 DeepSift: Next-Generation Codebase Intelligence

DeepSift is an advanced semantic search engine and codebase analysis tool designed to bridge the gap between abstract project structures and LLM context limits.

---

## 🏗️ Architecture

```text
mcp_search/
├── packages/
│   └── deepsift-core/         # Node.js/TypeScript text-semantic engine & MCP Server
├── docs/                      # Extensive legacy documentation and plans
├── .tools/                    # Local environment binaries (Node, npm)
├── deepsift-workspace.yml     # Master configuration file
├── package.json               # Root monorepo dependencies
└── pnpm-workspace.yaml        # Monorepo workspace configuration
```

### `packages/deepsift-core` (The Core Engine)
- **Tech Stack**: TypeScript, Node.js, Zig (for native AST parsing).
- **Responsibility**: Fast, text-based semantic indexing, AST traversal, DNA generation, DRM research memory, and serving the MCP (Model Context Protocol) to IDEs like VSCode/Cursor.
- **Entry Points**: 
  - `src/server.ts` (MCP Server)
  - `src/cli/cli-entry.ts` (CLI Commands)

---

## ⚙️ Configuration (`deepsift-workspace.yml`)

The configuration for DeepSift is managed in `deepsift-workspace.yml`:

```yaml
deepsift:
  core:
    enabled: true
    mode: "text-semantic"
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [pnpm](https://pnpm.io/) or npm

### 1. Install & Build Dependencies
```bash
# Install core dependencies across the monorepo
pnpm install

# Build deepsift-core
cd packages/deepsift-core
npm run build
```

### 2. Run DeepSift
```bash
# Start the CLI
cd packages/deepsift-core
npm run start:cli -- search "your query"
```

---

## 📚 Documentation
For deeper dives into specific systems, refer to the `docs/` folder:
- **`DEEPSIFT_CLI_GUIDE.md`**: Commands and arguments for the CLI.
- **`DEEPSIFT_FULL_CODEBASE_ANALYSIS.md`**: Architectural breakdown of the AST parsers.
- **`LEGACY_README.md`**: The original DeepSift V1 README.
