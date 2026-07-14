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
import { resolveCommand } from './commands/resolve.js';
import { terminateWorkers } from '../core/embedder.js';
import fs from 'fs';

const VERSION = '1.0.0';

const HELP_TEXT = `
\x1b[36m🔍 DeepSift v${VERSION}\x1b[0m — Semantic Codebase Search (CLI)

\x1b[33mUsage:\x1b[0m
  deepsift <command> [options]

\x1b[33mCommands:\x1b[0m
  init                          Initialize DeepSift for the current project
  config                        Interactive menu to configure DeepSift (e.g. excluded folders)
  search "query" ["query2" ...]  Semantic search (single or multi-query)
                                  Options:
                                    --include, -i <path>  Only search within path
                                    --no-sync, -n         Skip index synchronization
                                    --verbose, -v         Show file indexing progress
  index [--force]               Index/re-index the project
                                  Options:
                                    --verbose, -v         Show files being processed
  status                        Show index statistics
  watch, w                      Start background watcher for real-time indexing
  arch [--depth N]              Project architecture blueprint
  deps "target"                 Trace dependencies for a file/module
  feature "path"                Feature outline (classes, functions)
  history                       Show past search results
  clean                         Clear search history logs and index
  drill "logfile" "keyword"     Deep-search within a previous result
  resolve "token"               Decode a compressed token from the last search result

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

    const { format, compress, cleanArgs } = parseGlobalFlags(rawArgs);
    const command = cleanArgs[0];
    const commandArgs = cleanArgs.slice(1);
    const projectPath = resolveProjectPath();

    ensureDeepsiftDir(projectPath);

    try {
        switch (command) {
            case 'init':
                await initCommand(projectPath);
                break;

            case 'config':
                await configCommand(projectPath);
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
                archCommand(projectPath, maxDepth, format, compress);
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
                featureCommand(projectPath, commandArgs[0], format, compress);
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

function resolveProjectPath(): string {
    return process.cwd();
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
