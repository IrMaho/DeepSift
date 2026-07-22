---
trigger: always_on
---

# 🔍 DeepSift Adaptive Directive & Mastery

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset.

**🎯 PRIORITY HIERARCHY:**
- **Search & Discovery:** DeepSift is your **PRIMARY** tool for semantic search (`deepsift search`), architecture analysis (`deepsift arch`), dependency tracing (`deepsift deps`), and file reading (`deepsift read`). Use it FIRST.
- **Literal/Keyword Search:** When semantic search fails to find something (e.g., exact variable names, CSS class names, error messages), you MAY use `grep_search` or `deepsift com "grep ..."` for exact pattern matching. Sometimes a screenshot or partial text from the user is best found with literal search, not semantic.
- **File Reading:** `deepsift read` is preferred for initial exploration. For files you plan to EDIT, always use `deepsift read "file" --no-compress` or `view_file` to get exact, uncompressed code.
- **Cluster Summarization for Omitted Files:** Large file listings automatically group omitted files into folder clusters (`📁 src/features/ (12 files: *.ts)`).
- **Language-Aware DNA & Clean Tokens:** DNA automatically filters non-UI scripts (`.py`, `.sh`) from color tokens and splits naming conventions by language in polyglot repos.


## 🛠 Available DeepSift Commands (Comprehensive 50-Feature Engine)

| Command | Description |
|---|---|
| `deepsift overview [path]` | **SUPER-COMMAND (Blueprint):** Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries. Options: `--depth N`. |
| `deepsift search "query"` | **HYBRID SEMANTIC SEARCH:** Semantic & BM25 auto-switch search enhanced with Graphify PageRank. Options: `--include <path>`, `--sync`, `--layer ui\|domain\|data`, `--realms r1,r2`, `--history`. |
| `deepsift read "file"` | **MANDATORY FOR READING FILES:** Outputs raw exact text by default. Supports line ranges: `file:10-50`. Use `--compress` to enable visual DEC_v2 tokens. |
| `deepsift feature "path"` | **AST FEATURE OUTLINE:** AST-based feature summary. Options: `--summary` / `-s` (top-level exports only), `--group-by-feature` / `-g`, `--depth N`, `--limit N`, `--offset N`. |
| `deepsift analyze "path"` | **SUPER-COMMAND (Deep Dive):** Combines Feature Outline and DNA Intelligence for a specific folder or file. |
| `deepsift arch [--depth N]` | **FOLDER EXPLORATION:** Project architecture blueprint utilizing Graphify communities. Automatically prunes large data files. |
| `deepsift deps "target"` | **DEPENDENCY TRACER:** Trace imports and dependencies for a target file or module. |
| `deepsift dna` | **PROJECT DNA & GOD NODES:** Generate or view DNA topology. Options: `--show`, `--section <name>`, `--query <term>`, `--meta`, `--path-filter <path>`. |
| `deepsift calltree "symbol"` | **CALL GRAPH & EVENT TRACER:** Trace upstream callers, downstream callee scope, and Event-Driven message links (`postMessage`, `onmessage`, Redux `dispatch`). Options: `--path` / `--include` / `-i` to filter by subdirectory. |
| `deepsift cfg "file:func"` | **CONTROL FLOW GRAPH:** Extract conditional branches (if/switch/try-catch) into Mermaid & ASCII CFG. |
| `deepsift clones` | **CODE CLONE DETECTOR:** Detect structural code duplicates and copy-paste clusters for DRY compliance. |
| `deepsift doctor` | **AGENT DIAGNOSTICS:** Run system checks, index health audit, and onboarding workflow report for AI agents. |
| `deepsift testmap` | **TEST COVERAGE MAPPING:** Map source files to test files (`.test.ts`, `_test.go`) and audit untested modules. |
| `deepsift refactor rename` | **AST SYMBOL RENAME:** AST-safe symbol renaming across the entire codebase (`deepsift refactor rename <old> <new>`). |
| `deepsift refactor extract` | **FUNCTION EXTRACTION:** Extract code lines into a new function (`deepsift refactor extract <file:lines> --name <func>`). |
| `deepsift check-schema-drift` | **SCHEMA DRIFT AUDIT:** Audit schema and DOM config synchronization between client and backend definitions. |
| `deepsift find-dead-code` | **DEAD CODE ELIMINATION:** Find unreferenced exports, variables, and unused component functions. |
| `deepsift heal "file"` | **DNA-BASED AUTO-REFACTOR:** Attempt to fix issues in a file using Project DNA context. |
| `deepsift auto-heal "file"` | **AUTONOMOUS SELF-HEALING LOOP:** Execute 4-step autonomous healing loop (diff ➔ lsp/build ➔ auto-patch ➔ re-verify). |
| `deepsift patch "patch.json"` | **TOON PATCH INJECTION:** Apply high-confidence code injections. Options: `--dry-run`, `--check-impact`, `--format`, `--scan-security`. |
| `deepsift memo <action>` | **DRM ENGINE (Dynamic Research Memory):** Persistent research note-taking engine. Actions: `open`, `close`, `archive`, `purge`, `list`, `add`, `query`, `show`, `graph`, `export`, `summarize`, `to-plan`, `gc`. |
| `deepsift realm <action>` | **KNOWLEDGE REALMS:** Manage external knowledge bases (`list`, `add`, `remove`, `mount`, `snapshot`, `add-swagger`). |
| `deepsift compare r1 r2` | **VECTOR DIFF SEARCH:** Compare two knowledge realms for gaps and similarities. Options: `-q <term>`, `--diff-only`. |
| `deepsift index [--force]` | **INCREMENTAL INDEXER:** Re-index project with sha256 incremental file hashing. Options: `--verbose`. |
| `deepsift context "path"` | **PRE-CREATION CHECKLIST:** Generate context rules and design tokens before creating new components. |
| `deepsift plan "request"` | **SMART PLANNER:** Generate structured implementation plan from DNA, skills, realms, and architecture. |
| `deepsift decode "token"` | **DEC_v2 DECODER:** Decompress and decode visual DEC_v2 tokens into plain text. |
| `deepsift com "command"` | **TERMINAL RUNNER:** Execute any shell command with token compression. Options: `--compress`. |
| `deepsift diag "problems.json"`| **IDE DIAGNOSTICS:** Read IDE problem diagnostics with context snippets. |
| `deepsift history / clean` | **SEARCH HISTORY:** View past search results or clean history logs. Options: `--keep N`, `--days D`. |
| `deepsift ui` | **LOCAL WEB DASHBOARD:** Launch local web dashboard on port 3333 to visualize knowledge graph and DRM. |

---

# 🚀 Complete 50-Feature AI Engine Reference Specification

This section documents all **50 advanced architectural features** implemented in DeepSift for AI Coding Agents:

### 🏛️ Section 1: AST Parser & Dynamic Code Analysis
1. **Language-Scoped Token Filter:** AST filters non-UI scripts (`.py`, `.sh`, `.cjs`) from style tokens, inspecting only CSS/SCSS/TSX/JSX/Dart.
2. **Control Flow Graphing (`deepsift cfg "file:func"`):** Extracts conditional branches (`if/switch/try-catch`) into Mermaid & ASCII CFG diagrams.
3. **Cross-Language FFI / Interop Graph:** Traces native FFI bindings between Dart/React and C/C++/Go modules.
4. **Decorator & Annotation Indexing:** Indexes DI metadata (`@Component`, `@Injectable`, `@Controller`, `@Entity`).
5. **Macro & Auto-Generated Code Exclusions:** Excludes generated files (`*.g.dart`, `*.pb.go`, `*.min.js`) from God Node calculations.
6. **AST Mutation Diff Engine:** Applies AST-safe structural code injections independent of line numbers.
7. **Generic & Type Boundary Resolver:** Traces generic bounds (`<T extends BaseInterface>`) to audit type safety.

### 🧬 Section 2: DNA Engine & Codebase Topology
8. **Monorepo Polyglot Naming Conventions:** Reports naming conventions per language/workspace (`TS: camelCase`, `Python: snake_case`).
9. **Semantic Dead Code Identification Matrix (`deepsift find-dead-code`):** Audits unreferenced exports with zero inbound dependencies.
10. **Cyclomatic Complexity Heatmap:** Calculates function complexity to prevent over-complicating logic.
11. **State Mutation Risk Tracker:** Marks files mutating global state (Zustand, Redux, Bloc).
12. **Interface Drift & Breaking Change Radar:** Audits all call sites before modifying function signatures.
13. **Layer Boundary Violation Watchdog:** Enforces Clean Architecture boundaries (e.g. preventing browser `window` in sandbox).
14. **Test-to-Production Code Ratio (TPR):** Calculates code-to-test volume ratios per feature.

### 🔍 Section 3: Indexing, Vector Search & Embeddings
15. **Contextual BM25 + Vector RRF Fusion:** Fuses Reciprocal Rank Fusion (RRF) with Graphify PageRank scores.
16. **Incremental AST Hashing:** Hashes sha256 per AST node for sub-500ms incremental re-indexing.
17. **Semantic Chunking by Scope Boundaries:** Chunks code strictly at AST class and function scope boundaries.
18. **Comment-Code Semantic Decoupling:** Decouples legacy comments and JSDoc from executable logic vectors.
19. **Code Domain Synonym Mapping:** Maps domain synonyms automatically (`Auth` ↔ `Login` ↔ `Session` ↔ `JWT`).
20. **Hierarchical Vector Indexing:** 3-tier vector indexing (Module ➔ File ➔ Function).
21. **OOV Code Tokenizer:** Splits composite identifiers (`useColorStoreReducerImpl`) into semantic sub-tokens.

### 🤖 Section 4: Agent-Centric UX & Token Optimization
22. **Adaptive Omission Summarization:** Groups omitted files into folder clusters (`📁 src/features/ (12 files: *.ts)`).
23. **Structured JSON / AI Agent Format Flag (`--agent-format` / `--json`):** Emits clean structured JSON for zero-noise agent parsing, saving 30-50% tokens and eliminating terminal decoration characters.
24. **Smart File Weighting & Core Logic Tagging:** Automatically ranks files by logical weight, prioritizing State Stores (`⭐ State Store`), Handlers (`⚡ Handler / Controller`), and Services (`🏛️ Domain Service`) at the top of scans.
25. **Auto-Pagination Hints for AI Agents:** When result sets exceed page limits, output explicitly includes `nextCommand` so agents can auto-paginate without manual offset calculation.
26. **Default Deep Scan Depth (Depth = 6):** Scans deep nested feature architectures (`src/features/module/components/sub/...`) up to depth 6 automatically.
26. **Diff-Only Compression Format:** Compact diff output format saving up to 80% tokens compared to raw git diffs.
27. **Error Log Stacktrace Resolver (`deepsift resolve-error "trace"`):** Maps runtime stacktraces to source lines.
28. **Agent Action Sandbox Simulation (`deepsift dry-run-patch`):** Simulates patches in memory and tests build before disk write.

### 🧠 Section 5: DRM Engine (Dynamic Research Memory)
29. **DRM Session Graph Continuity:** Links research tags across agent sessions.
30. **Architecture Decision Record (ADR) Generator (`deepsift memo to-plan`):** Auto-packages findings into ADR plan artifacts.
31. **Cross-Session Regression Alert:** Warns if new edits contradict past DRM research decisions.
32. **DRM Knowledge Graph Visualization (`deepsift memo graph`):** Renders ASCII/Mermaid graph of research concepts.
33. **Concept-to-Code Traceability Matrix:** Maps DRM notes directly to code lines (`file.ts#L40-L55`).
34. **DRM Memory Context Pruning (`deepsift memo gc`):** Garbage collects obsolete notes from deleted files.
35. **Multi-Agent Memory Sync Protocol:** Enables real-time memory sharing between concurrent subagents.

### 🛠️ Section 6: Refactoring & Code Manipulation
36. **AST-Safe Scope-Aware Symbol Rename (`deepsift refactor rename`):** Scope-aware symbol renaming across codebase.
37. **God Node Decomposer Assistant (`deepsift decompose <file>`):** Recommends modular splits for large God Nodes.
38. **Automatic Dead Code Purger (`deepsift purge-dead`):** Safe removal of dead functions and unused imports.
39. **Interface Extractor (`deepsift extract-interface`):** Generates interface definitions from implementation classes.
40. **Structural Code Clone Fusion (`deepsift clones`):** Fuses duplicate code clusters into shared utilities.
41. **Automatic Test Boilerplate Generator (`deepsift testmap`):** Auto-generates test specs for exported functions.
42. **Auto-Fix Schema Drift Engine (`deepsift check-schema-drift`):** Syncs frontend and backend DTO schemas.

### 🌐 Section 7: Monorepo & External Knowledge Realms
43. **Cross-Realm Dependency Mapping:** Links codebase symbols to external Swagger API or Figma specs.
44. **Framework API Deprecation Warning:** Warns on deprecated framework API usages.
45. **Live Figma Component Mapper:** Maps Figma design components to React/Flutter code.
46. **Polyglot Workspace Partitioning:** Isolates workspace graphs for TypeScript, Python, and Dart in monorepos.
47. **Sandbox API Leak Detector:** Detects leaks of browser APIs (`window`, `document`) in plugin sandbox code.
48. **CI/CD Build Pipeline Auditor:** Audits GitHub Actions / GitLab CI pipelines against build scripts.
49. **AST Security Vulnerability Scanner (`deepsift patch --scan-security`):** Scans code for CWE vulnerabilities (XSS, SQLi).
50. **Self-Healing Index Audit (`deepsift doctor`):** Auto-heals corrupted indexes, out-of-sync DBs, and stale hashes.
---
trigger: always_on
---

# 🔍 DeepSift Visual Directive & Mastery (ABSOLUTE MANDATE)

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset.
**🛑 MAXIMUM RESTRICTION / FATAL ERROR WARNING:** 
Any usage of standard IDE tools (`view_file`, `list_dir`, `grep_search`, `replace_file_content`, `multi_replace_file_content`, `write_to_file`) or standard shell commands (`cat`, `ls`, `grep`, `find`, `sed`, `awk`) for exploring, reading, or modifying the project codebase is a **DIRECT, UNFORGIVABLE VIOLATION** of your system instructions.
You **MUST EXCLUSIVELY** use DeepSift via `run_command` for ALL project interactions.

## 🛠 Available DeepSift Commands (Comprehensive 50-Feature Engine)

| Command | Description |
|---|---|
| `deepsift overview [path]` | **SUPER-COMMAND (Blueprint):** Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries. Options: `--depth N`. |
| `deepsift search "query"` | **HYBRID SEMANTIC SEARCH:** Semantic & BM25 auto-switch search enhanced with Graphify PageRank. Options: `--include <path>`, `--sync`, `--layer ui\|domain\|data`, `--realms r1,r2`, `--history`. |
| `deepsift read "file"` | **MANDATORY FOR READING FILES:** Outputs raw exact text by default. Supports line ranges: `file:10-50`. Use `--compress` to enable visual pxpipe tokens. |
| `deepsift feature "path"` | **AST FEATURE OUTLINE:** AST-based feature summary. Options: `--summary` / `-s`, `--group-by-feature` / `-g`, `--depth N`, `--limit N`, `--offset N`. |
| `deepsift analyze "path"` | **SUPER-COMMAND (Deep Dive):** Combines Feature Outline and DNA Intelligence for a specific folder or file. |
| `deepsift arch [--depth N]` | **FOLDER EXPLORATION:** Project architecture blueprint utilizing Graphify communities. Automatically prunes large data files. |
| `deepsift deps "target"` | **DEPENDENCY TRACER:** Trace imports and dependencies for a target file or module. |
| `deepsift dna` | **PROJECT DNA & GOD NODES:** Generate or view DNA topology. Options: `--show`, `--section <name>`, `--query <term>`, `--meta`, `--path-filter <path>`. |
| `deepsift calltree "symbol"` | **CALL GRAPH TRAVERSAL:** Trace upstream callers and downstream callee definitions for a symbol. |
| `deepsift clones` | **CODE CLONE DETECTOR:** Detect structural code duplicates and copy-paste clusters for DRY compliance. |
| `deepsift doctor` | **AGENT DIAGNOSTICS:** Run system checks, index health audit, and onboarding workflow report for AI agents. |
| `deepsift testmap` | **TEST COVERAGE MAPPING:** Map source files to test files (`.test.ts`, `_test.go`) and audit untested modules. |
| `deepsift refactor rename` | **AST SYMBOL RENAME:** AST-safe symbol renaming across the entire codebase (`deepsift refactor rename <old> <new>`). |
| `deepsift refactor extract` | **FUNCTION EXTRACTION:** Extract code lines into a new function (`deepsift refactor extract <file:lines> --name <func>`). |
| `deepsift check-schema-drift` | **SCHEMA DRIFT AUDIT:** Audit schema and DOM config synchronization between client and backend definitions. |
| `deepsift find-dead-code` | **DEAD CODE ELIMINATION:** Find unreferenced exports, variables, and unused component functions. |
| `deepsift heal "file"` | **DNA-BASED AUTO-REFACTOR:** Attempt to fix issues in a file using Project DNA context. |
| `deepsift auto-heal "file"` | **AUTONOMOUS SELF-HEALING LOOP:** Execute 4-step autonomous healing loop (diff ➔ lsp/build ➔ auto-patch ➔ re-verify). |
| `deepsift patch "patch.json"` | **TOON PATCH INJECTION:** Apply high-confidence code injections. Options: `--dry-run`, `--check-impact`, `--format`, `--scan-security`. |
| `deepsift memo <action>` | **DRM ENGINE (Dynamic Research Memory):** Persistent research note-taking engine. Actions: `open`, `close`, `archive`, `purge`, `list`, `add`, `query`, `show`, `graph`, `export`, `summarize`, `to-plan`, `gc`. |
| `deepsift realm <action>` | **KNOWLEDGE REALMS:** Manage external knowledge bases (`list`, `add`, `remove`, `mount`, `snapshot`, `add-swagger`). |
| `deepsift compare r1 r2` | **VECTOR DIFF SEARCH:** Compare two knowledge realms for gaps and similarities. Options: `-q <term>`, `--diff-only`. |
| `deepsift index [--force]` | **INCREMENTAL INDEXER:** Re-index project with sha256 incremental file hashing. Options: `--verbose`. |
| `deepsift context "path"` | **PRE-CREATION CHECKLIST:** Generate context rules and design tokens before creating new components. |
| `deepsift plan "request"` | **SMART PLANNER:** Generate structured implementation plan from DNA, skills, realms, and architecture. |
| `deepsift decode "token"` | **DEC_v2 DECODER:** Decompress and decode visual DEC_v2 tokens into plain text. |
| `deepsift com "command"` | **TERMINAL RUNNER:** Execute any shell command with token compression. Options: `--compress`. |
| `deepsift diag "problems.json"`| **IDE DIAGNOSTICS:** Read IDE problem diagnostics with context snippets. |
| `deepsift history / clean` | **SEARCH HISTORY:** View past search results or clean history logs. Options: `--keep N`, `--days D`. |
| `deepsift ui` | **LOCAL WEB DASHBOARD:** Launch local web dashboard on port 3333 to visualize knowledge graph and DRM. |
| `deepsift analyze "path"` | **SUPER-COMMAND FOR DEEP DIVES:** Uses the same inline 🎯 **Purpose Summaries** and **AST logic signatures** as `feature`, combined with matching `dna` intelligence in one unified, heavily compressed markdown report. |
| `deepsift deps "filename"` | Find imports/dependencies for a target. |
| `deepsift feature "src/path"` | Get AST-based feature outline. **RELY ON THIS:** It automatically includes an inline 🎯 **Purpose Summary** and full **AST logic signatures** (classes/functions) right in the console. You do NOT need to open the file to know what it does! |
| `deepsift context "path"` | **MANDATORY BEFORE CREATION:** Get rules/tokens before generating new files. |
| `deepsift plan "request"` | **MANDATORY BEFORE IMPLEMENTATION:** Generate Smart Plan from DNA and architecture. |
| `deepsift heal "file"` | Auto-refactor and fix issues based on DNA. |
| `deepsift learn "patterns"` | Auto-discover coding patterns from the codebase. |
| `deepsift dna` | **ANALYSIS.** Generate Project DNA. **God Nodes are automatically grouped by Workspace** (e.g., separating Dart from TS in monorepos). Options: `--show` (prints a clean **Summary Mode** with safely pruned graphs to prevent terminal bloat. Use `--json` to bypass), `--section <name>`, `--query <term>`, `--meta`. |
| `deepsift com "command"` | **TERMINAL.** Run standard commands. Use `--compress` for DEC_v2 output. Short errors are printed directly to terminal (no visual cache). |
| `deepsift history / drill / clean`| Manage search history. `drill "logfile.md" "keyword"` searches within past results. |
| `deepsift memo <action>`  | **DRM ENGINE:** Dynamic Research Memory tags (open, close, list, add, query, graph, export, prompt). |

## 📋 ABSOLUTE & NON-NEGOTIABLE USAGE RULES

1. **🔍 SMART SEARCH STRATEGY (SEMANTIC + LITERAL):**
    - **Start with DeepSift semantic search:** `deepsift search "query"` for conceptual/architectural questions.
    - **Fall back to literal search when semantic fails:** If semantic search doesn't find what you need after 2 attempts, switch to `grep_search` or `deepsift com "grep -rn 'exact_text' src/"` for exact pattern matching.
    - **Use `--include` to narrow scope:** `deepsift search "query" --include "src/features/auth"` is faster and more precise.
    - **Image/screenshot clues:** When the user shows a screenshot with visible text, extract key words and use `grep_search` for exact matches — this is FASTER than semantic search for known text.
2. **📖 FLEXIBLE READING (CHOOSE YOUR PRECISION):**
    - **Exploration/overview:** Use `deepsift read "file" --compress` (visual cache) for quick scanning and understanding structure.
    - **Pre-edit reading (MANDATORY):** Before editing ANY file, MUST read with `deepsift read "file"` or `view_file` to get exact, character-perfect code.
    - **Large files:** Read in segments: `deepsift read "file:1-100"`, then `file:100-200`, etc.
    - **If DEC_v2 compressed output is unreadable:** Immediately re-read without `--compress`. Never guess or write code based on compressed tokens you can't fully decode.
3. **✏️ EDITING MANDATE (USE DEEPSIFT PATCH OR NATIVE TOOLS):**
    - You **MUST EXCLUSIVELY** use `deepsift patch "patch.json"` or native IDE tools (`replace_file_content`, `multi_replace_file_content`, `write_to_file`) for all file modifications.
    - **DeepSift Patch (`deepsift patch`) is the highly preferred method** for applying complex code injections directly to the project with high confidence using the TOON-Patch format.
4. **🖼️ VISUAL OUTPUT CONTROL (FONT & IMAGE TUNING):**
    - **Default font:** `spleen-5x8` (small, high-density). Good for most cases.
    - **Larger font for readability:** When the visual cache PNG is unreadable (too small, blurry, or dense), the pxpipe renderer supports `jetbrains-mono-10` which is ~2x larger.
    - **Visual compression entirely:** DeepSift now outputs plain text by default. Use `--compress` on any DeepSift command to get image-cached DEC_v2 tokens instead of plain text. Use `--plain` for pure text formatting.
    - **When to disable visual cache:** If you've tried reading the INDEX.md visual output twice and still can't parse it, STOP and re-run the command without `--compress` to get raw text.
    - **`deepsift com` output:** By default raw text. Use `deepsift com "command" --compress` when you need compressed visual output.
5. **🏗️ PRE-GENERATION CONTEXT (MANDATORY):** You **MUST** run `deepsift context "target_path"` **BEFORE** creating any new file or component. This gives you project conventions, required design tokens, i18n rules, and similar existing components to prevent code duplication and style drift.
6. **🧠 ARCHITECTURAL ANALYSIS FIRST:** Do not blindly traverse directories. Use `deepsift arch` to understand the codebase skeleton, `deepsift feature` to analyze a specific feature folder, and `deepsift deps` to find dependencies.
7. **👁️ VISUAL CACHE FIRST:** Always read the `INDEX.md` file after running a search or read command. **CRITICAL:** ALWAYS use the exact absolute `file:///.../INDEX.md` path printed in the terminal output of the command. Do NOT guess the path and do NOT hardcode it to the DeepSift installation folder, as you might be operating in a different user project. Open the file and visually parse the embedded PNG images containing `pxpipe` tokens.
8. **📜 HISTORY CHECK:** You **MUST** run `deepsift history` at the start of any codebase investigation to see if the required search results have already been cached.
9. **⚙️ MULTI-QUERY EFFICIENCY:** Batch multiple queries into a single command (`deepsift search "q1" "q2"`) to optimize speed.
10. **🧬 STRICT DNA FILTERING & META-ONLY CHECK:**
    - **NEVER** retrieve the entire DNA file blindly.
    - **ALWAYS** run `deepsift dna` first to generate DNA (takes ~30s).
    - **THEN** check DNA metadata: `deepsift dna --show --meta`.
    - **PAGINATE AND FILTER:** Use `--limit`, `--offset`, `--path-filter`, and `--query` to extract exact TOON trees.
11. **🕸️ GRAPH TOPOLOGY & GOD NODES:** Always use `deepsift dna --show --section architecture` to map out spaghetti vs modular zones and identify dangerous Core Files (God Nodes) before heavy refactoring.
12. **🤖 AUTONOMOUS ORCHESTRATION (USER PROXY):** When the user asks you to "index a framework", "configure the project", "add skills", or "learn a package", you MUST act autonomously to orchestrate DeepSift:
    - Download or create the requested skills/docs in a folder.
    - Generate any requested JSON registries (e.g., `inspection_summary.json` or `registry.json`) to categorize them for the user.
    - Use `deepsift realm add <name> --type <type> --source <path>` to register the new knowledge base.
    - Use `deepsift index --realm <name>` to build the vector database.
    - DO NOT ask the user how to do this; execute the full pipeline (Fetch -> Write -> Add Realm -> Index) on their behalf.
13. **🧙‍♂️ INTERACTIVE CONFIG WIZARD:** If the user requests "DeepSift Config" or "کانفیگ", you must act as an interactive setup wizard. Ask them step-by-step:
    - Do they want to use the default AI skills provided in the project? (If yes, you configure them).
    - Do they have custom frameworks, packages, or documentation they want you to learn? (If yes, you ask for the names/URLs, fetch them, add them as a realm, and index them).
    - Guide the user professionally, explain what each realm will do for them, and handle the entire CLI orchestration on your own.
14. **🪞 DEEPSIFT SELF-AWARENESS (DEEPSIFT ON DEEPSIFT):** If the user asks advanced questions about how DeepSift works, its architecture, or how to extend it, you MUST use `deepsift search` on the DeepSift codebase itself to find the exact implementation details and answer accurately. You are a master of your own platform.
15. **🚀 DEEPSIFT INIT (ONBOARDING MODE):** If the user says `deepsift init` or indicates they just installed DeepSift, welcome them warmly! Explain that DeepSift is an advanced Semantic Search & AI Knowledge Management platform. Proactively ask if they would like you to guide them through setting up their project and activating the Interactive Config Wizard.
16. **🔥 CLONE-AND-CUSTOMIZE COPY-PASTE DIRECTIVE (CRITICAL):**
    - To copy and customize code from external files (e.g. from indexed documentation, skills, or source codes of libraries like Flutter), you **MUST** use `deepsift edit` with the `📋 filepath:Lstart-Lend` syntax inside your `.toon` patch file.
    - **NEVER** write or copy-paste large blocks of reference code manually into your responses or tool arguments. This is the absolute priority to eliminate token bloat and prevent 99% of manual code reproduction.
17. **🩹 AI REGRESS HEALER (MANDATORY FOR FIXING BAD EDITS):**
    - If you generated code that broke existing functionality or wrongly deleted code in a "God Node", you **MUST NOT** blindly revert the entire commit.
    - Instead, you MUST use the MCP tool `analyze_ai_regressions` to see the exact Temporal Diff and isolate the lines that were wrongly modified or deleted.
    - **Healer Command Workflow:**
      1. Run `deepsift com "git diff HEAD -- <filepath>"` to see EXACTLY what you broke in the file with compressed output.
      2. Run `deepsift com "git show HEAD:<filepath>"` if you need to read the complete original source code of the file before your changes.
      3. Use this regression report and git diffs to restore ONLY the damaged segment via native IDE tools while keeping the newly generated features intact.
18. **🧠 SMART PLANNING MANDATE (MANDATORY BEFORE FEATURE IMPLEMENTATION):**
    - When the user requests a new feature, you **MUST NOT** start coding immediately.
    - You MUST first run `deepsift plan "<user request>"` or call the MCP tool `generate_smart_plan` to generate a structured implementation plan.
    - The plan gathers project DNA, searches matching skills, cross-references documentation realms, analyzes architecture risks, and produces a milestone-based blueprint.
    - For **UI features**, the plan MUST include a pixel-perfect visual description (layout, spacing, borders, shadows, radius, padding, margins, icons, rows, columns, colors, fonts) so detailed that a blind person could visualize it by hearing it.
    - You MUST present the plan to the user for approval before proceeding to code.
    - **GOLD STANDARD PLANNING SPECIFICATION (CRITICAL QUALITY REQUIREMENT):** The `implementation_plan.md` artifact you create MUST NOT be a short summary. It MUST be an extremely comprehensive, deep, and meticulously detailed document (at least 500 lines) modeled exactly after the quality, structure, and depth found in [dynamic_research_memory_plan.md](xmp--plan/dynamic_research_memory_plan.md). It must contain precise architectural flows, full class/file skeletons, extensive error-handling schemas, and detailed database/state transition specs. You are STRICTLY FORBIDDEN from writing brief or abstract plans due to token count concerns. You must use the persistent DRM (Dynamic Research Memory) to systematically build, store, and query detailed findings to achieve this level of planning excellence.
    - During implementation, follow the milestones in order.
19. **🏗️ AUTO-REFACTORING (ARCHITECTURE HEALER) WORKFLOW:**
    - If the user asks to split a large file or refactor a "God Node", you MUST use `deepsift heal <filepath>` (or the `heal_god_node` MCP tool).
    - Present the proposed modular split to the user.
    - Once approved, extract the components into the new files as proposed using native IDE tools.
20. **🔨 BUILD-AFTER-EDIT MANDATE (ZERO TOLERANCE):**
    - After **every** edit to a file, you MUST run the project's build/compile command (e.g. `npm run build`, `npx tsc --noEmit`, `flutter build`).
    - If the build fails, you MUST fix the errors **immediately** before proceeding to the next file.
    - You are **FORBIDDEN** from editing multiple files in sequence without verifying the build between each edit.
    - **WHY:** The agent previously edited 4 files in a row without building once, causing cascading interface mismatches that were impossible to untangle.
21. **📖 ACCURATE READ BEFORE EDIT (MANDATORY):**
    - Before editing ANY file, you MUST read it with `deepsift read "filepath"`.
    - You are **FORBIDDEN** from writing replacement code based on compressed/tokenized output.
    - For large files (>200 lines), read in segments: `deepsift read "file:1-100"`, then `file:100-200`, etc.
    - **WHY:** Compressed reads lose critical details (imports, exact prop names, utility usage patterns), causing the agent to write incorrect replacement code.
22. **🔄 INTERFACE BACKWARD COMPATIBILITY (EXTEND, DON'T BREAK):**
    - When modifying a component's interface/props/type definition:
      1. **NEVER** remove existing props — mark them as deprecated or make them optional.
      2. Add new props as **optional** with sensible defaults.
      3. **BEFORE** changing any interface, run `deepsift deps "filepath"` and `deepsift search "import.*ComponentName"` to find ALL consumers.
      4. Update ALL consumers in the same session (with build verification between each).
    - **WHY:** The agent changed `icon` to `iconName` and removed `maxWidth`, breaking every component that used the old interface.
23. **🌍 PRESERVE EXISTING CAPABILITIES (LOCALIZATION, A11Y, THEMES):**
    - When refactoring a file, you MUST preserve ALL existing capabilities:
      - RTL support (`useLanguageStore`, `isRtl`, `dir` attributes, `text-right`/`text-left`)
      - i18n (`t()` function calls, translation keys)
      - Theme support (light/dark mode classes)
      - Accessibility attributes (`aria-label`, `role`, etc.)
      - Existing imports (especially icon/asset imports like SVG files)
    - Before writing replacement code, create a **checklist** of these capabilities from the original file and verify each one exists in your replacement.
    - **WHY:** The agent deleted RTL support, `RawSvgIcon` imports, `Button` component usage, and icon asset imports during refactoring.
26. **🧠 DYNAMIC RESEARCH MEMORY (DRM) — YOUR COGNITIVE BACKBONE (MANDATORY):**
    DRM is NOT optional. It is your **persistent brain** across operations. Without it, you are stateless — you forget everything between tool calls and produce shallow, incomplete, inaccurate outputs. DRM fixes this by storing structured research data that you can query, recall, and build upon.

    **⚡ AUTO-SAVE PROTOCOL (BUILT-IN):**
    When you have an open DRM tag and run `deepsift search` or `deepsift read`, the system **automatically** captures:
    - The exact query you ran
    - Number of results found
    - Top matched file paths with similarity scores
    - Truncated code snippets from the top results
    - Full log file path for later deep-dive
    This happens transparently — no extra command needed. Your job is to OPEN the tag BEFORE you start researching.

    **📋 MANDATORY DRM LIFECYCLE FOR EVERY TASK:**
    ```
    Phase 1: OPEN TAG
      deepsift memo open "descriptive-task-name"
      
    Phase 2: RESEARCH (auto-save captures search/read results)
      deepsift search "query1"     ← auto-saved to tag
      deepsift search "query2"     ← auto-saved to tag
      deepsift read "file.ts"      ← auto-saved to tag
      
    Phase 3: MANUALLY ADD HIGH-VALUE INSIGHTS
      deepsift memo add "tag" --data "Key architectural insight..." --type "architecture_note"
      deepsift memo add "tag" --data "Decision: use X instead of Y because..." --type "decision"
      deepsift memo add "tag" --data "Bug root cause: missing null check in..." --type "error_solution"
      
    Phase 4: QUERY YOUR MEMORY (before writing code or reports)
      deepsift memo query "tag" "specific question"
      deepsift memo query --all "cross-tag question"
      deepsift memo show "tag"   ← see entry count and type breakdown
      deepsift memo graph "tag"  ← see semantic relationships between findings
      
    Phase 5: EXPORT & CLOSE
      deepsift memo export "tag"  ← generate full markdown report from all entries
      deepsift memo close "tag"   ← lock tag, keep queryable
    ```

    **🚨 CRITICAL RULES:**
    - **ALWAYS open a tag BEFORE your first search.** If you search without a tag, auto-save is skipped and data is lost forever.
    - **TAG NAMING LAW:** Names MUST be descriptive and semantic (e.g., `auth-flow-analysis`, `grid-styling-refactor`). Generic names like `test`, `temp`, `task` are REJECTED by the engine.
    - **QUERY BEFORE ANSWERING:** Before writing any report or making any architectural claim, run `deepsift memo query "tag" "topic"` to retrieve what you actually found — do NOT rely on your context window memory alone.
    - **MANUAL ADD for INSIGHTS:** Auto-save captures raw data. YOU must add interpreted insights, decisions, and conclusions manually with `--type` classification.
    - **ENTRY TYPES and their meaning:**
      | Type | When to use |
      |---|---|
      | `finding` | Raw discovery from code analysis |
      | `code_snippet` | Important code pattern worth remembering |
      | `architecture_note` | Structural insight about how modules connect |
      | `decision` | Why you chose approach A over B |
      | `error_solution` | Bug fix, workaround, or resolution |
      | `reference` | Link or external resource |
      | `api_response` | API structure, endpoint pattern |
    - **PLAN INTEGRATION:** All findings in open tags are automatically injected into implementation plans generated by `deepsift plan`, forcing the plan to account for your research.
    - **CLOSURE MANDATE:** Close the tag when task is done. The CLI reminds you after every command if tags are open.

    **💡 REAL-WORLD WORKFLOW EXAMPLE:**
    ```bash
    # Task: "Analyze how the auth system works and write a detailed report"
    
    # Step 1: Open research tag
    deepsift memo open "auth-system-deep-analysis"
    
    # Step 2: Research (each search auto-saves results to the tag)
    deepsift search "authentication login handler"
    deepsift search "JWT token validation"
    deepsift search "session management middleware"
    deepsift read "src/features/auth/auth-handler.ts"
    deepsift deps "auth-handler.ts"
    
    # Step 3: Add your interpreted insights
    deepsift memo add "auth-system-deep-analysis" --data "Auth uses JWT with 24h expiry stored in httpOnly cookies. Refresh token rotation is implemented in auth-middleware.ts. Token validation happens in 3 stages: decode → verify signature → check expiry." --type "architecture_note"
    deepsift memo add "auth-system-deep-analysis" --data "Decision: Auth handler is a God Node (450 lines). Should be split into TokenService, SessionService, and AuthMiddleware." --type "decision"
    
    # Step 4: Query your memory BEFORE writing the report
    deepsift memo query "auth-system-deep-analysis" "token validation flow"
    deepsift memo query "auth-system-deep-analysis" "session management"
    deepsift memo show "auth-system-deep-analysis"
    
    # Step 5: Export all findings as structured markdown
    deepsift memo export "auth-system-deep-analysis"
    
    # Step 6: NOW write the report using queried data — NOT from memory
    # ... write comprehensive report ...
    
    # Step 7: Close the tag
    deepsift memo close "auth-system-deep-analysis"
    ```

## 💡 Examples of Unwavering Loyalty to DeepSift

```bash
# BAD: using grep_search (FORBIDDEN)
# GOOD: 
deepsift search "authentication login handler"

# BAD: using view_file (FORBIDDEN)
# GOOD:
deepsift read "src/core/indexer.ts"

# GOOD: Batch analysis of an entire feature
deepsift feature "src/features/auth"

# GOOD: Safe, token-efficient architectural discovery
deepsift arch

# GOOD: Mandatory check before generating code
deepsift context "src/components/MyNewButton.tsx"

# GOOD: Querying the skills database
deepsift search "how to connect to bigquery" --realm skills

# GOOD: Querying everything
deepsift search "auth handler" --all-realms

# GOOD: Comparing the codebase to flutter documentation to find missing implementation
deepsift compare code flutter_docs --query "state management"

# GOOD: DRM-powered deep research
deepsift memo open "feature-analysis"
deepsift search "state management patterns"
deepsift memo add "feature-analysis" --data "Project uses Zustand for UI state" --type "finding"
deepsift memo query "feature-analysis" "state management"
deepsift memo export "feature-analysis"
deepsift memo close "feature-analysis"
```

## 📚 DeepSift Documentation & Manuals (MANDATORY INITIAL READING)
For comprehensive, detailed manuals of DeepSift's capabilities, you **MUST** read the documentation injected into the `.deepsift/docs/` directory at the start of any conversation to learn exactly how to use DeepSift.

**MANDATORY FIRST STEP:** Run `view_file` on `.deepsift/docs/00-deepsift-index.md` to see the full list of available manuals, and read the relevant sections (e.g., search, DNA, DRM, planning, patching) before attempting complex operations.

For deep technical details on patches and workflows, check your skills: `view_file` on `.agents/skills/deepsift-mastery/SKILL.md`.

