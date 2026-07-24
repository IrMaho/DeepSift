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
deepsift feature "src/features/auth" --summary
deepsift feature "src/features/auth" --depth 2 --limit 15
```

### 💡 Agent Rules for Feature Analysis:
- **RELY ON THIS HEAVILY:** It parses the AST (Abstract Syntax Tree) and automatically generates an inline **Purpose Summary** (smart-weighted from exported symbols, React JSX, and path context) and full **Logic Signatures** (Classes, Functions, Interfaces, Exports).
- **Prevent Terminal Truncation:** Use `--summary` / `-s` when scanning large folders to show top-level exports only without internal method clutter.
- **Smart Directory Limits:** Directory feature scans automatically cap internal method lines to keep console output clean and prevent token truncation.
- You do **NOT** need to open the file to know what it does. `deepsift feature` tells you `class AuthController { login(req): Promise<User>; logout(): void; }` without reading 500 lines of implementation details.

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

---

## 5. 🚀 `deepsift executive-summary` (Instant Verbal Overview)

Generate an ultra-fast <50 line overview dashboard for instant orientation at the beginning of any task.

**Usage:**
```bash
deepsift executive-summary
deepsift summary --json
```

### 💡 Agent Rules for Executive Summary:
- **Instant Orientation:** Run `executive-summary` at the start of a conversation to see primary languages, God Node count, core hubs, total files, and test coverage status in under 3 seconds.

---

## 6. 🔍 `deepsift zoom "folder"` (Cluster AST Drill-Down)

Drill down directly into omitted file clusters to analyze their AST signatures.

**Usage:**
```bash
deepsift zoom "src/components"
```

### 💡 Agent Rules for Zoom:
- When `overview` or `feature` lists an omitted cluster (`📁 src/components/ (15 files)`), run `deepsift zoom "src/components"` to analyze that folder's AST signatures without calculating offsets manually.

---

## 7. ⚡ `deepsift wire-trace [dir]` (Type-Aware IPC & Message Flow Tracer)

Trace cross-environment messages (`postMessage`, Electron IPC, WebSockets, EventEmitters) with AST Enum & Type alias matching.

**Usage:**
```bash
deepsift wire-trace
deepsift wire-trace "src/plugin"
```

### 💡 Agent Rules for Wire Trace:
- Automatically matches Enum member references (e.g. `MessageTypes.CREATE_RECT` ↔ `'create-rect'`), `switch (msg.type)` statements, and flags `⚠️ Orphan IPC Channel` for senders or receivers missing a pair.

---

## 8. 📊 `deepsift complexity [path]` (Cognitive Complexity Heatmap)

Calculate Cyclomatic and Cognitive complexity per function across the codebase.

**Usage:**
```bash
deepsift complexity
deepsift complexity "src/services"
```

### 💡 Agent Rules for Complexity:
- Automatically filters out compiled/minified build artifacts (`dist/`, `build/`, `code.js`, `min.js`) and transpiler boilerplates to highlight real source code complexity hotspots.

