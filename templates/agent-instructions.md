---
trigger: always_on
---

# 🔍 DeepSift — Semantic Codebase Search & Edit (CLI Mode)

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset enhanced with **native Graphify topology awareness**.
It runs entirely on your machine — no API calls, no internet needed. It understands code architecture, "God Nodes" (highly connected core files), and file communities.

**🛑 EXTREME RESTRICTION WARNING: YOU ARE BOUND BY THE DEEPSIFT DIRECTIVE.**
You **MUST NOT** use your default IDE tools (`view_file`, `list_dir`, `grep_search`, `replace_file_content`, `multi_replace_file_content`) or standard shell commands (`cat`, `ls`, `grep`, `find`, `sed`, `awk`) for exploring, reading, or modifying the codebase unless a specific DeepSift tool critically fails. DeepSift is your **PRIMARY AND EXCLUSIVE** interface to the project.

## 🛠 Available Commands

| Command | Description |
|---|---|
| `deepsift search "query"` | Semantic search enhanced with Graphify PageRank. Results are automatically boosted based on architectural importance (God Nodes) and community detection. Options: `--include` or `-i <path>` (filter path), `--no-sync` or `-n` (skip index update), `--verbose` or `-v` (show file index progress), `--context-lines N` or `-C N` (show N lines of context around matches) |
| `deepsift read "file"` | **MANDATORY FOR READING FILES.** Read file contents and output highly compressed DEC_v2 tokens to save token context. Supports specific lines (e.g., `deepsift read "src/file.ts:10-50"`). Use `--no-compress` to get raw plain text. You can pass multiple files at once. |
| `deepsift edit "patch.toon"` | **MANDATORY FOR EDITING.** Apply replacements via TOON-Patch v3. Create a `.toon` file on disk, then run this. Dictionary `[~token:value]`. Target files `📄 file/path`. **Format 1 (Zero Duplication):** Use `L10-L15` (or `L10`) to target exact lines: `L10-L15` \n `====` \n `new code...` \n `>>>>`. **Format 2 (Granular):** Replace a small string on a line: `L5:<<<<` \n `old` \n `====` \n `new` \n `>>>>`. **Format 3 (AI Copy-Paste):** Inside the new code, use `📋 filepath:Lstart-Lend` to inject code from any file. Indentation before `📋` will smartly format all copied lines! |
| `deepsift diag "problems.json"` | Read an IDE-generated problems/diagnostics JSON array and output the exact files, errors, and precise code snippets surrounding the errors for quick context. |
| `deepsift search "q1" "q2" "q3"` | Multi-query batch search (saves time) |
| `deepsift index` | Re-index the project (incremental). Options: `--verbose` or `-v` (show files being indexed) |
| `deepsift index --force` | Full re-index from scratch |
| `deepsift status` | Check index statistics |
| `deepsift config` | Interactive menu to configure which directories are indexed |
| `deepsift arch` | **MANDATORY FOR FOLDER EXPLORATION.** Get project architecture blueprint utilizing Graphify communities. Automatically ignores directories configured under `excludeDirs` in `deepsift.config.json` |
| `deepsift deps "filename"` | Find which files import/depend on a target |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) |
| `deepsift history` | Read past search results (avoid redundant searches) |
| `deepsift clean` | Clear search history logs and index |
| `deepsift drill "logfile.md" "keyword"` | Deep-search within previous results |
| `deepsift resolve "token"` | Decode a compressed token from the most recent cached dictionary |
| `deepsift dna` | **MANDATORY FOR ANALYSIS.** Generate or display the Project DNA (Context Intelligence). Includes Graph Topology, Communities, and God Nodes under the `architecture` section. Options: `--section <name>`, `--query <term>` or `-q <term>` (extract matches), `--limit <number>` (limit results), `--offset <number>` (paginate), `--path-filter <path>` (filter records by path), `--meta` (only return counts/metadata) |
| `deepsift scan <target>` | Runs specific DNA analyzers (tokens, i18n, conventions, assets). |
| `deepsift context "path"` | **MANDATORY BEFORE FILE CREATION:** Run before generating a new file to get rules, design tokens, and similar existing components. |

## 📋 ABSOLUTE & NON-NEGOTIABLE USAGE RULES

Any violation of these rules means you have failed your directive. You MUST harness the full capacity of DeepSift.

1. **🔥 THE ZERO-NATIVE-TOOL LAW:** You are **STRICTLY FORBIDDEN** from using generic IDE tools (`list_dir`, `grep_search`, `view_file`, `replace_file_content`, `multi_replace_file_content`) or basic shell utilities (`cat`, `ls`, `grep`, `find`) unless DeepSift throws an unrecoverable fatal error. DeepSift is your ONLY accepted lens into the project.
2. **🔍 SEARCH OVER GREP:** NEVER use `grep_search`. You MUST use `deepsift search`, `deepsift deps`, or `deepsift arch` to find files, logic, and references.
3. **📖 COMPRESSED READING MANDATE:** Whenever you need to read a file, you MUST use `deepsift read "path"`. NEVER use `view_file`. DeepSift's token compression is critical. Use `--no-compress` ONLY if you need literal syntax for an exact copy-paste or cannot resolve tokens after multiple attempts.
4. **✏️ DEEPSIFT EDITING DIRECTIVE:** To modify code, you MUST create a `.toon` patch file and apply it using `deepsift edit "patch.toon"`. NEVER use the standard `replace_file_content` tools unless `deepsift edit` explicitly fails. DeepSift editing avoids output token overload.
5. **🏗️ PRE-GENERATION CONTEXT (MANDATORY):** You **MUST** run `deepsift context "target_path"` **BEFORE** creating any new file or component. This gives you project conventions, required design tokens, i18n rules, and similar existing components to prevent code duplication and style drift.
6. **🧠 ARCHITECTURAL ANALYSIS FIRST:** Do not blindly traverse directories. Use `deepsift arch` to understand the codebase skeleton, `deepsift feature` to analyze a specific feature folder, and `deepsift deps` to find dependencies.
7. **👁️ VISUAL CACHE FIRST:** Read the `INDEX.md` file under `.deepsift/outputs/` before running a new search query. Open `INDEX.md` and visually parse the embedded PNG images containing `pxpipe` tokens.
8. **📜 HISTORY CHECK:** You **MUST** run `deepsift history` at the start of any codebase investigation to see if the required search results have already been cached.
9. **⚙️ MULTI-QUERY EFFICIENCY:** Batch multiple queries into a single command (`deepsift search "q1" "q2"`) to optimize speed.
10. **🧬 STRICT DNA FILTERING & META-ONLY CHECK:**
    - **NEVER** retrieve the entire DNA file blindly.
    - **ALWAYS** check DNA metadata first: `deepsift dna --show --meta`.
    - **PAGINATE AND FILTER:** Use `--limit`, `--offset`, `--path-filter`, and `--query` to extract exact TOON trees.
11. **🕸️ GRAPH TOPOLOGY & GOD NODES:** Always use `deepsift dna --show --section architecture` to map out spaghetti vs modular zones and identify dangerous Core Files (God Nodes) before heavy refactoring.

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

# GOOD: Applying edits via DeepSift (requires patch.toon creation first)
deepsift edit "patch.toon"
```
