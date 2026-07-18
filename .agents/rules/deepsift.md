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
| `deepsift realm list/add/remove`| Manage knowledge realms. Ex: `deepsift realm add my_docs --type docs --source ./docs` |
| `deepsift compare r1 r2 -q "k"` | **VECTOR DIFF:** Compare realms (e.g. `code` vs `flutter_docs`) to find Gaps/Similarities. |
| `deepsift arch [--depth N]` | **FOLDER EXPLORATION.** Get architecture blueprint. |
| `deepsift deps "filename"` | Find imports/dependencies for a target. |
| `deepsift feature "src/path"` | Get feature outline (classes, functions, imports) without full bodies. |
| `deepsift context "path"` | **MANDATORY BEFORE CREATION:** Get rules/tokens before generating new files. |
| `deepsift plan "request"` | **MANDATORY BEFORE IMPLEMENTATION:** Generate Smart Plan from DNA and architecture. |
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
| `deepsift realm list/add/remove`| Manage knowledge realms. Ex: `deepsift realm add my_docs --type docs --source ./docs` |
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

1. **🔥 THE ZERO-NATIVE-TOOL LAW:** You are **STRICTLY FORBIDDEN** from using generic IDE tools (`list_dir`, `grep_search`, `view_file`, `replace_file_content`, `multi_replace_file_content`) or basic shell utilities (`cat`, `ls`, `grep`, `find`) unless DeepSift throws an unrecoverable fatal error. DeepSift is your ONLY accepted lens into the project.
2. **🔍 SEARCH OVER GREP:** NEVER use `grep_search`. You MUST use `deepsift search`, `deepsift deps`, or `deepsift arch` to find files, logic, and references.
3. **📖 COMPRESSED READING MANDATE:** Whenever you need to read a file, you MUST use `deepsift read "path"`. NEVER use `view_file`. DeepSift's token compression is critical. Use `--no-compress` ONLY if you need literal syntax for an exact copy-paste or cannot resolve tokens after multiple attempts.
4. **✏️ DEEPSIFT EDITING DIRECTIVE:** To modify code, you MUST create a `.toon` patch file and apply it using `deepsift edit "patch.toon"`. NEVER use the standard `replace_file_content` tools unless `deepsift edit` explicitly fails. DeepSift editing avoids output token overload.
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
17. **🩹 AI REGRESS HEALER (MANDATORY FOR FIXING BAD PATCHES):**
    - If you generated code that broke existing functionality or wrongly deleted code in a "God Node", you **MUST NOT** blindly revert the entire commit.
    - Instead, you MUST use the MCP tool `analyze_ai_regressions` to see the exact Temporal Diff and isolate the lines that were wrongly modified or deleted.
    - **Healer Command Workflow:**
      1. Run `deepsift com "git diff HEAD -- <filepath>"` to see EXACTLY what you broke in the file with compressed output.
      2. Run `deepsift com "git show HEAD:<filepath>"` if you need to read the complete original source code of the file before your changes.
      3. Use this regression report and git diffs to restore ONLY the broken code blocks via `deepsift edit` while keeping the newly generated features intact.
18. **🧠 SMART PLANNING MANDATE (MANDATORY BEFORE FEATURE IMPLEMENTATION):**
    - When the user requests a new feature, you **MUST NOT** start coding immediately.
    - You MUST first run `deepsift plan "<user request>"` or call the MCP tool `generate_smart_plan` to generate a structured implementation plan.
    - The plan gathers project DNA, searches matching skills, cross-references documentation realms, analyzes architecture risks, and produces a milestone-based blueprint.
    - For **UI features**, the plan MUST include a pixel-perfect visual description (layout, spacing, borders, shadows, radius, padding, margins, icons, rows, columns, colors, fonts) so detailed that a blind person could visualize it by hearing it.
    - You MUST present the plan to the user for approval before proceeding to code.
    - **CRITICAL QUALITY REQUIREMENT:** The `implementation_plan.md` artifact you create MUST NOT be a short summary. It MUST be an extremely comprehensive, deep, and meticulously detailed document (at least 500 lines). Before writing it, you MUST use `deepsift search` and `deepsift read` to gather deep context and visually analyze the cached `INDEX.md` files. Use your full creativity, explore edge cases, and detail every single file, function, and architecture change.
    - During implementation, follow the milestones in order.
19. **🏗️ AUTO-REFACTORING (ARCHITECTURE HEALER) WORKFLOW:**
    - If the user asks to split a large file or refactor a "God Node", you MUST use `deepsift heal <filepath>` (or the `heal_god_node` MCP tool).
    - Present the proposed modular split to the user.
    - Once approved, write a `.toon` patch file to extract the components into the new files as proposed, and run `deepsift edit`.

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

# GOOD: Querying the skills database
deepsift search "how to connect to bigquery" --realm skills

# GOOD: Querying everything
deepsift search "auth handler" --all-realms

# GOOD: Comparing the codebase to flutter documentation to find missing implementation
deepsift compare code flutter_docs --query "state management"
```

For deep technical details on patches and workflows, check your skills: `view_file` on `.agents/skills/deepsift-mastery/SKILL.md`.
