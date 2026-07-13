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
| `deepsift search "query"` | Semantic search. Options: `--include` or `-i <path>` (filter path), `--no-sync` or `-n` (skip index update), `--verbose` or `-v` (show file index progress) |
| `deepsift search "q1" "q2" "q3"` | Multi-query batch search (saves time) |
| `deepsift index` | Re-index the project (incremental). Options: `--verbose` or `-v` (show files being indexed) |
| `deepsift index --force` | Full re-index from scratch |
| `deepsift status` | Check index statistics |
| `deepsift arch` | Get project architecture blueprint (options: `--depth N` to limit tree depth) |
| `deepsift deps "filename"` | Find which files import/depend on a target |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) |
| `deepsift history` | Read past search results (avoid redundant searches) |
| `deepsift clean` | Clear search history logs and index |
| `deepsift drill "logfile.md" "keyword"` | Deep-search within previous results |

## 📋 Usage Rules

1. **ALWAYS** run `deepsift history` before performing a new search to check if the answer already exists.
2. Results are cached in `.deepsift/outputs/` — read cached files before re-searching.
3. Use multi-query (`deepsift search "q1" "q2"`) when you have multiple questions.
4. Use `--json` flag for machine-readable output.
5. Use `--plain` flag for plain text without markdown formatting.
6. After major refactors, run `deepsift index --force` to rebuild the index.

## 💡 Examples

```bash
deepsift search "authentication login handler"

deepsift search "database connection setup" "error handling middleware" "user validation"

deepsift arch

deepsift deps "auth-service.ts"

deepsift feature "src/features/auth"
```
