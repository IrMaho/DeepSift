---
name: deepsift-mastery
description: Comprehensive mastery guide for DeepSift CLI commands, patch formats, and advanced features.
---

# 🎓 DeepSift Mastery Guide

This skill provides advanced technical documentation for the DeepSift engine. Use this as your reference manual whenever you need to write a patch file, execute an advanced multi-stage edit, or manage realms.
## 0. Output & Compression Control

DeepSift has three output layers you can control independently:

### Text Compression (DEC_v2)
- **Default:** Enabled. Compresses text output using dictionary-encoded tokens.
- **Disable:** `--no-compress` on ANY command → raw, exact text output.
- **When to disable:** Before editing files, when debugging build errors, when exact syntax matters.

```bash
deepsift read "src/modal.tsx" --no-compress
deepsift com "npm run build" --no-compress
deepsift search "modal component" --no-compress
```

### Visual Image Cache (pxpipe PNG)
- **Default:** Enabled. Renders text into PNG images for vision-model consumption.
- **Font options:** `spleen-5x8` (default, dense) or `jetbrains-mono-10` (2x larger, more readable).
- **Disable image output:** Use `--plain` for pure text with no markdown formatting.
- **When to switch fonts:** If the INDEX.md visual cache is too small/blurry to read, re-run with `--no-compress` to bypass pxpipe entirely.

### Practical Decision Tree
```
Need to understand structure? → deepsift read "file" (compressed, fast)
Need to EDIT the file?        → deepsift read "file" --no-compress (exact text)
Can't read PNG cache?         → deepsift read "file" --no-compress (bypass pxpipe)
Need exact build errors?      → deepsift com "npm run build" --no-compress
Need git diff details?        → deepsift com "git diff" --no-compress
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

### Step 1: Read with --no-compress
```bash
deepsift read "src/components/modal.tsx" --no-compress
```
For large files (>200 lines), read in segments:
```bash
deepsift read "src/components/modal.tsx:1-100" --no-compress
deepsift read "src/components/modal.tsx:100-200" --no-compress
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
deepsift read "src/components/modal.tsx:42-48" --no-compress
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

