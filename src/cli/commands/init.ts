import fs from 'fs';
import path from 'path';
import { SQLiteStore } from '../../storage/sqlite-store.js';
import { Indexer } from '../../core/indexer.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';
import { fileURLToPath } from 'url';

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
| \`deepsift search "query"\` | Semantic search. Options: \`--include\` or \`-i <path>\` (filter path), \`--no-sync\` or \`-n\` (skip index update), \`--verbose\` or \`-v\` (show file index progress) |
| \`deepsift search "q1" "q2" "q3"\` | Multi-query batch search (saves time) |
| \`deepsift index\` | Re-index the project (incremental). Options: \`--verbose\` or \`-v\` (show files being indexed) |
| \`deepsift index --force\` | Full re-index from scratch |
| \`deepsift status\` | Check index statistics |
| \`deepsift arch\` | Get project architecture blueprint (options: \`--depth N\` to limit tree depth) |
| \`deepsift deps "filename"\` | Find which files import/depend on a target |
| \`deepsift feature "src/path"\` | Get feature outline (classes, functions, imports) |
| \`deepsift history\` | Read past search results (avoid redundant searches) |
| \`deepsift clean\` | Clear search history logs and index |
| \`deepsift drill "logfile.md" "keyword"\` | Deep-search within previous results |

## 📋 Usage Rules

1. **ALWAYS** run \`deepsift history\` before performing a new search to check if the answer already exists.
2. Results are cached in \`.deepsift/outputs/\` — read cached files before re-searching.
3. Use multi-query (\`deepsift search "q1" "q2"\`) when you have multiple questions.
4. Use \`--json\` flag for machine-readable output.
5. Use \`--plain\` flag for plain text without markdown formatting.
6. Search results are compressed by default to save tokens (using DEC_v2 standard). If you need raw, uncompressed text outputs, use the \`--no-compress\` global flag.
7. After major refactors, run \`deepsift index --force\` to rebuild the index.

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
\`\`\`
`;
}

export async function initCommand(projectPath: string) {
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
    if (!fs.existsSync(agentsFilePath)) {
        const template = getTemplateContent();
        fs.writeFileSync(agentsFilePath, template, 'utf-8');
        printSuccess('Injected DeepSift agent instructions → .agents/rules/deepsift.md');
    } else {
        printInfo('Agent instructions already exist, skipping injection.');
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
