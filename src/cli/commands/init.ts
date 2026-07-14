import fs from 'fs';
import path from 'path';
import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTemplatePath(): string {
    return path.resolve(__dirname, '../../templates/agent-instructions.md');
}

function getTemplateContent(): string {
    const templatePath = getTemplatePath();
    if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
    }

    const srcTemplatePath = path.resolve(__dirname, '../../../templates/agent-instructions.md');
    if (fs.existsSync(srcTemplatePath)) {
        return fs.readFileSync(srcTemplatePath, 'utf-8');
    }

    return getFallbackTemplate();
}

function getFallbackTemplate(): string {
    return `---
trigger: always_on
---

# 🔍 DeepSift — Semantic Codebase Search (CLI Mode)

You have access to **DeepSift**, a powerful local semantic search engine.
It runs entirely on your machine — no API calls, no internet needed.
Use the terminal commands below to search, analyze, and understand the codebase.

## 🛠 Available Commands

| Command | Description |
|---|---|
| \`deepsift search "query"\` | Semantic search. Options: \`--include\` or \`-i <path>\` (filter path), \`--no-sync\` or \`-n\` (skip index update), \`--verbose\` or \`-v\` (show file index progress), \`--context-lines N\` or \`-C N\` (show N lines of context around matches) |
| \`deepsift search "q1" "q2" "q3"\` | Multi-query batch search (saves time) |
| \`deepsift index\` | Re-index the project (incremental). Options: \`--verbose\` or \`-v\` (show files being indexed) |
| \`deepsift index --force\` | Full re-index from scratch |
| \`deepsift status\` | Check index statistics |
| \`deepsift config\` | Interactive menu to configure which directories are indexed |
| \`deepsift arch\` | Get project architecture blueprint (options: \`--depth N\` to limit tree depth) |
| \`deepsift deps "filename"\` | Find which files import/depend on a target |
| \`deepsift feature "src/path"\` | Get feature outline (classes, functions, imports) |
| \`deepsift history\` | Read past search results (avoid redundant searches) |
| \`deepsift clean\` | Clear search history logs and index |
| \`deepsift drill "logfile.md" "keyword"\` | Deep-search within previous results |
| \`deepsift resolve "token"\` | Decode a compressed token from the most recent cached dictionary |

## 📋 Usage Rules

1. **ALWAYS** run \`deepsift history\` before performing a new search to check if the answer already exists.
2. Results are cached in \`.deepsift/outputs/\` — read cached files before re-searching.
3. Use multi-query (\`deepsift search "q1" "q2"\`) when you have multiple questions.
4. Use \`--json\` flag for machine-readable output.
5. Use \`--plain\` flag for plain text without markdown formatting.
6. Search results are compressed by default to save tokens (using DEC_v2 standard). If you need raw, uncompressed text outputs, use the \`--no-compress\` global flag.
7. **Smart Compression:** File paths, line references (\`[path:L1-L2]\`), scores, code fences, and structural markers are **NEVER compressed** — they always appear verbatim and are reliable for navigation.
8. If you encounter a compressed token you cannot decode, run \`deepsift resolve "token"\` to look up the original value from the cached dictionary.
9. Use \`--context-lines N\` or \`-C N\` to retrieve surrounding code for better context (e.g. \`-C 10\`).
10. After major refactors, run \`deepsift index --force\` to rebuild the index.

## 💡 Examples

\`\`\`bash
# Find authentication logic
deepsift search "authentication login handler"

# Multiple questions at once
deepsift search "database connection setup" "error handling middleware" "user validation"

# Understand project structure
deepsift arch

# Find who uses a specific module
deepsift deps "auth-service.ts"

# Get overview of a feature directory
deepsift feature "src/features/auth"

# Decode a compressed token you cannot understand
deepsift resolve "0A"

# Configure which folders to index
deepsift config
\`\`\`
`;
}

function compileZigOnDemand() {
    const ext = process.platform === 'win32' ? '.exe' : '';
    // Resolving bin/ relative to dist/cli/commands/init.js
    const binPath = path.resolve(__dirname, `../../bin/deepsift-math${ext}`);
    const binDir = path.dirname(binPath);
    if (fs.existsSync(binPath)) {
        return; // Already compiled
    }

    try {
        execSync('zig version', { stdio: 'ignore' });
    } catch (err) {
        // Zig not on path, fallback to TS
        return;
    }

    printInfo('Native math binary missing but Zig compiler detected. Compiling on-demand...');
    try {
        const zigProjectDir = path.resolve(__dirname, '../../../../native/core-zig');
        if (!fs.existsSync(zigProjectDir)) {
            const workspaceZigDir = path.resolve(__dirname, '../../../native/core-zig');
            if (fs.existsSync(workspaceZigDir)) {
                runZigBuild(workspaceZigDir, binDir, binPath, ext);
            }
            return;
        }
        runZigBuild(zigProjectDir, binDir, binPath, ext);
    } catch (err: any) {
        printError(`On-demand compilation failed: ${err.message}. Using JS fallback.`);
    }
}

function runZigBuild(zigDir: string, binDir: string, binPath: string, ext: string) {
    if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
    }
    execSync('zig build -Doptimize=ReleaseFast', { cwd: zigDir, stdio: 'ignore' });
    const srcPath = path.join(zigDir, `zig-out/bin/deepsift-math${ext}`);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, binPath);
        fs.chmodSync(binPath, 0o755);
        printSuccess('Successfully compiled native Zig module on-demand!');
    }
}

export async function initCommand(projectPath: string) {
    compileZigOnDemand();
    printInfo(`Initializing DeepSift for: ${projectPath}`);

    const deepsiftDir = path.join(projectPath, '.deepsift');
    const outputsDir = path.join(deepsiftDir, 'outputs');
    if (!fs.existsSync(outputsDir)) {
        fs.mkdirSync(outputsDir, { recursive: true });
        printSuccess('Created .deepsift/ directory');
    }

    const gitignorePath = path.join(projectPath, '.gitignore');
    injectGitignoreEntry(gitignorePath);

    const agentsDir = path.join(projectPath, '.agents', 'rules');
    if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
    }

    const agentsFilePath = path.join(agentsDir, 'deepsift.md');
    const template = getTemplateContent();
    if (!fs.existsSync(agentsFilePath) || fs.readFileSync(agentsFilePath, 'utf-8') !== template) {
        fs.writeFileSync(agentsFilePath, template, 'utf-8');
        printSuccess('Injected updated DeepSift agent instructions → .agents/rules/deepsift.md');
    } else {
        printInfo('Agent instructions are up-to-date, skipping injection.');
    }

    printInfo('Running initial index...');
    try {
        const store = new SQLiteStore(getDbPath(projectPath));
        const indexer = new Indexer(store);
        const stats = await indexer.indexProject(projectPath, false, (current, total, file) => {
            process.stdout.write(`\rIndexing: ${current}/${total} files (Processing: ${file})`);
            process.stdout.write('\x1b[K');
        });
        process.stdout.write('\n'); // newline after progress
        printSuccess(`Initial index complete: ${stats.files} files, ${stats.chunks} chunks`);
    } catch (err: any) {
        printError(`Indexing failed: ${err.message}`);
    }

    printSuccess('DeepSift is ready! The AI agent can now use terminal commands to search your codebase.');
    printInfo('Tell your AI agent: "Use deepsift commands to search and understand this codebase"');
}

function injectGitignoreEntry(gitignorePath: string) {
    const entry = '.deepsift/';
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        if (!content.includes(entry)) {
            fs.appendFileSync(gitignorePath, `\n# DeepSift local cache\n${entry}\n`);
            printSuccess('Added .deepsift/ to .gitignore');
        }
    } else {
        fs.writeFileSync(gitignorePath, `# DeepSift local cache\n${entry}\n`);
        printSuccess('Created .gitignore with .deepsift/ entry');
    }
}
