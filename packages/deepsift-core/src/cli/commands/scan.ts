import { printError, printInfo, printSuccess } from '../cli-output.js';
import { NativeStore } from '../../storage/native-store.js';
import { getDbPath } from '../cli-paths.js';
import { calculateCosineSimilarity } from '../../utils/similarity.js';

import { learnCommand } from './learn.js';

export type ScanTarget = 'tokens' | 'i18n' | 'duplicates' | 'conventions' | 'assets' | 'patterns';

const VALID_TARGETS: ScanTarget[] = ['tokens', 'i18n', 'duplicates', 'conventions', 'assets', 'patterns'];

const PHASE_MAP: Record<string, { emoji: string; label: string; phase: string }> = {
    tokens:      { emoji: '🔬', label: 'Property Miner',    phase: 'F2' },
    i18n:        { emoji: '🌍', label: 'L10n Detector',     phase: 'F6' },
    assets:      { emoji: '🎭', label: 'Resource Mapper',   phase: 'F10' },
};

export async function scanCommand(
    projectPath: string,
    target: string,
    format: string
): Promise<void> {
    if (!VALID_TARGETS.includes(target as ScanTarget)) {
        printError(
            `Unknown scan target: "${target}"\n` +
            `Available targets: ${VALID_TARGETS.join(', ')}\n` +
            `Usage: deepsift scan <target>`
        );
        return;
    }

    if (target === 'duplicates') {
        printInfo('🔍 Scanning for duplicate code blocks...');
        const store = new NativeStore(getDbPath(projectPath));
        const chunks = await store.getAllChunks();
        let dupCount = 0;
        
        for (let i = 0; i < chunks.length; i++) {
            for (let j = i + 1; j < chunks.length; j++) {
                if (chunks[i].chunk.filePath === chunks[j].chunk.filePath) continue;
                
                const isExact = chunks[i].chunk.content.trim() === chunks[j].chunk.content.trim();
                const score = calculateCosineSimilarity(chunks[i].embedding, chunks[j].embedding);
                
                if (isExact || score > 0.98) {
                    printInfo(`- Duplicate found (${isExact ? 'Exact' : 'High Similarity: ' + score.toFixed(2)}):`);
                    printInfo(`  1) ${chunks[i].chunk.filePath}:${chunks[i].chunk.startLine}`);
                    printInfo(`  2) ${chunks[j].chunk.filePath}:${chunks[j].chunk.startLine}`);
                    dupCount++;
                }
                
                if (dupCount >= 20) break;
            }
            if (dupCount >= 20) break;
        }
        
        if (dupCount === 0) printSuccess('No duplicates found!');
        else printSuccess(`Found ${dupCount} duplicate/similar blocks.`);
        
    } else if (target === 'conventions') {
        printInfo('📛 Scanning for naming convention violations...');
        const store = new NativeStore(getDbPath(projectPath));
        const chunks = await store.getAllChunks();
        let violationCount = 0;
        
        for (const item of chunks) {
            const { type, content, filePath } = item.chunk;
            if (type === 'class') {
                const match = content.match(/class\s+([a-z][\w]*)/);
                if (match) {
                    printError(`- Violation: Class '${match[1]}' should be PascalCase in ${filePath}`);
                    violationCount++;
                }
            } else if (type === 'function') {
                const match = content.match(/function\s+([A-Z][\w]*)/);
                if (match) {
                    printError(`- Violation: Function '${match[1]}' should be camelCase in ${filePath}`);
                    violationCount++;
                }
            }
            if (violationCount >= 20) break;
        }
        
        if (violationCount === 0) printSuccess('Codebase follows basic conventions!');
        else printSuccess(`Found ${violationCount} convention violations.`);
        
    } else if (target === 'patterns') {
        await learnCommand(projectPath, target);
    } else {
        const info = PHASE_MAP[target];
        process.stdout.write(
            `\x1b[33m${info.emoji} ${info.label} — scheduled for Phase ${info.phase}. ` +
            `Run \`deepsift dna\` for available analysis.\x1b[0m\n`
        );
    }
}
