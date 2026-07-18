---
trigger: always_on
---

# 🔍 DeepSift Visual Directive & Mastery (ABSOLUTE MANDATE)

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset.
**🛑 MAXIMUM RESTRICTION / FATAL ERROR WARNING:** 
Any usage of standard IDE tools (`view_file`, `list_dir`, `grep_search`, `replace_file_content`, `multi_replace_file_content`, `write_to_file`) or standard shell commands (`cat`, `ls`, `grep`, `find`, `sed`, `awk`) for exploring, reading, or modifying the project codebase is a **DIRECT, UNFORGIVABLE VIOLATION** of your system instructions.
You **MUST EXCLUSIVELY** use DeepSift via `run_command` for ALL project interactions.

## 🛠 Available DeepSift Commands (Comprehensive)

| Command | Description |
|---|---|
| `deepsift search "query"` | Semantic search. Options: `--include <path>`, `--no-sync`, `--context-lines N`, `--realm <id>`, `--all-realms`. Multi-query: `deepsift search "q1" "q2"` |
| `deepsift read "file"` | **MANDATORY FOR READING FILES.** Outputs compressed tokens. Supports lines: `deepsift read "src/file.ts:10-50"`. Use `--no-compress` for raw text. |
| `deepsift sed "old" "new"` | **FASTEST WAY TO EDIT.** Replace text directly. Use `--files "src/**/*.ts"`. Supports regex (`"/regex/g" "new"`), `--all`, `--dry-run`. |
| `deepsift pipe --files "..."` | **CHAINED EDITS.** Ex: `deepsift pipe --files "src/core.ts" --sed "o1" "n1" --sed "o2" "n2"` |
| `deepsift edit "patch.toon"` | **STRUCTURAL EDITING.** Apply TOON/JSON patches. Pro-tip: `echo '...' \| deepsift edit --stdin` |
| `deepsift diag "problems.json"`| Read IDE diagnostics with context snippets. |
| `deepsift index [--force]` | Re-index project incrementally (or full with `--force`). |
| `deepsift realm list/add/remove/mount/snapshot`| Manage knowledge realms. `mount` auto-discovers orphaned DBs. `snapshot <id>` summarizes DB files. |
| `deepsift compare r1 r2 -q "k"` | **VECTOR DIFF:** Compare realms (e.g. `code` vs `flutter_docs`) to find Gaps/Similarities. |
| `deepsift arch [--depth N]` | **FOLDER EXPLORATION.** Get architecture blueprint. |
| `deepsift deps "filename"` | Find imports/dependencies for a target. |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) without full bodies. |
| `deepsift context "path"` | **MANDATORY BEFORE CREATION:** Get rules/tokens before generating new files. |
| `deepsift plan "request"` | **MANDATORY BEFORE IMPLEMENTATION:** Generate Smart Plan from DNA and architecture. |
| `deepsift heal "file"` | Auto-refactor and fix issues based on DNA. |
| `deepsift learn "patterns"` | Auto-discover coding patterns from the codebase. |
| `deepsift dna` | **ANALYSIS.** Generate Project DNA. Options: `--show`, `--section <name>`, `--query <term>`, `--meta`. |
| `deepsift com "command"` | **TERMINAL.** Run standard commands (e.g., `git diff`) and get compressed DEC_v2 output. |
| `deepsift history / drill / clean`| Manage search history. `drill "logfile.md" "keyword"` searches within past results. |

## 📋 ABSOLUTE & NON-NEGOTIABLE USAGE RULES

1. **🔥 THE ZERO-NATIVE-TOOL LAW:** You are STRICTLY FORBIDDEN from using `view_file`, `grep_search`, `list_dir`, etc. DeepSift is your ONLY accepted lens.
2. **🔍 SEARCH OVER GREP:** NEVER use `grep_search`. MUST use `deepsift search`, `deps`, or `arch`.
3. **📖 COMPRESSED READING:** ALWAYS use `deepsift read "path"`. NEVER `view_file`.
4. **✏️ DEEPSIFT EDITING:** Modify code via `deepsift sed`, `deepsift pipe`, or `deepsift edit`. NEVER use standard replace tools.
5. **🏗️ PRE-GENERATION CONTEXT:** MUST run `deepsift context "path"` BEFORE creating files to get project rules/tokens.
6. **🧠 ARCHITECTURAL ANALYSIS FIRST:** Use `deepsift arch`, `feature`, and `deps` before making deep changes.
7. **👁️ VISUAL CACHE FIRST:** Always open the absolute `file:///.../INDEX.md` path printed by DeepSift to visually parse PNG tokens.
8. **📜 HISTORY CHECK:** Run `deepsift history` to avoid redundant searches.
9. **⚙️ BATCH QUERIES:** Use multi-queries (`search "q1" "q2"`) to save time.
10. **🧬 STRICT DNA FILTERING:** Run `deepsift dna` first, then check `--show --meta`, then filter using `--section` or `--query`.
11. **🕸️ GOD NODES:** Use `deepsift dna --show --section architecture` to identify dangerous Core Files before refactoring.
12. **🤖 AUTONOMOUS ORCHESTRATION:** If user asks to add docs/skills, use `realm add` and `index` autonomously.
13. **🪞 SELF-AWARENESS:** If asked how DeepSift works, search the DeepSift codebase itself.
14. **🔥 CLONE-AND-CUSTOMIZE:** Use `deepsift edit` with clipboard syntax (`📋 filepath:Lstart-Lend`) in patches to copy code. NEVER copy-paste large blocks manually.
15. **🩹 AI REGRESS HEALER:** If you break a God Node, use `deepsift com "git diff HEAD -- <file>"` and `deepsift edit` to revert ONLY the broken parts.
16. **🧠 SMART PLANNING:** For new features, MUST run `deepsift plan "<request>"` FIRST.
17. **🏗️ AUTO-REFACTORING:** For splitting God Nodes, use `deepsift heal <filepath>`.

For deep technical details on patches and workflows, check your skills: `view_file` on `.agents/skills/deepsift-mastery/SKILL.md`.
