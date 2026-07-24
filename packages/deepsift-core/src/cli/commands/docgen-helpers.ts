/**
 * @file docgen-helpers.ts
 * @description Command Metadata Registry and Markdown Generators for DeepSift DocGen Engine.
 * 
 * @module cli/commands/docgen-helpers
 * @category Documentation
 * @since 1.0.3
 */

import { CliCommandMetadata, TSDocModuleMetadata } from './docgen.js';

/**
 * Returns complete, exhaustive metadata for all DeepSift CLI commands.
 */
export function getFullCliCommandRegistry(): CliCommandMetadata[] {
    return [
        {
            name: 'overview',
            aliases: ['ov'],
            summary: 'SUPER-COMMAND: Single-step Project Blueprint combining Architecture Tree + Central God Nodes + Feature Summaries.',
            usage: 'deepsift overview [path] [--depth N] [--compress] [--json]',
            options: [
                { flag: '--depth <number>', description: 'Max directory traversal depth (default: 2)' },
                { flag: '--compress', description: 'Enable DEC_v2 visual token compression for context window efficiency' },
                { flag: '--json', description: 'Output structural blueprint in JSON format' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift overview --depth 3 --compress'
        },
        {
            name: 'search',
            aliases: ['s'],
            summary: 'Hybrid Semantic & BM25 search enhanced with Graphify PageRank and God Node boosting.',
            usage: 'deepsift search "query" [options]',
            options: [
                { flag: '--include, -i <path>', description: 'Narrow search scope to specific subdirectory' },
                { flag: '--sync', description: 'Synchronize vector index before executing search' },
                { flag: '--layer <ui|domain|data>', description: 'Filter search results by Clean Architecture layer' },
                { flag: '--verbose, -v', description: 'Display real-time indexing progress and processing speed' },
                { flag: '--context-lines, -C <N>', description: 'Include N surrounding lines of code in match snippets' },
                { flag: '--realm <id>', description: 'Search within a mounted external knowledge realm' },
                { flag: '--all-realms', description: 'Search simultaneously across all mounted knowledge realms' },
                { flag: '--limit <number>', description: 'Limit number of search match results returned (default: 8)' },
                { flag: '--no-compress', description: 'Disable DEC_v2 token compression output' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift search "auth store login" --include "src/features/auth" --context-lines 5 --limit 10'
        },
        {
            name: 'read',
            aliases: [],
            summary: 'Mandatory file reader outputting exact text or compressed DEC_v2 visual tokens.',
            usage: 'deepsift read "file:start-end" [--no-compress] [--json]',
            options: [
                { flag: '--no-compress', description: 'Output uncompressed raw file text instead of DEC_v2 tokens' },
                { flag: '--json', description: 'Output content and line metadata in JSON format' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift read "src/utils/config.ts:1-50"'
        },
        {
            name: 'feature',
            aliases: ['f'],
            summary: 'AST-based feature outline detailing class definitions, exported functions, and dependencies.',
            usage: 'deepsift feature "path" [options]',
            options: [
                { flag: '--compact, -c', description: 'High-density purpose & dependency outline' },
                { flag: '--summary, -s', description: 'Summary mode showing top-level exports only' },
                { flag: '--group-by-feature, -g', description: 'Group files by sub-feature directories' },
                { flag: '--depth <number>', description: 'Max directory traversal depth' },
                { flag: '--limit <number>', description: 'Max items per page for pagination' },
                { flag: '--offset <number>', description: 'Pagination offset index' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift feature "src/core" --summary --compact'
        },
        {
            name: 'analyze',
            aliases: ['an', 'a'],
            summary: 'SUPER-COMMAND: Deep dive combining Feature AST Outline and DNA topology for a specific folder/file.',
            usage: 'deepsift analyze "path" [--depth N] [--compact] [--json]',
            options: [
                { flag: '--depth <number>', description: 'Max directory traversal depth' },
                { flag: '--compact', description: 'High-density summary output' },
                { flag: '--json', description: 'Output structural analysis in JSON format' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift analyze "src/memo" --depth 2'
        },
        {
            name: 'arch',
            aliases: [],
            summary: 'Project directory blueprint utilizing Graphify communities and automatic noise pruning.',
            usage: 'deepsift arch [--depth N] [--json] [--plain]',
            options: [
                { flag: '--depth <number>', description: 'Max directory tree depth (default: 3)' },
                { flag: '--json', description: 'Output directory graph structure in JSON format' },
                { flag: '--plain', description: 'Output clean plain text without Markdown formatting' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift arch --depth 4'
        },
        {
            name: 'dna',
            aliases: [],
            summary: 'Generates or displays Project DNA topology, central God Nodes, and community clusters.',
            usage: 'deepsift dna [--show] [options]',
            options: [
                { flag: '--show', description: 'Display existing cached DNA topology without re-indexing' },
                { flag: '--force', description: 'Force full recalculation of project DNA and community clusters' },
                { flag: '--section <name>', description: 'Filter DNA section (tokens, architecture, conventions)' },
                { flag: '--query, -q <term>', description: 'Search DNA JSON data by keyword' },
                { flag: '--path-filter <path>', description: 'Filter DNA records by file path prefix' },
                { flag: '--meta', description: 'Output metadata and record counts only' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift dna --show --section architecture'
        },
        {
            name: 'calltree',
            aliases: ['ct'],
            summary: 'Traces upstream callers, downstream callee scopes, and event message flows for any symbol.',
            usage: 'deepsift calltree "symbol" [options]',
            options: [
                { flag: '--path <dir>', description: 'Filter call graph scope to a specific subdirectory' },
                { flag: '--compress', description: 'Apply DEC_v2 visual token compression' },
                { flag: '--json', description: 'Output call graph hierarchy in JSON format' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift calltree "TokenOptimizerService" --path "src/utils"'
        },
        {
            name: 'cfg',
            aliases: [],
            summary: 'Control Flow Graph extractor generating Mermaid and ASCII branch diagrams for functions.',
            usage: 'deepsift cfg "file:func" [--json]',
            options: [
                { flag: '--json', description: 'Output Control Flow Graph nodes and edge lists in JSON' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift cfg "src/utils/config.ts:loadConfig"'
        },
        {
            name: 'deps',
            aliases: ['d'],
            summary: 'Trace inbound and outbound dependencies for a specific file or module target.',
            usage: 'deepsift deps "target" [--incoming] [--outgoing] [--graph]',
            options: [
                { flag: '--incoming', description: 'Trace inbound callers depending on target' },
                { flag: '--outgoing', description: 'Trace outbound modules imported by target' },
                { flag: '--graph', description: 'Render dependency tree graph' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift deps "src/core/indexer.ts" --incoming'
        },
        {
            name: 'wire-trace',
            aliases: [],
            summary: 'Maps cross-environment message flows (postMessage, IPC, WebSockets, EventEmitters).',
            usage: 'deepsift wire-trace [directory] [--json]',
            options: [
                { flag: '--json', description: 'Output message wire trace channel matrix in JSON' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift wire-trace "src/figma-core"'
        },
        {
            name: 'clones',
            aliases: [],
            summary: 'AST Code Clone Detector highlighting duplicate blocks and copy-paste clusters for DRY compliance.',
            usage: 'deepsift clones [path] [--min-tokens N] [--json]',
            options: [
                { flag: '--min-tokens <number>', description: 'Minimum token threshold for clone detection (default: 30)' },
                { flag: '--json', description: 'Output clone clusters in JSON format' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift clones "src/analyzers"'
        },
        {
            name: 'find-dead-code',
            aliases: ['dead-code'],
            summary: 'Scans for unreferenced exports, dead variables, and uncalled component functions.',
            usage: 'deepsift find-dead-code [path] [--json]',
            options: [
                { flag: '--json', description: 'Output unreferenced symbols list in JSON format' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift find-dead-code'
        },
        {
            name: 'check-schema-drift',
            aliases: ['schema-drift'],
            summary: 'Audits schema and DOM selector synchronization between client UI and backend definitions.',
            usage: 'deepsift check-schema-drift [--json]',
            options: [
                { flag: '--json', description: 'Output schema drift audit report in JSON format' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift check-schema-drift'
        },
        {
            name: 'heal',
            aliases: [],
            summary: 'DNA-based auto-refactoring engine that fixes lint, type, and architectural issues in a file.',
            usage: 'deepsift heal "file" [--dry-run]',
            options: [
                { flag: '--dry-run', description: 'Simulate auto-healing patches without modifying file on disk' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift heal "src/cli/cli-output.ts" --dry-run'
        },
        {
            name: 'auto-heal',
            aliases: [],
            summary: 'Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify).',
            usage: 'deepsift auto-heal "file" [--max-attempts N]',
            options: [
                { flag: '--max-attempts <number>', description: 'Maximum patch retry attempts (default: 3)' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift auto-heal "src/storage/native-store.ts"'
        },
        {
            name: 'patch',
            aliases: [],
            summary: 'Applies structural AST code injections using the TOON-Patch specification.',
            usage: 'deepsift patch "patch.json" [options]',
            options: [
                { flag: '--dry-run', description: 'Simulate patch application in memory' },
                { flag: '--check-impact', description: 'Trace breaking impact before writing to disk' },
                { flag: '--scan-security', description: 'Perform CWE security vulnerability audit' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift patch "patch.json" --dry-run'
        },
        {
            name: 'refactor',
            aliases: [],
            summary: 'AST-safe symbol renaming across codebase or function extraction.',
            usage: 'deepsift refactor rename <old> <new> | deepsift refactor extract <file:lines> --name <func>',
            options: [
                { flag: '--name <functionName>', description: 'Name of extracted function target' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift refactor rename "oldHelper" "newHelper"'
        },
        {
            name: 'impact',
            aliases: [],
            summary: 'Calculates breaking change risk score and lists caller sites before symbol modification.',
            usage: 'deepsift impact "symbol" [--json]',
            options: [
                { flag: '--json', description: 'Output breaking change impact report in JSON format' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift impact "NativeStore"'
        },
        {
            name: 'complexity',
            aliases: [],
            summary: 'Calculates Cyclomatic & Cognitive Complexity heatmap highlighting high-risk refactor targets.',
            usage: 'deepsift complexity [path] [--json]',
            options: [
                { flag: '--json', description: 'Output complexity heatmap matrix in JSON format' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift complexity "src/core"'
        },
        {
            name: 'security-scan',
            aliases: ['audit-sandbox', 'audit-secrets', 'audit-deps'],
            summary: 'Scans for sandbox boundary leaks (e.g. window in sandbox), hardcoded secrets, and XSS risks.',
            usage: 'deepsift security-scan [--json]',
            options: [
                { flag: '--json', description: 'Output vulnerability finding details in JSON format' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift security-scan'
        },
        {
            name: 'doctor',
            aliases: [],
            summary: 'Runs system health diagnostics, database index checks, and self-healing index repairs.',
            usage: 'deepsift doctor [--repair]',
            options: [
                { flag: '--repair', description: 'Automatically repair corrupt SQLite indexes or missing cache files' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift doctor --repair'
        },
        {
            name: 'testmap',
            aliases: [],
            summary: 'Maps source files to corresponding unit test files and identifies untested modules.',
            usage: 'deepsift testmap [--lang <ts|dart|py|go>] [--untested-only]',
            options: [
                { flag: '--lang <ts|dart|py|go>', description: 'Filter test mapping by programming language' },
                { flag: '--untested-only', description: 'Display only source modules lacking test coverage' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift testmap --lang ts --untested-only'
        },
        {
            name: 'git-churn',
            aliases: [],
            summary: 'Git Hotspot Heatmap combining commit frequency with code complexity to find churn hotspots.',
            usage: 'deepsift git-churn [--limit N] [--json]',
            options: [
                { flag: '--limit <number>', description: 'Top N churn hotspot files to display (default: 10)' },
                { flag: '--json', description: 'Output churn risk metric array in JSON format' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift git-churn --limit 15'
        },
        {
            name: 'memo',
            aliases: ['m'],
            summary: 'Dynamic Research Memory (DRM) engine for persisting active research tags and architectural notes.',
            usage: 'deepsift memo <action> [tag] [options]',
            options: [
                { flag: 'open <tag> [--desc "text"]', description: 'Create and activate a research tag' },
                { flag: 'close <tag>', description: 'Close an active research tag' },
                { flag: 'add <tag> --data "text" [--type type]', description: 'Add research note entry' },
                { flag: 'query <tag> "query" [--topk N]', description: 'Semantic search within research notes' },
                { flag: 'list [--open]', description: 'List all active or archived research tags' },
                { flag: 'export <tag>', description: 'Export research tag findings as Markdown' },
                { flag: 'to-plan <tag>', description: 'Convert research tag notes directly into implementation_plan.md' }
            ],
            category: 'Memory & Realms',
            example: 'deepsift memo open "auth-refactor" --desc "OAuth2 token flow redesign"'
        },
        {
            name: 'realm',
            aliases: [],
            summary: 'Manages external knowledge bases and external Swagger/Figma specs (list, add, mount, snapshot).',
            usage: 'deepsift realm <action> [id] [options]',
            options: [
                { flag: 'list', description: 'List mounted knowledge realms' },
                { flag: 'add <id> --path <dir>', description: 'Mount external directory as knowledge realm' },
                { flag: 'snapshot <id>', description: 'Create persistent vector snapshot of realm' }
            ],
            category: 'Memory & Realms',
            example: 'deepsift realm add "figma-spec" --path "../figma-docs"'
        },
        {
            name: 'compare',
            aliases: [],
            summary: 'Compares vector knowledge gaps and similarities between two knowledge realms.',
            usage: 'deepsift compare <r1> <r2> [-q term]',
            options: [
                { flag: '-q <term>', description: 'Filter vector comparison by topic query string' }
            ],
            category: 'Memory & Realms',
            example: 'deepsift compare code docs -q "authentication"'
        },
        {
            name: 'context',
            aliases: [],
            summary: 'Generates pre-creation checklist with rules and design tokens before building components.',
            usage: 'deepsift context "path" [--json]',
            options: [
                { flag: '--json', description: 'Output pre-creation rule checklist in JSON format' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift context "src/components/Header.tsx"'
        },
        {
            name: 'plan',
            aliases: [],
            summary: 'Generates structured implementation plans based on DNA, skills, realms, and architecture.',
            usage: 'deepsift plan "request" [--output <file>]',
            options: [
                { flag: '--output <file>', description: 'Write generated implementation plan to target markdown file' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift plan "Add OAuth2 authentication flow"'
        },
        {
            name: 'plan-ui',
            aliases: [],
            summary: 'Generates visual UI specs layout, token palettes, spacing, and i18n rules.',
            usage: 'deepsift plan-ui "request"',
            options: [],
            category: 'Utilities & Dashboard',
            example: 'deepsift plan-ui "User Profile Settings Dialog"'
        },
        {
            name: 'docgen',
            aliases: ['docs'],
            summary: 'Generates and synchronizes complete Markdown documentation suite for GitHub and AI Agents.',
            usage: 'deepsift docgen [--project <path>]',
            options: [
                { flag: '--project <path>', description: 'Specify custom target project root directory' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift docgen'
        },
        {
            name: 'ui',
            aliases: [],
            summary: 'Launches local interactive Web Dashboard visualization on port 3333 for graph and DRM.',
            usage: 'deepsift ui [--port N]',
            options: [
                { flag: '--port <number>', description: 'Specify custom port number (default: 3333)' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift ui --port 3333'
        },

        // ── Core Setup & Indexing ──────────────────────────────────────────
        {
            name: 'init',
            aliases: [],
            summary: 'Initializes DeepSift workspace, creates .deepsift directory and performs first-run indexing bootstrap.',
            usage: 'deepsift init [--force]',
            options: [
                { flag: '--force', description: 'Re-initialize even if .deepsift directory already exists' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift init'
        },
        {
            name: 'config',
            aliases: [],
            summary: 'Interactive configuration menu for setting excluded folders, embedding model, and indexing preferences.',
            usage: 'deepsift config',
            options: [],
            category: 'Core Search & Discovery',
            example: 'deepsift config'
        },
        {
            name: 'index',
            aliases: ['i'],
            summary: 'Manually triggers incremental or full codebase re-indexing with vector embedding sync.',
            usage: 'deepsift index [--force] [--verbose] [--path <dir>]',
            options: [
                { flag: '--force', description: 'Force full re-index of all files regardless of modification time' },
                { flag: '--verbose, -v', description: 'Stream real-time per-file indexing progress logs' },
                { flag: '--path <dir>', description: 'Limit indexing scope to a specific subdirectory' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift index --force --verbose'
        },
        {
            name: 'scan',
            aliases: [],
            summary: 'Full workspace scan that discovers new files, repairs missing index entries, and prunes deleted chunks.',
            usage: 'deepsift scan [--verbose]',
            options: [
                { flag: '--verbose, -v', description: 'Show detailed per-file scan and repair log output' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift scan --verbose'
        },
        {
            name: 'watch',
            aliases: ['w'],
            summary: 'Starts a file system watcher that triggers incremental auto-indexing whenever source files change.',
            usage: 'deepsift watch [--path <dir>]',
            options: [
                { flag: '--path <dir>', description: 'Restrict watch scope to a specific subdirectory' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift watch'
        },
        {
            name: 'status',
            aliases: ['st'],
            summary: 'Displays current index health, chunk counts, last sync timestamp, and embedding model info.',
            usage: 'deepsift status [--json]',
            options: [
                { flag: '--json', description: 'Output index status report in JSON format' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift status'
        },
        {
            name: 'start',
            aliases: [],
            summary: 'Starts the DeepSift MCP (Model Context Protocol) server for IDE and AI Agent integrations.',
            usage: 'deepsift start [--compress]',
            options: [
                { flag: '--compress', description: 'Enable DEC_v2 output compression for all MCP responses' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift start'
        },
        {
            name: 'scope',
            aliases: [],
            summary: 'Sets or displays the active workspace search boundary — constrains all subsequent searches to a subdirectory.',
            usage: 'deepsift scope [<path>] [--clear]',
            options: [
                { flag: '<path>', description: 'Set active search scope to the specified directory path' },
                { flag: '--clear', description: 'Remove current scope restriction and reset to full workspace' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift scope src/features/auth'
        },

        // ── File Reading & Inspection ─────────────────────────────────────
        {
            name: 'zoom',
            aliases: [],
            summary: 'Deep inspection of a specific file, class, or symbol — renders annotated view with type info and cross-references.',
            usage: 'deepsift zoom "<file[:symbol]>" [--json]',
            options: [
                { flag: '--json', description: 'Output inspection data in structured JSON format' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift zoom "src/core/indexer.ts:Indexer"'
        },
        {
            name: 'read-feature',
            aliases: ['rf'],
            summary: 'Combined command: reads exact file lines AND generates an AST feature outline in a single call.',
            usage: 'deepsift read-feature "<file:start-end>" [--compact]',
            options: [
                { flag: '--compact', description: 'High-density outline omitting verbose descriptions' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift read-feature "src/core/searcher.ts:1-80" --compact'
        },

        // ── Code Editing & Patching ───────────────────────────────────────
        {
            name: 'edit',
            aliases: ['e'],
            summary: 'In-place file editor applying structured line-range replacements from a JSON edit spec.',
            usage: 'deepsift edit "<file>" --spec "<json>" [--dry-run]',
            options: [
                { flag: '--spec <json>', description: 'Inline JSON edit specification with target and replacement content' },
                { flag: '--dry-run', description: 'Preview changes without writing to disk' }
            ],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift edit "src/utils/helper.ts" --spec \'{"find":"oldFn","replace":"newFn"}\''
        },
        {
            name: 'sed',
            aliases: [],
            summary: 'Stream editor for targeted in-place text substitution within a specific line range of a file.',
            usage: 'deepsift sed "<file:start-end>" "<search>" "<replace>"',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift sed "src/api/client.ts:10-25" "oldBaseUrl" "newBaseUrl"'
        },
        {
            name: 'decode',
            aliases: [],
            summary: 'Decodes and expands DEC_v2 compressed visual token output back into full readable source text.',
            usage: 'deepsift decode "<compressed-text>"',
            options: [],
            category: 'Utilities & Dashboard',
            example: 'deepsift decode "«block:auth-logic»"'
        },
        {
            name: 'pipe',
            aliases: ['p'],
            summary: 'Reads DeepSift input from stdin — enables chaining commands through Unix-style shell pipelines.',
            usage: 'echo "<query>" | deepsift pipe [--search|--read]',
            options: [
                { flag: '--search', description: 'Treat piped input as a semantic search query' },
                { flag: '--read', description: 'Treat piped input as a file:lines read specification' }
            ],
            category: 'Utilities & Dashboard',
            example: 'echo "auth token logic" | deepsift pipe --search'
        },

        // ── History Management ────────────────────────────────────────────
        {
            name: 'history',
            aliases: ['h'],
            summary: 'Displays paginated search and read result history log with timestamps and result previews.',
            usage: 'deepsift history [--limit N] [--clear]',
            options: [
                { flag: '--limit <number>', description: 'Show last N history entries (default: 20)' },
                { flag: '--clear', description: 'Wipe all stored history log entries' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift history --limit 10'
        },
        {
            name: 'drill',
            aliases: ['dr'],
            summary: 'Drills into a specific history entry to re-render full search result with surrounding context lines.',
            usage: 'deepsift drill <index>',
            options: [],
            category: 'Utilities & Dashboard',
            example: 'deepsift drill 3'
        },

        // ── Architecture Validation ───────────────────────────────────────
        {
            name: 'check-layers',
            aliases: ['check-architecture'],
            summary: 'Validates Clean Architecture layer boundary rules — detects illegal cross-layer imports (e.g. data → UI).',
            usage: 'deepsift check-layers [--json]',
            options: [
                { flag: '--json', description: 'Output violation list in JSON format' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift check-layers'
        },

        // ── Code Generation ───────────────────────────────────────────────
        {
            name: 'gen-test',
            aliases: [],
            summary: 'Automatically generates a unit test scaffold and mock file for a specified source module.',
            usage: 'deepsift gen-test "<file>" [--framework <jest|vitest>]',
            options: [
                { flag: '--framework <jest|vitest>', description: 'Target test framework for generated test boilerplate (default: vitest)' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift gen-test "src/core/searcher.ts" --framework vitest'
        },
        {
            name: 'gen-mock',
            aliases: [],
            summary: 'Generates a complete type-safe mock file for a module, inferring all exported interfaces and classes.',
            usage: 'deepsift gen-mock "<file>"',
            options: [],
            category: 'Security & Diagnostics',
            example: 'deepsift gen-mock "src/storage/native-store.ts"'
        },
        {
            name: 'gen-adr',
            aliases: [],
            summary: 'Generates an Architecture Decision Record (ADR) Markdown template for documenting design decisions.',
            usage: 'deepsift gen-adr "<title>" [--output <file>]',
            options: [
                { flag: '--output <file>', description: 'Write ADR to specified file path instead of stdout' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift gen-adr "Switch from REST to GraphQL"'
        },

        // ── Reporting & Summary ───────────────────────────────────────────
        {
            name: 'executive-summary',
            aliases: ['summary'],
            summary: 'Generates a high-level executive summary report covering code quality, test coverage, architecture health, and complexity.',
            usage: 'deepsift executive-summary [--json]',
            options: [
                { flag: '--json', description: 'Output full summary report in JSON format' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift executive-summary'
        },

        // ── Type System ───────────────────────────────────────────────────
        {
            name: 'expand-type',
            aliases: ['type'],
            summary: 'Resolves and expands complex TypeScript types — unrolls generics, intersections, and conditional types.',
            usage: 'deepsift expand-type "<TypeName>" [--file <path>]',
            options: [
                { flag: '--file <path>', description: 'Scope type resolution to a specific source file' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift expand-type "SearchResult" --file "src/types/index.ts"'
        },

        // ── Symbol Resolution ─────────────────────────────────────────────
        {
            name: 'resolve',
            aliases: ['r'],
            summary: 'Resolves import paths and export symbols — finds where any identifier is defined across the workspace.',
            usage: 'deepsift resolve "<symbol>" [--file <path>]',
            options: [
                { flag: '--file <path>', description: 'Start resolution from a specific file context' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift resolve "NativeStore"'
        },
        {
            name: 'resolve-error',
            aliases: [],
            summary: 'Analyzes a TypeScript compiler error message and suggests targeted fixes with code snippets.',
            usage: 'deepsift resolve-error "<error message>"',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift resolve-error "TS2339: Property does not exist on type"'
        },

        // ── i18n & Localization ───────────────────────────────────────────
        {
            name: 'i18n-extract',
            aliases: [],
            summary: 'Scans codebase for hardcoded display strings and generates an i18n key-value extraction report.',
            usage: 'deepsift i18n-extract [--path <dir>] [--json]',
            options: [
                { flag: '--path <dir>', description: 'Limit i18n scan to a specific directory' },
                { flag: '--json', description: 'Output extracted string map in JSON format' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift i18n-extract --path src/app --json'
        },

        // ── Learning & Diagnostics ────────────────────────────────────────
        {
            name: 'learn',
            aliases: [],
            summary: 'Runs adaptive project pattern learning — mines naming conventions, token vocabularies, and architectural signals.',
            usage: 'deepsift learn [--force]',
            options: [
                { flag: '--force', description: 'Force re-learning even if patterns are already cached in DNA' }
            ],
            category: 'Architecture & Intelligence',
            example: 'deepsift learn --force'
        },
        {
            name: 'diag',
            aliases: [],
            summary: 'Runs a full system diagnostics report covering Node version, embedding model, SQLite health, and config state.',
            usage: 'deepsift diag [--json]',
            options: [
                { flag: '--json', description: 'Output diagnostics report in machine-readable JSON format' }
            ],
            category: 'Security & Diagnostics',
            example: 'deepsift diag'
        },

        // ── Shell Integration ─────────────────────────────────────────────
        {
            name: 'com',
            aliases: [],
            summary: 'Executes any arbitrary shell command from within the DeepSift context — output is compressed, cached, and searchable in history.',
            usage: 'deepsift com "<shell command>"',
            options: [
                { flag: '<command>', description: 'Any valid shell command to execute (e.g. git log, npm test, ls)' },
                { flag: '--no-compress', description: 'Disable DEC_v2 compression on command output' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift com "git log --oneline -10"'
        },
        {
            name: 'clean',
            aliases: ['c'],
            summary: 'Cleans and prunes stored history logs — removes old search and command result cache files.',
            usage: 'deepsift clean [--keep <N>] [--days <N>]',
            options: [
                { flag: '--keep <number>', description: 'Keep the most recent N history entries and delete the rest' },
                { flag: '--days <number>', description: 'Delete all history entries older than N days' }
            ],
            category: 'Utilities & Dashboard',
            example: 'deepsift clean --keep 20'
        }
    ];
}

/**
 * Renders full, exhaustive Markdown for docs/COMMANDS.md.
 */
export function buildFullCommandsMarkdown(commands: CliCommandMetadata[]): string {
    let md = `# 🛠️ DeepSift CLI Commands Reference Manual\n\n`;
    md += `Comprehensive, production-grade manual for all **${commands.length} CLI commands** available in DeepSift.\n\n`;
    md += `This manual provides exhaustive details on command execution, parameter options, real-world AI Agent scenarios, and output formats.\n\n`;
    md += `---\n\n`;

    const categories = Array.from(new Set(commands.map(c => c.category)));

    for (const category of categories) {
        md += `## 📌 ${category}\n\n`;
        const catCmds = commands.filter(c => c.category === category);

        for (const cmd of catCmds) {
            const aliasStr = cmd.aliases.length > 0 ? ` (Aliases: \`${cmd.aliases.join('`, `')}\`)` : '';
            md += `### \`deepsift ${cmd.name}\`${aliasStr}\n\n`;
            md += `**Summary:** ${cmd.summary}\n\n`;
            md += `#### 📋 Usage Syntax\n\`\`\`bash\n${cmd.usage}\n\`\`\`\n\n`;

            if (cmd.options.length > 0) {
                md += `#### ⚙️ Command Options & Flags\n`;
                md += `| Flag | Description |\n|---|---|\n`;
                for (const opt of cmd.options) {
                    md += `| \`${opt.flag}\` | ${opt.description} |\n`;
                }
                md += `\n`;
            }

            md += `#### 💡 Concrete Example\n\`\`\`bash\n${cmd.example}\n\`\`\`\n\n`;
            md += `---\n\n`;
        }
    }

    return md;
}

/**
 * Renders full, exhaustive Markdown for docs/API_REFERENCE.md.
 */
export function buildFullApiReferenceMarkdown(modules: TSDocModuleMetadata[]): string {
    let md = `# 📖 DeepSift Source Code API Reference\n\n`;
    md += `Automatically extracted API documentation generated directly from JSDoc/TSDoc metadata across **${modules.length} TypeScript modules** in DeepSift.\n\n`;
    md += `---\n\n`;

    for (const mod of modules) {
        md += `## 📄 [\`${mod.moduleName}\`](file:///${mod.filePath})\n\n`;
        md += `- **Path:** \`${mod.filePath}\`  \n`;
        md += `- **Description:** ${mod.description}\n\n`;

        if (mod.exports.length > 0) {
            md += `### Exported Symbols\n\n`;
            for (const exp of mod.exports) {
                md += `#### \`${exp.kind} ${exp.name}\`\n`;
                md += `${exp.description}\n\n`;
            }
        }

        md += `---\n\n`;
    }

    return md;
}
