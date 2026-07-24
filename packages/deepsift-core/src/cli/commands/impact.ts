import { ImpactAnalyzer } from '../../analyzers/impact-analyzer.js';

export async function impactCommand(projectPath: string, symbol: string, format = 'markdown') {
    if (!symbol) throw new Error('Please specify a symbol. Usage: deepsift impact "myFunction"');
    const analyzer = new ImpactAnalyzer(projectPath);
    const report = await analyzer.calculateImpact(symbol);

    if (format === 'json') {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    console.log(`\n\x1b[36m💥 DeepSift Impact Radius & Breaking Change Predictor\x1b[0m`);
    console.log(`=======================================================`);
    console.log(`Target Symbol: \x1b[1m${symbol}\x1b[0m | Risk Level: \x1b[31m${report.riskLevel.toUpperCase()}\x1b[0m`);
    console.log(`Affected Files: ${report.affectedFilesCount} | Affected Call Sites: ${report.affectedCallSitesCount}\n`);

    report.affectedCallers.forEach((c, idx) => {
        console.log(`${idx + 1}. \x1b[33m${c.file}:${c.line}\x1b[0m`);
        console.log(`   💡 ${c.snippet}`);
    });
}
