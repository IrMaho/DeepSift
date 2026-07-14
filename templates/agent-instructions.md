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
| `deepsift arch` | Get project architecture blueprint (options: `--depth N` to limit tree depth) |
| `deepsift deps "filename"` | Find which files import/depend on a target |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) |
| `deepsift history` | Read past search results (avoid redundant searches) |
| `deepsift clean` | Clear search history logs and index |
| `deepsift drill "logfile.md" "keyword"` | Deep-search within previous results |
| `deepsift resolve "token"` | Decode a compressed token from the most recent cached dictionary |

## 📋 Usage Rules

1. **ALWAYS** run `deepsift history` before performing a new search to check if the answer already exists.
2. Results are cached in `.deepsift/outputs/` — read cached files before re-searching.
3. Use multi-query (`deepsift search "q1" "q2"`) when you have multiple questions.
4. Use `--json` flag for machine-readable output.
5. Use `--plain` flag for plain text without markdown formatting.
6. Search results are compressed by default to save tokens (using DEC_v2 standard). If you need raw, uncompressed text outputs, use the `--no-compress` global flag.
7. **Smart Compression:** File paths, line references (`[path:L1-L2]`), scores, code fences, and structural markers are **NEVER compressed** — they always appear verbatim and are reliable for navigation.
8. If you encounter a compressed token you cannot decode, run `deepsift resolve "token"` to look up the original value from the cached dictionary.
9. Use `--context-lines N` or `-C N` to retrieve surrounding code for better context (e.g. `-C 10`).
10. After major refactors, run `deepsift index --force` to rebuild the index.

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

