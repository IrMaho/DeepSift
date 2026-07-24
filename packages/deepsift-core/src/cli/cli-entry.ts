#!/usr/bin/env node
/**
 * @file cli-entry.ts
 * @description Main CLI entry point and command routing dispatcher for all DeepSift commands.
 *
 * @module cli/cli-entry
 * @category Utilities & Dashboard
 * @since 1.0.0
 */
import path from 'path';
import { parseGlobalFlags, printError, printInfo } from './cli-output.js';
import { searchCommand } from './commands/search.js';
import { indexCommand } from './commands/index-cmd.js';
import { statusCommand } from './commands/status.js';
import { archCommand } from './commands/arch.js';
import { depsCommand } from './commands/deps.js';
import { featureCommand } from './commands/feature.js';
import { historyCommand, cleanHistoryCommand, drillCommand } from './commands/history.js';
import { initCommand } from './commands/init.js';

import { watchCommand } from './commands/watch.js';
import { configCommand } from './commands/config.js';
import { dnaCommand } from './commands/dna.js';
import { analyzeCommand } from './commands/analyze.js';
import { realmCommand } from './commands/realm-cmd.js';
import { compareCommand } from './commands/compare-cmd.js';
import { scanCommand } from './commands/scan.js';
import { resolveCommand } from './commands/resolve.js';
import { contextCommand } from './commands/context.js';
import { readCommand } from './commands/read.js';
import { readFeatureCommand } from './commands/read-feature.js';
import { editCommand } from './commands/edit.js';
import { comCommand } from './commands/com.js';
import { planCommand } from './commands/plan.js';
import { healCommand } from './commands/heal.js';
import { startCommand } from './commands/start.js';
import { diagCommand } from './commands/diag.js';
import { memoCommand } from './commands/memo.js';
import { overviewCommand } from './commands/overview.js';
import { calltreeCommand } from './commands/calltree.js';
import { clonesCommand } from './commands/clones.js';
import { doctorCommand } from './commands/doctor.js';
import { decodeCommand } from './commands/decode.js';
import { testmapCommand } from './commands/testmap.js';
import { refactorRenameCommand, refactorExtractCommand } from './commands/refactor.js';
import { schemaDriftCommand } from './commands/schema-drift.js';
import { deadCodeCommand } from './commands/dead-code.js';
import { autoHealCommand } from './commands/auto-heal.js';
import { cfgCommand } from './commands/cfg.js';
import { checkLayersCommand } from './commands/check-layers.js';
import { wireTraceCommand } from './commands/wire-trace.js';
import { complexityCommand } from './commands/complexity.js';
import { securityScanCommand } from './commands/security-scan.js';
import { scopeCommand } from './commands/scope.js';
import { genTestCommand } from './commands/gen-test.js';
import { genAdrCommand } from './commands/gen-adr.js';
import { expandTypeCommand } from './commands/expand-type.js';
import { executiveSummaryCommand } from './commands/executive-summary.js';
import { zoomCommand } from './commands/zoom.js';
import { resolveErrorCommand } from './commands/resolve-error.js';
import { launchWebDashboard } from '../ui/web-dashboard.js';
import { impactCommand } from './commands/impact.js';
import { planUiCommand } from './commands/plan-ui.js';
import { docgenCommand } from './commands/docgen.js';
import { QAGenerator } from '../analyzers/qa-generator.js';
import { GitChurnMiner } from '../analyzers/git-churn-miner.js';
import { terminateWorkers } from '../core/embedder.js';

import fs from 'fs';

const VERSION = '1.0.01-amir';

const HELP_TEXT = `
\x1b[36m🔍 DeepSift v${VERSION}\x1b[0m — Semantic Codebase Search (CLI Engine)

\x1b[33mUsage:\x1b[0m
  deepsift <command> [options]

\x1b[33mCommands:\x1b[0m
  init                          Initialize DeepSift for the current project
  config                        Interactive menu to configure DeepSift (e.g. excluded folders)
  dna [--show]                  Generate or display Project DNA (context intelligence). Includes Graph Topology, Communities, and God Nodes under the 'architecture' section.
                                   Options:
                                    --section <name>      Filter DNA to a specific section (e.g. tokens, conventions, architecture)
                                    --query, -q <term>    Search DNA and return only matching JSON structures
                                    --limit <number>      Limit the number of array items returned
                                    --offset <number>      Start index for pagination of array items
                                    --path-filter <path>  Filter DNA records by file path prefix
                                    --meta                Only return metadata and record counts (no content)
  analyze, an <path>            Super-command! Combines Feature Outline and DNA Intelligence for a specific folder/file.
  overview, ov [path]           SUPER COMMAND! Single-step Project Blueprint combining Arch Tree + Central God Nodes + Feature Summary.
                                   Options:
                                     --depth <number>      Max folder depth (default: 2)
  scan <target>                 Run a specific analyzer (tokens|i18n|duplicates|conventions|assets)
  context "path"                Generate a pre-creation checklist for a new component/feature
  search "query" ["query2" ...]  Semantic search (single or multi-query) enhanced with Graphify PageRank.
                                  Results are automatically boosted based on architectural importance (God Nodes) and community detection.
                                  Options:
                                    --include, -i <path>  Only search within path
                                    --sync                Synchronize index before searching (skipped by default)
                                    --verbose, -v         Show file indexing progress
  index [--force]               Index/re-index the project
                                  Options:
                                    --verbose, -v         Show files being processed
  status                        Show index statistics
  realm <action>                Manage knowledge realms (list, add, remove, mount, snapshot)
                                  mount: Auto-discover and mount copied databases in .deepsift/realms
                                  snapshot <id>: Get a summary of all indexed files in a realm
  watch, w                      Start background watcher for real-time indexing
  arch [--depth N]              Project architecture blueprint utilizing Graphify communities.
  deps "target"                 Trace dependencies for a file/module
  feature, f "path"             Feature outline (classes, functions)
                                   Options:
                                     --compact, -c        High-density overview (file path, purpose, dependencies only)
                                     --summary, -s        High-level summary (omit internal methods/vars to prevent truncation)
                                     --group-by-feature, -g Group files by top-level feature subfolder instead of flat list
                                     --depth <number>      Max directory traversal depth
                                     --limit <number>      Limit the number of files returned
                                     --offset <number>      Start file index for pagination
  read-feature, rf "path"       Read and extract all code from a feature directory
  history                       Show past search results
  clean                         Clear search history logs and index
                                   Options:
                                     --keep <number>      Keep newest N log files (default auto: 30)
                                     --days <number>      Keep logs within last D days (default auto: 7)
  drill "logfile" "keyword"     Deep-search within a previous result
  resolve "token"               Decode a compressed token from the last search result
  read "file1" ["file2"...]     Read file contents and output compressed tokens (Supports line ranges: file:10-50)
  diag "problems.json"          Read IDE problem diagnostics and output precise code snippets
  com "command"                 Execute any shell command and return compressed output
  plan "request"                Generate a Smart Plan by analyzing DNA, skills, realms, and architecture
  heal "file"                   Attempt to fix issues in a file using the project DNA and context
  auto-heal "file"              Autonomous self-healing loop (diff ➔ lsp/build ➔ auto-patch ➔ re-verify)
  calltree, ct "symbol"         Traverse upstream callers and downstream definition scope for a symbol
  clones                        Detect code duplicates and structural clone clusters (DRY Audit)
  doctor                        Diagnostics and onboarding status report for AI agents
  decode "token"                Decompress and decode a DEC_v2 visual token
  testmap                       Source-to-test mapping report and untested module audit
  refactor <rename|extract>     AST-safe symbol renaming or function extraction
  check-schema-drift            Audit schema & DOM config synchronization between frontend/backend
  find-dead-code                Detect unreferenced and dead code exports across codebase
  patch "patch.json"            Apply code injections directly to the codebase with high confidence (TOON-Patch format)
  memo <action>                 Dynamic Research Memory (DRM) — Persistent research note-taking
                                  open "name"         Create a new research tag
                                  close "name"        Close a tag (no more entries)
                                  archive "name"      Archive a closed tag
                                  purge "name"        Delete tag and all data
                                  list [--open]       List all tags
                                  add "name" --data   Record a finding
                                  query "name" "q"    Search within a tag
                                  show "name"         Tag summary and stats
                                  graph "name"        Show insight graph
                                  export "name"       Export as readable MD
                                  prompt              Check open tags & ask for notes

\x1b[33mGlobal Flags:\x1b[0m
  --json                        Output in JSON format
  --plain                       Output in plain text (no markdown)
  --no-compress                 Disable output token compression (enabled by default)
  --help, -h                    Show this help message
  --version, -v                 Show version

\x1b[33mExamples:\x1b[0m
  deepsift init
  deepsift config
  deepsift search "authentication logic" --include "lib/controllers"
  deepsift search "db setup"
  deepsift search "db setup" --sync
  deepsift index --force --verbose
  deepsift arch --depth 3
  deepsift analyze "src/features/auth"
`;

function logError(projectPath: string, command: string, args: string[], err: any) {
    try {
        const deepsiftDir = path.join(projectPath, '.deepsift');
        if (fs.existsSync(deepsiftDir)) {
            const logPath = path.join(deepsiftDir, 'error_log.txt');
            const timestamp = new Date().toISOString();
            const cmdStr = `deepsift ${command} ${args.join(' ')}`;
            const errMsg = err.stack || err.message || String(err);
            const logEntry = `\n[${timestamp}] ERROR executing: ${cmdStr}\n${errMsg}\n----------------------------------------\n`;
            fs.appendFileSync(logPath, logEntry, 'utf-8');
        }
    } catch (e) {
        // Ignore logging errors
    }
}

async function main() {
    const rawArgs = process.argv.slice(2);

    if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
        process.stdout.write(HELP_TEXT);
        process.exit(0);
    }

    if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
        process.stdout.write(`DeepSift v${VERSION}\n`);
        process.exit(0);
    }

    const { format, compress, cleanArgs, projectPathOverride, quietCache } = parseGlobalFlags(rawArgs);
    const command = cleanArgs[0];
    const commandArgs = cleanArgs.slice(1);
    const projectPath = resolveProjectPath(projectPathOverride, commandArgs);

    ensureDeepsiftDir(projectPath);

    try {
        switch (command) {
            case 'init':
                await initCommand(projectPath);
                break;

            case 'start':
                startCommand(compress);
                break;

            case 'config':
                await configCommand(projectPath);
                break;

            case 'dna': {
                const showOnly = commandArgs.includes('--show') || commandArgs.includes('-s');
                
                let section: string | undefined;
                const sectionIdx = commandArgs.indexOf('--section');
                if (sectionIdx !== -1 && commandArgs[sectionIdx + 1]) {
                    section = commandArgs[sectionIdx + 1];
                }

                let dnaQuery: string | undefined;
                const queryIdx = commandArgs.findIndex(arg => arg === '--query' || arg === '-q');
                if (queryIdx !== -1 && commandArgs[queryIdx + 1]) {
                    dnaQuery = commandArgs[queryIdx + 1];
                }

                let limit: number | undefined;
                const limitIdx = commandArgs.indexOf('--limit');
                if (limitIdx !== -1 && commandArgs[limitIdx + 1]) {
                    limit = parseInt(commandArgs[limitIdx + 1], 10);
                }

                let offset: number | undefined;
                const offsetIdx = commandArgs.indexOf('--offset');
                if (offsetIdx !== -1 && commandArgs[offsetIdx + 1]) {
                    offset = parseInt(commandArgs[offsetIdx + 1], 10);
                }

                let pathFilter: string | undefined;
                const pathFilterIdx = commandArgs.indexOf('--path-filter');
                if (pathFilterIdx !== -1 && commandArgs[pathFilterIdx + 1]) {
                    pathFilter = commandArgs[pathFilterIdx + 1];
                }

                const showMetaOnly = commandArgs.includes('--meta');

                await dnaCommand(projectPath, showOnly, format, section, dnaQuery, compress, limit, offset, pathFilter, showMetaOnly);
                break;
            }

            case 'realm':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide an action (e.g. list, add, remove).\nUsage: deepsift realm list');
                }
                const action = commandArgs[0];
                const realmId = commandArgs[1];
                
                let type: 'code' | 'skill' | 'docs' | undefined;
                const typeIdx = commandArgs.indexOf('--type');
                if (typeIdx !== -1 && commandArgs[typeIdx + 1]) {
                    type = commandArgs[typeIdx + 1] as any;
                }
                
                let source: string | undefined;
                const sourceIdx = commandArgs.indexOf('--source');
                if (sourceIdx !== -1 && commandArgs[sourceIdx + 1]) {
                    source = commandArgs[sourceIdx + 1];
                }

                await realmCommand(projectPath, action, format, realmId, { type, source });
                break;

            case 'compare':
                if (commandArgs.length < 2) {
                    throw new Error('Please provide two realms to compare.\nUsage: deepsift compare <realm1> <realm2> --query "keyword"');
                }
                const r1 = commandArgs[0];
                const r2 = commandArgs[1];
                
                let compareQuery: string | undefined;
                const compareQueryIdx = commandArgs.indexOf('--query');
                if (compareQueryIdx !== -1 && commandArgs[compareQueryIdx + 1]) {
                    compareQuery = commandArgs[compareQueryIdx + 1];
                }
                if (!compareQuery) {
                    throw new Error('Please provide a --query to compare.');
                }
                
                await compareCommand(projectPath, r1, r2, compareQuery, format, compress);
                break;

            case 'scan':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a scan target.\nUsage: deepsift scan <tokens|i18n|duplicates|conventions|assets>');
                }
                await scanCommand(projectPath, commandArgs[0], format);
                break;

            case 'context':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a target path.\nUsage: deepsift context "src/components/button.tsx"');
                }
                await contextCommand(projectPath, commandArgs[0], format, compress);
                break;

            case 'search':
            case 's':
                const skipSync = !commandArgs.includes('--sync');
                const verboseSearch = commandArgs.includes('--verbose') || commandArgs.includes('-v');
                const allRealmsSearch = commandArgs.includes('--all-realms');
                const noVisual = commandArgs.includes('--no-visual') || commandArgs.includes('--plain') || format === 'plain' || !compress;
                
                let filterPath: string | undefined;
                const includeIdx = commandArgs.findIndex(arg => arg === '--include' || arg === '-i');
                if (includeIdx !== -1 && commandArgs[includeIdx + 1]) {
                    filterPath = commandArgs[includeIdx + 1];
                }

                let contextLines: number | undefined;
                const contextIdx = commandArgs.findIndex(arg => arg === '--context-lines' || arg === '-C');
                if (contextIdx !== -1 && commandArgs[contextIdx + 1]) {
                    contextLines = parseInt(commandArgs[contextIdx + 1], 10);
                    if (isNaN(contextLines)) contextLines = undefined;
                }
                
                let searchRealm: string | undefined = undefined;
                const searchRealmIdx = commandArgs.indexOf('--realm');
                if (searchRealmIdx !== -1 && searchRealmIdx + 1 < commandArgs.length) {
                    searchRealm = commandArgs[searchRealmIdx + 1];
                }

                const searchQueries = commandArgs.filter((arg, idx) => {
                    if (arg.startsWith('-')) return false;
                    if (idx > 0 && (commandArgs[idx - 1] === '--include' || commandArgs[idx - 1] === '-i')) return false;
                    if (idx > 0 && (commandArgs[idx - 1] === '--context-lines' || commandArgs[idx - 1] === '-C')) return false;
                    if (idx > 0 && commandArgs[idx - 1] === '--realm') return false;
                    return true;
                });
                
                if (searchQueries.length === 0) {
                    throw new Error('Please provide at least one search query.\nUsage: deepsift search "your query"');
                }
                await searchCommand(projectPath, searchQueries, format, {
                    skipSync,
                    verbose: verboseSearch,
                    filterPath,
                    compress,
                    contextLines,
                    realm: searchRealm,
                    allRealms: allRealmsSearch,
                    noVisual
                });
                break;

            case 'read':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide at least one target file.\nUsage: deepsift read "src/file.ts" or "src/file.ts:10-50"');
                }
                const targets = commandArgs.filter((arg) => !arg.startsWith('-'));
                await readCommand(projectPath, targets, format, compress);
                break;

            case 'read-feature':
            case 'rf':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a feature path.\nUsage: deepsift read-feature "src/path"');
                }
                await readFeatureCommand(projectPath, commandArgs[0], format, compress);
                break;

            case 'sed': {
                throw new Error('This feature is temporarily disabled by user request.');
            }

            case 'pipe': {
                throw new Error('This feature is temporarily disabled by user request.');
            }

            case 'edit':
            case 'e':
            case 'patch':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a path to a patch file.\nUsage: deepsift patch "patch.json"');
                }
                await editCommand(projectPath, commandArgs[0], format);
                break;

            case 'index':
            case 'i':
                const force = commandArgs.includes('--force') || commandArgs.includes('-f');
                const verboseIndex = commandArgs.includes('--verbose') || commandArgs.includes('-v');
                
                const allRealmsIdx = commandArgs.indexOf('--all-realms');
                const allRealms = allRealmsIdx !== -1;
                
                const realmFlagIdx = commandArgs.indexOf('--realm');
                let realm: string | undefined = undefined;
                if (realmFlagIdx !== -1 && realmFlagIdx + 1 < commandArgs.length) {
                    realm = commandArgs[realmFlagIdx + 1];
                }

                await indexCommand(projectPath, { 
                    force, 
                    format, 
                    verbose: verboseIndex,
                    realm,
                    allRealms 
                });
                break;

            case 'watch':
            case 'w':
                await watchCommand(projectPath);
                break;

            case 'status':
            case 'st':
                statusCommand(projectPath, format);
                break;

            case 'arch':
            case 'a': {
                let maxDepth = 3;
                const depthIdx = commandArgs.indexOf('--depth');
                if (depthIdx !== -1 && commandArgs[depthIdx + 1]) {
                    maxDepth = parseInt(commandArgs[depthIdx + 1], 10) || 3;
                }
                await archCommand(projectPath, maxDepth, format, compress);
                break;
            }

            case 'analyze':
            case 'an': {
                if (commandArgs.length === 0) throw new Error('You must specify a target path for analyze');
                
                let limit: number | undefined;
                const limitIdx = commandArgs.indexOf('--limit');
                if (limitIdx !== -1 && commandArgs[limitIdx + 1]) {
                    limit = parseInt(commandArgs[limitIdx + 1], 10);
                }

                let offset: number | undefined;
                const offsetIdx = commandArgs.indexOf('--offset');
                if (offsetIdx !== -1 && commandArgs[offsetIdx + 1]) {
                    offset = parseInt(commandArgs[offsetIdx + 1], 10);
                }
                
                const summarizeOnly = commandArgs.includes('--summarize-only');
                
                const targetPath = commandArgs.filter(a => !a.startsWith('-') && commandArgs[commandArgs.indexOf(a) - 1] !== '--limit' && commandArgs[commandArgs.indexOf(a) - 1] !== '--offset')[0];
                
                await analyzeCommand(projectPath, targetPath || commandArgs[0], format, compress, limit, offset, summarizeOnly);
                break;
            }

            case 'deps':
            case 'd':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a target name.\nUsage: deepsift deps "filename"');
                }
                await depsCommand(projectPath, commandArgs[0], format, compress);
                break;

            case 'overview':
            case 'ov': {
                let ovDepth: number = 2;
                const ovDepthIdx = commandArgs.indexOf('--depth');
                if (ovDepthIdx !== -1 && commandArgs[ovDepthIdx + 1]) {
                    ovDepth = parseInt(commandArgs[ovDepthIdx + 1], 10);
                }
                const targetOverviewPath = commandArgs.find(a => !a.startsWith('-') && commandArgs[commandArgs.indexOf(a) - 1] !== '--depth');
                await overviewCommand(projectPath, targetOverviewPath, format, compress, ovDepth);
                break;
            }

            case 'feature':
            case 'f':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a feature path.\nUsage: deepsift feature "src/path"');
                }
                let featLimit: number | undefined;
                const featLimitIdx = commandArgs.indexOf('--limit');
                if (featLimitIdx !== -1 && commandArgs[featLimitIdx + 1]) {
                    featLimit = parseInt(commandArgs[featLimitIdx + 1], 10);
                }

                let featOffset: number | undefined;
                const featOffsetIdx = commandArgs.indexOf('--offset');
                if (featOffsetIdx !== -1 && commandArgs[featOffsetIdx + 1]) {
                    featOffset = parseInt(commandArgs[featOffsetIdx + 1], 10);
                }

                let featDepth: number | undefined;
                const featDepthIdx = commandArgs.indexOf('--depth');
                if (featDepthIdx !== -1 && commandArgs[featDepthIdx + 1]) {
                    featDepth = parseInt(commandArgs[featDepthIdx + 1], 10);
                }
                
                const featSummarizeOnly = commandArgs.includes('--summarize-only') || commandArgs.includes('--summary') || commandArgs.includes('-s');
                const featGroupByFeature = commandArgs.includes('--group-by-feature') || commandArgs.includes('--group') || commandArgs.includes('-g');
                const featCompact = commandArgs.includes('--compact') || commandArgs.includes('-c');
                
                const targetFeaturePath = commandArgs.filter(a => !a.startsWith('-') && !['--limit', '--offset', '--depth'].includes(commandArgs[commandArgs.indexOf(a) - 1]))[0];

                await featureCommand(projectPath, targetFeaturePath || commandArgs[0], format, compress, featLimit, featOffset, featSummarizeOnly, featDepth, featGroupByFeature, featCompact, quietCache);
                break;

            case 'history':
            case 'h':
                historyCommand(projectPath, format);
                break;

            case 'clean':
            case 'c': {
                let keepFiles: number | undefined;
                const keepIdx = commandArgs.indexOf('--keep');
                if (keepIdx !== -1 && commandArgs[keepIdx + 1]) {
                    keepFiles = parseInt(commandArgs[keepIdx + 1], 10);
                }
                let keepDays: number | undefined;
                const daysIdx = commandArgs.indexOf('--days');
                if (daysIdx !== -1 && commandArgs[daysIdx + 1]) {
                    keepDays = parseInt(commandArgs[daysIdx + 1], 10);
                }
                cleanHistoryCommand(projectPath, format, keepFiles, keepDays);
                break;
            }

            case 'drill':
            case 'dr':
                if (commandArgs.length < 2) {
                    throw new Error('Please provide a log filename and keyword.\nUsage: deepsift drill "logfile.md" "keyword"');
                }
                drillCommand(projectPath, commandArgs[0], commandArgs[1], format);
                break;

            case 'resolve':
            case 'r':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a token to resolve.\nUsage: deepsift resolve "token"');
                }
                resolveCommand(projectPath, commandArgs[0], format);
                break;

            case 'diag':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a path to a problems JSON file.\nUsage: deepsift diag "problems.json"');
                }
                await diagCommand(projectPath, commandArgs[0], format, compress);
                break;

            case 'com':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a command to execute.\nUsage: deepsift com "git status"');
                }
                const commandStr = commandArgs.join(' ');
                await comCommand(projectPath, commandStr, format, compress);
                break;

            case 'plan':
            case 'p':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a feature request.\nUsage: deepsift plan "Create a login page with email and password"');
                }
                const planRequest = commandArgs.filter(a => !a.startsWith('-')).join(' ');
                await planCommand(projectPath, planRequest, format, compress);
                break;

            case 'heal':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a file to heal.\nUsage: deepsift heal "src/utils.ts"');
                }
                await healCommand(commandArgs[0], format, compress);
                break;

            case 'auto-heal':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a file for auto-healing.\nUsage: deepsift auto-heal "src/utils.ts"');
                }
                await autoHealCommand(projectPath, commandArgs[0], format, compress);
                break;

            case 'calltree':
            case 'ct': {
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a symbol name.\nUsage: deepsift calltree "myFunction" [--path "src/features"]');
                }
                let ctFilterPath: string | undefined;
                const ctPathIdx = commandArgs.findIndex(arg => arg === '--path' || arg === '--include' || arg === '-i' || arg === '-p');
                if (ctPathIdx !== -1 && commandArgs[ctPathIdx + 1]) {
                    ctFilterPath = commandArgs[ctPathIdx + 1];
                }
                const ctSymbol = commandArgs.find(arg => !arg.startsWith('-') && !['--path', '--include', '-i', '-p'].includes(commandArgs[commandArgs.indexOf(arg) - 1])) || commandArgs[0];
                await calltreeCommand(projectPath, ctSymbol, format, compress, ctFilterPath);
                break;
            }

            case 'clones':
                await clonesCommand(projectPath, format);
                break;

            case 'cfg':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a file:symbol target.\nUsage: deepsift cfg "file.ts:myFunction"');
                }
                await cfgCommand(projectPath, commandArgs[0], format);
                break;

            case 'check-layers':
            case 'check-architecture':
                await checkLayersCommand(projectPath, format);
                break;

            case 'doctor':
                await doctorCommand(projectPath, format);
                break;

            case 'decode':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a compressed token.\nUsage: deepsift decode "<token>"');
                }
                decodeCommand(commandArgs[0], format);
                break;

            case 'testmap': {
                let langFilter: string | undefined;
                const langIdx = commandArgs.findIndex(a => a === '--lang' || a === '--language' || a === '-l');
                if (langIdx !== -1 && commandArgs[langIdx + 1]) {
                    langFilter = commandArgs[langIdx + 1];
                }
                await testmapCommand(projectPath, format, langFilter);
                break;
            }

            case 'refactor':
                if (commandArgs[0] === 'rename') {
                    refactorRenameCommand(projectPath, commandArgs[1], commandArgs[2], format);
                } else if (commandArgs[0] === 'extract') {
                    refactorExtractCommand(projectPath, commandArgs[1], commandArgs[3] || 'extractedFunction', format);
                } else {
                    throw new Error('Usage: deepsift refactor rename <old> <new> OR deepsift refactor extract <file:lines> --name <func>');
                }
                break;

            case 'schema-drift':
            case 'check-schema-drift':
                await schemaDriftCommand(projectPath, format);
                break;

            case 'docgen':
            case 'docs':
                await docgenCommand(projectPath, format);
                break;

            case 'cfg':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a file and scope.\nUsage: deepsift cfg "src/utils.ts:myFunction"');
                }
                await cfgCommand(projectPath, commandArgs[0], format);
                break;

            case 'dead-code':
            case 'find-dead-code':
                await deadCodeCommand(projectPath, format);
                break;

            case 'wire-trace':
                await wireTraceCommand(projectPath, commandArgs[0], format);
                break;

            case 'complexity':
                await complexityCommand(projectPath, commandArgs[0], format);
                break;

            case 'security-scan':
            case 'audit-sandbox':
            case 'audit-secrets':
            case 'audit-deps':
            case 'i18n-extract':
                await securityScanCommand(projectPath, format);
                break;

            case 'scope':
                scopeCommand(projectPath, commandArgs[0], commandArgs[1]);
                break;

            case 'gen-test':
                await genTestCommand(projectPath, commandArgs[0]);
                break;

            case 'gen-mock': {
                if (commandArgs.length === 0) throw new Error('Specify a type name. Usage: deepsift gen-mock "ColorState"');
                const qa = new QAGenerator(projectPath);
                console.log(qa.generateMockDataType(commandArgs[0]));
                break;
            }

            case 'gen-adr':
                await genAdrCommand(projectPath, commandArgs[0]);
                break;

            case 'expand-type':
            case 'type':
                await expandTypeCommand(commandArgs[0], { json: format === 'json' });
                break;

            case 'executive-summary':
            case 'summary':
                await executiveSummaryCommand({ json: format === 'json' });
                break;

            case 'zoom':
                await zoomCommand(commandArgs[0], { json: format === 'json' });
                break;

            case 'resolve-error':
                await resolveErrorCommand(commandArgs.join(' '), { json: format === 'json' });
                break;

            case 'git-churn': {
                const miner = new GitChurnMiner(projectPath);
                const churn = miner.analyze();
                if (format === 'json') {
                    console.log(JSON.stringify(churn, null, 2));
                } else {
                    console.log(`\n\x1b[36m🔥 DeepSift Git Churn & Refactoring Heatmap\x1b[0m`);
                    console.log(`=================================================`);
                    churn.slice(0, 10).forEach((c: any, idx: number) => {
                        console.log(`${idx + 1}. \x1b[33m${c.file}\x1b[0m (Commits: ${c.commitCount}, Lines: ${c.lineCount}, Risk Score: \x1b[31m${c.riskScore}\x1b[0m)`);
                    });
                }
                break;
            }

            case 'ui':
                launchWebDashboard(projectPath);
                break;

            case 'impact':
                await impactCommand(projectPath, commandArgs[0], format);
                break;

            case 'plan-ui':
                await planUiCommand(projectPath, commandArgs[0] || 'New UI Feature', format);
                break;

            case 'zoom':
                if (commandArgs.length === 0) throw new Error('Specify a folder to zoom. Usage: deepsift zoom "src/features/auth"');
                await analyzeCommand(projectPath, commandArgs[0], format, compress);
                break;

            case 'memo':
            case 'm': {
                if (commandArgs.length === 0) {
                    throw new Error('Please provide an action.\nUsage: deepsift memo open "tag-name"\nActions: open, close, archive, purge, list, add, query, show, graph, export, prompt');
                }
                const memoAction = commandArgs[0];
                const memoTarget = commandArgs[1];
                await memoCommand(projectPath, memoAction, memoTarget, commandArgs.slice(2), format);
                break;
            }

            default:

                throw new Error(`Unknown command: "${command}"\nRun 'deepsift --help' for available commands.`);
        }
    } catch (err: any) {
        logError(projectPath, command, commandArgs, err);
        printError(err.message || String(err));
        process.exit(1);
    } finally {
        terminateWorkers();
        if (command !== 'memo' && command !== 'm' && format !== 'json') {
            try {
                const { MemoEngine } = await import('../memo/memo-engine.js');
                const engine = new MemoEngine(projectPath);
                const openTags = engine.getOpenTags();
                if (openTags.length > 0) {
                    const tagNames = openTags.map(t => t.name).join(', ');
                    printInfo(`\n\x1b[33m⚠️  [DRM REMINDER] You still have open research tags: [${tagNames}]\x1b[0m`);
                    printInfo(`\x1b[36m👉 Close them when task is done: deepsift memo close "<tag>"\x1b[0m`);
                }
            } catch {
                // Safe ignore
            }
        }
        process.exit(0);
    }
}

function resolveProjectPath(override?: string, args: string[] = []): string {
    let currentDir = process.cwd();

    if (override) {
        currentDir = path.resolve(process.cwd(), override);
    } else {
        // First check if current working directory or any parent is a valid project root
        let tempDir = currentDir;
        const rootPath = path.parse(tempDir).root;
        let insideProject = false;
        while (tempDir !== rootPath) {
            if (
                fs.existsSync(path.join(tempDir, '.deepsift')) ||
                fs.existsSync(path.join(tempDir, '.git')) ||
                fs.existsSync(path.join(tempDir, 'package.json')) ||
                fs.existsSync(path.join(tempDir, 'pubspec.yaml'))
            ) {
                insideProject = true;
                break;
            }
            tempDir = path.dirname(tempDir);
        }

        // Only try to infer project root from absolute path arguments if NOT already in a project
        if (!insideProject) {
            for (const arg of args) {
                if (path.isAbsolute(arg) && fs.existsSync(arg)) {
                    currentDir = fs.statSync(arg).isDirectory() ? arg : path.dirname(arg);
                    break;
                }
            }
        }
    }

    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
        if (
            fs.existsSync(path.join(currentDir, '.deepsift')) ||
            fs.existsSync(path.join(currentDir, '.git')) ||
            fs.existsSync(path.join(currentDir, 'package.json')) ||
            fs.existsSync(path.join(currentDir, 'pubspec.yaml'))
        ) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    
    // Fallback to the initially determined directory if no project markers are found
    return override ? path.resolve(process.cwd(), override) : process.cwd();
}

function ensureDeepsiftDir(projectPath: string) {
    const deepsiftDir = path.join(projectPath, '.deepsift');
    const outputsDir = path.join(deepsiftDir, 'outputs');
    if (!fs.existsSync(outputsDir)) {
        fs.mkdirSync(outputsDir, { recursive: true });
    }
}

main().catch((err) => {
    printError(err.message || String(err));
    process.exit(1);
});
