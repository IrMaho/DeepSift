---
description: Standard operating procedures and execution workflows for using DeepSift.
---

# DeepSift Workflow

Use this workflow as your step-by-step execution guide when tasked with large modifications or explorations using DeepSift.

## Phase 1: Project Familiarization
1. Run `deepsift history` to see what has already been searched in the current session.
2. Run `deepsift dna` to parse the DNA, followed by `deepsift dna --show --section architecture` to find the core "God Nodes" (the central routing files).
3. Identify the directory structure using `deepsift arch --depth 3`.
4. **Initialize DRM Tag:** Open a new research memory tag for the task: `deepsift memo open "task-name" --desc "Refactoring feature X"`.

## Phase 2: Targeted Exploration
1. When asked to look at a feature (e.g., Auth), run `deepsift search "authentication" --context-lines 10`.
2. Open the generated `INDEX.md` absolute path and read the PNG token images.
3. If you need a broad view of a feature folder, run `deepsift feature "src/features/auth"` to see all classes and methods without their bodies.
4. If you need to trace where a file is used, run `deepsift deps "auth.ts"`.
5. **Record Initial Findings:** Add any architecture/dependency constraints discovered to the tag: `deepsift memo add "task-name" --data "Auth handler uses JWT tokens in localStorage" --type "finding"`.

## Phase 3: Pre-Generation & Planning
1. Before creating any new files, run `deepsift context "target_folder"`.
2. Run `deepsift plan "user's request"` to get a milestone-based implementation plan based on the project's DNA.
3. **Record Decisions:** Add planned architecture decisions to the tag: `deepsift memo add "task-name" --data "Decided to keep JWT storage in localStorage for backward compatibility" --type "decision"`.

## Phase 4: Structural Edits
1. For 1-line changes: Use `deepsift sed "old" "new" --files "target.ts"`.
2. For multi-line, structural changes: 
   - Write a `patch.toon` file to `.gemini/antigravity-ide/scratch/patch.toon` using standard `write_to_file`.
   - Apply it via `deepsift edit ".gemini/antigravity-ide/scratch/patch.toon"`.
   - Never write `.toon` patches directly into the project's source folders.
3. **Record Code snippet:** Store important code snippets added: `deepsift memo add "task-name" --data "Code content..." --type "code_snippet"`.

## Phase 5: Troubleshooting & Closure
1. If the project fails to compile, run `deepsift diag "problems.json"` if available, or just read the terminal output.
2. If your edit was wrong, use `deepsift com "git diff HEAD -- <file>"` to see what you broke, and heal it using `deepsift edit`.
3. **Record Solution:** If you solve an error, record the fix: `deepsift memo add "task-name" --data "Fixed compilation issue by importing X" --type "error_solution"`.
4. **Close DRM Tag:** Once the task is fully achieved, close the tag to lock it: `deepsift memo close "task-name"`.
