# 🔍 DeepSift Search & Discovery Manual

**Version**: 2.0
**Target**: AI Agents & Systems
**Sub-system**: Core Search Engine & Context Resolution

This document is the authoritative guide on DeepSift's Search and Discovery commands. DeepSift is not just a `grep` wrapper; it is an intelligent Semantic, AST-aware, and Visual Engine.

---

## 1. 🧠 `deepsift search "query"` (Semantic & Literal)

The `search` command is your primary tool for finding concepts, functions, and architecture across the entire codebase.

**Usage:**
```bash
deepsift search "authentication login handler"
deepsift search "JWT token validation" --include "src/features/auth"
```

### 💡 Agent Rules for Searching:
- **Semantic First:** Unlike `grep`, you can search for concepts (e.g., "state management patterns"). DeepSift uses vector embeddings to find the most conceptually relevant files.
- **Narrow the Scope:** Use `--include <path>` if you already know the domain. It speeds up the search 10x and increases precision. Example: `--include "src/components"`.
- **Multi-Query:** Batch queries for efficiency: `deepsift search "query1" "query2"`.
- **Fallback Hints:** If no semantic matches are found, DeepSift will automatically suggest exact-match literal terms. 
- **Literal Search (Grep fallback):** If you are looking for an exact CSS class name (e.g., `text-blue-500`) or a very specific error string, and semantic search misses it, fallback to `deepsift com "grep -rn 'exact_text' src/"`.

---

## 2. 📖 `deepsift read "file"` (Flexible Reading)

The `read` command gives you exact, line-numbered source code. 

**Usage:**
```bash
deepsift read "src/core/indexer.ts"
deepsift read "src/core/indexer.ts:100-250"
deepsift read "src/ui/button.tsx" --compress
```

### 💡 Agent Rules for Reading:
- **MANDATORY PRE-EDIT CHECK:** You are **strictly forbidden** from editing a file without first reading it via `deepsift read` or native `view_file` to get the exact `\n` character layout.
- **Visual Token Compression (`--compress`):** If you just want to understand the structure, use `--compress`. It converts code into dense visual `pxpipe` tokens that save context window space.
- **Line Segments:** For God Nodes (>300 lines), NEVER read the entire file at once. Read in chunks: `deepsift read "file:1-100"`.
- **Warning on Compressed Output:** NEVER write patch replacement code based on compressed output. Compressed output loses exact variable names and spacing.

---

## 3. 🕸️ `deepsift deps "filename"` & `deepsift calltree "symbol"` (Dependency & Call Graph / Event Tracing)

Dependency mapping and call graph traversal are critical before modifying any exported function, component interface, or inter-environment event message.

**Usage:**
```bash
deepsift deps "src/components/Button.tsx"
deepsift calltree "sync-variables"
deepsift calltree "postMessage"
```

### 💡 Agent Rules for Dependencies & Call Tree:
- **Before Modifying Interfaces:** If you change a prop or method signature, run `deepsift deps` to find all components that import it and update them.
- **Event-Driven / postMessage Link Tracing:** When analyzing cross-environment communication (e.g. Figma plugin UI iframe sending `postMessage({ type: 'sync-variables' })` and core sandbox handling `msg.type === 'sync-variables'`), run `deepsift calltree "sync-variables"`.
- **Sender & Handler Auto-Linking:** `calltree` automatically categorizes matching lines into:
  - 📤 **Event Senders / Producers (UI Environment)**
  - 📥 **Event Handlers / Listeners (Core Sandbox)**
  - ⬆️ **Upstream Callers**
  - ⬇️ **Downstream Definitions & Scope**
- **Breaking Changes:** DeepSift prevents breaking changes by allowing you to trace events and call chains across isolated runtimes. 

---

## 4. 🧬 `deepsift context "path"` (Context Generation)

When creating a **new file**, you must understand the rules of the neighborhood.

**Usage:**
```bash
deepsift context "src/features/auth/NewLoginComponent.tsx"
```

### 💡 Agent Rules for Context:
- **MANDATORY PRE-CREATION:** Run this BEFORE creating any new file.
- **What it does:** It scans the parent directory and project DNA to tell you:
  1. What Naming Conventions to use (PascalCase vs camelCase).
  2. What Design Tokens exist (e.g., `text-brand-primary`).
  3. Whether you must use the `i18n` translation system.
  4. Examples of similar components in the same folder.
- **Why it matters:** It prevents you from creating a React component with hardcoded `#FF0000` colors when a `theme.css` already exists.

---

## 5. 🩺 `deepsift diag "problems.json"` (IDE Diagnostics)

If a build fails (e.g., `npm run build` throws TS errors), use `diag`.

**Usage:**
```bash
deepsift diag "problems.json"
```

### 💡 Agent Rules for Diagnostics:
- It reads the standard IDE diagnostic output and maps it directly to the exact file lines with surrounding context snippets.
- Use it to instantly locate type mismatches and syntax errors after an incomplete patch operation.
