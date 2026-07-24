# 🏛️ DeepSift Clean Architecture & System Engine

DeepSift is a high-performance **Semantic Codebase Search, AST Graph Analysis, and Self-Healing Engine** engineered for both AI Coding Agents and Human Developers.

---

## 📐 Core Architecture Overview

DeepSift operates on a modular, decoupled Clean Architecture physically dividing components into discrete layers:

```mermaid
graph TD
    CLI[CLI Entry Point / Server] --> Analyzers[AST & Intelligence Analyzers]
    CLI --> Core[Indexer & Embedder]
    CLI --> Graphify[Graphify Community Engine]
    CLI --> DRM[Dynamic Research Memory (DRM)]
    Core --> Storage[Native SQLite / Key-Value Store]
    Core --> Parsers[Tree-Sitter Multilingual AST Parsers]
    Core --> Zig[Zig Native High-Density Renderer]
```

---

## 🧬 Key Architectural Engines

### 1. Hybrid Semantic & Graphify Search Engine
Combines **BM25 lexical search** with **Vector embeddings** and **Graphify PageRank RRF (Reciprocal Rank Fusion)**. Central God Nodes and top-connected functions are automatically scored and boosted in search results.

### 2. Tree-Sitter AST Structural Analyzer
Parses TypeScript, JavaScript, Python, Dart, and Go source code into AST scope blocks to extract exact function signatures, exported classes, call graphs, control flow branches (CFG), and dependency maps.

### 3. DEC_v2 Visual Token Compressor
Compresses terminal text outputs by 30-50% using DEC_v2 visual tokens and native Zig rendering (`deepsift-math.exe`), preventing context window explosion in AI Agent prompts.

### 4. Dynamic Research Memory (DRM Engine)
Provides persistent, tag-based research memory (`deepsift memo`) enabling AI agents to track active investigation states, decision logs, and architectural findings across multiple steps and sessions.

### 5. Self-Healing & Structural Patching Engine
Provides AST-safe code refactoring (`deepsift refactor`), dry-run simulations, security scanners (CWE vulnerabilities, sandbox boundary leaks), and autonomous self-healing loops (`deepsift auto-heal`).
