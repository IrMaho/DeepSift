# ⚙️ DeepSift Utilities, Dashboard & CLI Core Manual

This manual outlines the core CLI utilities, configuration tools, and visual dashboard commands available in the DeepSift engine.

## 1. Core Indexing & Watchers (`deepsift index`, `scan`, `watch`, `status`)
- **`deepsift index [--force]`**: Triggers a manual re-indexing of the entire project. The AST Incremental Hasher ensures sub-second updates by only embedding modified nodes.
- **`deepsift scan`**: Performs a deep workspace scan, detecting missing files, repairing corrupted index vectors, and pruning deleted files.
- **`deepsift watch`**: Starts a persistent background filesystem watcher. Re-indexes and hashes files incrementally in real-time as they are saved.
- **`deepsift status`**: Displays the active workspace index health, embedding model info, and chunk count.

## 2. Configuration & Initialization (`deepsift init`, `config`)
- **`deepsift init`**: Initializes a new DeepSift workspace. Creates the `.deepsift` directory and triggers the first-run index bootstrap.
- **`deepsift config`**: Opens an interactive CLI menu to adjust excluded folders, context window limits, token caps, and embedding model preferences.

## 3. Local Web Dashboard (`deepsift ui`)
- **Usage**: `deepsift ui`
- **Capabilities**: Launches a local interactive Web Dashboard (on port 3333). It visualizes the Project DNA graph, Dynamic Research Memory (DRM) nodes, and allows visual exploration of the God Nodes.

## 4. Documentation Generator (`deepsift docgen`)
- **Usage**: `deepsift docgen`
- **Capabilities**: Generates and synchronizes a complete Markdown documentation suite for the project, perfect for GitHub Wikis or AI Agent onboarding.

## 5. Scope & Zoom (`deepsift scope`, `zoom`)
- **`deepsift scope lock "src/features"`**: Locks the DeepSift search boundary strictly to a subdirectory. Future searches will only look inside this scope. Unlock with `deepsift scope unlock`.
- **`deepsift zoom "src/folder"`**: Instantly drills down into an omitted folder cluster. Renders annotated views with type information and cross-references without requiring a full analyze command.

## 6. History & Decoders (`deepsift history`, `drill`, `decode`, `pipe`)
- **`deepsift history`**: Displays a paginated log of past search and read results with timestamps.
- **`deepsift drill <id>`**: Drills into a specific history entry to re-render the full search result.
- **`deepsift decode "token"`**: Decompresses and expands DEC_v2 visual token output back into full readable source text (useful when working with minified output).
- **`deepsift pipe`**: Allows chaining commands through Unix-style shell pipelines.
- **`deepsift expand-type "Type"`**: Resolves and expands complex Generic or Interface types to their foundational primitives.

## 7. Executive Summary (`deepsift executive-summary`)
- **Usage**: `deepsift executive-summary`
- **Output**: Generates a high-level executive report covering code quality, test coverage ratios, architecture health, and overall cyclomatic complexity averages.
