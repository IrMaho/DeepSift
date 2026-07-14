import fs from 'fs';
import path from 'path';
import { jsonToToon, toonToJson } from '../dist/utils/toon-serializer.js';

const projectPath = process.cwd();
const jsonPath = path.join(projectPath, 'temp', 'test-4', 'project-dna.json');
const toonPath = path.join(projectPath, 'temp', 'test-4', 'project-dna.toon');

if (fs.existsSync(jsonPath)) {
    const jsonSize = fs.statSync(jsonPath).size;
    console.log(`Original JSON Size: ${(jsonSize / 1024 / 1024).toFixed(2)} MB (${jsonSize} bytes)`);

    const jsonText = fs.readFileSync(jsonPath, 'utf-8');
    const dna = JSON.parse(jsonText);
    
    console.time("TOON Serialization");
    const toonText = jsonToToon(dna);
    console.timeEnd("TOON Serialization");

    fs.writeFileSync(toonPath, toonText, 'utf-8');

    const toonSize = fs.statSync(toonPath).size;
    console.log(`TOON Text Size: ${(toonSize / 1024 / 1024).toFixed(2)} MB (${toonSize} bytes)`);
    console.log(`Compression ratio: ${((jsonSize - toonSize) / jsonSize * 100).toFixed(1)}% savings!`);

    console.time("TOON Deserialization");
    const parsed = toonToJson(toonText);
    console.timeEnd("TOON Deserialization");
    
    // Quick validation
    console.log("Validation: names match?", parsed.identity.name === dna.identity.name);
    console.log("Validation: total tokens match?", parsed.designSystem.tokens.colors.length === dna.designSystem.tokens.colors.length);
} else {
    console.log("project-dna.json not found!");
}
