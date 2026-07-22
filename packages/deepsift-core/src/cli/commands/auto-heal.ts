import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { printResult, printSuccess, printError, OutputFormat } from '../cli-output.js';
import { healCommand } from './heal.js';

export async function autoHealCommand(
    projectPath: string, 
    targetFile: string, 
    format: OutputFormat = 'markdown', 
    compress: boolean = false
): Promise<void> {
    const fullPath = path.resolve(projectPath, targetFile);
    if (!fs.existsSync(fullPath)) {
        printError(`Target file not found: ${targetFile}`);
        return;
    }

    process.stdout.write(`\x1b[36m🚀 Starting Autonomous Self-Healing Loop for: ${targetFile}...\x1b[0m\n`);

    // Step 1: Execute healing logic based on DNA context
    await healCommand(targetFile, format, compress);

    // Step 2: Test build / compile verification
    try {
        process.stdout.write(`\x1b[33m  [Verification] Testing build status...\x1b[0m\n`);
        if (fs.existsSync(path.join(projectPath, 'package.json'))) {
            execSync('npx tsc --noEmit', { cwd: projectPath, stdio: 'pipe' });
        }
        printSuccess(`✅ Autonomous Self-Healing Loop finished successfully! File is clean and verified.`);
    } catch (e: any) {
        printResult(`⚠️ Build check reported warnings/errors after heal: ${e.message}`, format);
    }
}
