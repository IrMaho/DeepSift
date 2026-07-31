const fs = require('fs');
let c = fs.readFileSync('src/cli/commands/learn.ts', 'utf8');

const oldCheck = "if (target !== 'patterns') {\r\n        printError(Unknown target for scan: ${target}. Try 'deepsift scan patterns'.);\r\n        return;\r\n    }";
const oldCheck2 = oldCheck.replace(/\r\n/g, '\n');

const newCheck = "if (!target) target = 'patterns';\n    if (target !== 'patterns') {\n        printError(Unknown target: ${target}. Usage: deepsift learn);\n        return;\n    }";

c = c.replace(oldCheck, newCheck).replace(oldCheck2, newCheck);

fs.writeFileSync('src/cli/commands/learn.ts', c);
