import { PlannerEngine } from '../../intelligence/plan-engine.js';
import { printResult, printSuccess, printError, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';
import { saveSearchLog } from '../../utils/history.js';

export async function planCommand(
    projectPath: string,
    request: string,
    format: OutputFormat,
    compress: boolean = true
) {
    if (!request || request.trim().length === 0) {
        throw new Error('Please provide a feature request.\nUsage: deepsift plan "Create a login page with email and password"');
    }

    process.stdout.write('\x1b[36m🧠 Smart Planner — Generating implementation plan...\x1b[0m\n');

    const engine = new PlannerEngine(projectPath);
    const plan = await engine.generatePlan(request, (phase, detail) => {
        process.stdout.write(`  \x1b[33m[${phase}]\x1b[0m ${detail}\n`);
    });

    const markdown = engine.formatPlanAsMarkdown(plan);
    let finalOutput = markdown;

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(markdown).toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`[SmartPlan] ${request}`], finalOutput);
    printResult(finalOutput, format);

    if (format !== 'json') {
        printSuccess(`Plan saved to .deepsift/plans/plan-${plan.id}.json`);
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        printSuccess(`Compressed output cached in: ${link}`);
    }
}
