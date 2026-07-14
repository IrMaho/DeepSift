import fs from 'fs';
import path from 'path';

const projectPath = process.cwd();
const srcFile = path.join(projectPath, 'temp', 'test-4', 'project-dna.json');
const destDir = path.join(projectPath, 'temp', 'test-4', '.deepsift');
const destFile = path.join(destDir, 'project-dna.json');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log("Copied project-dna.json into .deepsift directory.");
} else {
    console.log("Source project-dna.json not found!");
}
