/// <reference types="node" />
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

const FILE_HEADERS: Record<string, { description: string; module: string; category: string; since: string }> = {
    'analyzers/graph-analyzer.ts': { description: 'Graphify dependency graph topology analyzer for community detection and hub identification.', module: 'analyzers/graph-analyzer', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/l10n-detector.ts': { description: 'Internationalization (i18n) signal detector and hardcoded string auditor.', module: 'analyzers/l10n-detector', category: 'Security & Diagnostics', since: '1.0.3' },
    'analyzers/layer-watchdog.ts': { description: 'Clean Architecture layer boundary enforcer detecting cross-layer import violations.', module: 'analyzers/layer-watchdog', category: 'Security & Diagnostics', since: '1.0.3' },
    'analyzers/pattern-miner.ts': { description: 'Project pattern miner extracting recurring code structures and conventions.', module: 'analyzers/pattern-miner', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/property-miner.ts': { description: 'Design token and CSS/Dart property value extractor for design system discovery.', module: 'analyzers/property-miner', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/refactor-engine.ts': { description: 'AST-safe code refactoring engine for symbol renames and function extractions.', module: 'analyzers/refactor-engine', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'analyzers/registry-miner.ts': { description: 'Feature registry and UI tab miner for project capability and route discovery.', module: 'analyzers/registry-miner', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/resource-mapper.ts': { description: 'Static resource and asset mapper for image, font, and media file discovery.', module: 'analyzers/resource-mapper', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/similarity-engine.ts': { description: 'AST code clone and duplication detection engine using token hash fingerprinting.', module: 'analyzers/similarity-engine', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'analyzers/test-analyzer.ts': { description: 'Source-to-test file mapping analyzer identifying untested and partially covered modules.', module: 'analyzers/test-analyzer', category: 'Security & Diagnostics', since: '1.0.3' },
    'analyzers/type-resolver.ts': { description: 'TypeScript type resolution engine for expanding complex intersection and generic types.', module: 'analyzers/type-resolver', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/value-classifier.ts': { description: 'Code value and constant classifier categorizing numeric and string literal semantics.', module: 'analyzers/value-classifier', category: 'Architecture & Intelligence', since: '1.0.3' },
    'analyzers/wire-tracer.ts': { description: 'Cross-environment IPC and postMessage wire trace analyzer for event channel mapping.', module: 'analyzers/wire-tracer', category: 'Architecture & Intelligence', since: '1.0.3' },
    'benchmark.ts': { description: 'Performance benchmarking harness for indexing throughput and embedding speed measurement.', module: 'benchmark', category: 'Core Search & Discovery', since: '1.0.0' },
    'benchmark_web.ts': { description: 'Web-worker performance benchmarking harness for browser embedding throughput.', module: 'benchmark_web', category: 'Core Search & Discovery', since: '1.0.0' },
    'server.ts': { description: 'DeepSift MCP server entry point implementing Model Context Protocol tool handlers.', module: 'server', category: 'Utilities & Dashboard', since: '1.0.0' },
    'cli/cli-entry.ts': { description: 'Main CLI entry point and command routing dispatcher for all DeepSift commands.', module: 'cli/cli-entry', category: 'Utilities & Dashboard', since: '1.0.0' },
    'cli/cli-output.ts': { description: 'CLI output formatting utilities for color-coded results, info, success, and error messages.', module: 'cli/cli-output', category: 'Utilities & Dashboard', since: '1.0.0' },
    'cli/cli-paths.ts': { description: 'CLI path resolution utilities for workspace root and config directory discovery.', module: 'cli/cli-paths', category: 'Utilities & Dashboard', since: '1.0.0' },
    'cli/commands/analyze.ts': { description: 'Deep dive analysis super-command combining AST feature outline and DNA topology.', module: 'cli/commands/analyze', category: 'Architecture & Intelligence', since: '1.0.3' },
    'cli/commands/auto-heal.ts': { description: 'Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify).', module: 'cli/commands/auto-heal', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/check-layers.ts': { description: 'Clean Architecture layer boundary checker detecting import rule violations.', module: 'cli/commands/check-layers', category: 'Security & Diagnostics', since: '1.0.3' },
    'cli/commands/com.ts': { description: 'Community cluster explorer and god node viewer for Graphify topology.', module: 'cli/commands/com', category: 'Architecture & Intelligence', since: '1.0.3' },
    'cli/commands/compare-cmd.ts': { description: 'Vector knowledge comparison command between two realms.', module: 'cli/commands/compare-cmd', category: 'Memory & Realms', since: '1.0.3' },
    'cli/commands/complexity.ts': { description: 'Cyclomatic & Cognitive Complexity heatmap CLI command handler.', module: 'cli/commands/complexity', category: 'Security & Diagnostics', since: '1.0.2' },
    'cli/commands/config.ts': { description: 'CLI configuration management and project settings command.', module: 'cli/commands/config', category: 'Utilities & Dashboard', since: '1.0.0' },
    'cli/commands/context.ts': { description: 'Pre-creation checklist generator for design tokens, rules, and naming standards.', module: 'cli/commands/context', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/decode.ts': { description: 'DEC_v2 visual token decoder and decompressor command.', module: 'cli/commands/decode', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/deps.ts': { description: 'Inbound and outbound module dependency tracer command.', module: 'cli/commands/deps', category: 'Architecture & Intelligence', since: '1.0.2' },
    'cli/commands/diag.ts': { description: 'System diagnostics reporter with environment and configuration checks.', module: 'cli/commands/diag', category: 'Security & Diagnostics', since: '1.0.3' },
    'cli/commands/dna.ts': { description: 'Project DNA topology generator and community cluster visualizer command.', module: 'cli/commands/dna', category: 'Architecture & Intelligence', since: '1.0.3' },
    'cli/commands/edit.ts': { description: 'In-place source code file editing command using patch specifications.', module: 'cli/commands/edit', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/executive-summary.ts': { description: 'Executive summary generator for code quality and architecture health reports.', module: 'cli/commands/executive-summary', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/expand-type.ts': { description: 'TypeScript type expansion and resolution command.', module: 'cli/commands/expand-type', category: 'Architecture & Intelligence', since: '1.0.3' },
    'cli/commands/gen-adr.ts': { description: 'Architecture Decision Record (ADR) template generator command.', module: 'cli/commands/gen-adr', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/gen-test.ts': { description: 'Automatic unit test and mock file generator command.', module: 'cli/commands/gen-test', category: 'Security & Diagnostics', since: '1.0.3' },
    'cli/commands/heal.ts': { description: 'DNA-based auto-refactoring and lint healing command handler.', module: 'cli/commands/heal', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/history.ts': { description: 'Search and read result history log viewer command.', module: 'cli/commands/history', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/impact.ts': { description: 'Breaking change risk calculator and caller site tracer command.', module: 'cli/commands/impact', category: 'Refactoring & Self-Healing', since: '1.0.2' },
    'cli/commands/index-cmd.ts': { description: 'Manual codebase indexer and incremental sync trigger command.', module: 'cli/commands/index-cmd', category: 'Core Search & Discovery', since: '1.0.0' },
    'cli/commands/init.ts': { description: 'Workspace initialization and first-run indexing bootstrap command.', module: 'cli/commands/init', category: 'Core Search & Discovery', since: '1.0.0' },
    'cli/commands/learn.ts': { description: 'Adaptive learning command for project pattern and token discovery.', module: 'cli/commands/learn', category: 'Architecture & Intelligence', since: '1.0.3' },
    'cli/commands/memo-prompt.ts': { description: 'Interactive and auto-save Research Memory (DRM) prompt facilitator.', module: 'cli/commands/memo-prompt', category: 'Memory & Realms', since: '1.0.2' },
    'cli/commands/pipe.ts': { description: 'Stdin pipe reader for chaining DeepSift commands with shell pipelines.', module: 'cli/commands/pipe', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/plan.ts': { description: 'AI Agent implementation plan generator based on DNA, skills, and architecture.', module: 'cli/commands/plan', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/plan-ui.ts': { description: 'Visual UI specification and design token palette generator command.', module: 'cli/commands/plan-ui', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/read-feature.ts': { description: 'Combined file reader and AST feature outline extractor command.', module: 'cli/commands/read-feature', category: 'Core Search & Discovery', since: '1.0.3' },
    'cli/commands/realm-cmd.ts': { description: 'External knowledge realm management command (list, add, mount, snapshot).', module: 'cli/commands/realm-cmd', category: 'Memory & Realms', since: '1.0.3' },
    'cli/commands/refactor.ts': { description: 'AST-safe symbol renaming and function extraction refactoring command.', module: 'cli/commands/refactor', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/resolve.ts': { description: 'Import and symbol path resolver across workspace files.', module: 'cli/commands/resolve', category: 'Architecture & Intelligence', since: '1.0.3' },
    'cli/commands/resolve-error.ts': { description: 'Automatic TypeScript error resolution and suggestion generator command.', module: 'cli/commands/resolve-error', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/scan.ts': { description: 'Full workspace scan and batch index repair command.', module: 'cli/commands/scan', category: 'Core Search & Discovery', since: '1.0.0' },
    'cli/commands/schema-drift.ts': { description: 'Schema drift detection between client UI and backend definitions.', module: 'cli/commands/schema-drift', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/scope.ts': { description: 'Workspace scope and search boundary configuration command.', module: 'cli/commands/scope', category: 'Utilities & Dashboard', since: '1.0.3' },
    'cli/commands/security-scan.ts': { description: 'CWE vulnerability scanner for sandbox leaks, secrets, and XSS risks.', module: 'cli/commands/security-scan', category: 'Security & Diagnostics', since: '1.0.2' },
    'cli/commands/sed.ts': { description: 'Stream editor command for in-place line-range file content substitution.', module: 'cli/commands/sed', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'cli/commands/start.ts': { description: 'DeepSift server and MCP service startup command.', module: 'cli/commands/start', category: 'Utilities & Dashboard', since: '1.0.0' },
    'cli/commands/watch.ts': { description: 'File system watcher for incremental auto-indexing on source changes.', module: 'cli/commands/watch', category: 'Core Search & Discovery', since: '1.0.3' },
    'cli/commands/zoom.ts': { description: 'Deep inspection command for a specific file, class, or symbol scope.', module: 'cli/commands/zoom', category: 'Core Search & Discovery', since: '1.0.3' },
    'core/context-injector.ts': { description: 'Context injection engine that auto-prepends architectural rules before search results.', module: 'core/context-injector', category: 'Core Search & Discovery', since: '1.0.3' },
    'core/embedder.ts': { description: 'Neural text embedding engine using local ONNX transformer models.', module: 'core/embedder', category: 'Core Search & Discovery', since: '1.0.0' },
    'core/embedder-worker.ts': { description: 'Worker thread for parallel vector embedding computation.', module: 'core/embedder-worker', category: 'Core Search & Discovery', since: '1.0.2' },
    'core/realm-router.ts': { description: 'Multi-realm search router coordinating queries across mounted knowledge bases.', module: 'core/realm-router', category: 'Memory & Realms', since: '1.0.3' },
    'core/searcher.ts': { description: 'Hybrid vector cosine + BM25 lexical result combiner and relevance scorer.', module: 'core/searcher', category: 'Core Search & Discovery', since: '1.0.0' },
    'core/unified-walker.ts': { description: 'Parallel file system walker with intelligent noise filtering and .gitignore awareness.', module: 'core/unified-walker', category: 'Core Search & Discovery', since: '1.0.3' },
    'graphify/graph-cluster.ts': { description: 'Louvain community detection and PageRank scoring for code dependency graphs.', module: 'graphify/graph-cluster', category: 'Architecture & Intelligence', since: '1.0.3' },
    'graphify/graph-enhancer.ts': { description: 'Graph topology enhancer adding metadata and inferring missing cross-file edges.', module: 'graphify/graph-enhancer', category: 'Architecture & Intelligence', since: '1.0.3' },
    'graphify/graph-extractor.ts': { description: 'AST import/export symbol extractor for code dependency graph construction.', module: 'graphify/graph-extractor', category: 'Architecture & Intelligence', since: '1.0.3' },
    'graphify/graph-query-engine.ts': { description: 'Graph query engine for traversal, neighbor lookup, and shortest path finding.', module: 'graphify/graph-query-engine', category: 'Architecture & Intelligence', since: '1.0.3' },
    'graphify/graph-report.ts': { description: 'Markdown graph report generator for community clusters and god node summaries.', module: 'graphify/graph-report', category: 'Architecture & Intelligence', since: '1.0.3' },
    'graphify/graph-types.ts': { description: 'Shared TypeScript type definitions for Graphify node, edge, and cluster data structures.', module: 'graphify/graph-types', category: 'Architecture & Intelligence', since: '1.0.3' },
    'graphify/learning-overlay.ts': { description: 'Adaptive learning overlay enriching graph nodes with discovered project pattern metadata.', module: 'graphify/learning-overlay', category: 'Architecture & Intelligence', since: '1.0.3' },
    'intelligence/heal-engine.ts': { description: 'Self-healing refactoring engine applying DNA-aware patches to resolve lint and type errors.', module: 'intelligence/heal-engine', category: 'Refactoring & Self-Healing', since: '1.0.3' },
    'intelligence/internal-graph.ts': { description: 'Internal in-memory symbol graph for fast cross-file type and reference resolution.', module: 'intelligence/internal-graph', category: 'Architecture & Intelligence', since: '1.0.3' },
    'intelligence/plan-engine.ts': { description: 'AI Agent implementation plan generator integrating DNA, skills, and knowledge realms.', module: 'intelligence/plan-engine', category: 'Utilities & Dashboard', since: '1.0.3' },
    'intelligence/project-dna.ts': { description: 'Project DNA topology persistence, loading, and community cluster management.', module: 'intelligence/project-dna', category: 'Architecture & Intelligence', since: '1.0.3' },
    'intelligence/temporal-analyzer.ts': { description: 'Temporal file change history analyzer for churn risk and velocity metrics.', module: 'intelligence/temporal-analyzer', category: 'Security & Diagnostics', since: '1.0.3' },
    'memo/insight-graph.ts': { description: 'Research insight knowledge graph builder linking memo entries by semantic similarity.', module: 'memo/insight-graph', category: 'Memory & Realms', since: '1.0.3' },
    'memo/manifest-manager.ts': { description: 'DRM tag manifest persistence and metadata serialization manager.', module: 'memo/manifest-manager', category: 'Memory & Realms', since: '1.0.3' },
    'memo/memo-searcher.ts': { description: 'Semantic search engine for querying entries within DRM research tags.', module: 'memo/memo-searcher', category: 'Memory & Realms', since: '1.0.3' },
    'memo/note-processor.ts': { description: 'Research note preprocessor for content normalization and type classification.', module: 'memo/note-processor', category: 'Memory & Realms', since: '1.0.3' },
    'parsers/heuristic-parser.ts': { description: 'Heuristic regex-based code chunker for languages without tree-sitter grammars.', module: 'parsers/heuristic-parser', category: 'Core Search & Discovery', since: '1.0.2' },
    'parsers/simple-parser.ts': { description: 'Simple line-based code chunker for plain text and markdown documents.', module: 'parsers/simple-parser', category: 'Core Search & Discovery', since: '1.0.0' },
    'parsers/skill-parser.ts': { description: 'SKILL.md and markdown knowledge document parser for agent knowledge realms.', module: 'parsers/skill-parser', category: 'Core Search & Discovery', since: '1.0.3' },
    'parsers/tree-sitter-parser.ts': { description: 'Tree-sitter AST-based multi-language code chunk extractor for semantic indexing.', module: 'parsers/tree-sitter-parser', category: 'Core Search & Discovery', since: '1.0.0' },
    'storage/native-store.ts': { description: 'SQLite native store for vector chunks, graph topology, and metadata persistence.', module: 'storage/native-store', category: 'Core Search & Discovery', since: '1.0.0' },
    'storage/zig-bridge.ts': { description: 'Native Zig SIMD math bridge for accelerated vector cosine similarity computation.', module: 'storage/zig-bridge', category: 'Core Search & Discovery', since: '1.0.3' },
    'types/dna-types.ts': { description: 'Shared TypeScript type definitions for Project DNA, naming conventions, and architecture patterns.', module: 'types/dna-types', category: 'Architecture & Intelligence', since: '1.0.0' },
    'types/index.ts': { description: 'Central type barrel export index for all DeepSift public type definitions.', module: 'types/index', category: 'Core Search & Discovery', since: '1.0.0' },
    'types/memo-types.ts': { description: 'Shared TypeScript type definitions for DRM tags, entries, and manifest structures.', module: 'types/memo-types', category: 'Memory & Realms', since: '1.0.2' },
    'ui/web-dashboard.ts': { description: 'Local Express web server providing interactive graph and DRM visualization dashboard on port 3333.', module: 'ui/web-dashboard', category: 'Utilities & Dashboard', since: '1.0.3' },
    'utils/architecture.ts': { description: 'Directory tree architecture blueprint generator with Graphify community pruning.', module: 'utils/architecture', category: 'Architecture & Intelligence', since: '1.0.0' },
    'utils/binary-check.ts': { description: 'Binary file detection utility to skip non-text files during indexing scans.', module: 'utils/binary-check', category: 'Core Search & Discovery', since: '1.0.0' },
    'utils/file-walker.ts': { description: 'Recursive directory file walker with .gitignore and noise exclusion support.', module: 'utils/file-walker', category: 'Core Search & Discovery', since: '1.0.0' },
    'utils/history.ts': { description: 'Search and read result log persistence and paginated output image saver.', module: 'utils/history', category: 'Utilities & Dashboard', since: '1.0.0' },
    'utils/native-renderer.ts': { description: 'Native PNG and image renderer for search result visualization pages.', module: 'utils/native-renderer', category: 'Utilities & Dashboard', since: '1.0.3' },
    'utils/outline.ts': { description: 'AST feature outline extractor generating file purpose, class, function, and dependency summaries.', module: 'utils/outline', category: 'Core Search & Discovery', since: '1.0.0' },
    'utils/similarity.ts': { description: 'Cosine similarity and vector distance computation utilities for search ranking.', module: 'utils/similarity', category: 'Core Search & Discovery', since: '1.0.0' },
    'utils/token-compressor.ts': { description: 'DEC_v2 visual token compression engine for AI Agent context window optimization.', module: 'utils/token-compressor', category: 'Utilities & Dashboard', since: '1.0.3' },
    'utils/toon-serializer.ts': { description: 'TOON-Patch JSON specification serializer and deserializer for structured code edits.', module: 'utils/toon-serializer', category: 'Refactoring & Self-Healing', since: '1.0.3' },
};

let processed = 0;
let skipped = 0;

for (const [relPath, meta] of Object.entries(FILE_HEADERS)) {
    const fullPath = path.join(SRC_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
        skipped++;
        continue;
    }
    let content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('@file')) {
        skipped++;
        continue;
    }

    const header = `/**\n * @file ${path.basename(relPath)}\n * @description ${meta.description}\n *\n * @module ${meta.module}\n * @category ${meta.category}\n * @since ${meta.since}\n */\n`;

    fs.writeFileSync(fullPath, header + content, 'utf-8');
    processed++;
    console.log(`✅ ${relPath}`);
}

console.log(`\n✔ Done: ${processed} files annotated, ${skipped} skipped.`);
