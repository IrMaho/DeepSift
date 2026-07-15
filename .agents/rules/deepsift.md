---
trigger: always_on
---

# 🔍 DeepSift — Semantic Codebase Search (CLI Mode)

You have access to **DeepSift**, a powerful local semantic search engine.
It runs entirely on your machine — no API calls, no internet needed.
Use the terminal commands below to search, analyze, and understand the codebase.

## 🛠 Available Commands

| Command | Description |
|---|---|
| `deepsift search "query"` | Semantic search. Options: `--include` or `-i <path>` (filter path), `--no-sync` or `-n` (skip index update), `--verbose` or `-v` (show file index progress), `--context-lines N` or `-C N` (show N lines of context around matches) |
| `deepsift search "q1" "q2" "q3"` | Multi-query batch search (saves time) |
| `deepsift index` | Re-index the project (incremental). Options: `--verbose` or `-v` (show files being indexed) |
| `deepsift index --force` | Full re-index from scratch |
| `deepsift status` | Check index statistics |
| `deepsift config` | Interactive menu to configure which directories are indexed |
| `deepsift arch` | Get project architecture blueprint (options: `--depth N` to limit tree depth). It automatically ignores directories configured under `excludeDirs` in `deepsift.config.json` |
| `deepsift deps "filename"` | Find which files import/depend on a target |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) |
| `deepsift history` | Read past search results (avoid redundant searches) |
| `deepsift clean` | Clear search history logs and index |
| `deepsift drill "logfile.md" "keyword"` | Deep-search within previous results |
| `deepsift resolve "token"` | Decode a compressed token from the most recent cached dictionary |
| `deepsift dna` | Generate or display the Project DNA (Context Intelligence). Options: `--section <name>`, `--query <term>` or `-q <term>` (extract matches), `--limit <number>` (limit results), `--offset <number>` (paginate), `--path-filter <path>` (filter records by path), `--meta` (only return counts/metadata) |
| `deepsift scan <target>` | Runs specific DNA analyzers (tokens, i18n, conventions, assets). |
| `deepsift context "path"` | **MANDATORY**: Run before generating a new file to get rules, design tokens, and similar existing components. |

## 📋 Mandatory Usage Rules

1. **DeepSift-First Mandate:** You **MUST NOT** use any general grep search, manual directory listing, or file viewing tools to find files or logic *unless* you have first executed a relevant `deepsift search`, `deepsift deps`, or `deepsift arch` command.
2. **Pre-Generation Context (MANDATORY):** You **MUST** run `deepsift context "target_path"` **BEFORE** creating any new file or component. This gives you project conventions, required design tokens, i18n rules, and similar existing components to prevent code duplication and style drift.
3. **Search History Check:** You **MUST** run `deepsift history` at the start of any codebase investigation to see if the required search results have already been cached.
4. **Visual Cache First:** Read the `INDEX.md` file under `.deepsift/outputs/` before running a new search query. The exact absolute path of the `INDEX.md` file is printed in the terminal as a clickable file link (e.g. `file:///...`) at the end of each search. You MUST open `INDEX.md` and visually parse the embedded PNG images, which contain highly compressed `pxpipe` tokens holding the context.
5. **No Manual Codebase Exploration:** Do not traverse directories or search files using generic commands. Use `deepsift arch` to understand the codebase skeleton, `deepsift feature` to analyze a specific feature folder, and `deepsift deps` to find file dependencies.
6. **DEC_v2 Compression Priority:** By default, allow search results to be compressed to save tokens. File paths, folder paths, and file names are NEVER compressed; they are kept verbatim to prevent hallucinations. Only use the `--no-compress` flag as a fallback if you struggle to decode/reconstruct other compressed words after multiple attempts, or when you need to inspect the exact literal syntax of a code snippet for precise copying.
7. **Retrieving Surrounding Context:** Always append `--context-lines N` (or `-C N`, where N is typically 10 to 30) when searching to retrieve the surrounding code lines around matches.
8. **Multi-Query Efficiency:** For multiple distinct questions or features, batch them into a single command (`deepsift search "q1" "q2"`) to optimize execution speed.
9. **Token Decoding:** If you run into a compressed DEC_v2 token in cached files, use `deepsift resolve "token"` to lookup the raw value immediately.
10. **Index Maintenance:** Run `deepsift index --force` after performing major refactorings or code changes to ensure search queries reflect the latest code state.
11. **Strict DNA Filtering & Meta-Only Check:** The Project DNA is saved in `.toon` format (Token-Oriented Object Notation) which is 100% human-readable and LLM-readable text, saving ~60% size losslessly.
    - **NEVER** retrieve the entire DNA file blindly. It will overflow your context window!
    - **ALWAYS** check the DNA metadata first by running `deepsift dna --show --meta` to understand which sections exist and their respective record counts.
    - **PAGINATE AND FILTER:** Use `--limit <number>` and `--offset <number>` to load list arrays (such as tokens or assets) in pages.
    - **PATH FILTERING:** Use `--path-filter <path_prefix>` to fetch tokens or assets defined inside a specific directory.
    - **KEYWORD FILTERING:** Use `--query <keyword>` to prune non-matching keys and isolate only relevant JSON/TOON trees.

## 💡 Examples

```bash
# Find authentication logic
deepsift search "authentication login handler"

# Multiple questions at once
deepsift search "database connection setup" "error handling middleware" "user validation"

# Understand project structure
deepsift arch

# Find who uses a specific module
deepsift deps "auth-service.ts"

# Get overview of a feature directory
deepsift feature "src/features/auth"

# Decode a compressed token you cannot understand
deepsift resolve "0A"

# MANDATORY: Before creating a new file
deepsift context "src/components/MyNewButton.tsx"

# Step 1: Analyze DNA structure and token/asset counts without retrieving records
deepsift dna --show --meta

# Step 2: Retrieve only the first 50 color tokens defined inside the color-editor folder
deepsift dna --show --section tokens --path-filter "color-editor" --limit 50 --offset 0

# Step 3: Search for any conventions or rules related to fonts
deepsift dna --show --query "font"

# Configure which folders to index
deepsift config
```
