---
name: deepsift-mastery
description: Comprehensive mastery guide for DeepSift CLI commands, patch formats, and advanced features.
---

# 🎓 DeepSift Mastery Guide

This skill provides advanced technical documentation for the DeepSift engine. Use this as your reference manual whenever you need to write a patch file, execute an advanced multi-stage edit, or manage realms.

## 1. Fast Editing (`deepsift sed` & `deepsift pipe`)

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
