import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const targetName = 'deepsift-windows-x64';
const bundleFolder = path.join(releaseDir, targetName);

// Helper to copy directory recursively
function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function main() {
    console.log('=== Starting Release Packaging ===');

    // 1. Run local build
    console.log('Step 1: Compiling TypeScript & Native Zig math module...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

    // 2. Clean or create release folder
    console.log('Step 2: Preparing clean release directory...');
    if (fs.existsSync(bundleFolder)) {
        fs.rmSync(bundleFolder, { recursive: true, force: true });
    }
    fs.mkdirSync(bundleFolder, { recursive: true });

    // 3. Copy application dist directory
    console.log('Step 3: Copying dist files...');
    const srcDist = path.join(rootDir, 'dist');
    const destDist = path.join(bundleFolder, 'dist');
    if (fs.existsSync(srcDist)) {
        copyDirSync(srcDist, destDist);
    } else {
        throw new Error('Build failed: dist folder not found.');
    }

    // 4. Copy templates directory
    console.log('Step 4: Copying prompt templates...');
    const srcTemplates = path.join(rootDir, 'templates');
    const destTemplates = path.join(bundleFolder, 'templates');
    if (fs.existsSync(srcTemplates)) {
        copyDirSync(srcTemplates, destTemplates);
    }

    // 5. Copy deepsift-math native binary
    console.log('Step 5: Copying compiled Zig math binary...');
    const ext = process.platform === 'win32' ? '.exe' : '';
    const srcMathBin = path.join(rootDir, `bin/deepsift-math${ext}`);
    const destMathDir = path.join(bundleFolder, 'bin');
    const destMathBin = path.join(destMathDir, `deepsift-math${ext}`);
    
    if (fs.existsSync(srcMathBin)) {
        fs.mkdirSync(destMathDir, { recursive: true });
        fs.copyFileSync(srcMathBin, destMathBin);
        fs.chmodSync(destMathBin, 0o755);
        console.log('Zig math binary copied.');
    } else {
        console.warn('Warning: Native deepsift-math binary not found. JS fallbacks will be used.');
    }

    // 7. Copy package.json to bundle folder
    console.log('Step 7: Copying package configuration...');
    fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(bundleFolder, 'package.json'));

    // 8. Copy Node.js executable as portable runtime
    console.log('Step 8: Copying Node.js runtime...');
    const nodeBinDest = path.join(bundleFolder, process.platform === 'win32' ? 'node.exe' : 'node');
    fs.copyFileSync(process.execPath, nodeBinDest);
    fs.chmodSync(nodeBinDest, 0o755);
    console.log(`Copied Node.js runtime from: ${process.execPath}`);

    // 9. Write executable wrapper scripts
    console.log('Step 9: Writing launcher wrappers...');
    
    // Windows Batch Wrapper
    const winWrapperPath = path.join(bundleFolder, 'deepsift.cmd');
    const winWrapperContent = `@echo off
setlocal
set "NODE_EXE=%~dp0node.exe"
if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)
"%NODE_EXE%" "%~dp0dist\\cli\\cli-entry.js" %*
`;
    fs.writeFileSync(winWrapperPath, winWrapperContent, 'utf-8');

    // Unix Shell Wrapper (using LF explicitly)
    const unixWrapperPath = path.join(bundleFolder, 'deepsift');
    const unixWrapperContent = `#!/usr/bin/env bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [ -f "$DIR/node" ]; then
  NODE_EXE="$DIR/node"
else
  NODE_EXE="node"
fi
exec "$NODE_EXE" "$DIR/dist/cli/cli-entry.js" "$@"
`.replace(/\r\n/g, '\n'); // Ensure LF line endings
    fs.writeFileSync(unixWrapperPath, unixWrapperContent, 'utf-8');
    fs.chmodSync(unixWrapperPath, 0o755); // Make it executable

    // 10. Install production dependencies inside target folder
    console.log('Step 10: Installing production dependencies inside bundle...');
    execSync('npm install --omit=dev --no-audit --no-fund --legacy-peer-deps', { cwd: bundleFolder, stdio: 'inherit' });

    // 11. Zip target directory using PowerShell on Windows
    if (process.platform === 'win32') {
        console.log('Step 11: Zipping release folder...');
        const zipPath = path.join(releaseDir, `${targetName}.zip`);
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
        
        // Use PowerShell to compress the folder
        const zipCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${bundleFolder}' -DestinationPath '${zipPath}' -Force"`;
        execSync(zipCmd, { stdio: 'inherit' });
        console.log(`Successfully zipped bundle: ${zipPath}`);
    }

    console.log('\n=== Release Package Created Successfully! ===');
    console.log(`Location: ${bundleFolder}`);
    if (process.platform === 'win32') {
        console.log(`ZIP Archive: ${path.join(releaseDir, `${targetName}.zip`)}`);
    }
}

main().catch(err => {
    console.error('Release packaging failed:', err);
    process.exit(1);
});
