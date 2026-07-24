/**
 * @file gen-adr.ts
 * @description Architecture Decision Record (ADR) template generator command.
 *
 * @module cli/commands/gen-adr
 * @category Utilities & Dashboard
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { MemoEngine } from '../../memo/memo-engine.js';

export async function genAdrCommand(projectPath: string, tagTarget?: string) {
    const engine = new MemoEngine(projectPath);
    const tags = engine.getOpenTags();

    if (tags.length === 0) {
        console.log(`\n⚠️  No active DRM tags found. Create one with: deepsift memo open "<task>"`);
        return;
    }

    const targetTag = tagTarget || tags[0].name;
    const adrDir = path.join(projectPath, '.agents', 'adr');
    if (!fs.existsSync(adrDir)) fs.mkdirSync(adrDir, { recursive: true });

    const adrFile = path.join(adrDir, `ADR-${Date.now()}-${targetTag.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`);
    const entries = engine.getEntries(targetTag);

    const content = `# Architecture Decision Record: ${targetTag}

## Context
Automated ADR generated from DeepSift Dynamic Research Memory (DRM) for session tag \`${targetTag}\`.

## Findings & Decisions
${entries.map((e, idx) => `### ${idx + 1}. Entry (ID: ${e.id})\n${e.content}`).join('\n\n')}

## Status
Accepted / Completed
`;

    fs.writeFileSync(adrFile, content, 'utf-8');
    console.log(`\n📄 \x1b[32mSuccessfully generated ADR artifact:\x1b[0m ${path.relative(projectPath, adrFile)}`);
}
