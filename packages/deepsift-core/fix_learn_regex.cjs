const fs = require('fs');
let c = fs.readFileSync('src/cli/commands/learn.ts', 'utf8');

c = c.replace(/if\s*\(!target\).*?return;\s*\}/s, "if (!target) target = 'patterns';\n    if (target !== 'patterns') {\n        printError('Unknown target: ' + target + '. Usage: deepsift learn');\n        return;\n    }");

fs.writeFileSync('src/cli/commands/learn.ts', c);
