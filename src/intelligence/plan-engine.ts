import path from 'path';
import fs from 'fs';
import { SmartPlan, PlanMilestone, PlanRisk } from '../types/dna-types.js';
import { loadDNA } from './project-dna.js';
import { RealmRouter } from '../core/realm-router.js';
import { ContextInjector } from '../core/context-injector.js';
import crypto from 'crypto';

interface ParsedRequest {
    keywords: string[];
    type: 'ui' | 'feature' | 'refactor' | 'bugfix' | 'api' | 'other';
    targetPaths: string[];
}

interface ContextData {
    rules: string[];
    conventions: string;
    architecture: string;
    coreFiles: string[];
    godNodes: string[];
    i18nRequired: boolean;
    designTokensSample: string;
    temporalWarnings: string[];
    timeBombs?: any[];
    learnedPatterns?: any[];
}

interface SkillMatch {
    name: string;
    score: number;
    content: string;
}

interface RealmInsight {
    realmId: string;
    matches: { content: string; score: number }[];
}

const UI_KEYWORDS = ['page', 'screen', 'button', 'dialog', 'modal', 'card', 'list', 'form', 'input', 'layout', 'widget', 'component', 'navbar', 'sidebar', 'header', 'footer', 'tab', 'menu', 'drawer', 'panel', 'toggle', 'switch', 'slider', 'chart', 'table', 'grid', 'icon', 'avatar', 'badge', 'tooltip', 'popover', 'toast', 'snackbar', 'stepper', 'accordion', 'carousel', 'pagination', 'breadcrumb', 'chip', 'tag', 'progress', 'spinner', 'skeleton', 'theme', 'dark mode', 'light mode', 'responsive', 'animation', 'hover', 'صفحه', 'دکمه', 'فرم', 'لیست', 'کامپوننت', 'کارت', 'ویجت', 'تم'];
const REFACTOR_KEYWORDS = ['refactor', 'cleanup', 'split', 'extract', 'rename', 'restructure', 'migrate', 'optimize', 'ریفکتور', 'بهینه'];
const BUGFIX_KEYWORDS = ['fix', 'bug', 'error', 'crash', 'broken', 'issue', 'wrong', 'باگ', 'خطا', 'مشکل', 'درست'];
const API_KEYWORDS = ['api', 'endpoint', 'rest', 'graphql', 'fetch', 'request', 'response', 'webhook', 'socket', 'websocket'];

export class PlannerEngine {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public async generatePlan(
        request: string,
        onProgress?: (phase: string, detail: string) => void
    ): Promise<SmartPlan> {
        if (onProgress) onProgress('parse', 'Parsing request...');
        const parsed = this.parseRequest(request);

        if (onProgress) onProgress('context', 'Gathering project context...');
        const context = this.gatherContext();

        if (onProgress) onProgress('skills', 'Searching skills database...');
        const skills = await this.searchSkills(parsed.keywords);

        if (onProgress) onProgress('realms', 'Cross-referencing realms...');
        const realms = await this.crossReferenceRealms(parsed.keywords);

        if (onProgress) onProgress('build', 'Building smart plan...');
        const plan = this.buildPlan(request, parsed, context, skills, realms);

        if (onProgress) onProgress('save', 'Saving plan...');
        this.savePlan(plan);

        return plan;
    }

    private parseRequest(text: string): ParsedRequest {
        const lower = text.toLowerCase();
        const words = lower.split(/[\s,.\-!?;:'"()\[\]{}]+/).filter(w => w.length > 2);
        const uniqueWords = [...new Set(words)];

        let type: ParsedRequest['type'] = 'other';
        if (UI_KEYWORDS.some(k => lower.includes(k))) type = 'ui';
        else if (REFACTOR_KEYWORDS.some(k => lower.includes(k))) type = 'refactor';
        else if (BUGFIX_KEYWORDS.some(k => lower.includes(k))) type = 'bugfix';
        else if (API_KEYWORDS.some(k => lower.includes(k))) type = 'api';
        else type = 'feature';

        const pathPattern = /(?:src|lib|app|pages|components|features|modules|screens)\/[\w\-/.]+/gi;
        const targetPaths = (text.match(pathPattern) || []).map(p => p.trim());

        return { keywords: uniqueWords, type, targetPaths };
    }

    private gatherContext(): ContextData {
        const dna = loadDNA(this.projectPath);
        const data: ContextData = {
            rules: [],
            conventions: '',
            architecture: '',
            coreFiles: [],
            godNodes: [],
            i18nRequired: false,
            designTokensSample: '',
            temporalWarnings: [],
            timeBombs: [],
        };

        if (!dna) return data;

        data.rules = dna.rules || [];
        data.i18nRequired = dna.localization?.hasI18n || false;

        if (dna.testing?.timeBombs) {
            data.timeBombs = dna.testing.timeBombs;
        }

        if (dna.conventions?.learnedPatterns) {
            data.learnedPatterns = dna.conventions.learnedPatterns;
        }

        if (dna.conventions?.naming) {
            data.conventions = [
                `Files: ${dna.conventions.naming.files?.dominant || 'unknown'}`,
                `Classes: ${dna.conventions.naming.classes?.dominant || 'unknown'}`,
                `Functions: ${dna.conventions.naming.functions?.dominant || 'unknown'}`,
            ].join(' | ');
        }

        if (dna.architecture) {
            data.architecture = dna.architecture.topology || 'unknown';
            data.coreFiles = (dna.architecture.coreFiles || []).slice(0, 10);
            data.godNodes = dna.architecture.graph?.godNodes || [];
        }

        if (dna.designSystem?.tokens) {
            const colors = (dna.designSystem.tokens.colors || []).slice(0, 5);
            const dims = (dna.designSystem.tokens.dimensions || []).slice(0, 5);
            const typo = (dna.designSystem.tokens.typography || []).slice(0, 3);
            const parts: string[] = [];
            if (colors.length > 0) parts.push(`Colors: ${colors.map(c => `${c.name}=${c.value}`).join(', ')}`);
            if (dims.length > 0) parts.push(`Dimensions: ${dims.map(d => `${d.name}=${d.value}`).join(', ')}`);
            if (typo.length > 0) parts.push(`Typography: ${typo.map(t => `${t.name}=${t.value}`).join(', ')}`);
            data.designTokensSample = parts.join('\n');
        }

        if (dna.temporal) {
            for (const bn of dna.temporal.bottlenecks || []) {
                data.temporalWarnings.push(`⚠️ Bottleneck: ${bn}`);
            }
            for (const gn of dna.temporal.godNodeAges || []) {
                if (gn.recentCommits > 10) {
                    data.temporalWarnings.push(`🔥 Hot God Node: ${gn.filePath} (${gn.recentCommits} recent commits)`);
                }
            }
        }

        return data;
    }

    private async searchSkills(keywords: string[]): Promise<SkillMatch[]> {
        const matches: SkillMatch[] = [];
        try {
            const router = new RealmRouter(this.projectPath);
            const realmsConfig = router.listRealms();
            const skillRealms = Object.keys(realmsConfig).filter(
                r => realmsConfig[r].parserProfile === 'skill' || r === 'skills' || r === 'system_skills'
            );

            if (skillRealms.length === 0) return matches;

            const query = keywords.slice(0, 10).join(' ');
            const results = await router.searchAllRealms({ query, topK: 5 }, skillRealms);

            for (const r of results) {
                if (r.score >= 0.4) {
                    matches.push({
                        name: r.chunk.metadata?.fileName || path.basename(r.chunk.filePath),
                        score: r.score,
                        content: r.chunk.content.substring(0, 500),
                    });
                }
            }
        } catch {
        }
        return matches;
    }

    private async crossReferenceRealms(keywords: string[]): Promise<RealmInsight[]> {
        const insights: RealmInsight[] = [];
        try {
            const router = new RealmRouter(this.projectPath);
            const realmsConfig = router.listRealms();
            const docRealms = Object.keys(realmsConfig).filter(
                r => realmsConfig[r].parserProfile === 'docs' && r !== 'skills' && r !== 'system_skills'
            );

            if (docRealms.length === 0) return insights;

            const query = keywords.slice(0, 10).join(' ');
            for (const realmId of docRealms) {
                try {
                    const results = await router.searchRealm(realmId, { query, topK: 3 });
                    const relevant = results.filter(r => r.score >= 0.4);
                    if (relevant.length > 0) {
                        insights.push({
                            realmId,
                            matches: relevant.map(r => ({
                                content: r.chunk.content.substring(0, 300),
                                score: r.score,
                            })),
                        });
                    }
                } catch {
                }
            }
        } catch {
        }
        return insights;
    }

    private buildPlan(
        request: string,
        parsed: ParsedRequest,
        context: ContextData,
        skills: SkillMatch[],
        realms: RealmInsight[]
    ): SmartPlan {
        const planId = crypto.randomBytes(6).toString('hex');

        const dnaConstraints: string[] = [];
        for (const rule of context.rules) {
            dnaConstraints.push(`📜 ${rule}`);
        }
        if (context.i18nRequired) {
            dnaConstraints.push('🌍 i18n Required: All user-facing strings must go through the translation system.');
        }
        if (context.conventions) {
            dnaConstraints.push(`📛 Naming: ${context.conventions}`);
        }
        if (context.learnedPatterns) {
            for (const p of context.learnedPatterns) {
                dnaConstraints.push(`🧠 Pattern [${p.category}]: ${p.name} - ${p.description}`);
            }
        }
        for (const tw of context.temporalWarnings) {
            dnaConstraints.push(tw);
        }

        const risks: PlanRisk[] = [];
        for (const gn of context.godNodes) {
            risks.push({
                file: gn,
                reason: 'God Node — highly connected file. Modify with extreme caution.',
                severity: 'high',
            });
        }
        for (const tp of parsed.targetPaths) {
            if (context.coreFiles.some(cf => cf.includes(tp) || tp.includes(cf))) {
                risks.push({
                    file: tp,
                    reason: 'Target path overlaps with a core file. Changes may have wide impact.',
                    severity: 'medium',
                });
            }
        }

        // Add Time Bomb risks
        if (context.timeBombs && context.timeBombs.length > 0) {
            for (const bomb of context.timeBombs) {
                risks.push({
                    file: bomb.filePath,
                    reason: `💣 TIME BOMB: ${bomb.reason}`,
                    severity: 'high',
                });
                dnaConstraints.push(`🚨 CRITICAL INSTRUCTION: Milestone 0 MUST be to write Vitest/Jest unit tests for ${bomb.filePath} before any other implementation!`);
            }
        }

        const realmInsights: string[] = [];
        for (const ri of realms) {
            for (const m of ri.matches) {
                realmInsights.push(`[${ri.realmId}] (score: ${m.score.toFixed(2)}) ${m.content.substring(0, 200)}`);
            }
        }

        const skillsUsed = skills.map(s => `${s.name} (score: ${s.score.toFixed(2)})`);

        let executiveSummary = `Request: "${request}"\n`;
        executiveSummary += `Type: ${parsed.type}\n`;
        executiveSummary += `Architecture: ${context.architecture}\n`;
        if (context.designTokensSample) {
            executiveSummary += `Design Tokens Available: Yes\n`;
        }
        if (skills.length > 0) {
            executiveSummary += `Matching Skills Found: ${skills.length}\n`;
        }
        if (realms.length > 0) {
            executiveSummary += `Realm Cross-References: ${realms.length} realm(s)\n`;
        }

        const plan: SmartPlan = {
            id: planId,
            createdAt: new Date().toISOString(),
            request,
            requestType: parsed.type,
            executiveSummary,
            structureMap: '',
            milestones: [],
            dependencies: context.coreFiles.slice(0, 5),
            risks,
            skillsUsed,
            dnaConstraints,
            realmInsights,
        };

        if (parsed.type === 'ui' && context.designTokensSample) {
            plan.visualDescription = `[Design Tokens for UI]\n${context.designTokensSample}`;
        }

        return plan;
    }

    private savePlan(plan: SmartPlan): void {
        const plansDir = path.join(this.projectPath, '.deepsift', 'plans');
        if (!fs.existsSync(plansDir)) {
            fs.mkdirSync(plansDir, { recursive: true });
        }
        const filename = `plan-${plan.id}.json`;
        fs.writeFileSync(path.join(plansDir, filename), JSON.stringify(plan, null, 2), 'utf-8');
    }

    public formatPlanAsMarkdown(plan: SmartPlan): string {
        const lines: string[] = [];

        lines.push(`# 📋 Smart Plan: ${plan.id}`);
        lines.push(`Generated: ${plan.createdAt} | Type: ${plan.requestType}`);
        lines.push('');

        lines.push('## 📝 Executive Summary');
        lines.push(plan.executiveSummary);
        lines.push('');

        if (plan.visualDescription) {
            lines.push('## 👁️ Visual Description');
            lines.push(plan.visualDescription);
            lines.push('');
        }

        if (plan.dnaConstraints.length > 0) {
            lines.push('## 🧬 DNA Constraints & Rules');
            for (const c of plan.dnaConstraints) {
                lines.push(`- ${c}`);
            }
            lines.push('');
        }

        if (plan.skillsUsed.length > 0) {
            lines.push('## 📚 Skills Applied');
            for (const s of plan.skillsUsed) {
                lines.push(`- ${s}`);
            }
            lines.push('');
        }

        if (plan.realmInsights.length > 0) {
            lines.push('## 🗺️ Realm Insights');
            for (const ri of plan.realmInsights) {
                lines.push(`- ${ri}`);
            }
            lines.push('');
        }

        if (plan.structureMap) {
            lines.push('## 🏗️ Structure Map');
            lines.push('```');
            lines.push(plan.structureMap);
            lines.push('```');
            lines.push('');
        }

        if (plan.milestones.length > 0) {
            lines.push('## 🎯 Milestones');
            for (const m of plan.milestones) {
                lines.push(`### M${m.id}: ${m.title} (${m.estimatedComplexity})`);
                lines.push(m.description);
                if (m.files.length > 0) {
                    lines.push('Files:');
                    for (const f of m.files) {
                        lines.push(`  - [${f.action.toUpperCase()}] ${f.path}`);
                    }
                }
                if (m.dependencies.length > 0) {
                    lines.push(`Depends on: M${m.dependencies.join(', M')}`);
                }
                lines.push('');
            }
        }

        if (plan.risks.length > 0) {
            lines.push('## ⚠️ Risks');
            for (const r of plan.risks) {
                const icon = r.severity === 'high' ? '🔴' : r.severity === 'medium' ? '🟡' : '🟢';
                lines.push(`- ${icon} **${r.file}**: ${r.reason}`);
            }
            lines.push('');
        }

        if (plan.dependencies.length > 0) {
            lines.push('## 🔗 Key Dependencies');
            for (const d of plan.dependencies) {
                lines.push(`- ${d}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }
}
