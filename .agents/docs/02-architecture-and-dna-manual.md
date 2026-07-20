# 🏗️ DeepSift Architecture & DNA Manual

**Version**: 2.0
**Target**: AI Agents & Systems
**Sub-system**: Codebase Mapping & AST Extraction

This document explains how to use DeepSift to instantly understand project structures, map God Nodes, and extract zero-knowledge logic signatures without reading full source files.

---

## 1. 🩻 `deepsift arch [--depth N]` (Skeleton Mapping)

Do not blindly list directories. Use `arch` to see the high-level skeleton.

**Usage:**
```bash
deepsift arch
deepsift arch --depth 3
```

### 💡 Agent Rules for Architecture:
- `arch` automatically truncates giant trees (e.g., `node_modules`, `dist`, `.git`) and ignores large data/log files to prevent console bloat.
- It groups files by type and gives you a visual map of the domain boundaries.

---

## 2. 🎯 `deepsift feature "path"` (AST Logic Signatures)

The most powerful command for understanding a module without reading its code.

**Usage:**
```bash
deepsift feature "src/features/auth"
deepsift feature "src/core/indexer.ts"
```

### 💡 Agent Rules for Feature Analysis:
- **RELY ON THIS HEAVILY:** It parses the AST (Abstract Syntax Tree) and automatically generates an inline **Purpose Summary** and full **Logic Signatures** (Classes, Functions, Interfaces, Exports) directly in the console.
- You do **NOT** need to open the file to know what it does.
- Use this when you are investigating how a system works. For example, `deepsift feature` will tell you `class AuthController { login(req): Promise<User>; logout(): void; }` without you having to read the 500-line implementation details.

---

## 3. 🔬 `deepsift analyze "path"` (The Super-Command)

When you need a deep dive combining AST logic, Project DNA, and purpose summaries.

**Usage:**
```bash
deepsift analyze "src/components"
```

### 💡 Agent Rules for Analysis:
- `analyze` produces a heavily compressed markdown report that merges `feature` and `dna` data.
- It highlights exact architectural risks, temporal changes, and logic signatures in one unified view.

---

## 4. 🧬 `deepsift dna` (The Genetic Code of the Project)

DNA is DeepSift's persistent understanding of the project's architecture, design tokens, graph topology, and God Nodes.

**Usage:**
```bash
deepsift dna
deepsift dna --show
deepsift dna --show --meta
deepsift dna --show --section architecture
```

### 💡 Agent Rules for DNA:
- **God Node Identification:** A "God Node" is a file that has too many dependencies and is tightly coupled. `deepsift dna --show --section architecture` will list these files.
- **WARNING:** Modifying God Nodes is extremely dangerous. Always use `deepsift heal` or write highly precise patches when dealing with them.
- **Design Tokens:** DNA automatically mines UI design tokens (Colors, Typography, Spacing, Shadows). You MUST check DNA before writing CSS or UI code to ensure you are using the project's official tokens.
- **Paginating Large DNA:** If the DNA is huge, use `--limit` and `--offset` to safely extract TOON trees without blowing up your context window.
