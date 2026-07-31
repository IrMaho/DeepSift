# 🛡️ DeepSift Security, Diagnostics & Metrics Manual

This manual explains how to utilize the Native Zig modules focused on system health, compliance, test generation, and architectural boundaries.

## 1. Security & Compliance Auditor (`deepsift security-scan`)
A powerful static analyzer to prevent catastrophic leaks and security vulnerabilities.
- **Usage**: `deepsift security-scan`
- **What it checks**:
  - **Sandbox Leaks**: Detects illegal browser object usages (like `window` or `document`) inside secure environments (like Figma Plugin sandboxes or Node.js workers).
  - **Hardcoded Secrets**: Scans for embedded API keys, tokens, and passwords in the codebase.
  - **Vulnerability Checks**: Flags usages of `eval()`, dangerous XSS injection vectors, and dependency CVEs.

## 2. Agent Diagnostics & Self-Healing (`deepsift doctor`)
If DeepSift behaves unexpectedly or fails to find known context, run the diagnostic suite.
- **Usage**: `deepsift doctor`
- **Capabilities**: Analyzes index health, database corruption, out-of-sync vector embeddings, and automatically triggers incremental self-healing.

## 3. Cognitive Complexity Heatmap (`deepsift complexity`)
Before attempting to refactor a file, understand its complexity.
- **Usage**: `deepsift complexity "src/features"`
- **Output**: Calculates Cyclomatic (branching) and Cognitive (human readability) complexity metrics. Functions scoring above 15 are highlighted in Red as high-risk God Nodes.

## 4. Git Churn Hotspots (`deepsift git-churn`)
Powered by `commit_classifier.zig` and `churn.zig`.
- **Usage**: `deepsift git-churn`
- **Output**: Correlates the frequency of Git commits with file complexity. Identifies files that change constantly (hotspots) and are highly complex, flagging them as prime targets for refactoring.

## 5. Architectural Boundary Guard (`deepsift check-layers`)
Enforces Clean Architecture rules dynamically.
- **Usage**: `deepsift check-layers`
- **Capabilities**: Powered by `layer_guard.zig`. Detects illegal cross-layer imports (e.g., Domain layer importing UI components, or Data layer importing Domain logic directly).

## 6. Automated Testing (`deepsift testmap`, `gen-test`, `gen-mock`)
- **`deepsift testmap`**: Maps all source files to their corresponding test files (e.g., `feature.ts` -> `feature.test.ts`) and flags untested critical paths.
- **`deepsift gen-test "src/math.ts"`**: Automatically scaffolds a Vitest/Jest/Go test file targeting the public exports of the file.
- **`deepsift gen-mock "IUserRepository"`**: Parses the AST of an interface and automatically generates a fully typed Mock implementation for dependency injection during tests.

## 7. Architecture Decision Records (`deepsift gen-adr`)
Automatically converts dynamic research tags (from `deepsift memo`) into formal Markdown ADRs.
- **Usage**: `deepsift gen-adr "tag-name"`
- **Output**: Generates a structured ADR artifact detailing Context, Decision, and Consequences, storing it in the `.agents/adr` folder.
