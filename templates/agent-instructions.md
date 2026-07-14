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

## 📋 Mandatory Usage Rules

1. **DeepSift-First Mandate:** You **MUST NOT** use any general grep search, manual directory listing, or file viewing tools to find files or logic *unless* you have first executed a relevant `deepsift search`, `deepsift deps`, or `deepsift arch` command.
2. **Search History Check:** You **MUST** run `deepsift history` at the start of any codebase investigation to see if the required search results have already been cached.
3. **Cache First:** Read the cached files under `.deepsift/outputs/` before running a new search query. The exact absolute path of the cached file is printed in the terminal as a clickable file link (e.g. `file:///...`) at the end of each search, architecture, feature, or dependency command.
4. **No Manual Codebase Exploration:** Do not traverse directories or search files using generic commands. Use `deepsift arch` to understand the codebase skeleton, `deepsift feature` to analyze a specific feature folder, and `deepsift deps` to find file dependencies.
5. **DEC_v2 Compression Priority:** By default, allow search results to be compressed to save tokens. File paths, folder paths, and file names are NEVER compressed; they are kept verbatim to prevent hallucinations. Only use the `--no-compress` flag as a fallback if you struggle to decode/reconstruct other compressed words after multiple attempts, or when you need to inspect the exact literal syntax of a code snippet for precise copying.
6. **Retrieving Surrounding Context:** Always append `--context-lines N` (or `-C N`, where N is typically 10 to 30) when searching to retrieve the surrounding code lines around matches.
7. **Multi-Query Efficiency:** For multiple distinct questions or features, batch them into a single command (`deepsift search "q1" "q2"`) to optimize execution speed.
8. **Token Decoding:** If you run into a compressed DEC_v2 token in cached files, use `deepsift resolve "token"` to lookup the raw value immediately.
9. **Index Maintenance:** Run `deepsift index --force` after performing major refactorings or code changes to ensure search queries reflect the latest code state.

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

# Configure which folders to index
deepsift config
```

