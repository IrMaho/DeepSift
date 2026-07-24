# 🛠️ DeepSift CLI Commands Reference Manual

Comprehensive reference guide detailing all **32 CLI commands** available in DeepSift.

## 📌 Core Search & Discovery

### `deepsift overview` (Aliases: `ov`)
**Summary:** SUPER-COMMAND: Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries.

```bash
deepsift overview [path] [--depth N]
```

**Options:**
- `--depth <number>`: Max folder depth to traverse (default: 2)

**Example:**
```bash
deepsift overview --depth 3
```

---

### `deepsift search`
**Summary:** Hybrid Semantic & BM25 search enhanced with Graphify PageRank and God Node boosting.

```bash
deepsift search "query" [options]
```

**Options:**
- `--include, -i <path>`: Narrow search scope to specific subdirectory
- `--sync`: Synchronize index before executing search
- `--layer <ui|domain|data>`: Filter search results by Clean Architecture layer
- `--verbose, -v`: Display real-time indexing logs

**Example:**
```bash
deepsift search "auth store login" --include "src/features/auth"
```

---

### `deepsift read`
**Summary:** Mandatory file reader outputting exact text or compressed DEC_v2 visual tokens.

```bash
deepsift read "file:start-end" [--compress]
```

**Options:**
- `--compress`: Enable DEC_v2 token compression

**Example:**
```bash
deepsift read "src/utils/config.ts:1-50"
```

---

### `deepsift feature` (Aliases: `f`)
**Summary:** AST-based feature outline detailing class definitions, exported functions, and dependencies.

```bash
deepsift feature "path" [options]
```

**Options:**
- `--compact, -c`: High-density purpose & dependency outline
- `--summary, -s`: Summary mode showing top-level exports only
- `--group-by-feature, -g`: Group files by sub-feature directories
- `--depth <number>`: Max directory traversal depth
- `--limit <number>`: Max items per page
- `--offset <number>`: Pagination offset

**Example:**
```bash
deepsift feature "src/core" --summary
```

---

## 📌 Architecture & Intelligence

### `deepsift analyze` (Aliases: `an`)
**Summary:** SUPER-COMMAND: Deep dive combining Feature AST Outline and DNA topology for a specific folder/file.

```bash
deepsift analyze "path"
```

**Example:**
```bash
deepsift analyze "src/memo"
```

---

### `deepsift arch`
**Summary:** Project directory blueprint utilizing Graphify communities and automatic noise pruning.

```bash
deepsift arch [--depth N]
```

**Options:**
- `--depth <number>`: Max directory tree depth

**Example:**
```bash
deepsift arch --depth 4
```

---

### `deepsift dna`
**Summary:** Generates or displays Project DNA topology, central God Nodes, and community clusters.

```bash
deepsift dna [--show] [options]
```

**Options:**
- `--section <name>`: Filter DNA section (tokens, architecture, conventions)
- `--query, -q <term>`: Search DNA JSON data by keyword
- `--path-filter <path>`: Filter DNA records by file path prefix
- `--meta`: Output metadata and record counts only

**Example:**
```bash
deepsift dna --show --section architecture
```

---

### `deepsift calltree`
**Summary:** Traces upstream callers, downstream callee scopes, and event message flows for any symbol.

```bash
deepsift calltree "symbol" [--path <dir>]
```

**Options:**
- `--path <dir>`: Filter call graph scope to a specific subdirectory

**Example:**
```bash
deepsift calltree "TokenOptimizerService"
```

---

### `deepsift cfg`
**Summary:** Control Flow Graph extractor generating Mermaid and ASCII branch diagrams for functions.

```bash
deepsift cfg "file:func"
```

**Example:**
```bash
deepsift cfg "src/utils/config.ts:loadConfig"
```

---

### `deepsift deps`
**Summary:** Trace inbound and outbound dependencies for a specific file or module target.

```bash
deepsift deps "target"
```

**Example:**
```bash
deepsift deps "src/core/indexer.ts"
```

---

### `deepsift wire-trace`
**Summary:** Maps cross-environment message flows (postMessage, IPC, WebSockets, EventEmitters).

```bash
deepsift wire-trace [directory]
```

**Example:**
```bash
deepsift wire-trace "src/figma-core"
```

---

## 📌 Refactoring & Self-Healing

### `deepsift clones`
**Summary:** AST Code Clone Detector highlighting duplicate blocks and copy-paste clusters for DRY compliance.

```bash
deepsift clones
```

**Example:**
```bash
deepsift clones
```

---

### `deepsift find-dead-code` (Aliases: `dead-code`)
**Summary:** Scans for unreferenced exports, dead variables, and uncalled component functions.

```bash
deepsift find-dead-code
```

**Example:**
```bash
deepsift find-dead-code
```

---

### `deepsift check-schema-drift` (Aliases: `schema-drift`)
**Summary:** Audits schema and DOM selector synchronization between client UI and backend definitions.

```bash
deepsift check-schema-drift
```

**Example:**
```bash
deepsift check-schema-drift
```

---

### `deepsift heal`
**Summary:** DNA-based auto-refactoring engine that fixes lint, type, and architectural issues in a file.

```bash
deepsift heal "file"
```

**Example:**
```bash
deepsift heal "src/cli/cli-output.ts"
```

---

### `deepsift auto-heal`
**Summary:** Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify).

```bash
deepsift auto-heal "file"
```

**Example:**
```bash
deepsift auto-heal "src/storage/native-store.ts"
```

---

### `deepsift patch`
**Summary:** Applies structural AST code injections using the TOON-Patch specification.

```bash
deepsift patch "patch.json" [options]
```

**Options:**
- `--dry-run`: Simulate patch application in memory
- `--check-impact`: Trace breaking impact before writing to disk
- `--scan-security`: Perform CWE security vulnerability audit

**Example:**
```bash
deepsift patch "patch.json" --dry-run
```

---

### `deepsift refactor`
**Summary:** AST-safe symbol renaming across codebase or function extraction.

```bash
deepsift refactor rename <old> <new> | deepsift refactor extract <file:lines> --name <func>
```

**Example:**
```bash
deepsift refactor rename "oldHelper" "newHelper"
```

---

### `deepsift impact`
**Summary:** Calculates breaking change risk score and lists caller sites before symbol modification.

```bash
deepsift impact "symbol"
```

**Example:**
```bash
deepsift impact "NativeStore"
```

---

## 📌 Security & Diagnostics

### `deepsift complexity`
**Summary:** Calculates Cyclomatic & Cognitive Complexity heatmap highlighting high-risk refactor targets.

```bash
deepsift complexity [path]
```

**Example:**
```bash
deepsift complexity "src/core"
```

---

### `deepsift security-scan` (Aliases: `audit-sandbox`, `audit-secrets`, `audit-deps`)
**Summary:** Scans for sandbox boundary leaks (e.g. window in sandbox), hardcoded secrets, and XSS risks.

```bash
deepsift security-scan
```

**Example:**
```bash
deepsift security-scan
```

---

### `deepsift doctor`
**Summary:** Runs system health diagnostics, database index checks, and self-healing index repairs.

```bash
deepsift doctor
```

**Example:**
```bash
deepsift doctor
```

---

### `deepsift testmap`
**Summary:** Maps source files to corresponding unit test files and identifies untested modules.

```bash
deepsift testmap [--lang <ts|dart|py|go>]
```

**Options:**
- `--lang <ts|dart|py|go>`: Filter test mapping by programming language

**Example:**
```bash
deepsift testmap --lang ts
```

---

### `deepsift git-churn`
**Summary:** Git Hotspot Heatmap combining commit frequency with code complexity to find churn hotspots.

```bash
deepsift git-churn
```

**Example:**
```bash
deepsift git-churn
```

---

## 📌 Memory & Realms

### `deepsift memo` (Aliases: `m`)
**Summary:** Dynamic Research Memory (DRM) engine for persisting active research tags and architectural notes.

```bash
deepsift memo <action> [tag] [content]
```

**Example:**
```bash
deepsift memo open "auth-refactor"
```

---

### `deepsift realm`
**Summary:** Manages external knowledge bases and external Swagger/Figma specs (list, add, mount, snapshot).

```bash
deepsift realm <action> [id]
```

**Example:**
```bash
deepsift realm mount
```

---

### `deepsift compare`
**Summary:** Compares vector knowledge gaps and similarities between two knowledge realms.

```bash
deepsift compare <r1> <r2> [-q term]
```

**Options:**
- `-q <term>`: Filter vector comparison by topic query

**Example:**
```bash
deepsift compare r1 r2 -q "auth"
```

---

## 📌 Utilities & Dashboard

### `deepsift context`
**Summary:** Generates pre-creation checklist with rules and design tokens before building components.

```bash
deepsift context "path"
```

**Example:**
```bash
deepsift context "src/components/Header.tsx"
```

---

### `deepsift plan`
**Summary:** Generates structured implementation plans based on DNA, skills, realms, and architecture.

```bash
deepsift plan "request"
```

**Example:**
```bash
deepsift plan "Add OAuth2 authentication flow"
```

---

### `deepsift plan-ui`
**Summary:** Generates visual UI specs layout, token palettes, spacing, and i18n rules.

```bash
deepsift plan-ui "request"
```

**Example:**
```bash
deepsift plan-ui "User Profile Settings Dialog"
```

---

### `deepsift docgen` (Aliases: `docs`)
**Summary:** Generates and synchronizes complete Markdown documentation suite for GitHub and AI Agents.

```bash
deepsift docgen
```

**Example:**
```bash
deepsift docgen
```

---

### `deepsift ui`
**Summary:** Launches local interactive Web Dashboard visualization on port 3333 for graph and DRM.

```bash
deepsift ui
```

**Example:**
```bash
deepsift ui
```

---

