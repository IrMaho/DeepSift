---
description: Standard operating procedures and execution workflows for using DeepSift.
---

# DeepSift Workflow

Use this workflow as your step-by-step execution guide when tasked with large modifications or explorations using DeepSift.

## Phase 1: Project Familiarization & DRM Initialization
1. Run `deepsift history` to see what has already been searched in the current session.
2. Run `deepsift memo list --open` to check for any existing open research tags from previous sessions.
3. **Initialize DRM Tag:** Open a new research memory tag for the task: `deepsift memo open "task-name" --desc "Description"`.
   - Tag names MUST be descriptive (e.g., `auth-refactor-analysis`, `grid-component-styling`).
   - Generic names like `test`, `temp`, `task` will be REJECTED.
4. Run `deepsift dna` to parse the DNA, followed by `deepsift dna --show --section architecture` to find the core "God Nodes".
5. Identify the directory structure using `deepsift arch --depth 3`.

## Phase 2: Targeted Exploration (Auto-Save Active)
With your DRM tag open, every `search` and `read` command will automatically save results to the active tag.
1. Use `--agent-format` or `--json` when you need zero-token-waste structured JSON for pure machine parsing.
2. Run `deepsift feature "src/features/folder"` to inspect feature structure. Focus on `⭐ Core Logic` tags (`⭐ State Store`, `⚡ Handler / Controller`) at the top of the output.
3. If output shows `💡 Pagination` with `nextCommand`, execute `nextCommand` directly to retrieve subsequent file pages.
4. Run `deepsift search "topic" --context-lines 10` for semantic searches — results auto-saved.
5. Run `deepsift deps "target.ts"` to trace where a file is used.
6. Run `deepsift read "file.ts"` to read exact file contents — content auto-saved.
5. **Manually add high-value insights you interpret from the results:**
   ```bash
   deepsift memo add "tag" --data "Auth handler uses JWT with 24h expiry" --type "architecture_note"
   deepsift memo add "tag" --data "Found circular dependency between A.ts and B.ts" --type "finding"
   ```

## Phase 3: Pre-Generation & Planning
1. Before creating any new files, run `deepsift context "target_folder"`.
2. Run `deepsift plan "user's request"` — this automatically injects all open DRM tag findings into the plan.
3. **Record architectural decisions:**
   ```bash
   deepsift memo add "tag" --data "Decided to split auth-handler into 3 services" --type "decision"
   ```

## Phase 4: Query Memory Before Writing Code or Reports
This is the CRITICAL phase most agents skip. Before you write ANY output:
1. Run `deepsift memo show "tag"` to see how many entries and what types you collected.
2. Run `deepsift memo query "tag" "specific topic"` to retrieve relevant findings.
3. Run `deepsift memo graph "tag"` to see semantic relationships between your findings.
4. Run `deepsift memo export "tag"` to generate a full structured markdown report of all entries.
5. Use the queried data to write your code or report — do NOT rely on context window memory alone.

## Phase 5: Structural Edits
1. For 1-line changes: Use `deepsift sed "old" "new" --files "target.ts"`.
2. For multi-line, structural changes: 
   - Write a `patch.toon` file to `.gemini/antigravity-ide/scratch/patch.toon` using standard `write_to_file`.
   - Apply it via `deepsift edit ".gemini/antigravity-ide/scratch/patch.toon"`.
3. **Record important code changes:**
   ```bash
   deepsift memo add "tag" --data "Refactored TokenService.validate() to async pattern" --type "code_snippet"
   ```

## Phase 6: Troubleshooting & Error Resolution
1. If the project fails to compile, run `deepsift diag "problems.json"` or read the terminal output.
2. If your edit was wrong, use `deepsift com "git diff HEAD -- <file>"` to see what you broke.
3. **Record every solution:**
   ```bash
   deepsift memo add "tag" --data "Fixed: missing import for AutoSaveContext in read.ts" --type "error_solution"
   ```

## Phase 7: Closure & Deliverables
1. Run `deepsift memo export "tag"` to generate the final research export.
2. Use the exported data to write your final report, documentation, or summary.
3. Close the tag: `deepsift memo close "tag"`.
4. Verify the tag is closed: `deepsift memo list`.
