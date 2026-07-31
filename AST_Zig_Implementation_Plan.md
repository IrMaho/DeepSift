# Goal: Standalone AST Parser in Zig (Removing Node.js Dependency)

Currently, DeepSift extracts code structures (Classes, Functions, Interfaces, Imports) using 	ree-sitter bindings in Node.js. This requires loading V8 and keeping Node running heavy parsing tasks, which consumes a lot of memory.

By moving the entire AST parsing logic directly into the Zig binary, we completely eliminate the V8 overhead for parsing, making DeepSift a massive, self-contained, high-performance C/Zig engine that can index millions of lines of code in milliseconds.

## Proposed Architecture & Execution Plan

### 1. Integrate Tree-Sitter Core into Zig
We will incorporate the core 	ree-sitter C library directly into our uild.zig. Since Zig is an incredible C/C++ compiler, we can compile 	ree-sitter natively without external CMake or Makefiles.

### 2. Integrate Language Parsers
We will start by importing the most critical language parsers as C dependencies:
- 	ree-sitter-typescript (for TS/TSX)
- (We can expand to Python, Dart, Rust, Go later or immediately depending on requirements).

### 3. Zig AST Extraction Engine (st.zig)
We will create a new file packages/deepsift-core/native/core-zig/src/ast.zig:
- Use Zig's @cImport to interface with 	ree_sitter/api.h.
- Create a TSParser instance.
- Provide functions to traverse the TSTreeCursor and extract:
  - class_declaration
  - unction_declaration
  - method_definition
  - import_statement
- Output the extracted symbols in a structured format (e.g., JSON or binary structs) to be returned to the main Zig bridge.

### 4. Bridge Update (search_engine.zig & main.zig)
- Wire the new AST parser to handle the extractSymbolsNative action in Zig.
- Replace the Node.js 	ree-sitter logic in TypeScript (chunker.ts or parser.ts) with a direct call to the Zig binary.

## Why this is a game changer?
- **Zero V8 Overhead:** No more Garbage Collection pauses during indexing.
- **True Portability:** The resulting deepsift-math.exe will contain the full semantic intelligence engine, requiring zero Node.js native module recompilation on user machines.

