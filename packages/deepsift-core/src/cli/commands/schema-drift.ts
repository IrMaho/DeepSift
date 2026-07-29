/**
 * @file schema-drift.ts
 * @description Schema drift detection between client UI and backend definitions.
 *
 * @module cli/commands/schema-drift
 * @category Refactoring & Self-Healing
 * @since 1.0.3
 */
import path from 'path';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { saveSearchLog } from '../../utils/history.js';
import { normalizePath } from '../../utils/outline.js';

function extractEntities(content: string): { name: string, fields: string[] }[] {
    const entities: { name: string, fields: string[] }[] = [];
    const blockRegex = /(?:interface|class|type|struct)\s+([A-Za-z0-9_]+)[^{]*\{([^}]*)\}/g;
    let match;
    
    while ((match = blockRegex.exec(content)) !== null) {
        const name = match[1];
        const block = match[2];
        const fields: string[] = [];
        
        const lines = block.split('\n');
        for (const line of lines) {
            const clean = line.trim();
            if (!clean || clean.startsWith('//') || clean.startsWith('/*')) continue;
            
            // TS/JS: fieldName: type or fieldName?: type
            const tsMatch = clean.match(/^([A-Za-z0-9_]+)\s*\??\s*:/);
            if (tsMatch) {
                fields.push(tsMatch[1]);
                continue;
            }
            // Go/Dart/Java: Type fieldName;
            const cLikeMatch = clean.match(/^[A-Za-z0-9_<>\[\]\?]+\s+([A-Za-z0-9_]+)\s*;/);
            if (cLikeMatch) {
                fields.push(cLikeMatch[1]);
                continue;
            }
            // SQL/Prisma: fieldName Type ...
            const prismaMatch = clean.match(/^([A-Za-z0-9_]+)\s+[A-Za-z0-9_\[\]\?]+/);
            if (prismaMatch && !['PRIMARY', 'FOREIGN', 'UNIQUE', 'CONSTRAINT', '@@', 'model'].some(k => prismaMatch[1].toUpperCase().includes(k))) {
                fields.push(prismaMatch[1]);
            }
        }
        
        if (fields.length > 0) {
            entities.push({ name, fields });
        }
    }
    
    return entities;
}

function getBaseName(name: string): string {
    return name.replace(/(DTO|Model|Schema|Entity|Type|Interface|Config|Response|Request)$/i, '');
}

export async function schemaDriftCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🔄 DOM & Schema Drift Synchronization Audit\n`);

    const schemas: Array<{ file: string, type: string, fullPath: string }> = [];

    function scan(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name.startsWith('.') || ['node_modules', 'dist', 'build', '.deepsift'].includes(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                scan(fullPath);
            } else {
                const ext = path.extname(item.name);
                if (['.ts', '.json', '.prisma', '.sql', '.dart', '.go'].includes(ext)) {
                    if (item.name.includes('schema') || item.name.includes('config') || item.name.includes('dto') || item.name.includes('model') || item.name.includes('types')) {
                        schemas.push({ file: normalizePath(path.relative(projectPath, fullPath)), type: ext, fullPath });
                    }
                }
            }
        }
    }

    scan(projectPath);
    
    lines.push(`Discovered **${schemas.length}** schema and config definitions across workspace.\n`);
    
    // Group entities
    const entityGroups: Record<string, { file: string, name: string, fields: string[] }[]> = {};
    
    for (const schema of schemas) {
        try {
            const content = fs.readFileSync(schema.fullPath, 'utf8');
            const entities = extractEntities(content);
            for (const ent of entities) {
                const baseName = getBaseName(ent.name);
                if (baseName.length < 3) continue; // skip very short generic names
                
                if (!entityGroups[baseName]) {
                    entityGroups[baseName] = [];
                }
                entityGroups[baseName].push({
                    file: schema.file,
                    name: ent.name,
                    fields: ent.fields
                });
            }
        } catch (e) {
            // ignore unreadable
        }
    }
    
    let foundDrift = false;
    
    for (const [baseName, occurrences] of Object.entries(entityGroups)) {
        if (occurrences.length < 2) continue; // Needs to exist in at least 2 places to drift
        
        // Find union of all fields
        const allFields = new Set<string>();
        occurrences.forEach(occ => occ.fields.forEach(f => allFields.add(f)));
        
        const driftReports: string[] = [];
        
        for (const field of allFields) {
            const hasField = occurrences.filter(o => o.fields.includes(field));
            const missingField = occurrences.filter(o => !o.fields.includes(field));
            
            // If some have it and some don't, it's a drift!
            if (hasField.length > 0 && missingField.length > 0) {
                const hasNames = hasField.map(h => `\`${h.name}\` (${h.file})`).join(', ');
                const missingNames = missingField.map(m => `\`${m.name}\` (${m.file})`).join(', ');
                driftReports.push(`- 🔴 Field **\`${field}\`** exists in ${hasNames} BUT is missing in ${missingNames}`);
            }
        }
        
        if (driftReports.length > 0) {
            foundDrift = true;
            lines.push(`### ⚠️ Schema Drift detected in \`${baseName}\` Entity:`);
            lines.push(...driftReports);
            lines.push('');
        }
    }
    
    if (!foundDrift) {
        lines.push(`✅ **No schema drift detected!** All cross-boundary interfaces and models are perfectly synchronized.`);
    }

    lines.push(`\n> [!NOTE]`);
    lines.push(`> Always update backend API mappings and server definitions whenever client DOM selectors or database schemas change.`);

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[SchemaDrift]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
