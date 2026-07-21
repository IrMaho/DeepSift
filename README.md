# 🌌 DeepSift: Next-Generation Codebase Intelligence

DeepSift is an advanced, hybrid semantic search engine and codebase analysis tool designed to bridge the gap between abstract project structures and LLM context limits.

This repository is organized as a **Monorepo** to seamlessly integrate a lightweight text-based semantic search engine with a heavy multimodal (vision-based) UI component retrieval system.

---

## 🏗️ Monorepo Architecture

The project is structured to ensure maximum modularity, allowing DeepSift to scale from low-end laptops to high-end workstations with dedicated GPUs.

```text
mcp_search/
├── packages/
│   ├── deepsift-core/         # Node.js/TypeScript text-semantic engine & MCP Server
│   └── deepsift-vision/       # Python PixelRAG multimodal UI understanding engine
├── models/
│   └── Qwen3-VL-Embedding-2B/ # Downloaded ML models (local AI)
├── docs/                      # Extensive legacy documentation and plans
├── .tools/                    # Local environment binaries (Node, npm)
├── deepsift-workspace.yml     # Master configuration file
├── package.json               # Root monorepo dependencies
└── pnpm-workspace.yaml        # Monorepo workspace configuration
```

### 1. `packages/deepsift-core` (The Brain)
- **Tech Stack**: TypeScript, Node.js, Zig (for native AST parsing).
- **Responsibility**: Fast, text-based semantic indexing, AST traversal, DNA generation, and serving the MCP (Model Context Protocol) to IDEs like VSCode/Cursor.
- **Entry Points**: 
  - `src/server.ts` (MCP Server)
  - `src/cli/cli-entry.ts` (CLI Commands)

### 2. `packages/deepsift-vision` (The Eyes)
- **Tech Stack**: Python, PyTorch, FAISS, FastAPI.
- **Responsibility**: Based on the PixelRAG architecture, this module parses rendered UI components or PDF structures, chunks them visually, and computes semantic embeddings using Vision-Language Models (VLMs) like `Qwen3-VL`.
- **Use Case**: Allows you to query "Where is the login button with the blue shadow?" and find the exact file/component visually.

### 3. `models/` (The Knowledge)
- Contains large, locally cached machine learning models. 
- Keeping them at the root prevents redundant downloads and keeps the `packages/` folders strictly for code.

---

## ⚙️ Configuration (`deepsift-workspace.yml`)

The heart of the monorepo is the `deepsift-workspace.yml` file. It determines which engines are active based on your hardware capabilities.

### 🔋 High-Performance Mode (Text + Vision)
If your system has a strong GPU or sufficient RAM to load the 2B vision model:
```yaml
deepsift:
  core:
    enabled: true
    mode: "hybrid"
  vision:
    enabled: true
    mode: "pixelrag"
    model_path: "./models/Qwen3-VL-Embedding-2B"
    backend: "faiss"
```
*Queries will hit both the text AST index and the visual FAISS index.*

### 🪫 Lightweight Mode (Text Only)
If your system has limited RAM/VRAM:
```yaml
deepsift:
  core:
    enabled: true
    mode: "text-semantic"
  vision:
    enabled: false
```
*DeepSift will completely disable the Python/Vision backend, saving memory and processing solely via TypeScript/Zig.*

---

## 🚀 Getting Started

### Prerequisites
- [pnpm](https://pnpm.io/) for managing Node.js workspaces.
- Python 3.10+ (for `deepsift-vision`).
- Node.js 18+ (for `deepsift-core`).

### 1. Install Dependencies
```bash
# Install core dependencies across the monorepo
pnpm install

# Build core packages
pnpm run build
```

### 2. Setup Vision Backend (Optional)
If you plan to use the vision capabilities:
```bash
cd packages/deepsift-vision
python -m venv venv
.\venv\Scripts\activate
pip install -e ".[index,serve]"
```

### 3. Run DeepSift
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
