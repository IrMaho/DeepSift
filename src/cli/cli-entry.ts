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
import { scanCommand } from './commands/scan.js';
import { resolveCommand } from './commands/resolve.js';
import { contextCommand } from './commands/context.js';
import { readCommand } from './commands/read.js';
import { editCommand } from './commands/edit.js';
import { terminateWorkers } from '../core/embedder.js';
import fs from 'fs';

const VERSION = '1.0.0';

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
                                    --offset <number>     Start index for pagination of array items
                                    --path-filter <path>  Filter DNA records by file path prefix
                                    --meta                Only return metadata and record counts (no content)
  scan <target>                 Run a specific analyzer (tokens|i18n|duplicates|conventions|assets)
  context "path"                Generate a pre-creation checklist for a new component/feature
  search "query" ["query2" ...]  Semantic search (single or multi-query) enhanced with Graphify PageRank.
                                  Results are automatically boosted based on architectural importance (God Nodes) and community detection.
                                  Options:
                                    --include, -i <path>  Only search within path
                                    --no-sync, -n         Skip index synchronization
                                    --verbose, -v         Show file indexing progress
  index [--force]               Index/re-index the project
                                  Options:
                                    --verbose, -v         Show files being processed
  status                        Show index statistics
  watch, w                      Start background watcher for real-time indexing
  arch [--depth N]              Project architecture blueprint utilizing Graphify communities.
  deps "target"                 Trace dependencies for a file/module
  feature "path"                Feature outline (classes, functions)
  history                       Show past search results
  clean                         Clear search history logs and index
  drill "logfile" "keyword"     Deep-search within a previous result
  resolve "token"               Decode a compressed token from the last search result
  read "file1" ["file2"...]     Read file contents and output compressed tokens (Supports line ranges: file:10-50)
  edit "patch.json"             Apply a batch of string replacements across multiple files

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
  deepsift search "db setup" --no-sync
  deepsift index --force --verbose
  deepsift arch --depth 3
`;

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
                const skipSync = commandArgs.includes('--no-sync') || commandArgs.includes('-n');
                const verboseSearch = commandArgs.includes('--verbose') || commandArgs.includes('-v');
                
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

                const searchQueries = commandArgs.filter((arg, idx) => {
                    if (arg.startsWith('-')) return false;
                    if (idx > 0 && (commandArgs[idx - 1] === '--include' || commandArgs[idx - 1] === '-i')) return false;
                    if (idx > 0 && (commandArgs[idx - 1] === '--context-lines' || commandArgs[idx - 1] === '-C')) return false;
                    return true;
                });
                
                if (searchQueries.length === 0) {
                    throw new Error('Please provide at least one search query.\nUsage: deepsift search "your query"');
                }
                await searchCommand(projectPath, searchQueries, format, skipSync, verboseSearch, filterPath, compress, contextLines);
                break;

            case 'read':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide at least one target file.\nUsage: deepsift read "src/file.ts" or "src/file.ts:10-50"');
                }
                const targets = commandArgs.filter((arg) => !arg.startsWith('-'));
                await readCommand(projectPath, targets, format, compress);
                break;

            case 'edit':
            case 'e':
                if (commandArgs.length === 0) {
                    throw new Error('Please provide a patch JSON file.\nUsage: deepsift edit "patch.json"');
                }
                await editCommand(projectPath, commandArgs[0], format);
                break;

            case 'index':
            case 'i':
                const force = commandArgs.includes('--force') || commandArgs.includes('-f');
                const verboseIndex = commandArgs.includes('--verbose') || commandArgs.includes('-v');
                await indexCommand(projectPath, force, format, verboseIndex);
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
                let maxDepth = 5;
                const depthIdx = commandArgs.indexOf('--depth');
                if (depthIdx !== -1 && commandArgs[depthIdx + 1]) {
                    maxDepth = parseInt(commandArgs[depthIdx + 1], 10) || 5;
                }
                await archCommand(projectPath, maxDepth, format, compress);
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
                await featureCommand(projectPath, commandArgs[0], format, compress);
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


            default:
                throw new Error(`Unknown command: "${command}"\nRun 'deepsift --help' for available commands.`);
        }
    } catch (err: any) {
        printError(err.message || String(err));
        process.exit(1);
    } finally {
        terminateWorkers();
    }
}

function resolveProjectPath(override?: string, args: string[] = []): string {
    let currentDir = process.cwd();

    if (override) {
        currentDir = path.resolve(process.cwd(), override);
    } else {
        // Try to infer project root if an absolute path is provided in args
        for (const arg of args) {
            if (path.isAbsolute(arg) && fs.existsSync(arg)) {
                currentDir = fs.statSync(arg).isDirectory() ? arg : path.dirname(arg);
                break;
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
