const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cliPath = path.resolve(__dirname, 'dist/cli/cli-entry.js');
const sandboxDir = path.resolve(__dirname, 'test-sandbox-30');

if (fs.existsSync(sandboxDir)) {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
}
fs.mkdirSync(sandboxDir, { recursive: true });

function runCLI(args) {
    try {
        const cmd = `node "${cliPath}" ${args} 2>&1`;
        return execSync(cmd, { cwd: sandboxDir, encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
        return { error: e.message, stderr: e.stderr, stdout: e.stdout, status: e.status };
    }
}

let passed = 0;
let failed = 0;
let bugsFound = 0;

function assertEqual(actual, expected, testName, bugId) {
    if (actual === expected) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ BUG ${bugId}: ${testName}\n   Expected: ${JSON.stringify(expected)}\n   Actual:   ${JSON.stringify(actual)}`);
        failed++;
        bugsFound++;
    }
}

function assertContains(actual, expected, testName, bugId) {
    if (actual && actual.includes(expected)) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ BUG ${bugId}: ${testName}\n   Expected to contain: ${expected}\n   Actual:   ${actual}`);
        failed++;
        bugsFound++;
    }
}

// -----------------------------------------
// GENERATE TEST FILES
// -----------------------------------------
fs.writeFileSync(path.join(sandboxDir, 'sed1.txt'), 'apple banana apple banana');
fs.writeFileSync(path.join(sandboxDir, 'sed2.txt'), 'price is $10');
fs.writeFileSync(path.join(sandboxDir, 'sed3.txt'), 'path/to/file');
fs.writeFileSync(path.join(sandboxDir, 'edit1.txt'), 'line 1\nline 2\nline 3\nline 4\nline 5\n');
fs.writeFileSync(path.join(sandboxDir, 'edit_crlf.txt'), 'line 1\nline 2\r\nline 3');
fs.mkdirSync(path.join(sandboxDir, 'sub'));
fs.writeFileSync(path.join(sandboxDir, 'sub', 'sed4.txt'), 'match me');
fs.writeFileSync(path.join(sandboxDir, 'clip_source.txt'), '  line 1\n\n  line 3\n');


// -----------------------------------------
// RUN 30 TESTS
// -----------------------------------------
console.log("=== RUNNING 30 SPECIALIZED TESTS ===");

// SED BUGS
const resSed1 = runCLI(`sed sed1.txt --search "/(apple)/" --replace "orange"`);
const output1 = typeof resSed1 === 'string' ? resSed1 : (resSed1.stdout || resSed1.error);
assertEqual(output1.includes('1 replacements') ? '1' : output1, '1', 'SED: Regex without /g counts correctly', 'SED-01');

// BUG 2: literal replace without --all parses $1
runCLI(`sed sed2.txt --search "10" --replace "$100"`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'sed2.txt'), 'utf-8'), 'price is $$100', 'SED: Literal replace ignores $1 (Wait, cmd.exe escapes?)', 'SED-02');

// BUG 3: regex with escaped slash inside parsing fails
const resSed3 = runCLI(`sed sed3.txt --search "/path\\/to/g" --replace "dir/to"`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'sed3.txt'), 'utf-8'), 'dir/to/file', 'SED: Regex with escaped slash parsed correctly', 'SED-03');

// BUG 4: regex with invalid flags crashes the whole process
fs.writeFileSync(path.join(sandboxDir, 'sed4_test.txt'), 'apple');
const resSed4 = runCLI(`sed sed4_test.txt --search "/apple/invalid" --replace "orange"`);
const output4 = typeof resSed4 === 'string' ? resSed4 : (resSed4.stderr || resSed4.stdout || resSed4.error);
assertContains(output4, 'Modified 1 files', 'SED: Invalid regex flags handled gracefully by filtering', 'SED-04');


// EDIT BUGS
// BUG 5: CRLF in search string fails to match LF file content
const toonCrlf = `📄 edit_crlf.txt
<<<<
line 2\r
line 3
====
line 2
line 4
>>>>`;
fs.writeFileSync(path.join(sandboxDir, 'patch_crlf.toon'), toonCrlf);
runCLI(`edit patch_crlf.toon`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'edit_crlf.txt'), 'utf-8'), 'line 1\nline 2\nline 4', 'EDIT: CRLF in search string matches LF content', 'EDIT-01');

// BUG 6: StartLine > fileLines.length throws error, preventing appending
const toonAppend = `📄 edit1.txt
L6:<<<<
====
line 6
>>>>`;
fs.writeFileSync(path.join(sandboxDir, 'patch_append.toon'), toonAppend);
const resAppend = runCLI(`edit patch_append.toon`);
assertContains(fs.readFileSync(path.join(sandboxDir, 'edit1.txt'), 'utf-8'), 'line 6', 'EDIT: Can append to end of file', 'EDIT-02');

// BUG 7: TOON dictionary parser parses ANY bracketed string as dictionary!
const toonDict = `[Note: this is not a dictionary]
📄 edit1.txt
<<<<
line 1
====
line A
>>>>`;
fs.writeFileSync(path.join(sandboxDir, 'patch_dict.toon'), toonDict);
const resDict = runCLI(`edit patch_dict.toon`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'edit1.txt'), 'utf-8').includes('line A'), true, 'EDIT: TOON parser ignores non-dictionary bracket strings', 'EDIT-03');

// BUG 8: Clipboard inserts trailing spaces on empty lines
const toonClip = `📄 edit1.txt
<<<<
line A
====
    📋 clip_source.txt:L1-L3
>>>>`;
fs.writeFileSync(path.join(sandboxDir, 'patch_clip.toon'), toonClip);
runCLI(`edit patch_clip.toon`);
const editedClip = fs.readFileSync(path.join(sandboxDir, 'edit1.txt'), 'utf-8');
assertEqual(editedClip.includes('    \n'), false, 'EDIT: Clipboard does not add trailing space to empty lines', 'EDIT-04');

// BUG 9: Line replace without search block
const toonLine = `📄 edit1.txt
L4-L5
====
replaced 4 and 5
>>>>`;
fs.writeFileSync(path.join(sandboxDir, 'patch_line.toon'), toonLine);
runCLI(`edit patch_line.toon`);
assertEqual(fs.readFileSync(path.join(sandboxDir, 'edit1.txt'), 'utf-8').includes('replaced 4 and 5'), true, 'EDIT: Line range replace without search block works', 'EDIT-05');


console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}. Bugs found: ${bugsFound}`);
