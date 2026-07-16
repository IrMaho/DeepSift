import { GraphifyNode, GraphifyEdge, SubgraphResult } from './graph-types.js';

const QUERY_STOPWORDS = new Set([
    // English
    "how", "what", "why", "when", "where", "which", "who", "whom", "whose",
    "does", "did", "is", "are", "was", "were", "be", "been", "being",
    "can", "could", "should", "would", "will", "shall", "may", "might", "must",
    "has", "have", "had", "the", "and", "but", "not", "for", "from", "with",
    "without", "into", "onto", "off", "that", "this", "these", "those", "there",
    "here", "its", "their", "them", "they", "about", "any", "all", "some",
    "work", "works", "working",
    // Adding some persian stopwords since this could be queried in persian
    "چگونه", "چیست", "چرا", "کی", "کجا", "کدام", "چه", "کسی",
    "آیا", "است", "هست", "بود", "شد", "می", "کند", "دارد", "کرد", "کار", "میکند",
    "در", "با", "از", "به", "بر", "برای", "که", "این", "آن", "ها"
]);

export class GraphQueryEngine {
    private nodes: Map<string, GraphifyNode>;
    private idfCache: Map<string, number> = new Map();

    constructor(nodesList: GraphifyNode[]) {
        this.nodes = new Map();
        for (const node of nodesList) {
            this.nodes.set(node.id, node);
        }
    }

    private queryTerms(question: string): string[] {
        const terms: string[] = [];
        const rawTerms = question.toLowerCase().split(/\s+/);
        
        for (const raw of rawTerms) {
            // Very simple tokenization for now
            const tokens = raw.match(/\w+/g);
            if (tokens) {
                for (const t of tokens) {
                    if (t.length > 2) {
                        terms.push(t);
                    }
                }
            }
        }

        const content = terms.filter(t => !QUERY_STOPWORDS.has(t));
        return content.length > 0 ? content : terms;
    }

    private computeIdf(terms: string[]): Map<string, number> {
        const N = Math.max(1, this.nodes.size);
        const result = new Map<string, number>();

        for (const term of terms) {
            if (this.idfCache.has(term)) {
                result.set(term, this.idfCache.get(term)!);
                continue;
            }

            let df = 0;
            for (const node of this.nodes.values()) {
                const normLabel = node.label.toLowerCase();
                if (normLabel.includes(term)) {
                    df++;
                }
            }

            const idf = Math.log(1 + N / (1 + df));
            this.idfCache.set(term, idf);
            result.set(term, idf);
        }

        return result;
    }

    public scoreQuery(question: string): { ranked: { score: number, id: string }[], bestSeedByTerm: Map<string, string> } {
        const terms = this.queryTerms(question);
        if (terms.length === 0) return { ranked: [], bestSeedByTerm: new Map() };

        const idf = this.computeIdf(terms);
        const joined = terms.join(" ");
        let joinedW = 1.0;
        for (const t of terms) {
            const w = idf.get(t) || 1.0;
            if (w > joinedW) joinedW = w;
        }

        const EXACT_MATCH_BONUS = 1000.0;
        const PREFIX_MATCH_BONUS = 100.0;
        const SUBSTRING_MATCH_BONUS = 1.0;
        const SOURCE_MATCH_BONUS = 0.5;

        const scored: { score: number, id: string }[] = [];
        const bestByTerm = new Map<string, { score: number, id: string }>();

        for (const [nid, node] of this.nodes.entries()) {
            const normLabel = node.label.toLowerCase();
            const source = node.sourceFile.toLowerCase();
            const nidLower = nid.toLowerCase();

            let score = 0.0;

            if (joined) {
                if ([normLabel, nidLower].includes(joined)) {
                    score += EXACT_MATCH_BONUS * 10 * joinedW;
                } else if (normLabel.startsWith(joined)) {
                    score += PREFIX_MATCH_BONUS * 10 * joinedW;
                }
            }

            let matched = 0;
            let tiered = 0.0;

            for (const t of terms) {
                const w = idf.get(t) || 1.0;
                let tierValue = 0.0;
                let substrValue = 0.0;
                let sourceValue = 0.0;

                if (t === normLabel) {
                    tierValue = EXACT_MATCH_BONUS * w;
                    matched++;
                } else if (normLabel.startsWith(t)) {
                    tierValue = PREFIX_MATCH_BONUS * w;
                    matched++;
                } else if (normLabel.includes(t)) {
                    substrValue = SUBSTRING_MATCH_BONUS * w;
                    score += substrValue;
                    matched++;
                }

                if (source.includes(t)) {
                    sourceValue = SOURCE_MATCH_BONUS * w;
                    score += sourceValue;
                }

                tiered += tierValue;

                // Per term singleton
                let singleton = 0.0;
                if ([normLabel, nidLower].includes(t)) {
                    singleton = EXACT_MATCH_BONUS * 10 * w;
                } else if (normLabel.startsWith(t)) {
                    singleton = PREFIX_MATCH_BONUS * 10 * w;
                }
                singleton += tierValue + substrValue + sourceValue;

                if (singleton > 0) {
                    const cur = bestByTerm.get(t);
                    if (!cur || singleton > cur.score) {
                        bestByTerm.set(t, { score: singleton, id: nid });
                    }
                }
            }

            if (tiered > 0) {
                score += tiered * Math.pow(matched / terms.length, 2);
            }

            if (score > 0) {
                scored.push({ score, id: nid });
            }
        }

        scored.sort((a, b) => b.score - a.score);

        const bestSeedByTerm = new Map<string, string>();
        for (const [t, data] of bestByTerm.entries()) {
            bestSeedByTerm.set(t, data.id);
        }

        return { ranked: scored, bestSeedByTerm };
    }

    public pickSeeds(scored: { score: number, id: string }[], maxK: number = 3, gapRatio: number = 0.2, bestSeedByTerm?: Map<string, string>): string[] {
        if (scored.length === 0) return [];

        const topScore = scored[0].score;
        const seeds: string[] = [];
        const seenLabels = new Set<string>();

        for (const item of scored) {
            if (seeds.length >= maxK) break;
            if (seeds.length > 0 && item.score < topScore * gapRatio) break;

            const node = this.nodes.get(item.id);
            const key = node ? node.label.toLowerCase() : item.id;
            
            if (seenLabels.has(key)) continue;
            
            seenLabels.add(key);
            seeds.push(item.id);
        }

        if (bestSeedByTerm) {
            for (const bestId of bestSeedByTerm.values()) {
                const node = this.nodes.get(bestId);
                const key = node ? node.label.toLowerCase() : bestId;
                if (!seeds.includes(bestId) && !seenLabels.has(key)) {
                    seenLabels.add(key);
                    seeds.push(bestId);
                }
            }
        }

        return seeds;
    }
}
