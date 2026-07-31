# 🛠️ DeepSift Advanced Refactoring & Surgical Tools Manual

This manual covers the highly advanced Native Zig modules for manipulating, auditing, and surgical refactoring of codebases.

## 1. Direct File Mutations (`deepsift sed` & `deepsift edit`)
When you need to perform precision string manipulations or line-range patches, use these native commands:
- **`deepsift sed <file> --search "<pattern>" --replace "<replacement>"`**: 
  - Performs direct in-place string replacement.
  - Supports string literals natively (it gracefully ignores `$1` variables during literal string replace).
  - Supports safe Regex by passing `/pattern/flags` (e.g., `/(foo)/gi`). Invalid flags are gracefully filtered to prevent engine crashes.
- **`deepsift edit <patch.json>`**:
  - The core engine behind the TOON-Patch protocol.
  - Automatically handles line-ending normalizations (CRLF vs LF) ensuring cross-platform stability.
  - Supports robust appending at the end of files and dictionary parsing (`[key: value]`).

## 2. Structural Clones & DRY Audits (`deepsift clones`)
Powered by `spectral_clone.zig`, this command scans the entire codebase AST to find semantically identical code blocks, even if variable names have been changed.
- **Usage**: `deepsift clones`
- **Output**: Returns clusters of duplicate code. Use this before extracting a new utility function to see if you can consolidate multiple existing duplicates.

## 3. Dead Code Elimination (`deepsift find-dead-code`)
Scans the project dependency graph and AST exports to find variables, functions, and components that have exactly 0 inbound references.
- **Usage**: `deepsift find-dead-code`
- **Action**: Safely prune dead code to reduce complexity and agent token context.

## 4. Architectural Refactoring & Surgeons (`deepsift refactor`)
Powered by `refactor_surgeon.zig`, this allows AST-safe structural modifications without manual patching.
- **Symbol Rename**: `deepsift refactor rename "oldName" "newName"` (Renames the symbol and updates all callers across the codebase).
- **Function Extraction**: `deepsift refactor extract "src/file.ts:L10-L20" --name "newFunction"` (Extracts a block of code into a new pure function, lifting dependencies as arguments).

## 5. Control Flow Graph (`deepsift cfg`) & Call Tree (`deepsift calltree`)
- **`deepsift cfg "file.ts:functionName"`**: Extracts conditional branching logic (`if/switch/try`) into a Mermaid diagram. Excellent for debugging complex logic.
- **`deepsift calltree "symbol"`**: Generates a tree of all upstream callers and downstream dependencies for a function.
- **`deepsift wire-trace`**: Specifically traces event-driven messaging (e.g., `postMessage`, WebSockets, IPC) across UI and Backend boundaries.

## 6. Breaking Change Impact Radar (`deepsift impact`)
Before modifying a God Node or a heavily used service, calculate the blast radius.
- **Usage**: `deepsift impact "ClassName"`
- **Output**: Returns a risk score (Low/Medium/Critical) and a list of all call sites that might break if the signature changes.

## 7. Schema Drift Synchronization (`deepsift check-schema-drift`)
Audits synchronization between Frontend DTOs/API integrations and Backend schemas.
- **Usage**: `deepsift check-schema-drift`
- **Output**: Highlights mismatched types (e.g., UI expects `string`, DB provides `int`).
