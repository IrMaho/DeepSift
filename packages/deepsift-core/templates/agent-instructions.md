---
trigger: always_on
---

# 🔍 DeepSift Visual Directive & Mastery (AUTOMATED SYNC)

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset.

## 🛠 Available DeepSift Commands (61 Commands)

| Command | Description |
|---|---|
| `deepsift overview (ov)` | **CORE SEARCH & DISCOVERY:** SUPER-COMMAND: Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries. |
| `deepsift search (s)` | **CORE SEARCH & DISCOVERY:** Hybrid Semantic & BM25 search enhanced with Graphify PageRank and God Node boosting. |
| `deepsift read` | **CORE SEARCH & DISCOVERY:** Mandatory file reader outputting exact text or compressed DEC_v2 visual tokens. |
| `deepsift feature (f)` | **CORE SEARCH & DISCOVERY:** AST-based feature outline detailing class definitions, exported functions, and dependencies. |
| `deepsift analyze (an, a)` | **ARCHITECTURE & INTELLIGENCE:** SUPER-COMMAND: Deep dive combining Feature AST Outline and DNA topology for a specific folder/file. |
| `deepsift arch` | **ARCHITECTURE & INTELLIGENCE:** Project directory blueprint utilizing Graphify communities and automatic noise pruning. |
| `deepsift dna` | **ARCHITECTURE & INTELLIGENCE:** Generates or displays Project DNA topology, central God Nodes, and community clusters. |
| `deepsift calltree (ct)` | **ARCHITECTURE & INTELLIGENCE:** Traces upstream callers, downstream callee scopes, and event message flows for any symbol. |
| `deepsift cfg` | **ARCHITECTURE & INTELLIGENCE:** Control Flow Graph extractor generating Mermaid and ASCII branch diagrams for functions. |
| `deepsift deps (d)` | **ARCHITECTURE & INTELLIGENCE:** Trace inbound and outbound dependencies for a specific file or module target. |
| `deepsift wire-trace` | **ARCHITECTURE & INTELLIGENCE:** Maps cross-environment message flows (postMessage, IPC, WebSockets, EventEmitters). |
| `deepsift clones` | **REFACTORING & SELF-HEALING:** AST Code Clone Detector highlighting duplicate blocks and copy-paste clusters for DRY compliance. |
| `deepsift find-dead-code (dead-code)` | **REFACTORING & SELF-HEALING:** Scans for unreferenced exports, dead variables, and uncalled component functions. |
| `deepsift check-schema-drift (schema-drift)` | **REFACTORING & SELF-HEALING:** Audits schema and DOM selector synchronization between client UI and backend definitions. |
| `deepsift heal` | **REFACTORING & SELF-HEALING:** DNA-based auto-refactoring engine that fixes lint, type, and architectural issues in a file. |
| `deepsift auto-heal` | **REFACTORING & SELF-HEALING:** Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify). |
| `deepsift patch` | **REFACTORING & SELF-HEALING:** Applies structural AST code injections using the TOON-Patch specification. |
| `deepsift refactor` | **REFACTORING & SELF-HEALING:** AST-safe symbol renaming across codebase or function extraction. |
| `deepsift impact` | **REFACTORING & SELF-HEALING:** Calculates breaking change risk score and lists caller sites before symbol modification. |
| `deepsift complexity` | **SECURITY & DIAGNOSTICS:** Calculates Cyclomatic & Cognitive Complexity heatmap highlighting high-risk refactor targets. |
| `deepsift security-scan (audit-sandbox, audit-secrets, audit-deps)` | **SECURITY & DIAGNOSTICS:** Scans for sandbox boundary leaks (e.g. window in sandbox), hardcoded secrets, and XSS risks. |
| `deepsift doctor` | **SECURITY & DIAGNOSTICS:** Runs system health diagnostics, database index checks, and self-healing index repairs. |
| `deepsift testmap` | **SECURITY & DIAGNOSTICS:** Maps source files to corresponding unit test files and identifies untested modules. |
| `deepsift git-churn` | **SECURITY & DIAGNOSTICS:** Git Hotspot Heatmap combining commit frequency with code complexity to find churn hotspots. |
| `deepsift memo (m)` | **MEMORY & REALMS:** Dynamic Research Memory (DRM) engine for persisting active research tags and architectural notes. |
| `deepsift realm` | **MEMORY & REALMS:** Manages external knowledge bases and external Swagger/Figma specs (list, add, mount, snapshot). |
| `deepsift compare` | **MEMORY & REALMS:** Compares vector knowledge gaps and similarities between two knowledge realms. |
| `deepsift context` | **UTILITIES & DASHBOARD:** Generates pre-creation checklist with rules and design tokens before building components. |
| `deepsift plan` | **UTILITIES & DASHBOARD:** Generates structured implementation plans based on DNA, skills, realms, and architecture. |
| `deepsift plan-ui` | **UTILITIES & DASHBOARD:** Generates visual UI specs layout, token palettes, spacing, and i18n rules. |
| `deepsift docgen (docs)` | **UTILITIES & DASHBOARD:** Generates and synchronizes complete Markdown documentation suite for GitHub and AI Agents. |
| `deepsift ui` | **UTILITIES & DASHBOARD:** Launches local interactive Web Dashboard visualization on port 3333 for graph and DRM. |
| `deepsift init` | **CORE SEARCH & DISCOVERY:** Initializes DeepSift workspace, creates .deepsift directory and performs first-run indexing bootstrap. |
| `deepsift config` | **CORE SEARCH & DISCOVERY:** Interactive configuration menu for setting excluded folders, embedding model, and indexing preferences. |
| `deepsift index (i)` | **CORE SEARCH & DISCOVERY:** Manually triggers incremental or full codebase re-indexing with vector embedding sync. |
| `deepsift scan` | **CORE SEARCH & DISCOVERY:** Full workspace scan that discovers new files, repairs missing index entries, and prunes deleted chunks. |
| `deepsift watch (w)` | **CORE SEARCH & DISCOVERY:** Starts a file system watcher that triggers incremental auto-indexing whenever source files change. |
| `deepsift status (st)` | **CORE SEARCH & DISCOVERY:** Displays current index health, chunk counts, last sync timestamp, and embedding model info. |
| `deepsift start` | **UTILITIES & DASHBOARD:** Starts the DeepSift MCP (Model Context Protocol) server for IDE and AI Agent integrations. |
| `deepsift scope` | **UTILITIES & DASHBOARD:** Sets or displays the active workspace search boundary — constrains all subsequent searches to a subdirectory. |
| `deepsift zoom` | **CORE SEARCH & DISCOVERY:** Deep inspection of a specific file, class, or symbol — renders annotated view with type info and cross-references. |
| `deepsift read-feature (rf)` | **CORE SEARCH & DISCOVERY:** Combined command: reads exact file lines AND generates an AST feature outline in a single call. |
| `deepsift edit (e)` | **REFACTORING & SELF-HEALING:** In-place file editor applying structured line-range replacements from a JSON edit spec. |
| `deepsift sed` | **REFACTORING & SELF-HEALING:** Stream editor for targeted in-place text substitution within a specific line range of a file. |
| `deepsift decode` | **UTILITIES & DASHBOARD:** Decodes and expands DEC_v2 compressed visual token output back into full readable source text. |
| `deepsift pipe (p)` | **UTILITIES & DASHBOARD:** Reads DeepSift input from stdin — enables chaining commands through Unix-style shell pipelines. |
| `deepsift history (h)` | **UTILITIES & DASHBOARD:** Displays paginated search and read result history log with timestamps and result previews. |
| `deepsift drill (dr)` | **UTILITIES & DASHBOARD:** Drills into a specific history entry to re-render full search result with surrounding context lines. |
| `deepsift check-layers (check-architecture)` | **SECURITY & DIAGNOSTICS:** Validates Clean Architecture layer boundary rules — detects illegal cross-layer imports (e.g. data → UI). |
| `deepsift gen-test` | **SECURITY & DIAGNOSTICS:** Automatically generates a unit test scaffold and mock file for a specified source module. |
| `deepsift gen-mock` | **SECURITY & DIAGNOSTICS:** Generates a complete type-safe mock file for a module, inferring all exported interfaces and classes. |
| `deepsift gen-adr` | **UTILITIES & DASHBOARD:** Generates an Architecture Decision Record (ADR) Markdown template for documenting design decisions. |
| `deepsift executive-summary (summary)` | **UTILITIES & DASHBOARD:** Generates a high-level executive summary report covering code quality, test coverage, architecture health, and complexity. |
| `deepsift expand-type (type)` | **ARCHITECTURE & INTELLIGENCE:** Resolves and expands complex TypeScript types — unrolls generics, intersections, and conditional types. |
| `deepsift resolve (r)` | **ARCHITECTURE & INTELLIGENCE:** Resolves import paths and export symbols — finds where any identifier is defined across the workspace. |
| `deepsift resolve-error` | **REFACTORING & SELF-HEALING:** Analyzes a TypeScript compiler error message and suggests targeted fixes with code snippets. |
| `deepsift i18n-extract` | **SECURITY & DIAGNOSTICS:** Scans codebase for hardcoded display strings and generates an i18n key-value extraction report. |
| `deepsift learn` | **ARCHITECTURE & INTELLIGENCE:** Runs adaptive project pattern learning — mines naming conventions, token vocabularies, and architectural signals. |
| `deepsift diag` | **SECURITY & DIAGNOSTICS:** Runs a full system diagnostics report covering Node version, embedding model, SQLite health, and config state. |
| `deepsift com` | **UTILITIES & DASHBOARD:** Executes any arbitrary shell command from within the DeepSift context — output is compressed, cached, and searchable in history. |
| `deepsift clean (c)` | **UTILITIES & DASHBOARD:** Cleans and prunes stored history logs — removes old search and command result cache files. |

## 📋 ABSOLUTE & NON-NEGOTIABLE USAGE RULES
1. **🔍 SMART SEARCH STRATEGY:** Start with `deepsift search "query"` for conceptual questions.
2. **📖 PRE-EDIT READING:** Before editing ANY file, read exact lines with `deepsift read "file:start-end"`.
3. **✏️ EDITING MANDATE:** Apply code changes using `deepsift patch "patch.json"` or native replace tools.
4. **🧠 DRM RESEARCH MEMORY:** Use `deepsift memo open "tag"` and `deepsift memo add` to track active research notes.
5. **📚 DOCUMENTATION GENERATION:** Run `deepsift docgen` whenever adding new features to update all documentation automatically.
