# 📖 DeepSift Source Code API Reference

Automatically extracted API documentation generated directly from JSDoc/TSDoc metadata across **129 TypeScript modules** in DeepSift.

---

## 📄 [`complexity-analyzer`](file:///packages/deepsift-core/src/analyzers/complexity-analyzer.ts)

- **Path:** `packages/deepsift-core/src/analyzers/complexity-analyzer.ts`  
- **Description:** Cyclomatic & Cognitive Complexity Heatmap Analyzer Engine.

### Exported Symbols

#### `interface FunctionComplexity`
Calculates branch complexity scores for functions, methods, and modules to flag high-risk refactoring targets.

#### `interface ComplexityReport`
Summary report containing complexity metrics across target codebase directory.

#### `class ComplexityAnalyzer`
Analyzer that scans source code and calculates Cyclomatic and Cognitive complexity scores.

---

## 📄 [`convention-miner`](file:///packages/deepsift-core/src/analyzers/convention-miner.ts)

- **Path:** `packages/deepsift-core/src/analyzers/convention-miner.ts`  
- **Description:** Project Naming Convention & Directory Architecture Miner Engine.

### Exported Symbols

#### `interface ConventionResult`
Analyzes case styles (camelCase, PascalCase, kebab-case, snake_case) across files, classes,

#### `function mineConventions`
Mines project-wide naming conventions and structural architecture templates.

---

## 📄 [`entropy-filter`](file:///packages/deepsift-core/src/analyzers/entropy-filter.ts)

- **Path:** `packages/deepsift-core/src/analyzers/entropy-filter.ts`  
- **Description:** Shannon Entropy & Minified Code Filter Engine.

### Exported Symbols

#### `function calculateEntropy`
Detects bundled JS files, minified code artifacts, and high-entropy text chunks to prevent indexing noise.

#### `function isBundledOrMinifiedFile`
Determines whether a file path or file content represents a minified or bundled artifact.

---

## 📄 [`git-churn-miner`](file:///packages/deepsift-core/src/analyzers/git-churn-miner.ts)

- **Path:** `packages/deepsift-core/src/analyzers/git-churn-miner.ts`  
- **Description:** Git Hotspot Heatmap & Churn Risk Miner Engine.

### Exported Symbols

#### `interface GitChurnItem`
Combines commit change frequency with file size complexity to calculate refactoring risk scores.

#### `class GitChurnMiner`
Miner that extracts commit frequency and churn hotspots from Git repository history.

---

## 📄 [`graph-analyzer`](file:///packages/deepsift-core/src/analyzers/graph-analyzer.ts)

- **Path:** `packages/deepsift-core/src/analyzers/graph-analyzer.ts`  
- **Description:** Graphify dependency graph topology analyzer for community detection and hub identification.

---

## 📄 [`impact-analyzer`](file:///packages/deepsift-core/src/analyzers/impact-analyzer.ts)

- **Path:** `packages/deepsift-core/src/analyzers/impact-analyzer.ts`  
- **Description:** Breaking Change Impact Analyzer Module.

### Exported Symbols

#### `interface ImpactReport`
Traces symbol references across source files, calculates breaking risk scores,

#### `class ImpactAnalyzer`
Analyzer that evaluates breaking change risk for code symbols across the codebase.

---

## 📄 [`l10n-detector`](file:///packages/deepsift-core/src/analyzers/l10n-detector.ts)

- **Path:** `packages/deepsift-core/src/analyzers/l10n-detector.ts`  
- **Description:** Internationalization (i18n) signal detector and hardcoded string auditor.

---

## 📄 [`layer-watchdog`](file:///packages/deepsift-core/src/analyzers/layer-watchdog.ts)

- **Path:** `packages/deepsift-core/src/analyzers/layer-watchdog.ts`  
- **Description:** Clean Architecture layer boundary enforcer detecting cross-layer import violations.

---

## 📄 [`pattern-miner`](file:///packages/deepsift-core/src/analyzers/pattern-miner.ts)

- **Path:** `packages/deepsift-core/src/analyzers/pattern-miner.ts`  
- **Description:** Project pattern miner extracting recurring code structures and conventions.

---

## 📄 [`property-miner`](file:///packages/deepsift-core/src/analyzers/property-miner.ts)

- **Path:** `packages/deepsift-core/src/analyzers/property-miner.ts`  
- **Description:** Design token and CSS/Dart property value extractor for design system discovery.

---

## 📄 [`qa-generator`](file:///packages/deepsift-core/src/analyzers/qa-generator.ts)

- **Path:** `packages/deepsift-core/src/analyzers/qa-generator.ts`  
- **Description:** QA Test Boilerplate & Mock Data Generator Engine.

### Exported Symbols

#### `interface TestGeneratorOptions`
Generates unit test stubs (Vitest, PyTest, GoTest), mock data definitions, and test-to-production line ratios.

#### `class QAGenerator`
Engine that generates test stubs, mock data types, and calculates test production line ratios.

---

## 📄 [`refactor-engine`](file:///packages/deepsift-core/src/analyzers/refactor-engine.ts)

- **Path:** `packages/deepsift-core/src/analyzers/refactor-engine.ts`  
- **Description:** AST-safe code refactoring engine for symbol renames and function extractions.

---

## 📄 [`refactor-guide`](file:///packages/deepsift-core/src/analyzers/refactor-guide.ts)

- **Path:** `packages/deepsift-core/src/analyzers/refactor-guide.ts`  
- **Description:** God Node Decomposition Roadmap Generator Engine.

### Exported Symbols

#### `interface RefactorStep`
Analyzes large monolithic files and auto-generates step-by-step Clean Architecture (SoC) refactoring roadmaps.

#### `interface RefactorGuideReport`
Complete decomposition roadmap report for a monolithic file.

#### `class RefactorGuideEngine`
Engine that generates architectural decomposition blueprints for large God Nodes.

---

## 📄 [`registry-miner`](file:///packages/deepsift-core/src/analyzers/registry-miner.ts)

- **Path:** `packages/deepsift-core/src/analyzers/registry-miner.ts`  
- **Description:** Feature registry and UI tab miner for project capability and route discovery.

---

## 📄 [`resource-mapper`](file:///packages/deepsift-core/src/analyzers/resource-mapper.ts)

- **Path:** `packages/deepsift-core/src/analyzers/resource-mapper.ts`  
- **Description:** Static resource and asset mapper for image, font, and media file discovery.

---

## 📄 [`security-auditor`](file:///packages/deepsift-core/src/analyzers/security-auditor.ts)

- **Path:** `packages/deepsift-core/src/analyzers/security-auditor.ts`  
- **Description:** Security Vulnerability & Sandbox Leak Auditor Engine.

### Exported Symbols

#### `interface SecurityFinding`
Scans codebases for sandbox boundary leaks (window in core sandbox), hardcoded API keys/secrets,

#### `interface SecurityReport`
Complete security audit report summary.

#### `class SecurityAuditor`
Auditor that performs CWE security analysis, sandbox isolation checks, and secret scans.

---

## 📄 [`similarity-engine`](file:///packages/deepsift-core/src/analyzers/similarity-engine.ts)

- **Path:** `packages/deepsift-core/src/analyzers/similarity-engine.ts`  
- **Description:** AST code clone and duplication detection engine using token hash fingerprinting.

---

## 📄 [`test-analyzer`](file:///packages/deepsift-core/src/analyzers/test-analyzer.ts)

- **Path:** `packages/deepsift-core/src/analyzers/test-analyzer.ts`  
- **Description:** Source-to-test file mapping analyzer identifying untested and partially covered modules.

---

## 📄 [`type-resolver`](file:///packages/deepsift-core/src/analyzers/type-resolver.ts)

- **Path:** `packages/deepsift-core/src/analyzers/type-resolver.ts`  
- **Description:** TypeScript type resolution engine for expanding complex intersection and generic types.

---

## 📄 [`value-classifier`](file:///packages/deepsift-core/src/analyzers/value-classifier.ts)

- **Path:** `packages/deepsift-core/src/analyzers/value-classifier.ts`  
- **Description:** Code value and constant classifier categorizing numeric and string literal semantics.

---

## 📄 [`wire-tracer`](file:///packages/deepsift-core/src/analyzers/wire-tracer.ts)

- **Path:** `packages/deepsift-core/src/analyzers/wire-tracer.ts`  
- **Description:** Cross-environment IPC and postMessage wire trace analyzer for event channel mapping.

---

## 📄 [`benchmark`](file:///packages/deepsift-core/src/benchmark.ts)

- **Path:** `packages/deepsift-core/src/benchmark.ts`  
- **Description:** Performance benchmarking harness for indexing throughput and embedding speed measurement.

---

## 📄 [`benchmark_web`](file:///packages/deepsift-core/src/benchmark_web.ts)

- **Path:** `packages/deepsift-core/src/benchmark_web.ts`  
- **Description:** Web-worker performance benchmarking harness for browser embedding throughput.

---

## 📄 [`cli-entry`](file:///packages/deepsift-core/src/cli/cli-entry.ts)

- **Path:** `packages/deepsift-core/src/cli/cli-entry.ts`  
- **Description:** Main CLI entry point and command routing dispatcher for all DeepSift commands.

---

## 📄 [`cli-output`](file:///packages/deepsift-core/src/cli/cli-output.ts)

- **Path:** `packages/deepsift-core/src/cli/cli-output.ts`  
- **Description:** CLI output formatting utilities for color-coded results, info, success, and error messages.

### Exported Symbols

#### `type OutputFormat`
Exported symbol.

---

## 📄 [`cli-paths`](file:///packages/deepsift-core/src/cli/cli-paths.ts)

- **Path:** `packages/deepsift-core/src/cli/cli-paths.ts`  
- **Description:** CLI path resolution utilities for workspace root and config directory discovery.

---

## 📄 [`analyze`](file:///packages/deepsift-core/src/cli/commands/analyze.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/analyze.ts`  
- **Description:** Deep dive analysis super-command combining AST feature outline and DNA topology.

### Exported Symbols

#### `function analyzeCommand`
Super-command: Analyzes a specific path by combining Feature Outline and DNA Intelligence.

---

## 📄 [`arch`](file:///packages/deepsift-core/src/cli/commands/arch.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/arch.ts`  
- **Description:** Project Directory Blueprint & Graphify Community Blueprint Command.

### Exported Symbols

#### `function archCommand`
Generates directory tree blueprints utilizing Graphify communities, module counts, and noise pruning.

---

## 📄 [`auto-heal`](file:///packages/deepsift-core/src/cli/commands/auto-heal.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/auto-heal.ts`  
- **Description:** Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify).

---

## 📄 [`calltree`](file:///packages/deepsift-core/src/cli/commands/calltree.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/calltree.ts`  
- **Description:** Call Graph & Event-Driven Message Traversal Command.

### Exported Symbols

#### `function calltreeCommand`
Traces upstream callers, downstream callee scopes, and event-driven message channels (postMessage, IPC, EventEmitters).

---

## 📄 [`cfg`](file:///packages/deepsift-core/src/cli/commands/cfg.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/cfg.ts`  
- **Description:** Control Flow Graph (CFG) Generator Command.

### Exported Symbols

#### `interface CFGNode`
Extracts function boundaries, decision branches, switch statements, and try/catch blocks

#### `interface CFGEdge`
Edge connection between nodes in a Control Flow Graph.

#### `function cfgCommand`
Executes the `deepsift cfg` command to analyze a function's control flow and print a Mermaid branch diagram.

---

## 📄 [`check-layers`](file:///packages/deepsift-core/src/cli/commands/check-layers.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/check-layers.ts`  
- **Description:** Clean Architecture layer boundary checker detecting import rule violations.

---

## 📄 [`clones`](file:///packages/deepsift-core/src/cli/commands/clones.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/clones.ts`  
- **Description:** AST Code Clone Detector & DRY Compliance Command.

### Exported Symbols

#### `function clonesCommand`
Scans files for structural code duplicates, copy-paste clusters, and block-level redundancies.

---

## 📄 [`com`](file:///packages/deepsift-core/src/cli/commands/com.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/com.ts`  
- **Description:** Community cluster explorer and god node viewer for Graphify topology.

---

## 📄 [`compare-cmd`](file:///packages/deepsift-core/src/cli/commands/compare-cmd.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/compare-cmd.ts`  
- **Description:** Vector knowledge comparison command between two realms.

---

## 📄 [`complexity`](file:///packages/deepsift-core/src/cli/commands/complexity.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/complexity.ts`  
- **Description:** Cyclomatic & Cognitive Complexity heatmap CLI command handler.

---

## 📄 [`config`](file:///packages/deepsift-core/src/cli/commands/config.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/config.ts`  
- **Description:** CLI configuration management and project settings command.

---

## 📄 [`context`](file:///packages/deepsift-core/src/cli/commands/context.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/context.ts`  
- **Description:** Pre-creation checklist generator for design tokens, rules, and naming standards.

---

## 📄 [`dead-code`](file:///packages/deepsift-core/src/cli/commands/dead-code.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/dead-code.ts`  
- **Description:** Dead Code Elimination & Unreferenced Export Audit Command.

### Exported Symbols

#### `function deadCodeCommand`
Scans exported symbols, classes, functions, and interfaces to identify unused or dead code.

---

## 📄 [`decode`](file:///packages/deepsift-core/src/cli/commands/decode.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/decode.ts`  
- **Description:** DEC_v2 visual token decoder and decompressor command.

---

## 📄 [`deps`](file:///packages/deepsift-core/src/cli/commands/deps.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/deps.ts`  
- **Description:** Inbound and outbound module dependency tracer command.

### Exported Symbols

#### `function depsCommand`
Traces file dependents and outputs them as a tree.

---

## 📄 [`diag`](file:///packages/deepsift-core/src/cli/commands/diag.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/diag.ts`  
- **Description:** System diagnostics reporter with environment and configuration checks.

---

## 📄 [`dna`](file:///packages/deepsift-core/src/cli/commands/dna.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/dna.ts`  
- **Description:** Project DNA topology generator and community cluster visualizer command.

---

## 📄 [`docgen-helpers`](file:///packages/deepsift-core/src/cli/commands/docgen-helpers.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/docgen-helpers.ts`  
- **Description:** Command Metadata Registry and Markdown Generators for DeepSift DocGen Engine.

### Exported Symbols

#### `function getFullCliCommandRegistry`
Returns complete, exhaustive metadata for all DeepSift CLI commands.

#### `function buildFullCommandsMarkdown`
Renders full, exhaustive Markdown for docs/COMMANDS.md.

#### `function buildFullApiReferenceMarkdown`
Renders full, exhaustive Markdown for docs/API_REFERENCE.md.

---

## 📄 [`docgen`](file:///packages/deepsift-core/src/cli/commands/docgen.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/docgen.ts`  
- **Description:** DeepSift Automated Documentation Generator Engine.

### Exported Symbols

#### `interface CliCommandMetadata`
Parses source code metadata, CLI commands, TSDoc comments, and architecture topology

#### `interface TSDocModuleMetadata`
Interface representing extracted TSDoc module documentation.

#### `function docgenCommand`
Executes the `deepsift docgen` command to parse the codebase and regenerate all documentation artifacts.

#### `function extractCliCommands`
Extracts comprehensive CLI command definitions and usage metadata.

#### `function scanTsDocModules`
Scans TypeScript source files and extracts TSDoc metadata.

---

## 📄 [`doctor`](file:///packages/deepsift-core/src/cli/commands/doctor.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/doctor.ts`  
- **Description:** Health Diagnostics & Self-Healing Doctor Command.

### Exported Symbols

#### `function doctorCommand`
Runs system health checks, database index diagnostics, configuration checks,

---

## 📄 [`edit`](file:///packages/deepsift-core/src/cli/commands/edit.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/edit.ts`  
- **Description:** In-place source code file editing command using patch specifications.

---

## 📄 [`executive-summary`](file:///packages/deepsift-core/src/cli/commands/executive-summary.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/executive-summary.ts`  
- **Description:** Executive summary generator for code quality and architecture health reports.

---

## 📄 [`expand-type`](file:///packages/deepsift-core/src/cli/commands/expand-type.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/expand-type.ts`  
- **Description:** TypeScript type expansion and resolution command.

---

## 📄 [`feature`](file:///packages/deepsift-core/src/cli/commands/feature.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/feature.ts`  
- **Description:** AST Feature Outline Generator Command.

### Exported Symbols

#### `function featureCommand`
Extracts function signatures, exported classes, dependencies, and file purpose summaries for targeted directories.

---

## 📄 [`gen-adr`](file:///packages/deepsift-core/src/cli/commands/gen-adr.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/gen-adr.ts`  
- **Description:** Architecture Decision Record (ADR) template generator command.

---

## 📄 [`gen-test`](file:///packages/deepsift-core/src/cli/commands/gen-test.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/gen-test.ts`  
- **Description:** Automatic unit test and mock file generator command.

---

## 📄 [`heal`](file:///packages/deepsift-core/src/cli/commands/heal.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/heal.ts`  
- **Description:** DNA-based auto-refactoring and lint healing command handler.

---

## 📄 [`history`](file:///packages/deepsift-core/src/cli/commands/history.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/history.ts`  
- **Description:** Search and read result history log viewer command.

---

## 📄 [`impact`](file:///packages/deepsift-core/src/cli/commands/impact.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/impact.ts`  
- **Description:** Breaking change risk calculator and caller site tracer command.

---

## 📄 [`index-cmd`](file:///packages/deepsift-core/src/cli/commands/index-cmd.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/index-cmd.ts`  
- **Description:** Manual codebase indexer and incremental sync trigger command.

---

## 📄 [`init`](file:///packages/deepsift-core/src/cli/commands/init.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/init.ts`  
- **Description:** Workspace initialization and first-run indexing bootstrap command.

---

## 📄 [`learn`](file:///packages/deepsift-core/src/cli/commands/learn.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/learn.ts`  
- **Description:** Adaptive learning command for project pattern and token discovery.

---

## 📄 [`memo-prompt`](file:///packages/deepsift-core/src/cli/commands/memo-prompt.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/memo-prompt.ts`  
- **Description:** Interactive and auto-save Research Memory (DRM) prompt facilitator.

---

## 📄 [`memo`](file:///packages/deepsift-core/src/cli/commands/memo.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/memo.ts`  
- **Description:** Dynamic Research Memory (DRM) Command Line Interface.

### Exported Symbols

#### `function memoCommand`
Manages active research tags, research note additions, semantic queries, graph generation,

---

## 📄 [`overview`](file:///packages/deepsift-core/src/cli/commands/overview.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/overview.ts`  
- **Description:** Single-Step Project Blueprint Overview Super-Command.

### Exported Symbols

#### `function overviewCommand`
Consolidates directory trees, Central God Nodes, feature summaries, and AST outlines into a single output.

---

## 📄 [`pipe`](file:///packages/deepsift-core/src/cli/commands/pipe.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/pipe.ts`  
- **Description:** Stdin pipe reader for chaining DeepSift commands with shell pipelines.

---

## 📄 [`plan-ui`](file:///packages/deepsift-core/src/cli/commands/plan-ui.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/plan-ui.ts`  
- **Description:** Visual UI specification and design token palette generator command.

---

## 📄 [`plan`](file:///packages/deepsift-core/src/cli/commands/plan.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/plan.ts`  
- **Description:** AI Agent implementation plan generator based on DNA, skills, and architecture.

---

## 📄 [`read-feature`](file:///packages/deepsift-core/src/cli/commands/read-feature.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/read-feature.ts`  
- **Description:** Combined file reader and AST feature outline extractor command.

### Exported Symbols

#### `function readFeatureCommand`
Reads all relevant code files within a feature directory.

---

## 📄 [`read`](file:///packages/deepsift-core/src/cli/commands/read.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/read.ts`  
- **Description:** File Reader Command with Token Compression & Line Range Support.

### Exported Symbols

#### `function readCommand`
Reads source file contents, extracts line ranges (e.g. file.ts:10-50), and formats

---

## 📄 [`realm-cmd`](file:///packages/deepsift-core/src/cli/commands/realm-cmd.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/realm-cmd.ts`  
- **Description:** External knowledge realm management command (list, add, mount, snapshot).

---

## 📄 [`refactor`](file:///packages/deepsift-core/src/cli/commands/refactor.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/refactor.ts`  
- **Description:** AST-safe symbol renaming and function extraction refactoring command.

---

## 📄 [`resolve-error`](file:///packages/deepsift-core/src/cli/commands/resolve-error.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/resolve-error.ts`  
- **Description:** Automatic TypeScript error resolution and suggestion generator command.

---

## 📄 [`resolve`](file:///packages/deepsift-core/src/cli/commands/resolve.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/resolve.ts`  
- **Description:** Import and symbol path resolver across workspace files.

---

## 📄 [`scan`](file:///packages/deepsift-core/src/cli/commands/scan.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/scan.ts`  
- **Description:** Full workspace scan and batch index repair command.

---

## 📄 [`schema-drift`](file:///packages/deepsift-core/src/cli/commands/schema-drift.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/schema-drift.ts`  
- **Description:** Schema drift detection between client UI and backend definitions.

---

## 📄 [`scope`](file:///packages/deepsift-core/src/cli/commands/scope.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/scope.ts`  
- **Description:** Workspace scope and search boundary configuration command.

---

## 📄 [`search`](file:///packages/deepsift-core/src/cli/commands/search.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/search.ts`  
- **Description:** Hybrid Semantic & BM25 Search Command Engine.

### Exported Symbols

#### `interface SearchOptions`
Executes vector semantic search, BM25 lexical retrieval, Graphify PageRank boosting,

#### `function searchCommand`
Executes the `deepsift search` command across single or multiple queries.

---

## 📄 [`security-scan`](file:///packages/deepsift-core/src/cli/commands/security-scan.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/security-scan.ts`  
- **Description:** CWE vulnerability scanner for sandbox leaks, secrets, and XSS risks.

---

## 📄 [`sed`](file:///packages/deepsift-core/src/cli/commands/sed.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/sed.ts`  
- **Description:** Stream editor command for in-place line-range file content substitution.

---

## 📄 [`start`](file:///packages/deepsift-core/src/cli/commands/start.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/start.ts`  
- **Description:** DeepSift server and MCP service startup command.

---

## 📄 [`status`](file:///packages/deepsift-core/src/cli/commands/status.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/status.ts`  
- **Description:** Index Statistics & System Status Command.

### Exported Symbols

#### `function statusCommand`
Retrieves database state, total indexed files, chunk counts, and indexing timestamps.

---

## 📄 [`testmap`](file:///packages/deepsift-core/src/cli/commands/testmap.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/testmap.ts`  
- **Description:** Source-to-Test Coverage Mapping Command.

### Exported Symbols

#### `function testmapCommand`
Maps source files to corresponding unit/integration test files and identifies untested modules.

---

## 📄 [`watch`](file:///packages/deepsift-core/src/cli/commands/watch.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/watch.ts`  
- **Description:** File system watcher for incremental auto-indexing on source changes.

### Exported Symbols

#### `function watchCommand`
Starts a directory watcher that automatically and incrementally keeps the DeepSift

---

## 📄 [`wire-trace`](file:///packages/deepsift-core/src/cli/commands/wire-trace.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/wire-trace.ts`  
- **Description:** Cross-Environment IPC & Event Wire Tracer Command.

### Exported Symbols

#### `function wireTraceCommand`
Maps postMessage, EventEmitters, WebSocket, and IPC message channels between environments.

---

## 📄 [`zoom`](file:///packages/deepsift-core/src/cli/commands/zoom.ts)

- **Path:** `packages/deepsift-core/src/cli/commands/zoom.ts`  
- **Description:** Deep inspection command for a specific file, class, or symbol scope.

---

## 📄 [`context-injector`](file:///packages/deepsift-core/src/core/context-injector.ts)

- **Path:** `packages/deepsift-core/src/core/context-injector.ts`  
- **Description:** Context injection engine that auto-prepends architectural rules before search results.

---

## 📄 [`embedder-worker`](file:///packages/deepsift-core/src/core/embedder-worker.ts)

- **Path:** `packages/deepsift-core/src/core/embedder-worker.ts`  
- **Description:** Worker thread for parallel vector embedding computation.

---

## 📄 [`embedder`](file:///packages/deepsift-core/src/core/embedder.ts)

- **Path:** `packages/deepsift-core/src/core/embedder.ts`  
- **Description:** Neural text embedding engine using local ONNX transformer models.

### Exported Symbols

#### `function getEmbedding`
const __filename = fileURLToPath(import.meta.url);

#### `function getEmbeddings`
Generates embeddings for an array of texts asynchronously and in parallel.

#### `function terminateWorkers`
Terminate all running worker threads.

---

## 📄 [`indexer`](file:///packages/deepsift-core/src/core/indexer.ts)

- **Path:** `packages/deepsift-core/src/core/indexer.ts`  
- **Description:** Codebase Incremental Indexer & AST Vector Embedder Engine.

### Exported Symbols

#### `class Indexer`
Scans workspace files, generates AST chunks, computes vector embeddings,

---

## 📄 [`realm-router`](file:///packages/deepsift-core/src/core/realm-router.ts)

- **Path:** `packages/deepsift-core/src/core/realm-router.ts`  
- **Description:** Multi-realm search router coordinating queries across mounted knowledge bases.

---

## 📄 [`searcher`](file:///packages/deepsift-core/src/core/searcher.ts)

- **Path:** `packages/deepsift-core/src/core/searcher.ts`  
- **Description:** Hybrid vector cosine + BM25 lexical result combiner and relevance scorer.

---

## 📄 [`unified-walker`](file:///packages/deepsift-core/src/core/unified-walker.ts)

- **Path:** `packages/deepsift-core/src/core/unified-walker.ts`  
- **Description:** Parallel file system walker with intelligent noise filtering and .gitignore awareness.

---

## 📄 [`graph-builder`](file:///packages/deepsift-core/src/graphify/graph-builder.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-builder.ts`  
- **Description:** Graphify Topology & Graph Construction Engine.

### Exported Symbols

#### `class GraphBuilder`
Resolves symbol labels, cross-file imports, and node edges to construct code dependency graphs.

---

## 📄 [`graph-cluster`](file:///packages/deepsift-core/src/graphify/graph-cluster.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-cluster.ts`  
- **Description:** Louvain community detection and PageRank scoring for code dependency graphs.

---

## 📄 [`graph-enhancer`](file:///packages/deepsift-core/src/graphify/graph-enhancer.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-enhancer.ts`  
- **Description:** Graph topology enhancer adding metadata and inferring missing cross-file edges.

---

## 📄 [`graph-extractor`](file:///packages/deepsift-core/src/graphify/graph-extractor.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-extractor.ts`  
- **Description:** AST import/export symbol extractor for code dependency graph construction.

---

## 📄 [`graph-query-engine`](file:///packages/deepsift-core/src/graphify/graph-query-engine.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-query-engine.ts`  
- **Description:** Graph query engine for traversal, neighbor lookup, and shortest path finding.

---

## 📄 [`graph-report`](file:///packages/deepsift-core/src/graphify/graph-report.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-report.ts`  
- **Description:** Markdown graph report generator for community clusters and god node summaries.

---

## 📄 [`graph-types`](file:///packages/deepsift-core/src/graphify/graph-types.ts)

- **Path:** `packages/deepsift-core/src/graphify/graph-types.ts`  
- **Description:** Shared TypeScript type definitions for Graphify node, edge, and cluster data structures.

### Exported Symbols

#### `interface GraphifyNode`
Exported symbol.

---

## 📄 [`learning-overlay`](file:///packages/deepsift-core/src/graphify/learning-overlay.ts)

- **Path:** `packages/deepsift-core/src/graphify/learning-overlay.ts`  
- **Description:** Adaptive learning overlay enriching graph nodes with discovered project pattern metadata.

---

## 📄 [`heal-engine`](file:///packages/deepsift-core/src/intelligence/heal-engine.ts)

- **Path:** `packages/deepsift-core/src/intelligence/heal-engine.ts`  
- **Description:** Self-healing refactoring engine applying DNA-aware patches to resolve lint and type errors.

---

## 📄 [`internal-graph`](file:///packages/deepsift-core/src/intelligence/internal-graph.ts)

- **Path:** `packages/deepsift-core/src/intelligence/internal-graph.ts`  
- **Description:** Internal in-memory symbol graph for fast cross-file type and reference resolution.

---

## 📄 [`plan-engine`](file:///packages/deepsift-core/src/intelligence/plan-engine.ts)

- **Path:** `packages/deepsift-core/src/intelligence/plan-engine.ts`  
- **Description:** AI Agent implementation plan generator integrating DNA, skills, and knowledge realms.

---

## 📄 [`project-dna`](file:///packages/deepsift-core/src/intelligence/project-dna.ts)

- **Path:** `packages/deepsift-core/src/intelligence/project-dna.ts`  
- **Description:** Project DNA topology persistence, loading, and community cluster management.

---

## 📄 [`temporal-analyzer`](file:///packages/deepsift-core/src/intelligence/temporal-analyzer.ts)

- **Path:** `packages/deepsift-core/src/intelligence/temporal-analyzer.ts`  
- **Description:** Temporal file change history analyzer for churn risk and velocity metrics.

### Exported Symbols

#### `function integrateTemporalMiner`
Executes a git command safely and returns its stdout.

---

## 📄 [`insight-graph`](file:///packages/deepsift-core/src/memo/insight-graph.ts)

- **Path:** `packages/deepsift-core/src/memo/insight-graph.ts`  
- **Description:** Research insight knowledge graph builder linking memo entries by semantic similarity.

---

## 📄 [`manifest-manager`](file:///packages/deepsift-core/src/memo/manifest-manager.ts)

- **Path:** `packages/deepsift-core/src/memo/manifest-manager.ts`  
- **Description:** DRM tag manifest persistence and metadata serialization manager.

---

## 📄 [`memo-engine`](file:///packages/deepsift-core/src/memo/memo-engine.ts)

- **Path:** `packages/deepsift-core/src/memo/memo-engine.ts`  
- **Description:** Dynamic Research Memory (DRM) Engine Core facade.

### Exported Symbols

#### `class MemoEngine`
Coordinates research tag tracking, entry insertion, semantic querying,

---

## 📄 [`memo-searcher`](file:///packages/deepsift-core/src/memo/memo-searcher.ts)

- **Path:** `packages/deepsift-core/src/memo/memo-searcher.ts`  
- **Description:** Semantic search engine for querying entries within DRM research tags.

---

## 📄 [`note-processor`](file:///packages/deepsift-core/src/memo/note-processor.ts)

- **Path:** `packages/deepsift-core/src/memo/note-processor.ts`  
- **Description:** Research note preprocessor for content normalization and type classification.

---

## 📄 [`heuristic-parser`](file:///packages/deepsift-core/src/parsers/heuristic-parser.ts)

- **Path:** `packages/deepsift-core/src/parsers/heuristic-parser.ts`  
- **Description:** Heuristic regex-based code chunker for languages without tree-sitter grammars.

---

## 📄 [`simple-parser`](file:///packages/deepsift-core/src/parsers/simple-parser.ts)

- **Path:** `packages/deepsift-core/src/parsers/simple-parser.ts`  
- **Description:** Simple line-based code chunker for plain text and markdown documents.

### Exported Symbols

#### `function parseSimple`
Fallback parser that splits text into simple chunks based on lines.

---

## 📄 [`skill-parser`](file:///packages/deepsift-core/src/parsers/skill-parser.ts)

- **Path:** `packages/deepsift-core/src/parsers/skill-parser.ts`  
- **Description:** SKILL.md and markdown knowledge document parser for agent knowledge realms.

---

## 📄 [`tree-sitter-parser`](file:///packages/deepsift-core/src/parsers/tree-sitter-parser.ts)

- **Path:** `packages/deepsift-core/src/parsers/tree-sitter-parser.ts`  
- **Description:** Tree-sitter AST-based multi-language code chunk extractor for semantic indexing.

### Exported Symbols

#### `function parseAST`
const parsers = new Map<string, Parser>();

---

## 📄 [`generate-docs`](file:///packages/deepsift-core/src/scripts/generate-docs.ts)

- **Path:** `packages/deepsift-core/src/scripts/generate-docs.ts`  
- **Description:** Build script for auto-generating DeepSift documentation artifacts during compile / build lifecycle.

---

## 📄 [`server`](file:///packages/deepsift-core/src/server.ts)

- **Path:** `packages/deepsift-core/src/server.ts`  
- **Description:** DeepSift MCP server entry point implementing Model Context Protocol tool handlers.

---

## 📄 [`native-store`](file:///packages/deepsift-core/src/storage/native-store.ts)

- **Path:** `packages/deepsift-core/src/storage/native-store.ts`  
- **Description:** SQLite native store for vector chunks, graph topology, and metadata persistence.

---

## 📄 [`zig-bridge`](file:///packages/deepsift-core/src/storage/zig-bridge.ts)

- **Path:** `packages/deepsift-core/src/storage/zig-bridge.ts`  
- **Description:** Native Zig SIMD math bridge for accelerated vector cosine similarity computation.

---

## 📄 [`dna-types`](file:///packages/deepsift-core/src/types/dna-types.ts)

- **Path:** `packages/deepsift-core/src/types/dna-types.ts`  
- **Description:** Shared TypeScript type definitions for Project DNA, naming conventions, and architecture patterns.

### Exported Symbols

#### `type PropertyType`
Exported symbol.

---

## 📄 [`index`](file:///packages/deepsift-core/src/types/index.ts)

- **Path:** `packages/deepsift-core/src/types/index.ts`  
- **Description:** Central type barrel export index for all DeepSift public type definitions.

---

## 📄 [`memo-types`](file:///packages/deepsift-core/src/types/memo-types.ts)

- **Path:** `packages/deepsift-core/src/types/memo-types.ts`  
- **Description:** Shared TypeScript type definitions for DRM tags, entries, and manifest structures.

### Exported Symbols

#### `type MemoTagStatus`
Exported symbol.

---

## 📄 [`web-dashboard`](file:///packages/deepsift-core/src/ui/web-dashboard.ts)

- **Path:** `packages/deepsift-core/src/ui/web-dashboard.ts`  
- **Description:** Local Express web server providing interactive graph and DRM visualization dashboard on port 3333.

---

## 📄 [`architecture`](file:///packages/deepsift-core/src/utils/architecture.ts)

- **Path:** `packages/deepsift-core/src/utils/architecture.ts`  
- **Description:** Directory tree architecture blueprint generator with Graphify community pruning.

---

## 📄 [`binary-check`](file:///packages/deepsift-core/src/utils/binary-check.ts)

- **Path:** `packages/deepsift-core/src/utils/binary-check.ts`  
- **Description:** Binary file detection utility to skip non-text files during indexing scans.

---

## 📄 [`config`](file:///packages/deepsift-core/src/utils/config.ts)

- **Path:** `packages/deepsift-core/src/utils/config.ts`  
- **Description:** DeepSift Configuration Management Module.

### Exported Symbols

#### `interface RealmDefinition`
Manages loading, merging, defaults, and saving of deepsift.config.json settings.

#### `interface DeepSiftConfig`
Root DeepSift Configuration Interface.

#### `const DEFAULT_CONFIG`
Default global configuration values for DeepSift.

#### `function loadConfig`
Loads project configuration from deepsift.config.json or returns default configuration.

#### `function saveConfig`
Saves updated DeepSift configuration to deepsift.config.json in the project root.

---

## 📄 [`file-walker`](file:///packages/deepsift-core/src/utils/file-walker.ts)

- **Path:** `packages/deepsift-core/src/utils/file-walker.ts`  
- **Description:** Recursive directory file walker with .gitignore and noise exclusion support.

### Exported Symbols

#### `function getFiles`
const DEFAULT_IGNORES = [

---

## 📄 [`history`](file:///packages/deepsift-core/src/utils/history.ts)

- **Path:** `packages/deepsift-core/src/utils/history.ts`  
- **Description:** Search and read result log persistence and paginated output image saver.

---

## 📄 [`native-renderer`](file:///packages/deepsift-core/src/utils/native-renderer.ts)

- **Path:** `packages/deepsift-core/src/utils/native-renderer.ts`  
- **Description:** Native PNG and image renderer for search result visualization pages.

---

## 📄 [`outline`](file:///packages/deepsift-core/src/utils/outline.ts)

- **Path:** `packages/deepsift-core/src/utils/outline.ts`  
- **Description:** AST feature outline extractor generating file purpose, class, function, and dependency summaries.

---

## 📄 [`similarity`](file:///packages/deepsift-core/src/utils/similarity.ts)

- **Path:** `packages/deepsift-core/src/utils/similarity.ts`  
- **Description:** Cosine similarity and vector distance computation utilities for search ranking.

### Exported Symbols

#### `function calculateCosineSimilarity`
Calculates cosine similarity between two 384-dim Float32Arrays.

#### `function applyRRF`
Calculates Reciprocal Rank Fusion (RRF) scores to combine semantic and keyword search results.

#### `function quantizeF32ToBQ`
Quantizes a 384-dimensional Float32Array into a 48-byte Buffer (Binary Quantization).

#### `function calculateHammingSimilarityBatch`
Calculates Hamming similarity for a batch of BQ candidate vectors using the compiled Zig binary

---

## 📄 [`token-compressor`](file:///packages/deepsift-core/src/utils/token-compressor.ts)

- **Path:** `packages/deepsift-core/src/utils/token-compressor.ts`  
- **Description:** DEC_v2 visual token compression engine for AI Agent context window optimization.

---

## 📄 [`toon-serializer`](file:///packages/deepsift-core/src/utils/toon-serializer.ts)

- **Path:** `packages/deepsift-core/src/utils/toon-serializer.ts`  
- **Description:** TOON-Patch JSON specification serializer and deserializer for structured code edits.

### Exported Symbols

#### `function jsonToToon`
Token-Oriented Object Notation (TOON) Serializer

---

