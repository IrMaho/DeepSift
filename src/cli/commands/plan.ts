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

    // Retrieve active DRM findings and prepend them to the plan
    try {
        const { MemoEngine } = await import('../../memo/memo-engine.js');
        const memo = new MemoEngine(projectPath);
        const openTags = memo.getOpenTags();
        if (openTags.length > 0) {
            let drmSection = `\n# 📝 Active Research Memory (DRM) Context\n`;
            drmSection += `> **IMPORTANT:** The following findings and constraints were retrieved from your active research tags and **MUST** be strictly incorporated into the implementation steps:\n\n`;

            for (const tag of openTags) {
                const entries = memo.getEntries(tag.name);
                if (entries.length > 0) {
                    drmSection += `### Tag: \`${tag.name}\` (${tag.description || 'No description'})\n`;
                    for (const entry of entries) {
                        const typeLabel = entry.type.replace(/_/g, ' ').toUpperCase();
                        drmSection += `- **[${typeLabel}]** ${entry.content}\n`;
                    }
                    drmSection += `\n`;
                }
            }
            finalOutput = drmSection + `---\n\n` + markdown;
        }
    } catch {
        // Safe fallback if DRM retrieval fails
    }

    if (compress && format !== 'json') {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(finalOutput).toUnifiedString();
    }

    const logInfo = await saveSearchLog(projectPath, [`[SmartPlan] ${request}`], finalOutput, { skipVisuals: !compress });
    printResult(finalOutput, format);

    if (format !== 'json') {
        printSuccess(`Plan saved to .deepsift/plans/plan-${plan.id}.json`);
        const link = `file:///${logInfo.filePath.replace(/\\/g, '/')}`;
        printSuccess(`Compressed output cached in: ${link}`);
    }
}
