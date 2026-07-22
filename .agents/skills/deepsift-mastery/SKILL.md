---
name: deepsift-mastery
description: Comprehensive mastery guide for DeepSift CLI commands, patch formats, and advanced features.
---

# 🎓 DeepSift Mastery Guide

This skill provides advanced technical documentation for the DeepSift engine. Use this as your reference manual whenever you need to write a patch file, execute an advanced multi-stage edit, or manage realms.
## 0. Output & Compression Control

DeepSift has three output layers you can control independently:

### Text Compression (DEC_v2)
- **Default:** Disabled. Outputs raw exact text.
- **Enable:** `--compress` on ANY command → compressed, visual dictionary-encoded tokens.
- **When to enable:** For quick architectural overviews, exploration, or if token context gets too large.

```bash
deepsift read "src/modal.tsx"
deepsift com "npm run build"
deepsift search "modal component"
```

### Visual Image Cache (pxpipe PNG)
- **Default:** Disabled. Renders text into PNG images for vision-model consumption ONLY when `--compress` is passed.
- **Font options:** `spleen-5x8` (default, dense) or `jetbrains-mono-10` (2x larger, more readable).
- **Disable image output:** Use `--plain` for pure text with no markdown formatting.
- **When to switch fonts:** If the INDEX.md visual cache is too small/blurry to read, re-run without `--compress` to bypass pxpipe entirely.

## 🛠 Available DeepSift Commands (Comprehensive 50-Feature Engine)

| Command | Description |
|---|---|
| `deepsift overview [path]` | **SUPER-COMMAND (Blueprint):** Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries. Options: `--depth N`. |
| `deepsift search "query"` | **HYBRID SEMANTIC SEARCH:** Semantic & BM25 auto-switch search enhanced with Graphify PageRank. Options: `--include <path>`, `--sync`, `--layer ui\|domain\|data`, `--realms r1,r2`, `--history`. |
| `deepsift read "file"` | **MANDATORY FOR READING FILES:** Outputs raw exact text by default. Supports line ranges: `file:10-50`. Use `--compress` to enable visual DEC_v2 tokens. |
| `deepsift feature "path"` | **AST FEATURE OUTLINE:** AST-based feature summary. Options: `--summary` / `-s`, `--group-by-feature` / `-g`, `--depth N`, `--limit N`, `--offset N`. |
| `deepsift analyze "path"` | **SUPER-COMMAND (Deep Dive):** Combines Feature Outline and DNA Intelligence for a specific folder or file. |
| `deepsift arch [--depth N]` | **FOLDER EXPLORATION:** Project architecture blueprint utilizing Graphify communities. Automatically prunes large data files. |
| `deepsift deps "target"` | **DEPENDENCY TRACER:** Trace imports and dependencies for a target file or module. |
| `deepsift dna` | **PROJECT DNA & GOD NODES:** Generate or view DNA topology. Options: `--show`, `--section <name>`, `--query <term>`, `--meta`, `--path-filter <path>`. |
| `deepsift calltree "symbol"` | **CALL GRAPH TRAVERSAL:** Trace upstream callers and downstream callee definitions for a symbol. |
| `deepsift clones` | **CODE CLONE DETECTOR:** Detect structural code duplicates and copy-paste clusters for DRY compliance. |
| `deepsift doctor` | **AGENT DIAGNOSTICS:** Run system checks, index health audit, and onboarding workflow report for AI agents. |
| `deepsift testmap` | **TEST COVERAGE MAPPING:** Map source files to test files (`.test.ts`, `_test.go`) and audit untested modules. |
| `deepsift refactor rename` | **AST SYMBOL RENAME:** AST-safe symbol renaming across the entire codebase (`deepsift refactor rename <old> <new>`). |
| `deepsift refactor extract` | **FUNCTION EXTRACTION:** Extract code lines into a new function (`deepsift refactor extract <file:lines> --name <func>`). |
| `deepsift check-schema-drift` | **SCHEMA DRIFT AUDIT:** Audit schema and DOM config synchronization between client and backend definitions. |
| `deepsift find-dead-code` | **DEAD CODE ELIMINATION:** Find unreferenced exports, variables, and unused component functions. |
| `deepsift heal "file"` | **DNA-BASED AUTO-REFACTOR:** Attempt to fix issues in a file using Project DNA context. |
| `deepsift auto-heal "file"` | **AUTONOMOUS SELF-HEALING LOOP:** Execute 4-step autonomous healing loop (diff ➔ lsp/build ➔ auto-patch ➔ re-verify). |
| `deepsift patch "patch.json"` | **TOON PATCH INJECTION:** Apply high-confidence code injections. Options: `--dry-run`, `--check-impact`, `--format`, `--scan-security`. |
| `deepsift memo <action>` | **DRM ENGINE (Dynamic Research Memory):** Persistent research note-taking engine. Actions: `open`, `close`, `archive`, `purge`, `list`, `add`, `query`, `show`, `graph`, `export`, `summarize`, `to-plan`, `gc`. |
| `deepsift realm <action>` | **KNOWLEDGE REALMS:** Manage external knowledge bases (`list`, `add`, `remove`, `mount`, `snapshot`, `add-swagger`). |
| `deepsift compare r1 r2` | **VECTOR DIFF SEARCH:** Compare two knowledge realms for gaps and similarities. Options: `-q <term>`, `--diff-only`. |
| `deepsift index [--force]` | **INCREMENTAL INDEXER:** Re-index project with sha256 incremental file hashing. Options: `--verbose`. |
| `deepsift context "path"` | **PRE-CREATION CHECKLIST:** Generate context rules and design tokens before creating new components. |
| `deepsift plan "request"` | **SMART PLANNER:** Generate structured implementation plan from DNA, skills, realms, and architecture. |
| `deepsift decode "token"` | **DEC_v2 DECODER:** Decompress and decode visual DEC_v2 tokens into plain text. |
| `deepsift com "command"` | **TERMINAL RUNNER:** Execute any shell command with token compression. Options: `--compress`. |
| `deepsift diag "problems.json"`| **IDE DIAGNOSTICS:** Read IDE problem diagnostics with context snippets. |
| `deepsift history / clean` | **SEARCH HISTORY:** View past search results or clean history logs. Options: `--keep N`, `--days D`. |
| `deepsift ui` | **LOCAL WEB DASHBOARD:** Launch local web dashboard on port 3333 to visualize knowledge graph and DRM. |

### Practical Decision Tree
```
Need single-step blueprint?  → deepsift overview "." (combines arch + god nodes + feature summary)
Need to understand structure? → deepsift read "file" --compress (fast, visual)
Need to deep dive a folder?   → deepsift analyze "src/folder" (combines feature + DNA)
Need to EDIT the file?        → deepsift read "file" (exact text)
Can't read PNG cache?         → deepsift read "file" (bypass pxpipe)
Need exact build errors?      → deepsift com "npm run build"
Need git diff details?        → deepsift com "git diff"
```

## 0.5 Hybrid Search Strategy

DeepSift semantic search is powerful but not perfect. Use the right search for the job:

### Semantic Search (DeepSift)
Best for: architectural questions, finding related code, understanding patterns.
```bash
deepsift search "authentication handler"
deepsift search "modal component reusable" --include "src/components"
```

### Literal/Keyword Search (grep_search or deepsift com)
Best for: exact text, variable names, CSS classes, error messages, imports.
```bash
grep_search for "useAuthStore"
deepsift com "grep -rn 'iconVariant' src/"
```

### When user shows a screenshot
1. Extract visible text/keywords from the screenshot
2. Use `grep_search` for exact matches FIRST (fastest)
3. Only fall back to semantic search if literal search fails



For simple replacements (e.g. renaming variables, changing a string), use the `sed` or `pipe` commands directly in the terminal to avoid writing `.toon` files.

**Basic Replace (First match only by default):**
```bash
deepsift sed "const oldVar = 1;" "const newVar = 2;" --files "src/utils.ts"
```

**Global Regex Replace:**
```bash
deepsift sed "/foo/g" "bar" --files "src/**/*.ts" --all
```

**Chained Replacements (`pipe`):**
Use `pipe` to apply multiple changes sequentially to the same files in one operation:
```bash
deepsift pipe --files "src/core.ts" --sed "import A from 'a';" "import A from 'b';" --sed "A.init()" "A.initialize()"
```

## 2. Structural Editing (`deepsift edit "patch.toon"`)

For complex architectural changes, you must write a `.toon` or `.json` patch file and apply it. TOON-Patch is highly recommended as it avoids JSON escaping hell for large code blocks.

### The TOON-Patch Format

A `.toon` file consists of block markers.
- `📄 <filepath>`: Indicates the target file.
- `L<start>-L<end>:<<<<`: Begins a targeted search-and-replace block restricted to specific line numbers.
- `<<<<`: Begins a global search-and-replace block.
- `====`: Separates the search block from the replacement block.
- `>>>>`: Closes the replacement block.
- `[key1: value1, key2: value2]`: (Optional) First line dictionary for expanding macros.

**Example 1: Line-Targeted Replacement (Safest)**
```text
📄 src/app.ts
L10-L15:<<<<
function oldLogic() {
  console.log("old");
}
====
function newLogic() {
  console.log("new");
}
>>>>
```

**Example 2: Global Replacement (Finds the first match anywhere)**
```text
📄 src/config.ts
<<<<
export const PORT = 3000;
====
export const PORT = 8080;
>>>>
```

**Example 3: Appending/Inserting Code**
To append, simply include the original text in the replacement block.
```text
📄 src/index.ts
<<<<
import { A } from './a';
====
import { A } from './a';
import { B } from './b';
>>>>
```

### The Clone-and-Customize Syntax (📋)

To copy large chunks of code without consuming output tokens, use the clipboard syntax inside your `====` replacement block. DeepSift will automatically resolve it.

```text
📄 src/my-new-feature.ts
<<<<
// PLACEHOLDER
====
📋 src/templates/auth.ts:L1-L50
function extraLogic() {
  // My custom code
}
>>>>
```
DeepSift will replace `📋 src/templates/auth.ts:L1-L50` with the exact lines 1 to 50 from that file, keeping the indentation intact.

## 3. Realm Management (`deepsift realm`)

Realms allow you to partition knowledge (e.g. keep `code`, `docs`, and `skills` isolated).

- **Add a realm:** `deepsift realm add flutter_docs --type docs --source ./flutter_docs`
- **Index a realm:** `deepsift index --realm flutter_docs`
- **Compare realms:** `deepsift compare code flutter_docs --query "authentication"` (Finds what's missing in `code` compared to `flutter_docs`).

## 4. Troubleshooting & AI Regress Healer

If your patch breaks the code, DO NOT guess what went wrong.
1. Check the git diff: `deepsift com "git diff HEAD -- src/broken.ts"`
2. Read the original code: `deepsift com "git show HEAD:src/broken.ts"`
3. Write a precise `patch.toon` to revert only the damaged segment, leaving your new features intact.

Always use `--dry-run` on `sed` or `pipe` if you are unsure of the result.

## 5. Safe Editing Workflow (MANDATORY)

Before editing ANY file, follow this exact checklist:

### Step 1: Read exactly (No visual cache)
```bash
deepsift read "src/components/modal.tsx"
```
For large files (>200 lines), read in segments:
```bash
deepsift read "src/components/modal.tsx:1-100"
deepsift read "src/components/modal.tsx:100-200"
```

### Step 2: Identify Existing Capabilities
Before writing any replacement code, mentally note:
- All imports (especially icon/asset SVG imports)
- RTL support (`useLanguageStore`, `isRtl`, `dir` attribute)
- i18n usage (`t()` function calls)
- Theme support (light/dark mode CSS classes)
- Component interfaces/props (exact names and types)
- Accessibility attributes (`aria-label`, `role`)

### Step 3: Write Surgical Patches (NEVER Full-File Replace)
Each TOON patch block MUST target only the specific lines that need to change:

```toon
📄 src/components/modal.tsx
L42-L48:<<<<
const oldFunction = () => {
  return "old"
}
====
const newFunction = () => {
  return "new"
}
>>>>
```

FORBIDDEN: `L1-L{totalLines}:<<<<` (full file replacement)

### Step 4: Apply and Verify
```bash
deepsift edit "patch.toon"
deepsift read "src/components/modal.tsx:42-48"
```

### Step 5: Build Check
```bash
npm run build
# OR
npx tsc --noEmit
```
If build fails, fix IMMEDIATELY before editing the next file.

### Step 6: NEVER Double Apply
If `deepsift edit` fails:
1. Read the current file state
2. Understand what changed (or didn't)
3. Write a NEW patch targeting the current state
4. NEVER re-run the same patch blindly

## 7. Dynamic Research Memory (DRM)

DeepSift features a persistent Dynamic Research Memory (`deepsift memo`) to ensure you do not lose insights, architecture constraints, or solutions during a long session. You **MUST** use this feature to retain important findings.

### When to use Memo Tags
- Before diving into a complex task, open a tag: `deepsift memo open "task-name"`.
- As you find constraints, solutions, or patterns, add them: `deepsift memo add "task-name" --data "Findings..." --type "finding"`.
- If a prompt reminds you to save notable findings, do so if there's value!

### Available Memo Commands
```bash
# 1. Start a new research task
deepsift memo open "auth-refactor" --desc "Refactoring the login flow"

# 2. Record findings (Types: finding, code_snippet, api_response, architecture_note, decision, reference, error_solution)
deepsift memo add "auth-refactor" --data "Auth handler uses JWT tokens in localStorage" --type "finding"

# 3. Search past research across all tags or within a specific tag
deepsift memo query --all "jwt tokens"
deepsift memo query "auth-refactor" "jwt tokens" --topk 5

# 4. Show summary & relations
deepsift memo show "auth-refactor"
deepsift memo graph "auth-refactor"

# 5. Finish a task (Locks it from further additions but keeps it queryable)
deepsift memo close "auth-refactor"
```
