import { checkLayerViolations } from '../../analyzers/layer-watchdog.js';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';

export async function checkLayersCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🛡️ Clean Architecture Layer Boundary Watchdog\n`);

    const violations = checkLayerViolations(projectPath);

    if (violations.length === 0) {
        lines.push(`- 🎉 **Clean Architecture Intact!** No forbidden browser imports or environment boundary violations detected in plugin sandbox / core logic files.`);
    } else {
        lines.push(`Found **${violations.length}** architectural boundary violations:\n`);
        violations.forEach((v, idx) => {
            lines.push(`### 🚨 Violation #${idx + 1}: Forbidden import \`${v.forbiddenImport}\``);
            lines.push(`  - 📄 **${v.file}:${v.line}**: \`${v.snippet}\``);
            lines.push(`  - 🛑 **Rule**: ${v.rule}`);
            lines.push('');
        });
    }

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[Check-Layers]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
