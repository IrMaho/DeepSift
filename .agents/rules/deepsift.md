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
| `deepsift search "query"` | Semantic search for code snippets, functions, classes |
| `deepsift search "q1" "q2" "q3"` | Multi-query batch search (saves time) |
| `deepsift index` | Re-index the project (incremental) |
| `deepsift index --force` | Full re-index from scratch |
| `deepsift status` | Check index statistics |
| `deepsift arch` | Get project architecture blueprint |
| `deepsift deps "filename"` | Find which files import/depend on a target |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) |
| `deepsift history` | Read past search results (avoid redundant searches) |
| `deepsift drill "logfile.md" "keyword"` | Deep-search within previous results |
| `deepsift dna` | Generate or display the Project DNA (Context Intelligence) |
| `deepsift scan <target>` | Run a specific analyzer (tokens, i18n, conventions, etc.) |
| `deepsift context "path"` | **MANDATORY**: Run before generating a new file to get rules & templates |

## 📋 Usage Rules

1. **ALWAYS** run `deepsift history` before performing a new search to check if the answer already exists.
2. **ALWAYS** run `deepsift context "target_path"` **BEFORE** creating any new file or component to get the project's design tokens, naming rules, and similar existing components.
3. Results are cached in `.deepsift/outputs/` — read cached files before re-searching.
4. Use multi-query (`deepsift search "q1" "q2"`) when you have multiple questions.
5. After major refactors, run `deepsift index --force` to rebuild the index.

## 💡 Examples

```bash
deepsift search "authentication login handler"

deepsift search "database connection setup" "error handling middleware" "user validation"

deepsift arch

deepsift deps "auth-service.ts"

deepsift feature "src/features/auth"

deepsift context "src/components/button.tsx"

deepsift dna
```
