# 🚀 DeepSift TOON-Patch Engine: Agent Operating Manual

**Status**: Bulletproof (10/10)
**Version**: Quantum-Enabled (v2)

This document is the authoritative manual for AI Agents operating the DeepSift `patch` command. The TOON-Patch engine is a deterministic, AST-aware, and Quantum-State-isolated code injection system.

## 🧬 1. The Greedy Strategy (Optimization Protocol)

When making code modifications, you MUST greedily select the most token-efficient approach:
- **< 15 Lines (Single File):** Use native IDE tools (e.g. `replace_file_content`).
- **Multi-File, Large Scale, or Relocations:** EXCLUSIVELY use `deepsift patch`.

## 🗂️ 2. The Bootstrap Protocol (File Creation)

TOON-Patch is capable of spontaneously generating files and arbitrarily deep directory structures (`mkdir -p`).

**How to Bootstrap a New File:**
To create a new file, target an empty `<<<<` search block.
```json
{
  "files": [
    {
      "file": "src/new/deep/path/module.ts",
      "edits": [
        {
          "type": "search",
          "search": "<<<<\n====",
          "replace": "export const message = 'Hello World';"
        }
      ]
    }
  ]
}
```
*Rule:* The file MUST NOT exist, OR it must be completely empty (`0 bytes`). If you attempt an empty search on a populated file, it will throw a strict `[Warning]` to prevent destructive overwrites.

## 📸 3. The Quantum Snapshot (Clipboard Memory)

The engine utilizes an in-memory **Original Files Cache**. Before ANY changes are flushed to disk, the engine creates a pristine snapshot of all targeted files.

**What this means for you:**
- You can perform **Circular Swaps** (e.g. swap line 10 of File A with line 20 of File B).
- The `📋` (Clipboard) macro will ALWAYS read the original state of the file, regardless of how many mutations have occurred earlier in the patch execution.
- Order of file patching does not affect clipboard reads. 

**Clipboard Syntax:**
- Block Indented: `    📋src/file.ts:L10-L20` (Automatically applies the `    ` indent to all copied lines)
- Inline: `📋src/file.ts:L10`

## 💣 4. Dictionary Variables (Zero-Collision)

Use the Dictionary `[KEY:VALUE]` to rename variables or dependencies on the fly during injection.
- **Smart Sorting:** Keys are expanded from longest to shortest, meaning `oldValue` and `oldValueExtended` will not collide.
- **Search Isolation:** Dictionary replacements are ONLY applied to the `replace` block. The `search` block is strictly isolated so that exact matching against the *current* codebase remains highly accurate.

## 🧙‍♂️ 5. AST-Powered Zero-Knowledge Extraction

You do NOT need to read a 1000-line file just to move a function!

**Workflow:**
1. Run `deepsift analyze "src/large_file.ts"`. (This returns exact AST boundaries, e.g. `fetchData: L300-L450`).
2. Construct a single TOON-Patch payload that:
   - Targets the injection point in `new_file.ts`.
   - Uses `📋src/large_file.ts:L300-L450` in the `replace` block.
   - Deletes or comments out lines 300-450 in `src/large_file.ts` using a targeted line edit:
     ```json
     {
       "startLine": 300,
       "endLine": 450,
       "replace": "// Refactored to new_file.ts"
     }
     ```
This extracts, relocates, and cleans up the code in a single atomic transaction spending almost zero output tokens.

## 📝 6. Detailed Terminal Reporting

Upon execution, the engine will return a highly detailed Terminal Report. It outputs exact line actions:
```
📄 src/cli/parser.ts:
  - Initialized/Populated empty file
📄 src/cli/commands/edit.ts:
  - Replaced targeted search block at lines 150-200
```
Use this report for Self-Correction. If your search block missed, the report will tell you exactly which file and line range was skipped.
