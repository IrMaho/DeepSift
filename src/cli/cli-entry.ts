#!/usr/bin/env node

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
  feature "path"                Feature outline (classes, functions)
                                   Options:
                                     --limit <number>      Limit the number of files returned
                                     --offset <number>      Start file index for pagination
  read-feature, rf "path"       Read and extract all code from a feature directory
  history                       Show past search results
  clean                         Clear search history logs and index
  drill "logfile" "keyword"     Deep-search within a previous result
  resolve "token"               Decode a compressed token from the last search result
  read "file1" ["file2"...]     Read file contents and output compressed tokens (Supports line ranges: file:10-50)
  diag "problems.json"          Read IDE problem diagnostics and output precise code snippets
  com "command"                 Execute any shell command and return compressed output
  plan "request"                Generate a Smart Plan by analyzing DNA, skills, realms, and architecture
  heal "file"                   Attempt to fix issues in a file using the project DNA and context
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

    const { format, compress, cleanArgs, projectPathOverride } = parseGlobalFlags(rawArgs);
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
                
                const targetPath = commandArgs.filter(a => !a.startsWith('-') && commandArgs[commandArgs.indexOf(a) - 1] !== '--limit' && commandArgs[commandArgs.indexOf(a) - 1] !== '--offset')[0];
                
                await analyzeCommand(projectPath, targetPath || commandArgs[0], format, compress, limit, offset);
                break;
            }

            case 'deps':
            case 'd':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a target name.\nUsage: deepsift deps "filename"');
                }
                await depsCommand(projectPath, commandArgs[0], format, compress);
                break;

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
                
                const targetFeaturePath = commandArgs.filter(a => !a.startsWith('-') && commandArgs[commandArgs.indexOf(a) - 1] !== '--limit' && commandArgs[commandArgs.indexOf(a) - 1] !== '--offset')[0];

                await featureCommand(projectPath, targetFeaturePath || commandArgs[0], format, compress, featLimit, featOffset);
                break;

            case 'history':
            case 'h':
                historyCommand(projectPath, format);
                break;

            case 'clean':
            case 'c':
                cleanHistoryCommand(projectPath, format);
                break;

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
