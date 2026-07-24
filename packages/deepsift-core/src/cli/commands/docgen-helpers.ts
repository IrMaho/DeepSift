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
            usage: 'deepsift overview [path] [--depth N]',
            options: [{ flag: '--depth <number>', description: 'Max directory traversal depth (default: 2)' }],
            category: 'Core Search & Discovery',
            example: 'deepsift overview --depth 3'
        },
        {
            name: 'search',
            aliases: ['s'],
            summary: 'Hybrid Semantic & BM25 search enhanced with Graphify PageRank and God Node boosting.',
            usage: 'deepsift search "query" [options]',
            options: [
                { flag: '--include, -i <path>', description: 'Narrow search scope to specific subdirectory' },
                { flag: '--sync', description: 'Synchronize index before executing search' },
                { flag: '--layer <ui|domain|data>', description: 'Filter search results by Clean Architecture layer' },
                { flag: '--verbose, -v', description: 'Display real-time indexing progress' },
                { flag: '--context-lines, -C <N>', description: 'Include N surrounding lines of code in match snippets' },
                { flag: '--realm <id>', description: 'Search within a mounted external knowledge realm' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift search "auth store login" --include "src/features/auth" --context-lines 5'
        },
        {
            name: 'read',
            aliases: [],
            summary: 'Mandatory file reader outputting exact text or compressed DEC_v2 visual tokens.',
            usage: 'deepsift read "file:start-end" [--compress]',
            options: [{ flag: '--compress', description: 'Enable DEC_v2 visual token compression to save context window tokens' }],
            category: 'Core Search & Discovery',
            example: 'deepsift read "src/utils/config.ts:1-50" --compress'
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
                { flag: '--limit <number>', description: 'Max items per page' },
                { flag: '--offset <number>', description: 'Pagination offset' }
            ],
            category: 'Core Search & Discovery',
            example: 'deepsift feature "src/core" --summary'
        },
        {
            name: 'analyze',
            aliases: ['an'],
            summary: 'SUPER-COMMAND: Deep dive combining Feature AST Outline and DNA topology for a specific folder/file.',
            usage: 'deepsift analyze "path"',
            options: [],
            category: 'Architecture & Intelligence',
            example: 'deepsift analyze "src/memo"'
        },
        {
            name: 'arch',
            aliases: [],
            summary: 'Project directory blueprint utilizing Graphify communities and automatic noise pruning.',
            usage: 'deepsift arch [--depth N]',
            options: [{ flag: '--depth <number>', description: 'Max directory tree depth' }],
            category: 'Architecture & Intelligence',
            example: 'deepsift arch --depth 4'
        },
        {
            name: 'dna',
            aliases: [],
            summary: 'Generates or displays Project DNA topology, central God Nodes, and community clusters.',
            usage: 'deepsift dna [--show] [options]',
            options: [
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
            aliases: [],
            summary: 'Traces upstream callers, downstream callee scopes, and event message flows for any symbol.',
            usage: 'deepsift calltree "symbol" [--path <dir>]',
            options: [{ flag: '--path <dir>', description: 'Filter call graph scope to a specific subdirectory' }],
            category: 'Architecture & Intelligence',
            example: 'deepsift calltree "TokenOptimizerService"'
        },
        {
            name: 'cfg',
            aliases: [],
            summary: 'Control Flow Graph extractor generating Mermaid and ASCII branch diagrams for functions.',
            usage: 'deepsift cfg "file:func"',
            options: [],
            category: 'Architecture & Intelligence',
            example: 'deepsift cfg "src/utils/config.ts:loadConfig"'
        },
        {
            name: 'deps',
            aliases: [],
            summary: 'Trace inbound and outbound dependencies for a specific file or module target.',
            usage: 'deepsift deps "target"',
            options: [],
            category: 'Architecture & Intelligence',
            example: 'deepsift deps "src/core/indexer.ts"'
        },
        {
            name: 'wire-trace',
            aliases: [],
            summary: 'Maps cross-environment message flows (postMessage, IPC, WebSockets, EventEmitters).',
            usage: 'deepsift wire-trace [directory]',
            options: [],
            category: 'Architecture & Intelligence',
            example: 'deepsift wire-trace "src/figma-core"'
        },
        {
            name: 'clones',
            aliases: [],
            summary: 'AST Code Clone Detector highlighting duplicate blocks and copy-paste clusters for DRY compliance.',
            usage: 'deepsift clones',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift clones'
        },
        {
            name: 'find-dead-code',
            aliases: ['dead-code'],
            summary: 'Scans for unreferenced exports, dead variables, and uncalled component functions.',
            usage: 'deepsift find-dead-code',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift find-dead-code'
        },
        {
            name: 'check-schema-drift',
            aliases: ['schema-drift'],
            summary: 'Audits schema and DOM selector synchronization between client UI and backend definitions.',
            usage: 'deepsift check-schema-drift',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift check-schema-drift'
        },
        {
            name: 'heal',
            aliases: [],
            summary: 'DNA-based auto-refactoring engine that fixes lint, type, and architectural issues in a file.',
            usage: 'deepsift heal "file"',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift heal "src/cli/cli-output.ts"'
        },
        {
            name: 'auto-heal',
            aliases: [],
            summary: 'Autonomous 4-step healing loop (diff -> build check -> auto-patch -> re-verify).',
            usage: 'deepsift auto-heal "file"',
            options: [],
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
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift refactor rename "oldHelper" "newHelper"'
        },
        {
            name: 'impact',
            aliases: [],
            summary: 'Calculates breaking change risk score and lists caller sites before symbol modification.',
            usage: 'deepsift impact "symbol"',
            options: [],
            category: 'Refactoring & Self-Healing',
            example: 'deepsift impact "NativeStore"'
        },
        {
            name: 'complexity',
            aliases: [],
            summary: 'Calculates Cyclomatic & Cognitive Complexity heatmap highlighting high-risk refactor targets.',
            usage: 'deepsift complexity [path]',
            options: [],
            category: 'Security & Diagnostics',
            example: 'deepsift complexity "src/core"'
        },
        {
            name: 'security-scan',
            aliases: ['audit-sandbox', 'audit-secrets', 'audit-deps'],
            summary: 'Scans for sandbox boundary leaks (e.g. window in sandbox), hardcoded secrets, and XSS risks.',
            usage: 'deepsift security-scan',
            options: [],
            category: 'Security & Diagnostics',
            example: 'deepsift security-scan'
        },
        {
            name: 'doctor',
            aliases: [],
            summary: 'Runs system health diagnostics, database index checks, and self-healing index repairs.',
            usage: 'deepsift doctor',
            options: [],
            category: 'Security & Diagnostics',
            example: 'deepsift doctor'
        },
        {
            name: 'testmap',
            aliases: [],
            summary: 'Maps source files to corresponding unit test files and identifies untested modules.',
            usage: 'deepsift testmap [--lang <ts|dart|py|go>]',
            options: [{ flag: '--lang <ts|dart|py|go>', description: 'Filter test mapping by programming language' }],
            category: 'Security & Diagnostics',
            example: 'deepsift testmap --lang ts'
        },
        {
            name: 'git-churn',
            aliases: [],
            summary: 'Git Hotspot Heatmap combining commit frequency with code complexity to find churn hotspots.',
            usage: 'deepsift git-churn',
            options: [],
            category: 'Security & Diagnostics',
            example: 'deepsift git-churn'
        },
        {
            name: 'memo',
            aliases: ['m'],
            summary: 'Dynamic Research Memory (DRM) engine for persisting active research tags and architectural notes.',
            usage: 'deepsift memo <action> [tag] [content]',
            options: [],
            category: 'Memory & Realms',
            example: 'deepsift memo open "auth-refactor"'
        },
        {
            name: 'realm',
            aliases: [],
            summary: 'Manages external knowledge bases and external Swagger/Figma specs (list, add, mount, snapshot).',
            usage: 'deepsift realm <action> [id]',
            options: [],
            category: 'Memory & Realms',
            example: 'deepsift realm mount'
        },
        {
            name: 'compare',
            aliases: [],
            summary: 'Compares vector knowledge gaps and similarities between two knowledge realms.',
            usage: 'deepsift compare <r1> <r2> [-q term]',
            options: [{ flag: '-q <term>', description: 'Filter vector comparison by topic query' }],
            category: 'Memory & Realms',
            example: 'deepsift compare r1 r2 -q "auth"'
        },
        {
            name: 'context',
            aliases: [],
            summary: 'Generates pre-creation checklist with rules and design tokens before building components.',
            usage: 'deepsift context "path"',
            options: [],
            category: 'Utilities & Dashboard',
            example: 'deepsift context "src/components/Header.tsx"'
        },
        {
            name: 'plan',
            aliases: [],
            summary: 'Generates structured implementation plans based on DNA, skills, realms, and architecture.',
            usage: 'deepsift plan "request"',
            options: [],
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
            usage: 'deepsift docgen',
            options: [],
            category: 'Utilities & Dashboard',
            example: 'deepsift docgen'
        },
        {
            name: 'ui',
            aliases: [],
            summary: 'Launches local interactive Web Dashboard visualization on port 3333 for graph and DRM.',
            usage: 'deepsift ui',
            options: [],
            category: 'Utilities & Dashboard',
            example: 'deepsift ui'
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
