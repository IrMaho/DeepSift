const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cliPath = path.resolve(__dirname, 'dist/cli/cli-entry.js');
const sandboxDir = path.resolve(__dirname, 'test-sandbox');

if (fs.existsSync(sandboxDir)) {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
}
fs.mkdirSync(sandboxDir, { recursive: true });

function runCLI(args) {
    try {
        const cmd = `node "${cliPath}" ${args}`;
        return execSync(cmd, { cwd: sandboxDir, encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
        return { error: e.message, stderr: e.stderr, stdout: e.stdout, status: e.status };
    }
}

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, testName) {
    if (actual === expected) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${testName}\nExpected: ${expected}\nActual: ${actual}`);
        failed++;
    }
}

function assertContains(actual, expected, testName) {
    if (actual && actual.includes(expected)) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${testName}\nExpected to contain: ${expected}\nActual: ${actual}`);
        failed++;
    }
}

fs.writeFileSync(path.join(sandboxDir, 'test1.txt'), 'Hello world! Hello user!');
fs.writeFileSync(path.join(sandboxDir, 'test2.txt'), 'SidebarNav is active.\nsidebarNav: ["nav"]');

// 1. Simple sed replace
runCLI(`sed test1.txt --search "Hello" --replace "Hi"`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'test1.txt'), 'utf-8'), 'Hi world! Hello user!', 'SED: Simple replace');

// 2. Global sed replace
runCLI(`sed test1.txt --search "Hello" --replace "Hi" --all`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'test1.txt'), 'utf-8'), 'Hi world! Hi user!', 'SED: Global replace');

// 3. Regex replace
runCLI(`sed test1.txt --search "/H[a-z]+/" --replace "Greetings"`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'test1.txt'), 'utf-8'), 'Greetings world! Hi user!', 'SED: Regex replace');

// 4. Regex global replace
runCLI(`sed test2.txt --search "/sidebarnav/i" --replace "TopNav" --all`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'test2.txt'), 'utf-8'), 'TopNav is active.\nTopNav: ["nav"]', 'SED: Regex global replace');

// 5. Valid JSON Edit
const validJsonPatch = { files: [ { file: "test2.txt", edits: [ { type: "search", search: "TopNav is active.", replace: "Replaced is active." } ] } ] };
fs.writeFileSync(path.join(sandboxDir, 'patch_valid.json'), JSON.stringify(validJsonPatch));
runCLI(`edit patch_valid.json`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'test2.txt'), 'utf-8'), 'Replaced is active.\nTopNav: ["nav"]', 'EDIT: Valid JSON patch');

// 6. Invalid JSON (Syntax Error)
fs.writeFileSync(path.join(sandboxDir, 'patch_invalid.json'), '{ invalid: "json" }');
const res7 = runCLI(`edit patch_invalid.json`);
assertContains(res7.stderr || res7.stdout || res7.error, 'Original JSON error', 'EDIT: Invalid JSON shows original syntax error');

// 7. Invalid Schema
fs.writeFileSync(path.join(sandboxDir, 'patch_schema.json'), JSON.stringify({ something: "else" }));
const res8 = runCLI(`edit patch_schema.json`);
assertContains(res8.stderr || res8.stdout || res8.error, 'JSON format is invalid: expected array or object with "files" array', 'EDIT: JSON schema error is surfaced');

// 8. TOON Patch
const toonPatch = `📄 test1.txt
<<<<
Greetings world!
====
TOON world!
>>>>`;
fs.writeFileSync(path.join(sandboxDir, 'patch.toon'), toonPatch);
runCLI(`edit patch.toon`);
assertContains(fs.readFileSync(path.join(sandboxDir, 'test1.txt'), 'utf-8'), 'TOON world! Hi user!', 'EDIT: Valid TOON Patch');

console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
