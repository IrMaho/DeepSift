import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const zigProjectDir = path.join(rootDir, 'native/core-zig');
const binDir = path.join(rootDir, 'bin');

async function main() {
    console.log('Checking for Zig compiler...');
    try {
        execSync('zig version', { stdio: 'ignore' });
    } catch (err) {
        console.log('Zig compiler not found on PATH. Skipping native compilation (will use JS fallback).');
        return;
    }

    console.log('Zig found. Compiling native math module...');
    try {
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }

        // Run zig build
        execSync('zig build -Doptimize=ReleaseFast', { cwd: zigProjectDir, stdio: 'inherit' });

        // Copy built binary to bin/
        const ext = process.platform === 'win32' ? '.exe' : '';
        const srcPath = path.join(zigProjectDir, `zig-out/bin/deepsift-math${ext}`);
        const destPath = path.join(binDir, `deepsift-math${ext}`);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            fs.chmodSync(destPath, 0o755); // Make executable
            console.log(`Successfully compiled and copied native module to: ${destPath}`);
        } else {
            console.error('Built binary not found after zig build.');
        }
    } catch (err) {
        console.error('Failed to compile Zig module:', err.message);
    }
}

main().catch(console.error);
