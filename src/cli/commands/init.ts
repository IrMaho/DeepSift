import fs from 'fs';
import path from 'path';
import { NativeStore } from '../../storage/native-store.js';
import { Indexer } from '../../core/indexer.js';
import { printInfo, printSuccess, printError } from '../cli-output.js';
import { getDbPath } from '../cli-paths.js';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { dnaCommand } from './dna.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    printInfo('Running index...');
    let dnaNeedsUpdate = true;
    try {
        const store = new NativeStore(getDbPath(projectPath));
        const indexer = new Indexer(store);
        const stats = await indexer.indexProject(projectPath, false, (current, total, file) => {
            process.stdout.write(`\rIndexing: ${current}/${total} files (Processing: ${file})`);
            process.stdout.write('\x1b[K');
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
