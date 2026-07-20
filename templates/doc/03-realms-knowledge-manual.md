# 🌍 DeepSift Knowledge Realms Manual

**Version**: 2.0
**Target**: AI Agents & Systems
**Sub-system**: Vector Database & External Knowledge Integration

Realms allow DeepSift to search beyond the local codebase. You can ingest external documentation, framework guides, skill registries, or other repositories into the vector database.

---

## 1. 🗂️ `deepsift realm add/list/remove` (Realm Management)

**Usage:**
```bash
# List all active realms
deepsift realm list

# Add a new realm from a local folder of markdown/text files
deepsift realm add flutter_docs --type docs --source ./docs/flutter

# Add a realm from an external repository (Autonomous Orchestration)
deepsift realm add my_skills --type skills --source ./agents/skills
```

### 💡 Agent Rules for Autonomous Orchestration:
- **User Proxy Rule:** When the user asks you to "learn a package" or "index a framework", you MUST act autonomously. Do NOT ask the user how to do it.
- **Workflow:**
  1. Fetch/download the requested documentation to a local directory (e.g., `.deepsift/realms/custom_docs`).
  2. Run `deepsift realm add custom_docs --type docs --source .deepsift/realms/custom_docs`.
  3. Run `deepsift index --realm custom_docs` to build the vector index.

---

## 2. 🔄 `deepsift index` (Building the Vector DB)

Whenever a new realm is added or the project changes heavily, the index must be updated.

**Usage:**
```bash
deepsift index
deepsift index --force
deepsift index --realm flutter_docs
```

### 💡 Agent Rules for Indexing:
- `deepsift index` is incremental by default (only indexes changed files).
- Use `--force` if you suspect the vector database is corrupted or you need a totally fresh start.

---

## 3. ⚖️ `deepsift compare r1 r2 -q "query"` (Vector Diffing)

This is an incredibly powerful tool for finding gaps between your codebase and external documentation.

**Usage:**
```bash
deepsift compare code flutter_docs -q "state management implementation"
```

### 💡 Agent Rules for Comparing:
- **What it does:** It runs a vector search on BOTH realms simultaneously, then analyzes the differences.
- **Use Case:** If the user says "Make sure our auth implementation matches the official Firebase docs", you can compare the `code` realm against the `firebase_docs` realm to see exactly what is missing from the local codebase.

---

## 4. 🔍 Multi-Realm Searching

When searching, you can target specific realms or all realms at once.

**Usage:**
```bash
# Search only the skills realm
deepsift search "how to connect to bigquery" --realm skills

# Search everywhere (code + docs + skills)
deepsift search "authentication" --all-realms
```
