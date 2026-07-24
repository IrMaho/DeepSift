import { ComplexityAnalyzer } from '../../analyzers/complexity-analyzer.js';

export async function complexityCommand(projectPath: string, targetPath?: string, format = 'markdown', includeBundled = false) {
    const analyzer = new ComplexityAnalyzer(projectPath);
    const report = analyzer.analyze(targetPath, includeBundled);

    if (format === 'json') {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    console.log(`\n\x1b[36m📊 DeepSift Function Complexity Heatmap\x1b[0m`);
    console.log(`========================================`);
    console.log(`Total Functions: ${report.totalFunctions} | High Complexity (>10): ${report.highComplexityCount} | Avg Complexity: ${report.averageComplexity}\n`);

    report.functions.slice(0, 15).forEach((f, idx) => {
        let color = '\x1b[32m';
        if (f.status === 'critical') color = '\x1b[31m';
        else if (f.status === 'high') color = '\x1b[33m';

        console.log(`${idx + 1}. ${color}[${f.status.toUpperCase()}]\x1b[0m \x1b[1m${f.name}\x1b[0m (Cyclomatic: ${f.cyclomaticComplexity}, Cognitive: ${f.cognitiveComplexity})`);
        console.log(`   📄 File: ${f.file}:${f.line}`);
    });
}
