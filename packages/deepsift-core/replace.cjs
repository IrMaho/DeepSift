const fs = require('fs');
let c = fs.readFileSync('src/cli/cli-entry.ts', 'utf8');

const oldDiag1 = "case 'diag':\r\n                if (commandArgs.length === 0) {\r\n                    throw new Error('Please provide a path to a problems JSON file.\\nUsage: deepsift diag \"problems.json\"');\r\n                }\r\n                await diagCommand(projectPath, commandArgs[0], format, compress);\r\n                break;";
const oldDiag2 = oldDiag1.replace(/\r\n/g, '\n');

const newDiag = "case 'diag':\n                if (commandArgs.length === 0) {\n                    await doctorCommand(projectPath, format);\n                } else {\n                    await diagCommand(projectPath, commandArgs[0], format, compress);\n                }\n                break;";

c = c.replace(oldDiag1, newDiag).replace(oldDiag2, newDiag);

c = c.replace("import { docgenCommand } from './commands/docgen.js';", "import { docgenCommand } from './commands/docgen.js';\nimport { learnCommand } from './commands/learn.js';");

const oldDoc1 = "case 'doctor':\r\n                await doctorCommand(projectPath, format);\r\n                break;";
const oldDoc2 = oldDoc1.replace(/\r\n/g, '\n');

const newDoc = "case 'doctor':\n                await doctorCommand(projectPath, format);\n                break;\n\n            case 'learn':\n                await learnCommand(projectPath, commandArgs[0] || '');\n                break;";

c = c.replace(oldDoc1, newDoc).replace(oldDoc2, newDoc);

fs.writeFileSync('src/cli/cli-entry.ts', c);
