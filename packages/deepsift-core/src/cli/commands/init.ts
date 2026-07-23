import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { NativeStore } from '../../storage/native-store.js';
import { Indexer } from '../../core/indexer.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { dnaCommand } from './dna.js';
import { loadConfig, saveConfig } from '../../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_IGNORED_DIRS = new Set([
    'node_modules', '.git', '.deepsift', '.idea', '.vscode', '.gradle',
    '.dart_tool', 'coverage', '.next', '.cache', '.zig-cache', 'zig-out',
    '.mcp_search_outputs'
]);

const RECOMMENDED_SRC_NAMES = new Set([
    'src', 'lib', 'packages', 'app', 'core', 'features', 'scripts',
    'backend', 'web', 'tools', 'ai', 'server', 'client', 'test', 'tests',
    'spec', 'components', 'pages', 'api', 'domain', 'data', 'services'
]);

const ASSET_OR_BUILD_NAMES = new Set([
    'dist', 'build', 'assets', 'public', 'icon_temp', 'ver', 'coverage',
    'out', 'release', 'bin', 'obj', 'temp', 'tmp', 'scratch'
]);

const CODE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs', '.java', '.kt', '.swift',
    '.c', '.cpp', '.h', '.hpp', '.cs', '.rb', '.php', '.vue', '.svelte', '.astro', '.ex',
    '.exs', '.zig', '.nim', '.lua', '.sql', '.sh', '.bat', '.ps1',
    '.json', '.yaml', '.yml', '.toml', '.xml', '.html', '.css', '.scss', '.sass', '.less',
    '.md', '.txt', '.graphql', '.proto', '.env'
]);

interface DirChoiceItem {
    name: string;
    value: string;
    checked: boolean;
}

interface ExtChoiceItem {
    name: string;
    value: string;
    checked: boolean;
}

function scanProjectDirectories(projectPath: string): DirChoiceItem[] {
    const choices: DirChoiceItem[] = [];
    let entries: fs.Dirent[] = [];
    try {
        entries = fs.readdirSync(projectPath, { withFileTypes: true });
    } catch {
        return choices;
    }

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const name = entry.name;
        if (name.startsWith('.') || SYSTEM_IGNORED_DIRS.has(name)) continue;

        let fileCount = 0;
        try {
            const subEntries = fs.readdirSync(path.join(projectPath, name));
            fileCount = subEntries.length;
        } catch { /* skip */ }

        const nameLower = name.toLowerCase();
        const isRecommended = RECOMMENDED_SRC_NAMES.has(nameLower);
        const isAssetBuild = ASSET_OR_BUILD_NAMES.has(nameLower);

        let checked = true;
        let tag = '[Source Folder]';
        if (isAssetBuild) {
            checked = false;
            tag = '[Build/Assets/Extra]';
        } else if (isRecommended) {
            checked = true;
            tag = '[Recommended Source]';
        }

        choices.push({
            name: `📁 ${name}/ (${fileCount} items) ${tag}`,
            value: name,
            checked
        });
    }

    choices.sort((a, b) => (b.checked ? 1 : 0) - (a.checked ? 1 : 0));
    return choices;
}

function scanProjectExtensions(projectPath: string): ExtChoiceItem[] {
    const extCounts = new Map<string, number>();

    function walkScan(dir: string, depth: number) {
        if (depth > 6) return;
        let entries: fs.Dirent[] = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch { return; }

        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (entry.name.startsWith('.') || SYSTEM_IGNORED_DIRS.has(entry.name) || ASSET_OR_BUILD_NAMES.has(entry.name.toLowerCase())) {
                    continue;
                }
                walkScan(path.join(dir, entry.name), depth + 1);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext && ext.length > 1) {
                    extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
                }
            }
        }
    }

    walkScan(projectPath, 0);

    const choices: ExtChoiceItem[] = [];
    for (const [ext, count] of extCounts.entries()) {
        const isCode = CODE_EXTENSIONS.has(ext);
        choices.push({
            name: `${ext} (${count} files) ${isCode ? '[Code/Logic/Config]' : '[Asset/Binary/Media]'}`,
            value: ext,
            checked: isCode
        });
    }

    choices.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? -1 : 1;
        const countA = parseInt((a.name.match(/\((\d+) files\)/) || [])[1] || '0', 10);
        const countB = parseInt((b.name.match(/\((\d+) files\)/) || [])[1] || '0', 10);
        return countB - countA;
    });

    return choices;
}

async function runInteractiveConfigWizard(projectPath: string) {
    if (!process.stdin.isTTY) {
        return;
    }

    try {
        const { checkbox } = await import('@inquirer/prompts');

        printInfo('\n✨ DeepSift Interactive Configuration Setup ✨');

        // 1. Scan & Prompt Directories
        const dirChoices = scanProjectDirectories(projectPath);
        let selectedDirs: string[] = [];
        if (dirChoices.length > 0) {
            try {
                selectedDirs = await checkbox({
                    message: '📁 Select Top-Level Directories to Index:',
                    choices: dirChoices,
                    pageSize: 15
                });
            } catch {
                selectedDirs = dirChoices.filter(c => c.checked).map(c => c.value);
            }
        }

        // 2. Scan & Prompt File Extensions
        const extChoices = scanProjectExtensions(projectPath);
        let selectedExts: string[] = [];
        if (extChoices.length > 0) {
            try {
                selectedExts = await checkbox({
                    message: '📄 Select File Extensions to Index (Code formats auto-selected):',
                    choices: extChoices,
                    pageSize: 15
                });
            } catch {
                selectedExts = extChoices.filter(c => c.checked).map(c => c.value);
            }
        }

        // 3. Update & Save deepsift.config.json
        const config = loadConfig(projectPath);
        const allDirValues = dirChoices.map(c => c.value);
        const excludedDirs = allDirValues.filter(d => !selectedDirs.includes(d));
        const allExtValues = extChoices.map(c => c.value);
        const excludedExts = allExtValues.filter(e => !selectedExts.includes(e));

        config.indexer = {
            ...config.indexer,
            includeDirs: selectedDirs,
            excludeDirs: Array.from(new Set([...(config.indexer?.excludeDirs || []), ...excludedDirs])),
            includeExtensions: selectedExts,
            excludeExtensions: Array.from(new Set([...(config.indexer?.excludeExtensions || []), ...excludedExts]))
        };

        saveConfig(projectPath, config);
        printSuccess('Saved custom configuration → deepsift.config.json');
        if (selectedDirs.length > 0) printInfo(`Included Folders: ${selectedDirs.join(', ')}`);
        if (selectedExts.length > 0) printInfo(`Included Formats: ${selectedExts.join(', ')}`);
        printInfo('');
    } catch (err: any) {
        printError(`Interactive prompt error: ${err.message}`);
    }
}

function getTemplateContent(filename: string): string {
    const templatePath = path.resolve(__dirname, `../../templates/${filename}`);
    const fallbackPath = path.resolve(__dirname, `../../../templates/${filename}`);
    
    if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
    } else if (fs.existsSync(fallbackPath)) {
        return fs.readFileSync(fallbackPath, 'utf-8');
    }
    return '';
}

function getTemplateDirFiles(dirPath: string): { name: string, content: string }[] {
    const templateDirPath = path.resolve(__dirname, `../../templates/${dirPath}`);
    const fallbackDirPath = path.resolve(__dirname, `../../../templates/${dirPath}`);
    
    let activePath = '';
    if (fs.existsSync(templateDirPath)) {
        activePath = templateDirPath;
    } else if (fs.existsSync(fallbackDirPath)) {
        activePath = fallbackDirPath;
    }
    
    if (!activePath) return [];
    
    const results = [];
    const files = fs.readdirSync(activePath);
    for (const file of files) {
        const fullPath = path.join(activePath, file);
        if (fs.statSync(fullPath).isFile()) {
            results.push({
                name: file,
                content: fs.readFileSync(fullPath, 'utf-8')
            });
        }
    }
    return results;
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

    await runInteractiveConfigWizard(projectPath);

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

    // Inject Rules
    const agentsFilePath = path.join(agentsDir, 'deepsift.md');
    const ruleTemplate = getTemplateContent('agent-instructions.md');
    if (ruleTemplate && (!fs.existsSync(agentsFilePath) || fs.readFileSync(agentsFilePath, 'utf-8') !== ruleTemplate)) {
        fs.writeFileSync(agentsFilePath, ruleTemplate, 'utf-8');
        printSuccess('Injected updated DeepSift agent instructions → .agents/rules/deepsift.md');
    }

    // Inject Image (Legacy Support)
    const imageDestPath = path.join(agentsDir, 'deepsift-directive.png');
    const imageSrcPath = path.resolve(__dirname, '../../templates/deepsift-directive.png');
    const fallbackImageSrcPath = path.resolve(__dirname, '../../../templates/deepsift-directive.png');
    if (fs.existsSync(imageSrcPath)) fs.copyFileSync(imageSrcPath, imageDestPath);
    else if (fs.existsSync(fallbackImageSrcPath)) fs.copyFileSync(fallbackImageSrcPath, imageDestPath);

    // Inject Skill
    const skillsDir = path.join(projectPath, '.agents', 'skills', 'deepsift-mastery');
    if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });
    const skillFilePath = path.join(skillsDir, 'SKILL.md');
    const skillTemplate = getTemplateContent('skill-mastery.md');
    if (skillTemplate && (!fs.existsSync(skillFilePath) || fs.readFileSync(skillFilePath, 'utf-8') !== skillTemplate)) {
        fs.writeFileSync(skillFilePath, skillTemplate, 'utf-8');
        printSuccess('Injected DeepSift mastery skill → .agents/skills/deepsift-mastery/SKILL.md');
    }

    // Inject Workflow
    const workflowsDir = path.join(projectPath, '.agents', 'workflows');
    if (!fs.existsSync(workflowsDir)) fs.mkdirSync(workflowsDir, { recursive: true });
    const workflowFilePath = path.join(workflowsDir, 'deepsift.md');
    const workflowTemplate = getTemplateContent('workflow.md');
    if (workflowTemplate && (!fs.existsSync(workflowFilePath) || fs.readFileSync(workflowFilePath, 'utf-8') !== workflowTemplate)) {
        fs.writeFileSync(workflowFilePath, workflowTemplate, 'utf-8');
        printSuccess('Injected DeepSift workflow → .agents/workflows/deepsift.md');
    }

    // Inject Documentation
    const docsDir = path.join(projectPath, '.deepsift', 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    // Inject comprehensive manuals from templates/doc/
    const docFiles = getTemplateDirFiles('doc');
    for (const file of docFiles) {
        const destPath = path.join(docsDir, file.name);
        if (!fs.existsSync(destPath) || fs.readFileSync(destPath, 'utf-8') !== file.content) {
            fs.writeFileSync(destPath, file.content, 'utf-8');
            printSuccess(`Injected DeepSift Manual → .deepsift/docs/${file.name}`);
        }
    }

    printInfo('Running index...');
    let dnaNeedsUpdate = true;
    try {
        const store = new NativeStore(getDbPath(projectPath));
        const indexer = new Indexer(store);
        const stats = await indexer.indexProject(projectPath, false, (current, total, file) => {
            const msg = `Indexing: ${current}/${total} files (Processing: ${file})`;
            const termWidth = process.stdout.columns || 80;
            const displayMsg = msg.length > termWidth ? msg.substring(0, termWidth - 4) + '...)' : msg;
            
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(displayMsg);
        });
        process.stdout.write('\n'); // newline after progress
        printSuccess(`Index complete: ${stats.files} files processed, ${stats.chunks} chunks.`);
        
        // Check if DNA exists
        const dnaExists = fs.existsSync(path.join(projectPath, '.deepsift', 'project-dna.json'));
        if (dnaExists && stats.newOrUpdated === 0 && stats.deleted === 0) {
            dnaNeedsUpdate = false;
        }
    } catch (err: any) {
        printError(`Indexing failed: ${err.message}`);
    }

    if (dnaNeedsUpdate) {
        try {
            printInfo('Generating Project DNA...');
            await dnaCommand(projectPath, false, 'plain');
        } catch (err: any) {
            printError(`DNA generation failed: ${err.message}`);
        }
    } else {
        printSuccess('DNA is already up-to-date. Skipping DNA generation.');
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
