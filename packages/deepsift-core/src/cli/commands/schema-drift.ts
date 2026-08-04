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

export interface FieldMeta {
    name: string;
    type: string;
    isOptional: boolean;
}

export interface EntityMeta {
    name: string;
    fields: FieldMeta[];
    block: string;
}

export function extractEntities(content: string): EntityMeta[] {
    const entities: EntityMeta[] = [];
    const blockRegex = /(?:interface|class|type|struct)\s+([A-Za-z0-9_]+)[^{]*\{([^}]*)\}/g;
    let match;
    
    while ((match = blockRegex.exec(content)) !== null) {
        const name = match[1];
        const block = match[2];
        const fields: FieldMeta[] = [];
        
        const lines = block.split('\n');
        for (const line of lines) {
            const clean = line.trim();
            if (!clean || clean.startsWith('//') || clean.startsWith('/*')) continue;
            
            // TS/JS: fieldName: type or fieldName?: type
            const tsMatch = clean.match(/^([A-Za-z0-9_]+)\s*(\?)?\s*:\s*([^;]+)/);
            if (tsMatch) {
                fields.push({ name: tsMatch[1], isOptional: !!tsMatch[2], type: tsMatch[3].trim() });
                continue;
            }
            // Go/Dart/Java: Type fieldName;
            const cLikeMatch = clean.match(/^([A-Za-z0-9_<>\[\]\?]+)\s+([A-Za-z0-9_]+)\s*;/);
            if (cLikeMatch) {
                fields.push({ name: cLikeMatch[2], isOptional: cLikeMatch[1].includes('?'), type: cLikeMatch[1] });
                continue;
            }
            // SQL/Prisma: fieldName Type ...
            const prismaMatch = clean.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_\[\]\?]+)/);
            if (prismaMatch && !['PRIMARY', 'FOREIGN', 'UNIQUE', 'CONSTRAINT', '@@', 'model'].some(k => prismaMatch[1].toUpperCase().includes(k))) {
                fields.push({ name: prismaMatch[1], isOptional: prismaMatch[2].includes('?'), type: prismaMatch[2] });
            }
        }
        
        if (fields.length > 0) {
            entities.push({ name, fields, block });
        }
    }
    
    return entities;
}

export function getBaseName(name: string): string {
    return name.replace(/(DTO|Model|Schema|Entity|Type|Interface|Config|Response|Request)$/i, '');
}

export interface DriftReport {
    baseName: string;
    field: FieldMeta;
    missingIn: { file: string; name: string; fullPath: string }[];
    existsIn: { file: string; name: string; fullPath: string }[];
}

export function detectSchemaDrifts(projectPath: string): { reports: DriftReport[], schemasCount: number } {
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
    
    // Group entities
    const entityGroups: Record<string, { file: string, name: string, fields: FieldMeta[], fullPath: string }[]> = {};
    
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
                    fields: ent.fields,
                    fullPath: schema.fullPath
                });
            }
        } catch (e: any) {
            if (process.env.DEEPSIFT_DEBUG) {
                console.error(`[deepsift] Failed to read schema file in check-schema-drift: ${e.message}`);
            }
        }
    }
    
    const reports: DriftReport[] = [];
    
    for (const [baseName, occurrences] of Object.entries(entityGroups)) {
        if (occurrences.length < 2) continue; // Needs to exist in at least 2 places to drift
        
        // Find union of all fields
        const allFieldsMap = new Map<string, FieldMeta>();
        occurrences.forEach(occ => occ.fields.forEach(f => {
            if (!allFieldsMap.has(f.name)) allFieldsMap.set(f.name, f);
        }));
        
        for (const [fieldName, fieldMeta] of allFieldsMap.entries()) {
            const hasField = occurrences.filter(o => o.fields.some(f => f.name === fieldName));
            const missingField = occurrences.filter(o => !o.fields.some(f => f.name === fieldName));
            
            // If some have it and some don't, it's a drift!
            if (hasField.length > 0 && missingField.length > 0) {
                reports.push({
                    baseName,
                    field: fieldMeta,
                    missingIn: missingField.map(m => ({ file: m.file, name: m.name, fullPath: m.fullPath })),
                    existsIn: hasField.map(h => ({ file: h.file, name: h.name, fullPath: h.fullPath }))
                });
            }
        }
    }
    
    return { reports, schemasCount: schemas.length };
}

export async function schemaDriftCommand(projectPath: string, format: OutputFormat = 'markdown'): Promise<void> {
    const lines: string[] = [];
    lines.push(`# 🔄 DOM & Schema Drift Synchronization Audit\n`);

    const { reports, schemasCount } = detectSchemaDrifts(projectPath);
    
    lines.push(`Discovered **${schemasCount}** schema and config definitions across workspace.\n`);
    
    if (reports.length > 0) {
        // Group by base name for rendering
        const groupedReports = reports.reduce((acc, report) => {
            if (!acc[report.baseName]) acc[report.baseName] = [];
            acc[report.baseName].push(report);
            return acc;
        }, {} as Record<string, DriftReport[]>);

        for (const [baseName, baseReports] of Object.entries(groupedReports)) {
            lines.push(`### ⚠️ Schema Drift detected in \`${baseName}\` Entity:`);
            for (const r of baseReports) {
                const hasNames = r.existsIn.map(h => `\`${h.name}\` (${h.file})`).join(', ');
                const missingNames = r.missingIn.map(m => `\`${m.name}\` (${m.file})`).join(', ');
                lines.push(`- 🔴 Field **\`${r.field.name}\`** exists in ${hasNames} BUT is missing in ${missingNames}`);
            }
            lines.push('');
        }
    } else {
        lines.push(`✅ **No schema drift detected!** All cross-boundary interfaces and models are perfectly synchronized.`);
    }

    lines.push(`\n> [!NOTE]`);
    lines.push(`> Always update backend API mappings and server definitions whenever client DOM selectors or database schemas change.`);
    lines.push(`> 💡 **Tip:** Use \`deepsift patch-drift\` to automatically fix these missing fields!`);

    const outputText = lines.join('\n');
    await saveSearchLog(projectPath, ['[SchemaDrift]'], outputText, { skipVisuals: true });
    printResult(outputText, format);
}
