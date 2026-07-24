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

DeepSift features **32 powerful CLI commands**. For detailed options and usage examples, refer to [docs/COMMANDS.md](docs/COMMANDS.md).

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
