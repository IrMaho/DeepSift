import path from 'path';
import { TypeResolver } from '../../analyzers/type-resolver.js';
import { printHeader, printBox, printSuccess, printError } from '../cli-output.js';

export async function expandTypeCommand(symbolName: string, options: { json?: boolean } = {}) {
    if (!symbolName) {
        printError('Please specify a symbol name to expand (e.g. deepsift expand-type ColorState)');
        return;
    }

    const projectPath = process.cwd();
    const resolver = new TypeResolver(projectPath);
    const result = resolver.resolve(symbolName);

    if (!result) {
        printError(`Symbol '${symbolName}' not found in type indexing.`);
        return;
    }

    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    printHeader(`📐 AST Type Definition: ${result.symbol}`);
    console.log(`\x1b[33mKind:\x1b[0m ${result.kind} | \x1b[33mFile:\x1b[0m ${result.filePath}:${result.startLine}-${result.endLine}\n`);

    if (result.fields.length > 0) {
        console.log(`\x1b[36mFields (${result.fields.length}):\x1b[0m`);
        result.fields.forEach(f => {
            console.log(`  - ${f.name}${f.optional ? '?' : ''}: \x1b[32m${f.type}\x1b[0m`);
        });
        console.log('\n\x1b[33mFull AST Source:\x1b[0m');
    }

    printBox(result.rawCode, `${result.filePath}:${result.startLine}`);
}
