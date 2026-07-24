# 🔍 DeepSift Core

> **High-Performance Semantic Codebase Search, AST Graph Analysis, and Self-Healing Engine for AI Agents & Developers**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-ISC-blue.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.3-orange.svg)]()

DeepSift is an enterprise-grade codebase intelligence engine. It combines **Tree-Sitter AST parsing**, **BM25 + Vector Hybrid Search**, **Graphify PageRank algorithms**, **DEC_v2 Token Compression**, and a **Dynamic Research Memory (DRM)** engine to provide lightning-fast, highly accurate context for AI agents and software engineers.

---

## ✨ Features at a Glance

- 🚀 **Super-Commands (`overview`, `analyze`):** Single-step blueprint combining directory trees, God Nodes, and AST feature signatures.
- 🎯 **Hybrid Semantic & Graphify Search:** Combines BM25 lexical search with Graphify PageRank boosting for God Nodes.
- 🧬 **Project DNA & Topology:** Automatically discovers core architecture patterns, clean layer boundaries, and state stores.
- 🧠 **Dynamic Research Memory (DRM):** Persistent research note-taking engine (`deepsift memo`) tracking multi-step agent investigations.
- ⚡ **DEC_v2 Token Compressor:** Reduces terminal output token volume by 30-50% using high-density visual tokens and native Zig rendering.
- 🛡️ **Self-Healing & Security Scan:** AST-safe symbol renaming, dry-run patching, CWE vulnerability scanning, and autonomous auto-healing.
- 📚 **Automated DocGen Engine (`deepsift docgen`):** Self-updating documentation system that regenerates Markdown docs on every build.

---

## 📦 Quick Start

### Installation

```bash
npm install -g deepsift
# or inside monorepo
pnpm add deepsift
```

### Basic Commands

```bash
# Initialize DeepSift in your repository
deepsift init

# Project Overview & Blueprint
deepsift overview

# Semantic Code Search
deepsift search "authentication state store"

# AST Feature Signature Outline
deepsift feature "src/core"

# Regenerate Documentation
deepsift docgen
```

---

## 🛠️ Complete CLI Command Suite

DeepSift features **61 powerful CLI commands**. For detailed options and usage examples, refer to [docs/COMMANDS.md](docs/COMMANDS.md).

| Command | Category | Description |
|---|---|---|
| `deepsift overview` | Core Search & Discovery | SUPER-COMMAND: Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries. |
| `deepsift search` | Core Search & Discovery | Hybrid Semantic & BM25 search enhanced with Graphify PageRank and God Node boosting. |
| `deepsift read` | Core Search & Discovery | Mandatory file reader outputting exact text or compressed DEC_v2 visual tokens. |
| `deepsift feature` | Core Search & Discovery | AST-based feature outline detailing class definitions, exported functions, and dependencies. |
| `deepsift analyze` | Architecture & Intelligence | SUPER-COMMAND: Deep dive combining Feature AST Outline and DNA topology for a specific folder/file. |
| `deepsift arch` | Architecture & Intelligence | Project directory blueprint utilizing Graphify communities and automatic noise pruning. |
| `deepsift dna` | Architecture & Intelligence | Generates or displays Project DNA topology, central God Nodes, and community clusters. |
| `deepsift calltree` | Architecture & Intelligence | Traces upstream callers, downstream callee scopes, and event message flows for any symbol. |
| `deepsift cfg` | Architecture & Intelligence | Control Flow Graph extractor generating Mermaid and ASCII branch diagrams for functions. |
| `deepsift deps` | Architecture & Intelligence | Trace inbound and outbound dependencies for a specific file or module target. |
| `deepsift wire-trace` | Architecture & Intelligence | Maps cross-environment message flows (postMessage, IPC, WebSockets, EventEmitters). |
| `deepsift clones` | Refactoring & Self-Healing | AST Code Clone Detector highlighting duplicate blocks and copy-paste clusters for DRY compliance. |
| `deepsift find-dead-code` | Refactoring & Self-Healing | Scans for unreferenced exports, dead variables, and uncalled component functions. |
| `deepsift check-schema-drift` | Refactoring & Self-Healing | Audits schema and DOM selector synchronization between client UI and backend definitions. |
| `deepsift heal` | Refactoring & Self-Healing | DNA-based auto-refactoring engine that fixes lint, type, and architectural issues in a file. |
| `deepsift auto-heal` | Refactoring & Self-Healing | Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify). |
| `deepsift patch` | Refactoring & Self-Healing | Applies structural AST code injections using the TOON-Patch specification. |
| `deepsift refactor` | Refactoring & Self-Healing | AST-safe symbol renaming across codebase or function extraction. |
| `deepsift impact` | Refactoring & Self-Healing | Calculates breaking change risk score and lists caller sites before symbol modification. |
| `deepsift complexity` | Security & Diagnostics | Calculates Cyclomatic & Cognitive Complexity heatmap highlighting high-risk refactor targets. |
| `deepsift security-scan` | Security & Diagnostics | Scans for sandbox boundary leaks (e.g. window in sandbox), hardcoded secrets, and XSS risks. |
| `deepsift doctor` | Security & Diagnostics | Runs system health diagnostics, database index checks, and self-healing index repairs. |
| `deepsift testmap` | Security & Diagnostics | Maps source files to corresponding unit test files and identifies untested modules. |
| `deepsift git-churn` | Security & Diagnostics | Git Hotspot Heatmap combining commit frequency with code complexity to find churn hotspots. |
| `deepsift memo` | Memory & Realms | Dynamic Research Memory (DRM) engine for persisting active research tags and architectural notes. |
| `deepsift realm` | Memory & Realms | Manages external knowledge bases and external Swagger/Figma specs (list, add, mount, snapshot). |
| `deepsift compare` | Memory & Realms | Compares vector knowledge gaps and similarities between two knowledge realms. |
| `deepsift context` | Utilities & Dashboard | Generates pre-creation checklist with rules and design tokens before building components. |
| `deepsift plan` | Utilities & Dashboard | Generates structured implementation plans based on DNA, skills, realms, and architecture. |
| `deepsift plan-ui` | Utilities & Dashboard | Generates visual UI specs layout, token palettes, spacing, and i18n rules. |
| `deepsift docgen` | Utilities & Dashboard | Generates and synchronizes complete Markdown documentation suite for GitHub and AI Agents. |
| `deepsift ui` | Utilities & Dashboard | Launches local interactive Web Dashboard visualization on port 3333 for graph and DRM. |
| `deepsift init` | Core Search & Discovery | Initializes DeepSift workspace, creates .deepsift directory and performs first-run indexing bootstrap. |
| `deepsift config` | Core Search & Discovery | Interactive configuration menu for setting excluded folders, embedding model, and indexing preferences. |
| `deepsift index` | Core Search & Discovery | Manually triggers incremental or full codebase re-indexing with vector embedding sync. |
| `deepsift scan` | Core Search & Discovery | Full workspace scan that discovers new files, repairs missing index entries, and prunes deleted chunks. |
| `deepsift watch` | Core Search & Discovery | Starts a file system watcher that triggers incremental auto-indexing whenever source files change. |
| `deepsift status` | Core Search & Discovery | Displays current index health, chunk counts, last sync timestamp, and embedding model info. |
| `deepsift start` | Utilities & Dashboard | Starts the DeepSift MCP (Model Context Protocol) server for IDE and AI Agent integrations. |
| `deepsift scope` | Utilities & Dashboard | Sets or displays the active workspace search boundary — constrains all subsequent searches to a subdirectory. |
| `deepsift zoom` | Core Search & Discovery | Deep inspection of a specific file, class, or symbol — renders annotated view with type info and cross-references. |
| `deepsift read-feature` | Core Search & Discovery | Combined command: reads exact file lines AND generates an AST feature outline in a single call. |
| `deepsift edit` | Refactoring & Self-Healing | In-place file editor applying structured line-range replacements from a JSON edit spec. |
| `deepsift sed` | Refactoring & Self-Healing | Stream editor for targeted in-place text substitution within a specific line range of a file. |
| `deepsift decode` | Utilities & Dashboard | Decodes and expands DEC_v2 compressed visual token output back into full readable source text. |
| `deepsift pipe` | Utilities & Dashboard | Reads DeepSift input from stdin — enables chaining commands through Unix-style shell pipelines. |
| `deepsift history` | Utilities & Dashboard | Displays paginated search and read result history log with timestamps and result previews. |
| `deepsift drill` | Utilities & Dashboard | Drills into a specific history entry to re-render full search result with surrounding context lines. |
| `deepsift check-layers` | Security & Diagnostics | Validates Clean Architecture layer boundary rules — detects illegal cross-layer imports (e.g. data → UI). |
| `deepsift gen-test` | Security & Diagnostics | Automatically generates a unit test scaffold and mock file for a specified source module. |
| `deepsift gen-mock` | Security & Diagnostics | Generates a complete type-safe mock file for a module, inferring all exported interfaces and classes. |
| `deepsift gen-adr` | Utilities & Dashboard | Generates an Architecture Decision Record (ADR) Markdown template for documenting design decisions. |
| `deepsift executive-summary` | Utilities & Dashboard | Generates a high-level executive summary report covering code quality, test coverage, architecture health, and complexity. |
| `deepsift expand-type` | Architecture & Intelligence | Resolves and expands complex TypeScript types — unrolls generics, intersections, and conditional types. |
| `deepsift resolve` | Architecture & Intelligence | Resolves import paths and export symbols — finds where any identifier is defined across the workspace. |
| `deepsift resolve-error` | Refactoring & Self-Healing | Analyzes a TypeScript compiler error message and suggests targeted fixes with code snippets. |
| `deepsift i18n-extract` | Security & Diagnostics | Scans codebase for hardcoded display strings and generates an i18n key-value extraction report. |
| `deepsift learn` | Architecture & Intelligence | Runs adaptive project pattern learning — mines naming conventions, token vocabularies, and architectural signals. |
| `deepsift diag` | Security & Diagnostics | Runs a full system diagnostics report covering Node version, embedding model, SQLite health, and config state. |
| `deepsift com` | Utilities & Dashboard | Executes any arbitrary shell command from within the DeepSift context — output is compressed, cached, and searchable in history. |
| `deepsift clean` | Utilities & Dashboard | Cleans and prunes stored history logs — removes old search and command result cache files. |

---

## 📚 Documentation Index

- 📄 [CLI Commands Manual](docs/COMMANDS.md)
- 📄 [System Architecture & Clean Engine](docs/ARCHITECTURE.md)
- 📄 [TSDoc Source Code API Reference](docs/API_REFERENCE.md)
- 📄 [AI Agent Integration Manual](docs/AGENT_GUIDE.md)
- 📄 [Persian Guide (راهنمای فارسی)](docs/README_FA.md)

---

## 📄 License

ISC License © DeepSift Team
