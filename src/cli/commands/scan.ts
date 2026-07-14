import { printError } from '../cli-output.js';

export type ScanTarget = 'tokens' | 'i18n' | 'duplicates' | 'conventions' | 'assets';

const VALID_TARGETS: ScanTarget[] = ['tokens', 'i18n', 'duplicates', 'conventions', 'assets'];

const PHASE_MAP: Record<ScanTarget, { emoji: string; label: string; phase: string }> = {
    tokens:      { emoji: '🔬', label: 'Property Miner',    phase: 'F2' },
    i18n:        { emoji: '🌍', label: 'L10n Detector',     phase: 'F6' },
    duplicates:  { emoji: '🔍', label: 'Similarity Engine', phase: 'F4' },
    conventions: { emoji: '📛', label: 'Convention Miner',  phase: 'F5' },
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

    const info = PHASE_MAP[target as ScanTarget];
    process.stdout.write(
        `\x1b[33m${info.emoji} ${info.label} — scheduled for Phase ${info.phase}. ` +
        `Run \`deepsift dna\` for available analysis.\x1b[0m\n`
    );
}
