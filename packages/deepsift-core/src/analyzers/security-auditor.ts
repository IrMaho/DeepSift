import fs from 'fs';
import path from 'path';

export interface SecurityFinding {
    type: 'sandbox-leak' | 'secret-exposure' | 'vulnerability' | 'vulnerable-dependency' | 'i18n-hardcoded';
    file: string;
    line: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    snippet?: string;
}

export interface SecurityReport {
    findings: SecurityFinding[];
    sandboxLeakCount: number;
    secretCount: number;
    vulnerabilityCount: number;
    hardcodedI18nCount: number;
    totalFindings: number;
}

export class SecurityAuditor {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public auditAll(): SecurityReport {
        const files = this.collectFiles(this.projectPath);
        const findings: SecurityFinding[] = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const relFile = path.relative(this.projectPath, file);

                this.auditSandboxLeaks(content, relFile, findings);
                this.auditHardcodedSecrets(content, relFile, findings);
                this.auditVulnerabilities(content, relFile, findings);
                this.auditHardcodedI18n(content, relFile, findings);
            } catch (e) {
                // Ignore read errors
            }
        }

        this.auditDependencies(findings);

        const sandboxLeakCount = findings.filter(f => f.type === 'sandbox-leak').length;
        const secretCount = findings.filter(f => f.type === 'secret-exposure').length;
        const vulnerabilityCount = findings.filter(f => f.type === 'vulnerability').length;
        const hardcodedI18nCount = findings.filter(f => f.type === 'i18n-hardcoded').length;

        return {
            findings,
            sandboxLeakCount,
            secretCount,
            vulnerabilityCount,
            hardcodedI18nCount,
            totalFindings: findings.length
        };
    }

    public auditSandboxLeaks(content: string, relFile: string, findings: SecurityFinding[]) {
        // Only inspect sandbox/backend files (e.g. code.ts, figma-core, worker, server, backend)
        const isSandboxOrBackend = /(figma-core|code\.ts|sandbox|worker|server|backend|main\.ts|cli)/i.test(relFile);
        if (!isSandboxOrBackend) return;

        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const leakMatch = line.match(/\b(window|document|localStorage|sessionStorage|alert|prompt|location\.href)\b/);
            if (leakMatch && !line.includes('//') && !line.includes('typeof window')) {
                findings.push({
                    type: 'sandbox-leak',
                    file: relFile,
                    line: lineNum,
                    severity: 'critical',
                    message: `Illegal browser API reference '${leakMatch[1]}' detected in sandbox environment`,
                    snippet: line.trim()
                });
            }
        });
    }

    public auditHardcodedSecrets(content: string, relFile: string, findings: SecurityFinding[]) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            // Secret patterns: API keys, Firebase keys, private keys, Tokens
            const secretMatch = line.match(/(?:api[_-]?key|secret|token|password|auth_key|private[_-]?key)\s*[:=]\s*['"`]([A-Za-z0-9_\-]{16,})['"`]/i);
            if (secretMatch && !relFile.includes('test') && !line.includes('example') && !line.includes('process.env')) {
                findings.push({
                    type: 'secret-exposure',
                    file: relFile,
                    line: lineNum,
                    severity: 'high',
                    message: `Possible hardcoded secret or API key exposed`,
                    snippet: line.trim()
                });
            }
        });
    }

    public auditVulnerabilities(content: string, relFile: string, findings: SecurityFinding[]) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            if (line.includes('dangerouslySetInnerHTML')) {
                findings.push({
                    type: 'vulnerability',
                    file: relFile,
                    line: lineNum,
                    severity: 'high',
                    message: 'Use of dangerouslySetInnerHTML detected (Potential XSS)',
                    snippet: line.trim()
                });
            }
            if (/\beval\s*\(/.test(line)) {
                findings.push({
                    type: 'vulnerability',
                    file: relFile,
                    line: lineNum,
                    severity: 'critical',
                    message: 'Use of eval() detected (Potential Arbitrary Code Execution)',
                    snippet: line.trim()
                });
            }
        });
    }

    public auditHardcodedI18n(content: string, relFile: string, findings: SecurityFinding[]) {
        if (!/\.(tsx|jsx|html|dart)$/i.test(relFile)) return;
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const jsxTextMatch = line.match(/>\s*([A-Z][a-zA-Z0-9\s]{3,30})\s*</);
            if (jsxTextMatch && !line.includes('//') && !line.includes('{t(')) {
                findings.push({
                    type: 'i18n-hardcoded',
                    file: relFile,
                    line: lineNum,
                    severity: 'low',
                    message: `Hardcoded UI string '${jsxTextMatch[1].trim()}' candidate for i18n extraction`,
                    snippet: line.trim()
                });
            }
        });
    }

    public auditDependencies(findings: SecurityFinding[]) {
        const pkgPath = path.join(this.projectPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

                // Known problematic / vulnerable pattern heuristics
                const suspicious = ['event-stream', 'flatmap-stream', 'rc-pagination@1.0.0'];
                for (const dep of suspicious) {
                    if (allDeps[dep]) {
                        findings.push({
                            type: 'vulnerable-dependency',
                            file: 'package.json',
                            line: 1,
                            severity: 'critical',
                            message: `Known vulnerable dependency detected: ${dep}`
                        });
                    }
                }
            } catch (e) {
                // Ignore parse error
            }
        }
    }

    private collectFiles(dir: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', '.deepsift', 'dist', 'build'].includes(entry.name)) {
                    files.push(...this.collectFiles(full));
                }
            } else if (/\.(ts|js|tsx|jsx|py|go|dart|json|rs|html)$/i.test(entry.name)) {
                files.push(full);
            }
        }
        return files;
    }
}
