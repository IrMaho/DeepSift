# 📖 DeepSift Source Code API Reference

Automatically extracted API documentation generated from TSDoc comments across DeepSift modules.

## 📄 [`complexity-analyzer`](file:///src/analyzers/complexity-analyzer.ts)
**Path:** `src/analyzers/complexity-analyzer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`convention-miner`](file:///src/analyzers/convention-miner.ts)
**Path:** `src/analyzers/convention-miner.ts`  
**Description:** TypeScript source module.

---

## 📄 [`entropy-filter`](file:///src/analyzers/entropy-filter.ts)
**Path:** `src/analyzers/entropy-filter.ts`  
**Description:** TypeScript source module.

---

## 📄 [`git-churn-miner`](file:///src/analyzers/git-churn-miner.ts)
**Path:** `src/analyzers/git-churn-miner.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-analyzer`](file:///src/analyzers/graph-analyzer.ts)
**Path:** `src/analyzers/graph-analyzer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`impact-analyzer`](file:///src/analyzers/impact-analyzer.ts)
**Path:** `src/analyzers/impact-analyzer.ts`  
**Description:** Breaking Change Impact Analyzer Module.

### Exports

- **`interface ImpactReport`**: Traces symbol references across source files, calculates breaking risk scores, and compiles call-site impact reports before performing refactoring. / import fs from 'fs'; import path from 'path'; /** Report containing calculated impact metrics for a symbol modification.
- **`class ImpactAnalyzer`**: Analyzer that evaluates breaking change risk for code symbols across the codebase.

---

## 📄 [`l10n-detector`](file:///src/analyzers/l10n-detector.ts)
**Path:** `src/analyzers/l10n-detector.ts`  
**Description:** TypeScript source module.

---

## 📄 [`layer-watchdog`](file:///src/analyzers/layer-watchdog.ts)
**Path:** `src/analyzers/layer-watchdog.ts`  
**Description:** TypeScript source module.

---

## 📄 [`pattern-miner`](file:///src/analyzers/pattern-miner.ts)
**Path:** `src/analyzers/pattern-miner.ts`  
**Description:** TypeScript source module.

---

## 📄 [`property-miner`](file:///src/analyzers/property-miner.ts)
**Path:** `src/analyzers/property-miner.ts`  
**Description:** TypeScript source module.

---

## 📄 [`qa-generator`](file:///src/analyzers/qa-generator.ts)
**Path:** `src/analyzers/qa-generator.ts`  
**Description:** TypeScript source module.

---

## 📄 [`refactor-engine`](file:///src/analyzers/refactor-engine.ts)
**Path:** `src/analyzers/refactor-engine.ts`  
**Description:** TypeScript source module.

---

## 📄 [`refactor-guide`](file:///src/analyzers/refactor-guide.ts)
**Path:** `src/analyzers/refactor-guide.ts`  
**Description:** God Node Decomposition Roadmap Generator Engine.

### Exports

- **`interface RefactorStep`**: Analyzes large monolithic files and auto-generates step-by-step Clean Architecture (SoC) refactoring roadmaps. / import fs from 'fs'; import path from 'path'; /** Step detail in a refactoring guide roadmap.
- **`interface RefactorGuideReport`**: Complete decomposition roadmap report for a monolithic file.
- **`class RefactorGuideEngine`**: Engine that generates architectural decomposition blueprints for large God Nodes.

---

## 📄 [`registry-miner`](file:///src/analyzers/registry-miner.ts)
**Path:** `src/analyzers/registry-miner.ts`  
**Description:** TypeScript source module.

---

## 📄 [`resource-mapper`](file:///src/analyzers/resource-mapper.ts)
**Path:** `src/analyzers/resource-mapper.ts`  
**Description:** TypeScript source module.

---

## 📄 [`security-auditor`](file:///src/analyzers/security-auditor.ts)
**Path:** `src/analyzers/security-auditor.ts`  
**Description:** TypeScript source module.

---

## 📄 [`similarity-engine`](file:///src/analyzers/similarity-engine.ts)
**Path:** `src/analyzers/similarity-engine.ts`  
**Description:** TypeScript source module.

---

## 📄 [`test-analyzer`](file:///src/analyzers/test-analyzer.ts)
**Path:** `src/analyzers/test-analyzer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`type-resolver`](file:///src/analyzers/type-resolver.ts)
**Path:** `src/analyzers/type-resolver.ts`  
**Description:** TypeScript source module.

---

## 📄 [`value-classifier`](file:///src/analyzers/value-classifier.ts)
**Path:** `src/analyzers/value-classifier.ts`  
**Description:** TypeScript source module.

---

## 📄 [`wire-tracer`](file:///src/analyzers/wire-tracer.ts)
**Path:** `src/analyzers/wire-tracer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`benchmark`](file:///src/benchmark.ts)
**Path:** `src/benchmark.ts`  
**Description:** TypeScript source module.

---

## 📄 [`benchmark_web`](file:///src/benchmark_web.ts)
**Path:** `src/benchmark_web.ts`  
**Description:** TypeScript source module.

---

## 📄 [`cli-entry`](file:///src/cli/cli-entry.ts)
**Path:** `src/cli/cli-entry.ts`  
**Description:** TypeScript source module.

---

## 📄 [`cli-output`](file:///src/cli/cli-output.ts)
**Path:** `src/cli/cli-output.ts`  
**Description:** TypeScript source module.

---

## 📄 [`cli-paths`](file:///src/cli/cli-paths.ts)
**Path:** `src/cli/cli-paths.ts`  
**Description:** TypeScript source module.

---

## 📄 [`analyze`](file:///src/cli/commands/analyze.ts)
**Path:** `src/cli/commands/analyze.ts`  
**Description:** TypeScript source module.

### Exports

- **`function analyzeCommand`**: Super-command: Analyzes a specific path by combining Feature Outline and DNA Intelligence.

---

## 📄 [`arch`](file:///src/cli/commands/arch.ts)
**Path:** `src/cli/commands/arch.ts`  
**Description:** TypeScript source module.

### Exports

- **`function archCommand`**: Executes the project architecture mapping command. Outputs are token-compressed by default.

---

## 📄 [`auto-heal`](file:///src/cli/commands/auto-heal.ts)
**Path:** `src/cli/commands/auto-heal.ts`  
**Description:** TypeScript source module.

---

## 📄 [`calltree`](file:///src/cli/commands/calltree.ts)
**Path:** `src/cli/commands/calltree.ts`  
**Description:** TypeScript source module.

---

## 📄 [`cfg`](file:///src/cli/commands/cfg.ts)
**Path:** `src/cli/commands/cfg.ts`  
**Description:** TypeScript source module.

---

## 📄 [`check-layers`](file:///src/cli/commands/check-layers.ts)
**Path:** `src/cli/commands/check-layers.ts`  
**Description:** TypeScript source module.

---

## 📄 [`clones`](file:///src/cli/commands/clones.ts)
**Path:** `src/cli/commands/clones.ts`  
**Description:** TypeScript source module.

---

## 📄 [`com`](file:///src/cli/commands/com.ts)
**Path:** `src/cli/commands/com.ts`  
**Description:** TypeScript source module.

---

## 📄 [`compare-cmd`](file:///src/cli/commands/compare-cmd.ts)
**Path:** `src/cli/commands/compare-cmd.ts`  
**Description:** TypeScript source module.

---

## 📄 [`complexity`](file:///src/cli/commands/complexity.ts)
**Path:** `src/cli/commands/complexity.ts`  
**Description:** TypeScript source module.

---

## 📄 [`config`](file:///src/cli/commands/config.ts)
**Path:** `src/cli/commands/config.ts`  
**Description:** TypeScript source module.

---

## 📄 [`context`](file:///src/cli/commands/context.ts)
**Path:** `src/cli/commands/context.ts`  
**Description:** TypeScript source module.

---

## 📄 [`dead-code`](file:///src/cli/commands/dead-code.ts)
**Path:** `src/cli/commands/dead-code.ts`  
**Description:** TypeScript source module.

---

## 📄 [`decode`](file:///src/cli/commands/decode.ts)
**Path:** `src/cli/commands/decode.ts`  
**Description:** TypeScript source module.

---

## 📄 [`deps`](file:///src/cli/commands/deps.ts)
**Path:** `src/cli/commands/deps.ts`  
**Description:** TypeScript source module.

### Exports

- **`function depsCommand`**: Traces file dependents and outputs them as a tree. Outputs are token-compressed by default.

---

## 📄 [`diag`](file:///src/cli/commands/diag.ts)
**Path:** `src/cli/commands/diag.ts`  
**Description:** TypeScript source module.

---

## 📄 [`dna`](file:///src/cli/commands/dna.ts)
**Path:** `src/cli/commands/dna.ts`  
**Description:** TypeScript source module.

---

## 📄 [`docgen`](file:///src/cli/commands/docgen.ts)
**Path:** `src/cli/commands/docgen.ts`  
**Description:** DeepSift Automated Documentation Generator Engine.

### Exports

- **`interface CliCommandMetadata`**: Parses source code metadata, CLI commands, TSDoc comments, and architecture topology to generate and update full documentation suites for GitHub users and AI Agents. / import fs from 'fs'; import path from 'path'; import { printInfo, printSuccess, printError, OutputFormat } from '../cli-output.js'; import { normalizePath } from '../../utils/outline.js'; /** Interface representing metadata extracted from a CLI Command.
- **`interface TSDocModuleMetadata`**: Interface representing extracted TSDoc module documentation.
- **`function docgenCommand`**: Executes the `deepsift docgen` command to parse the codebase and regenerate all documentation artifacts. ```ts await docgenCommand(process.cwd(), 'markdown'); ```
- **`function extractCliCommands`**: Extracts comprehensive CLI command definitions and usage metadata.
- **`function scanTsDocModules`**: Scans TypeScript source files and extracts TSDoc metadata.

---

## 📄 [`doctor`](file:///src/cli/commands/doctor.ts)
**Path:** `src/cli/commands/doctor.ts`  
**Description:** TypeScript source module.

---

## 📄 [`edit`](file:///src/cli/commands/edit.ts)
**Path:** `src/cli/commands/edit.ts`  
**Description:** TypeScript source module.

---

## 📄 [`executive-summary`](file:///src/cli/commands/executive-summary.ts)
**Path:** `src/cli/commands/executive-summary.ts`  
**Description:** TypeScript source module.

---

## 📄 [`expand-type`](file:///src/cli/commands/expand-type.ts)
**Path:** `src/cli/commands/expand-type.ts`  
**Description:** TypeScript source module.

---

## 📄 [`feature`](file:///src/cli/commands/feature.ts)
**Path:** `src/cli/commands/feature.ts`  
**Description:** TypeScript source module.

### Exports

- **`function featureCommand`**: Generates outline stats and imports for a specific folder feature. Outputs are token-compressed by default.

---

## 📄 [`gen-adr`](file:///src/cli/commands/gen-adr.ts)
**Path:** `src/cli/commands/gen-adr.ts`  
**Description:** TypeScript source module.

---

## 📄 [`gen-test`](file:///src/cli/commands/gen-test.ts)
**Path:** `src/cli/commands/gen-test.ts`  
**Description:** TypeScript source module.

---

## 📄 [`heal`](file:///src/cli/commands/heal.ts)
**Path:** `src/cli/commands/heal.ts`  
**Description:** TypeScript source module.

---

## 📄 [`history`](file:///src/cli/commands/history.ts)
**Path:** `src/cli/commands/history.ts`  
**Description:** TypeScript source module.

---

## 📄 [`impact`](file:///src/cli/commands/impact.ts)
**Path:** `src/cli/commands/impact.ts`  
**Description:** TypeScript source module.

---

## 📄 [`index-cmd`](file:///src/cli/commands/index-cmd.ts)
**Path:** `src/cli/commands/index-cmd.ts`  
**Description:** TypeScript source module.

---

## 📄 [`init`](file:///src/cli/commands/init.ts)
**Path:** `src/cli/commands/init.ts`  
**Description:** TypeScript source module.

---

## 📄 [`learn`](file:///src/cli/commands/learn.ts)
**Path:** `src/cli/commands/learn.ts`  
**Description:** TypeScript source module.

---

## 📄 [`memo-prompt`](file:///src/cli/commands/memo-prompt.ts)
**Path:** `src/cli/commands/memo-prompt.ts`  
**Description:** TypeScript source module.

---

## 📄 [`memo`](file:///src/cli/commands/memo.ts)
**Path:** `src/cli/commands/memo.ts`  
**Description:** TypeScript source module.

---

## 📄 [`overview`](file:///src/cli/commands/overview.ts)
**Path:** `src/cli/commands/overview.ts`  
**Description:** TypeScript source module.

### Exports

- **`function overviewCommand`**: Super Command: deepsift overview [path] Consolidates Architecture Tree + Feature Summary + Core Files/God Nodes into a single, high-efficiency output.

---

## 📄 [`pipe`](file:///src/cli/commands/pipe.ts)
**Path:** `src/cli/commands/pipe.ts`  
**Description:** TypeScript source module.

---

## 📄 [`plan-ui`](file:///src/cli/commands/plan-ui.ts)
**Path:** `src/cli/commands/plan-ui.ts`  
**Description:** TypeScript source module.

---

## 📄 [`plan`](file:///src/cli/commands/plan.ts)
**Path:** `src/cli/commands/plan.ts`  
**Description:** TypeScript source module.

---

## 📄 [`read-feature`](file:///src/cli/commands/read-feature.ts)
**Path:** `src/cli/commands/read-feature.ts`  
**Description:** TypeScript source module.

### Exports

- **`function readFeatureCommand`**: Reads all relevant code files within a feature directory. Combines them and optionally token-compresses the output.

---

## 📄 [`read`](file:///src/cli/commands/read.ts)
**Path:** `src/cli/commands/read.ts`  
**Description:** TypeScript source module.

---

## 📄 [`realm-cmd`](file:///src/cli/commands/realm-cmd.ts)
**Path:** `src/cli/commands/realm-cmd.ts`  
**Description:** TypeScript source module.

---

## 📄 [`refactor`](file:///src/cli/commands/refactor.ts)
**Path:** `src/cli/commands/refactor.ts`  
**Description:** TypeScript source module.

---

## 📄 [`resolve-error`](file:///src/cli/commands/resolve-error.ts)
**Path:** `src/cli/commands/resolve-error.ts`  
**Description:** TypeScript source module.

---

## 📄 [`resolve`](file:///src/cli/commands/resolve.ts)
**Path:** `src/cli/commands/resolve.ts`  
**Description:** TypeScript source module.

---

## 📄 [`scan`](file:///src/cli/commands/scan.ts)
**Path:** `src/cli/commands/scan.ts`  
**Description:** TypeScript source module.

---

## 📄 [`schema-drift`](file:///src/cli/commands/schema-drift.ts)
**Path:** `src/cli/commands/schema-drift.ts`  
**Description:** TypeScript source module.

---

## 📄 [`scope`](file:///src/cli/commands/scope.ts)
**Path:** `src/cli/commands/scope.ts`  
**Description:** TypeScript source module.

---

## 📄 [`search`](file:///src/cli/commands/search.ts)
**Path:** `src/cli/commands/search.ts`  
**Description:** TypeScript source module.

---

## 📄 [`security-scan`](file:///src/cli/commands/security-scan.ts)
**Path:** `src/cli/commands/security-scan.ts`  
**Description:** TypeScript source module.

---

## 📄 [`sed`](file:///src/cli/commands/sed.ts)
**Path:** `src/cli/commands/sed.ts`  
**Description:** TypeScript source module.

---

## 📄 [`start`](file:///src/cli/commands/start.ts)
**Path:** `src/cli/commands/start.ts`  
**Description:** TypeScript source module.

---

## 📄 [`status`](file:///src/cli/commands/status.ts)
**Path:** `src/cli/commands/status.ts`  
**Description:** TypeScript source module.

---

## 📄 [`testmap`](file:///src/cli/commands/testmap.ts)
**Path:** `src/cli/commands/testmap.ts`  
**Description:** TypeScript source module.

---

## 📄 [`watch`](file:///src/cli/commands/watch.ts)
**Path:** `src/cli/commands/watch.ts`  
**Description:** TypeScript source module.

### Exports

- **`function watchCommand`**: Starts a directory watcher that automatically and incrementally keeps the DeepSift semantic index updated in real-time as the developer saves files.

---

## 📄 [`wire-trace`](file:///src/cli/commands/wire-trace.ts)
**Path:** `src/cli/commands/wire-trace.ts`  
**Description:** TypeScript source module.

---

## 📄 [`zoom`](file:///src/cli/commands/zoom.ts)
**Path:** `src/cli/commands/zoom.ts`  
**Description:** TypeScript source module.

---

## 📄 [`context-injector`](file:///src/core/context-injector.ts)
**Path:** `src/core/context-injector.ts`  
**Description:** TypeScript source module.

---

## 📄 [`embedder-worker`](file:///src/core/embedder-worker.ts)
**Path:** `src/core/embedder-worker.ts`  
**Description:** TypeScript source module.

---

## 📄 [`embedder`](file:///src/core/embedder.ts)
**Path:** `src/core/embedder.ts`  
**Description:** TypeScript source module.

### Exports

- **`function getEmbedding`**: Generates an embedding for a given text asynchronously using worker threads.
- **`function getEmbeddings`**: Generates embeddings for an array of texts asynchronously and in parallel.
- **`function terminateWorkers`**: Terminate all running worker threads.

---

## 📄 [`indexer`](file:///src/core/indexer.ts)
**Path:** `src/core/indexer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`realm-router`](file:///src/core/realm-router.ts)
**Path:** `src/core/realm-router.ts`  
**Description:** TypeScript source module.

---

## 📄 [`searcher`](file:///src/core/searcher.ts)
**Path:** `src/core/searcher.ts`  
**Description:** TypeScript source module.

---

## 📄 [`unified-walker`](file:///src/core/unified-walker.ts)
**Path:** `src/core/unified-walker.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-builder`](file:///src/graphify/graph-builder.ts)
**Path:** `src/graphify/graph-builder.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-cluster`](file:///src/graphify/graph-cluster.ts)
**Path:** `src/graphify/graph-cluster.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-enhancer`](file:///src/graphify/graph-enhancer.ts)
**Path:** `src/graphify/graph-enhancer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-extractor`](file:///src/graphify/graph-extractor.ts)
**Path:** `src/graphify/graph-extractor.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-query-engine`](file:///src/graphify/graph-query-engine.ts)
**Path:** `src/graphify/graph-query-engine.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-report`](file:///src/graphify/graph-report.ts)
**Path:** `src/graphify/graph-report.ts`  
**Description:** TypeScript source module.

---

## 📄 [`graph-types`](file:///src/graphify/graph-types.ts)
**Path:** `src/graphify/graph-types.ts`  
**Description:** TypeScript source module.

---

## 📄 [`learning-overlay`](file:///src/graphify/learning-overlay.ts)
**Path:** `src/graphify/learning-overlay.ts`  
**Description:** TypeScript source module.

---

## 📄 [`heal-engine`](file:///src/intelligence/heal-engine.ts)
**Path:** `src/intelligence/heal-engine.ts`  
**Description:** TypeScript source module.

---

## 📄 [`internal-graph`](file:///src/intelligence/internal-graph.ts)
**Path:** `src/intelligence/internal-graph.ts`  
**Description:** TypeScript source module.

---

## 📄 [`plan-engine`](file:///src/intelligence/plan-engine.ts)
**Path:** `src/intelligence/plan-engine.ts`  
**Description:** TypeScript source module.

---

## 📄 [`project-dna`](file:///src/intelligence/project-dna.ts)
**Path:** `src/intelligence/project-dna.ts`  
**Description:** TypeScript source module.

---

## 📄 [`temporal-analyzer`](file:///src/intelligence/temporal-analyzer.ts)
**Path:** `src/intelligence/temporal-analyzer.ts`  
**Description:** TypeScript source module.

### Exports

- **`function integrateTemporalMiner`**: Executes a git command safely and returns its stdout. Returns null if the command fails (e.g. not a git repo). / function runGitCmd(cmd: string, cwd: string): string | null { try { const result = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }); return result.trim(); } catch { return null; } } /** Integrates temporal data (git history) into the project DNA.

---

## 📄 [`insight-graph`](file:///src/memo/insight-graph.ts)
**Path:** `src/memo/insight-graph.ts`  
**Description:** TypeScript source module.

---

## 📄 [`manifest-manager`](file:///src/memo/manifest-manager.ts)
**Path:** `src/memo/manifest-manager.ts`  
**Description:** TypeScript source module.

---

## 📄 [`memo-engine`](file:///src/memo/memo-engine.ts)
**Path:** `src/memo/memo-engine.ts`  
**Description:** Dynamic Research Memory (DRM) Engine Core facade.

### Exports

- **`class MemoEngine`**: Coordinates research tag tracking, entry insertion, semantic querying, insight graph construction, and Markdown export for AI Agents. / import { MemoManifestManager } from './manifest-manager.js'; import { NoteProcessor } from './note-processor.js'; import { MemoSearcher } from './memo-searcher.js'; import { InsightGraphBuilder } from './insight-graph.js'; import { MemoTag, MemoEntry, MemoEntryType, MemoQueryResult, MemoInsightGraph } from '../types/memo-types.js'; /** Facade class providing public API for Dynamic Research Memory operations.

---

## 📄 [`memo-searcher`](file:///src/memo/memo-searcher.ts)
**Path:** `src/memo/memo-searcher.ts`  
**Description:** TypeScript source module.

---

## 📄 [`note-processor`](file:///src/memo/note-processor.ts)
**Path:** `src/memo/note-processor.ts`  
**Description:** TypeScript source module.

---

## 📄 [`heuristic-parser`](file:///src/parsers/heuristic-parser.ts)
**Path:** `src/parsers/heuristic-parser.ts`  
**Description:** TypeScript source module.

---

## 📄 [`simple-parser`](file:///src/parsers/simple-parser.ts)
**Path:** `src/parsers/simple-parser.ts`  
**Description:** TypeScript source module.

### Exports

- **`function parseSimple`**: Fallback parser that splits text into simple chunks based on lines. Useful for languages without Tree-sitter grammar or plain text files.

---

## 📄 [`skill-parser`](file:///src/parsers/skill-parser.ts)
**Path:** `src/parsers/skill-parser.ts`  
**Description:** TypeScript source module.

---

## 📄 [`tree-sitter-parser`](file:///src/parsers/tree-sitter-parser.ts)
**Path:** `src/parsers/tree-sitter-parser.ts`  
**Description:** TypeScript source module.

### Exports

- **`function parseAST`**: Parses code using Tree-sitter and returns meaningful semantic chunks. Falls back to simple parsing if the language is unsupported.

---

## 📄 [`server`](file:///src/server.ts)
**Path:** `src/server.ts`  
**Description:** TypeScript source module.

---

## 📄 [`native-store`](file:///src/storage/native-store.ts)
**Path:** `src/storage/native-store.ts`  
**Description:** TypeScript source module.

---

## 📄 [`zig-bridge`](file:///src/storage/zig-bridge.ts)
**Path:** `src/storage/zig-bridge.ts`  
**Description:** TypeScript source module.

---

## 📄 [`dna-types`](file:///src/types/dna-types.ts)
**Path:** `src/types/dna-types.ts`  
**Description:** TypeScript source module.

---

## 📄 [`index`](file:///src/types/index.ts)
**Path:** `src/types/index.ts`  
**Description:** TypeScript source module.

---

## 📄 [`memo-types`](file:///src/types/memo-types.ts)
**Path:** `src/types/memo-types.ts`  
**Description:** TypeScript source module.

---

## 📄 [`web-dashboard`](file:///src/ui/web-dashboard.ts)
**Path:** `src/ui/web-dashboard.ts`  
**Description:** TypeScript source module.

---

## 📄 [`architecture`](file:///src/utils/architecture.ts)
**Path:** `src/utils/architecture.ts`  
**Description:** TypeScript source module.

---

## 📄 [`binary-check`](file:///src/utils/binary-check.ts)
**Path:** `src/utils/binary-check.ts`  
**Description:** TypeScript source module.

---

## 📄 [`config`](file:///src/utils/config.ts)
**Path:** `src/utils/config.ts`  
**Description:** DeepSift Configuration Management Module.

### Exports

- **`interface RealmDefinition`**: Manages loading, merging, defaults, and saving of deepsift.config.json settings. / import fs from 'fs'; import path from 'path'; /** Definition for a Knowledge Realm within DeepSift.
- **`interface DeepSiftConfig`**: Root DeepSift Configuration Interface.
- **`const DEFAULT_CONFIG`**: Default global configuration values for DeepSift.
- **`function loadConfig`**: Loads project configuration from deepsift.config.json or returns default configuration. ```ts const config = loadConfig(process.cwd()); ```
- **`function saveConfig`**: Saves updated DeepSift configuration to deepsift.config.json in the project root. ```ts saveConfig(process.cwd(), updatedConfig); ```

---

## 📄 [`file-walker`](file:///src/utils/file-walker.ts)
**Path:** `src/utils/file-walker.ts`  
**Description:** TypeScript source module.

### Exports

- **`function getFiles`**: ', '.mcp_search_outputs', '.zig-cache', 'zig-out', 'pxpipe-main', 'scratch', 'temp', 'bin', 'ide_nab', '**/*.min.js', '**/*.map', '**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.ico', '**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.otf', '**/*.otb', '**/*.eot', '**/*.pdf', '**/*.zip', '**/*.tar', '**/*.gz', '**/*.rar', '**/*.7z', '**/*.sqlite', '**/*.db', '**/*.log', '**/logs/**', '**/*.mp4', '**/*.avi', '**/*.mov', '**/*.lock', '**/package-lock.json', '**/pnpm-lock.yaml', '**/yarn.lock', '**/bun.lockb', '**/*.dll', '**/*.pdb', '**/*.exe', '**/*.so', '**/*.dylib', '**/*.lib', '**/*.exp', '**/*.obj', '**/*.o', '**/*.a', '**/*.bak', '**/*.wasm', '**/*.pb.go', '**/*.pb.cc', '**/*.pb.h', '**/*.csv', '**/*.tsv', '**/*.xlsx', '**/*.parquet' ]; /** Recursively walks a directory and returns a list of files that are not ignored. Evaluates .gitignore if present in the root directory.

---

## 📄 [`history`](file:///src/utils/history.ts)
**Path:** `src/utils/history.ts`  
**Description:** TypeScript source module.

---

## 📄 [`native-renderer`](file:///src/utils/native-renderer.ts)
**Path:** `src/utils/native-renderer.ts`  
**Description:** TypeScript source module.

---

## 📄 [`outline`](file:///src/utils/outline.ts)
**Path:** `src/utils/outline.ts`  
**Description:** TypeScript source module.

---

## 📄 [`similarity`](file:///src/utils/similarity.ts)
**Path:** `src/utils/similarity.ts`  
**Description:** TypeScript source module.

### Exports

- **`function calculateCosineSimilarity`**: Calculates cosine similarity between two 384-dim Float32Arrays. We use the optimized version provided by @ternlight/base.
- **`function applyRRF`**: Calculates Reciprocal Rank Fusion (RRF) scores to combine semantic and keyword search results. RRF(d) = Σ 1 / (k + rank_i(d))
- **`function quantizeF32ToBQ`**: Quantizes a 384-dimensional Float32Array into a 48-byte Buffer (Binary Quantization). Maps values > 0.0 to 1 and <= 0.0 to 0.
- **`function calculateHammingSimilarityBatch`**: Calculates Hamming similarity for a batch of BQ candidate vectors using the compiled Zig binary for native speed. Falls back to TypeScript if the binary is missing or errors out.

---

## 📄 [`token-compressor`](file:///src/utils/token-compressor.ts)
**Path:** `src/utils/token-compressor.ts`  
**Description:** TypeScript source module.

---

## 📄 [`toon-serializer`](file:///src/utils/toon-serializer.ts)
**Path:** `src/utils/toon-serializer.ts`  
**Description:** TypeScript source module.

### Exports

- **`function jsonToToon`**: Token-Oriented Object Notation (TOON) Serializer Lossless text-based serialization designed specifically to reduce LLM token count.

---

