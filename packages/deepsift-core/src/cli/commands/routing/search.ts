import { searchCommand } from '../search.js';
import { OutputFormat } from '../../cli-output.js';

export async function handleSearchCommand(
    commandArgs: string[],
    projectPath: string,
    format: OutputFormat,
    compress: boolean
): Promise<void> {
    const skipSync = !commandArgs.includes('--sync');
    const verboseSearch = commandArgs.includes('--verbose') || commandArgs.includes('-v');
    const allRealmsSearch = commandArgs.includes('--all-realms');
    const noVisual = commandArgs.includes('--no-visual') || commandArgs.includes('--plain') || format === 'plain' || !compress;
    const showContext = commandArgs.includes('--context');
    const allResults = commandArgs.includes('--all');
    
    let filterPath: string | undefined;
    const includeIdx = commandArgs.findIndex(arg => arg === '--include' || arg === '-i' || arg === '--path' || arg === '--scope');
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

    let searchLimit: number | undefined;
    const searchLimitIdx = commandArgs.findIndex(arg => arg === '--limit' || arg === '-l' || arg === '--top');
    if (searchLimitIdx !== -1 && commandArgs[searchLimitIdx + 1]) {
        searchLimit = parseInt(commandArgs[searchLimitIdx + 1], 10);
        if (isNaN(searchLimit)) searchLimit = undefined;
    }

    const searchQueries = commandArgs.filter((arg, idx) => {
        if (arg.startsWith('-')) return false;
        if (idx > 0 && (commandArgs[idx - 1] === '--include' || commandArgs[idx - 1] === '-i' || commandArgs[idx - 1] === '--path' || commandArgs[idx - 1] === '--scope')) return false;
        if (idx > 0 && (commandArgs[idx - 1] === '--context-lines' || commandArgs[idx - 1] === '-C')) return false;
        if (idx > 0 && commandArgs[idx - 1] === '--realm') return false;
        if (idx > 0 && (commandArgs[idx - 1] === '--limit' || commandArgs[idx - 1] === '-l' || commandArgs[idx - 1] === '--top')) return false;
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
        noVisual,
        limit: searchLimit,
        showContext,
        allResults
    });
}
