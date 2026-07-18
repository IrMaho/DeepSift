---
trigger: always_on
---

# 🔍 DeepSift Adaptive Directive & Mastery

You have access to **DeepSift**, a powerful local semantic search engine and codebase manipulation toolset.

**🎯 PRIORITY HIERARCHY:**
- **Search & Discovery:** DeepSift is your **PRIMARY** tool for semantic search (`deepsift search`), architecture analysis (`deepsift arch`), dependency tracing (`deepsift deps`), and file reading (`deepsift read`). Use it FIRST.
- **Literal/Keyword Search:** When semantic search fails to find something (e.g., exact variable names, CSS class names, error messages), you MAY use `grep_search` or `deepsift com "grep ..."` for exact pattern matching. Sometimes a screenshot or partial text from the user is best found with literal search, not semantic.
- **Editing:** DeepSift editing (`deepsift edit`, `deepsift sed`, `deepsift pipe`) is **OPTIONAL**. Use it when it genuinely helps (e.g., `sed` for simple renames, `pipe` for chained text replacements). For complex structural edits, you are FREE to use native IDE tools (`replace_file_content`, `multi_replace_file_content`, `write_to_file`) which provide safer, more precise control.
- **File Reading:** `deepsift read` is preferred for initial exploration. For files you plan to EDIT, always use `deepsift read "file" --no-compress` or `view_file` to get exact, uncompressed code.

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

1. **🔍 SMART SEARCH STRATEGY (SEMANTIC + LITERAL):**
    - **Start with DeepSift semantic search:** `deepsift search "query"` for conceptual/architectural questions.
    - **Fall back to literal search when semantic fails:** If semantic search doesn't find what you need after 2 attempts, switch to `grep_search` or `deepsift com "grep -rn 'exact_text' src/"` for exact pattern matching.
    - **Use `--include` to narrow scope:** `deepsift search "query" --include "src/features/auth"` is faster and more precise.
    - **Image/screenshot clues:** When the user shows a screenshot with visible text, extract key words and use `grep_search` for exact matches — this is FASTER than semantic search for known text.
2. **📖 FLEXIBLE READING (CHOOSE YOUR PRECISION):**
    - **Exploration/overview:** Use `deepsift read "file"` (compressed) for quick scanning and understanding structure.
    - **Pre-edit reading (MANDATORY):** Before editing ANY file, MUST read with `deepsift read "file" --no-compress` or `view_file` to get exact, character-perfect code.
    - **Large files:** Read in segments: `deepsift read "file:1-100" --no-compress`, then `file:100-200`, etc.
    - **If DEC_v2 compressed output is unreadable:** Immediately re-read with `--no-compress`. Never guess or write code based on compressed tokens you can't fully decode.
3. **✏️ EDITING FREEDOM (USE THE BEST TOOL):**
    - **Simple text replacements:** `deepsift sed` or `deepsift pipe` are fastest (no patch file needed).
    - **Complex structural edits:** Native IDE tools (`replace_file_content`, `multi_replace_file_content`, `write_to_file`) are **preferred** because they give exact control and avoid TOON patch bugs.
    - **TOON patches:** Only use `deepsift edit "patch.toon"` when the Copy-Paste syntax (`📋 filepath:Lstart-Lend`) genuinely saves tokens or when doing cross-file reference copying.
    - **NEVER force DeepSift editing** when native tools would be simpler and safer.
4. **🖼️ VISUAL OUTPUT CONTROL (FONT & IMAGE TUNING):**
    - **Default font:** `spleen-5x8` (small, high-density). Good for most cases.
    - **Larger font for readability:** When the visual cache PNG is unreadable (too small, blurry, or dense), the pxpipe renderer supports `jetbrains-mono-10` which is ~2x larger.
    - **Disable visual compression entirely:** Use `--no-compress` on any DeepSift command to get plain text output instead of image-cached DEC_v2 tokens. Use `--plain` for even simpler output.
    - **When to disable visual cache:** If you've tried reading the INDEX.md visual output twice and still can't parse it, STOP and re-run the command with `--no-compress` to get raw text.
    - **`deepsift com` output:** By default compressed. Use `deepsift com "command" --no-compress` when you need exact command output (e.g., `git diff`, `git log`, build errors).
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

20. **🔪 SURGICAL EDIT LAW (CRITICAL — NO FULL-FILE REPLACEMENT):**
    - You are **STRICTLY FORBIDDEN** from replacing an entire file in a single TOON patch block (e.g. `L1-L{end}:<<<<`).
    - Every TOON patch block MUST target **only the specific lines that need to change** (max 30-50 lines per block).
    - If a file needs multiple changes, write **multiple separate blocks** in the same `.toon` file, each targeting its own line range.
    - If you catch yourself writing a replacement that covers more than 60% of a file's lines, **STOP** and break it into smaller surgical patches.
    - **WHY:** Full-file replacement causes catastrophic loss of existing logic, imports, RTL support, and state management code that the agent fails to reproduce from memory.
    - **BAD Example:**
      ```toon
      📄 src/components/modal.tsx
      L1-L435:<<<<
      ====
      📋 scratch/new_modal.tsx:L1-L368
      >>>>
      ```
    - **GOOD Example:**
      ```toon
      📄 src/components/modal.tsx
      L5-L14:<<<<
      interface ModalProps {
        isOpen: boolean
        onClose: () => void
        icon?: string
      }
      ====
      interface ModalProps {
        isOpen: boolean
        onClose: () => void
        icon?: string
        iconVariant?: 'danger' | 'primary' | 'default'
        footerActions?: React.ReactNode
      }
      >>>>
      ```
21. **🔨 BUILD-AFTER-EDIT MANDATE (ZERO TOLERANCE):**
    - After **every** `deepsift edit` or `deepsift sed`, you MUST run the project's build/compile command (e.g. `npm run build`, `npx tsc --noEmit`, `flutter build`).
    - If the build fails, you MUST fix the errors **immediately** before proceeding to the next file.
    - You are **FORBIDDEN** from editing multiple files in sequence without verifying the build between each edit.
    - **WHY:** The agent previously edited 4 files in a row without building once, causing cascading interface mismatches that were impossible to untangle.
22. **📖 ACCURATE READ BEFORE EDIT (MANDATORY --no-compress):**
    - Before editing ANY file, you MUST read it with `deepsift read "filepath" --no-compress`.
    - You are **FORBIDDEN** from writing replacement code based on compressed/tokenized output.
    - For large files (>200 lines), read in segments: `deepsift read "file:1-100" --no-compress`, then `file:100-200`, etc.
    - **WHY:** Compressed reads lose critical details (imports, exact prop names, utility usage patterns), causing the agent to write incorrect replacement code.
23. **🚫 NO DOUBLE APPLY (PATCH VERIFICATION):**
    - After running `deepsift edit "patch.toon"`, you MUST immediately verify the result by running `deepsift read "target_file" --no-compress`.
    - If the edit succeeded, DO NOT run the same patch again.
    - If the edit failed, investigate the error message, fix the `.toon` file, and create a **new** patch — never re-run the same one blindly.
    - **WHY:** The agent previously applied the same patch twice to multiple files, causing double-corruption of already-modified content.
24. **🔄 INTERFACE BACKWARD COMPATIBILITY (EXTEND, DON'T BREAK):**
    - When modifying a component's interface/props/type definition:
      1. **NEVER** remove existing props — mark them as deprecated or make them optional.
      2. Add new props as **optional** with sensible defaults.
      3. **BEFORE** changing any interface, run `deepsift deps "filepath"` and `deepsift search "import.*ComponentName"` to find ALL consumers.
      4. Update ALL consumers in the same session (with build verification between each).
    - **WHY:** The agent changed `icon` to `iconName` and removed `maxWidth`, breaking every component that used the old interface.
25. **🌍 PRESERVE EXISTING CAPABILITIES (LOCALIZATION, A11Y, THEMES):**
    - When refactoring a file, you MUST preserve ALL existing capabilities:
      - RTL support (`useLanguageStore`, `isRtl`, `dir` attributes, `text-right`/`text-left`)
      - i18n (`t()` function calls, translation keys)
      - Theme support (light/dark mode classes)
      - Accessibility attributes (`aria-label`, `role`, etc.)
      - Existing imports (especially icon/asset imports like SVG files)
    - Before writing replacement code, create a **checklist** of these capabilities from the original file and verify each one exists in your replacement.
    - **WHY:** The agent deleted RTL support, `RawSvgIcon` imports, `Button` component usage, and icon asset imports during refactoring.

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
