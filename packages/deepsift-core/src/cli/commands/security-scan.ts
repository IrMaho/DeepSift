/**
 * @file security-scan.ts
 * @description CWE vulnerability scanner for sandbox leaks, secrets, and XSS risks.
 *
 * @module cli/commands/security-scan
 * @category Security & Diagnostics
 * @since 1.0.2
 */
import { SecurityAuditor } from '../../analyzers/security-auditor.js';

export async function securityScanCommand(projectPath: string, format = 'markdown') {
    const auditor = new SecurityAuditor(projectPath);
    const report = auditor.auditAll();

    if (format === 'json') {
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    console.log(`\n\x1b[36m🛡️ DeepSift Security & Compliance Audit\x1b[0m`);
    console.log(`========================================`);
    console.log(`Total Findings: ${report.totalFindings} | Sandbox Leaks: ${report.sandboxLeakCount} | Secrets: ${report.secretCount} | Vulns: ${report.vulnerabilityCount}\n`);

    if (report.findings.length === 0) {
        console.log(`✅ \x1b[32mNo security issues or sandbox leaks detected!\x1b[0m`);
        return;
    }

    report.findings.forEach((f, idx) => {
        let color = '\x1b[33m';
        if (f.severity === 'critical') color = '\x1b[31m';
        console.log(`${idx + 1}. ${color}[${f.severity.toUpperCase()} - ${f.type.toUpperCase()}]\x1b[0m ${f.message}`);
        console.log(`   📄 File: ${f.file}:${f.line}`);
        if (f.snippet) console.log(`   💡 Snippet: ${f.snippet}`);
    });
}
