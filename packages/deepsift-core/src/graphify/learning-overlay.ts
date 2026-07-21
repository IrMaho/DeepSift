import fs from 'fs';
import path from 'path';
import { LearningEntry } from './graph-types.js';

export class LearningOverlay {
    private lessonsPath: string;
    private lessons: LearningEntry[] = [];
    private HALF_LIFE_DAYS = 30;

    constructor(workspaceRoot: string) {
        this.lessonsPath = path.join(workspaceRoot, '.deepsift', 'graph_learning.json');
        this.loadLessons();
    }

    private loadLessons() {
        if (fs.existsSync(this.lessonsPath)) {
            try {
                const data = fs.readFileSync(this.lessonsPath, 'utf8');
                this.lessons = JSON.parse(data);
            } catch (e) {
                console.error('Failed to load graph learning data', e);
            }
        }
    }

    public saveLessons() {
        try {
            const dir = path.dirname(this.lessonsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.lessonsPath, JSON.stringify(this.lessons, null, 2));
            this.generateLessonsMarkdown(dir);
        } catch (e) {
            console.error('Failed to save graph learning data', e);
        }
    }

    public recordExperience(question: string, sourceNodes: string[], outcome: 'useful' | 'dead_end' | 'corrected', correction?: string) {
        this.lessons.push({
            question,
            sourceNodes,
            outcome,
            timestamp: Date.now(),
            correction
        });
        this.saveLessons();
    }

    public getLessonsForNode(nodeId: string): LearningEntry[] {
        const now = Date.now();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        return this.lessons.filter(l => l.sourceNodes.includes(nodeId)).map(lesson => {
            // Calculate time decay
            const daysSince = (now - lesson.timestamp) / MS_PER_DAY;
            const decay = Math.pow(2, -daysSince / this.HALF_LIFE_DAYS);
            
            // Only return if it still has relevance (> 0.1 weight)
            if (decay > 0.1) {
                return lesson;
            }
            return null;
        }).filter(Boolean) as LearningEntry[];
    }

    private generateLessonsMarkdown(dir: string) {
        const mdPath = path.join(dir, 'LESSONS.md');
        let content = `# DeepSift Graphify Lessons\n\nExperiential learning gathered from past queries.\n\n`;

        const useful = this.lessons.filter(l => l.outcome === 'useful');
        const deadEnds = this.lessons.filter(l => l.outcome === 'dead_end');
        const corrected = this.lessons.filter(l => l.outcome === 'corrected');

        if (useful.length > 0) {
            content += `## Proven Paths\n\n`;
            for (const l of useful) {
                content += `- Query: "${l.question}" -> Found in: ${l.sourceNodes.join(', ')}\n`;
            }
            content += '\n';
        }

        if (deadEnds.length > 0) {
            content += `## Known Dead Ends\n\n`;
            for (const l of deadEnds) {
                content += `- Query: "${l.question}" -> DO NOT USE: ${l.sourceNodes.join(', ')}\n`;
            }
            content += '\n';
        }

        if (corrected.length > 0) {
            content += `## Corrections\n\n`;
            for (const l of corrected) {
                content += `- Query: "${l.question}" -> Incorrectly went to: ${l.sourceNodes.join(', ')}\n  - Correction: ${l.correction}\n`;
            }
        }

        fs.writeFileSync(mdPath, content);
    }
}
