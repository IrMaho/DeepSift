const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CLI = 'node "C:\\Users\\ASUS\\Desktop\\flutter_project\\mcp_search\\dist\\cli\\cli-entry.js"';
const TEST_DIR = "C:\\Users\\ASUS\\Desktop\\flutter_project\\plugin_figma\\color\\my-color-test\\AI\\Project test ai";
const testPatch = path.join(TEST_DIR, "test_manual.txt");

fs.writeFileSync(testPatch, "📄 src5/manual_test/file.ts\n<<<<\n====\nexport const test = 1;\n>>>>", "utf-8");

const stdout = execSync(CLI + ' patch "' + testPatch + '"', { cwd: TEST_DIR, encoding: "utf-8" });
console.log("OUTPUT FROM CLI:");
console.log(stdout);

const expectedPath = path.join(TEST_DIR, "src5/manual_test/file.ts");
console.log("Exists in TEST_DIR?", fs.existsSync(expectedPath));

const projectPath = "C:\\Users\\ASUS\\Desktop\\flutter_project\\plugin_figma\\color\\my-color-test";
const altPath = path.join(projectPath, "src5/manual_test/file.ts");
console.log("Exists in altPath?", fs.existsSync(altPath));
