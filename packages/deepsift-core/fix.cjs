const fs = require('fs');
let c = fs.readFileSync('src/cli/cli-entry.ts', 'utf8');
c = c.replace("import { learnCommand } from './commands/learn.js';\r\nimport { learnCommand } from './commands/learn.js';", "import { learnCommand } from './commands/learn.js';");
c = c.replace("import { learnCommand } from './commands/learn.js';\nimport { learnCommand } from './commands/learn.js';", "import { learnCommand } from './commands/learn.js';");
fs.writeFileSync('src/cli/cli-entry.ts', c);
