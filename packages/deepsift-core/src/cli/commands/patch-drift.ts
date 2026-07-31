/**
 * @file patch-drift.ts
 * @description Auto-heals schema drift by automatically injecting missing fields.
 *
 * @module cli/commands/patch-drift
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { detectSchemaDrifts, FieldMeta, DriftReport } from './schema-drift.js';
import { saveSearchLog } from '../../utils/history.js';
import path from 'path';

export async function patchDriftCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 💉 Self-Healing Schema Drift Engine\n`);

    const { reports, schemasCount } = detectSchemaDrifts(projectPath);

    if (reports.length === 0) {
        lines.push(`✅ **No schema drift detected!** Workspace is already perfectly synchronized.`);
        printResult(lines.join('\n'), format);
        return;
    }

    lines.push(`Discovered **${reports.length}** drift issues across ${schemasCount} schemas. Applying auto-healing patches...\n`);

    const filesToPatch = new Map<string, { entityName: string, fieldsToAdd: FieldMeta[] }[]>();

    // Collect all patches per file
    for (const report of reports) {
        for (const missing of report.missingIn) {
            // We only support auto-patching TS/JS and Dart files for now
            const ext = path.extname(missing.file);
            if (!['.ts', '.js', '.dart'].includes(ext)) {
                lines.push(`- ⚠️ Skipping auto-patch for \`${missing.name}\` in \`${missing.file}\` (unsupported auto-patch extension)`);
                continue;
            }

            if (!filesToPatch.has(missing.fullPath)) {
                filesToPatch.set(missing.fullPath, []);
            }
            
            const filePatches = filesToPatch.get(missing.fullPath)!;
            let entityPatch = filePatches.find(p => p.entityName === missing.name);
            if (!entityPatch) {
                entityPatch = { entityName: missing.name, fieldsToAdd: [] };
                filePatches.push(entityPatch);
            }
            
            // Only add if not already added
            if (!entityPatch.fieldsToAdd.some(f => f.name === report.field.name)) {
                entityPatch.fieldsToAdd.push(report.field);
            }
        }
    }

    let patchedCount = 0;

    // Apply patches
    for (const [fullPath, entityPatches] of filesToPatch.entries()) {
        try {
            let content = fs.readFileSync(fullPath, 'utf8');
            const blockRegex = /(interface|class|type|struct)\s+([A-Za-z0-9_]+)([^{]*)\{([^}]*)\}/g;
            
            let updatedContent = content.replace(blockRegex, (match, keyword, name, preBlock, block) => {
                const patch = entityPatches.find(p => p.entityName === name);
                if (!patch) return match; // No patch for this entity

                let newBlock = block.trimEnd();
                if (!newBlock.endsWith('\n')) newBlock += '\n';

                const isDart = fullPath.endsWith('.dart');

                for (const field of patch.fieldsToAdd) {
                    if (isDart) {
                        const typeStr = field.type;
                        newBlock += `  ${typeStr} ${field.name};\n`;
                    } else {
                        // TS/JS
                        const opt = field.isOptional ? '?' : '';
                        let typeStr = field.type || 'any';
                        // Clean up type if it was from Prisma or Go
                        if (typeStr.includes('Int')) typeStr = 'number';
                        else if (typeStr.includes('String')) typeStr = 'string';
                        else if (typeStr.includes('Boolean')) typeStr = 'boolean';
                        
                        newBlock += `  ${field.name}${opt}: ${typeStr};\n`;
                    }
                }
                
                newBlock += '}'; // add back the closing brace that was outside the capture group
                return `${keyword} ${name}${preBlock}{${newBlock}`;
            });

            if (content !== updatedContent) {
                fs.writeFileSync(fullPath, updatedContent, 'utf8');
                const relPath = path.relative(projectPath, fullPath);
                lines.push(`- ✅ **Healed** \`${relPath}\` (injected ${entityPatches.reduce((acc, p) => acc + p.fieldsToAdd.length, 0)} missing fields)`);
                patchedCount++;
            }
        } catch (e) {
            lines.push(`- ❌ **Failed to heal** \`${path.relative(projectPath, fullPath)}\`: ${(e as Error).message}`);
        }
    }

    if (patchedCount > 0) {
        lines.push(`\n🎉 Successfully auto-healed **${patchedCount}** files using AST-based patching!`);
    } else {
        lines.push(`\n⚠️ No files were successfully patched (they might be in unsupported languages).`);
    }

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[PatchDrift]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
