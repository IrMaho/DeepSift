import { printSuccess } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

export function startCommand(compress: boolean = true) {
    let output = `# 🚀 DeepSift Cross-Repo & Monorepo Initialization\n\n`;
    output += `Welcome to DeepSift! This workspace is not fully configured yet.\n\n`;
    output += `> **To AI Agent:**\n`;
    output += `> The user wants to initialize DeepSift. Before running \`deepsift init\`, you must understand their architecture.\n`;
    output += `> 1. Ask the user about their folder structure (e.g., is it a Monorepo with lib/ and backend/? Is there an external Microservice?)\n`;
    output += `> 2. Propose a \`deepsift.config.json\` file defining Workspaces/Realms.\n`;
    output += `> 3. Use \`isolatedDbPath\` for isolated local databases.\n`;
    output += `> 4. Use \`isExternalHivemind: true\` for external project connections.\n`;
    output += `> 5. Once the config is created, run \`deepsift index --force\` to build the Hivemind.\n`;

    let finalOutput = output;
    if (compress) {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(output).toUnifiedString();
    }

    console.log(finalOutput);
}
