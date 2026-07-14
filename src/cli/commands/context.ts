import path from 'path';
import { ProjectDNA, CreationContext } from '../../types/dna-types.js';
import fs from 'fs';
import { printResult, OutputFormat } from '../cli-output.js';
import { TokenOptimizerService } from '../../utils/token-compressor.js';

export function getContextText(projectPath: string, targetPath: string, compress: boolean = true): string {
    const dnaPath = path.join(projectPath, '.deepsift', 'project-dna.json');
    if (!fs.existsSync(dnaPath)) {
        throw new Error('Project DNA not found. Run `deepsift dna` first.');
    }

    const dna: ProjectDNA = JSON.parse(fs.readFileSync(dnaPath, 'utf-8'));
    
    // Build context
    const isComponent = targetPath.toLowerCase().includes('component') || targetPath.toLowerCase().includes('widget');
    const isFeature = targetPath.toLowerCase().includes('feature') || targetPath.toLowerCase().includes('screen');

    const context: CreationContext = {
        targetPath,
        namingSuggestion: dna.conventions?.naming?.files?.dominant || 'unknown',
        similarExisting: [],
        requiredTokens: [],
        i18nRequired: dna.localization?.hasI18n || false,
        templateStructure: [],
        conventionReminders: dna.rules || []
    };

    // Populate Similar Existing based on target name
    const baseName = path.basename(targetPath, path.extname(targetPath));
    if (dna.components && dna.components.similarityGroups) {
        for (const group of dna.components.similarityGroups) {
            for (const member of group.members) {
                if (member.name.toLowerCase().includes(baseName.toLowerCase()) || member.filePath.toLowerCase().includes(baseName.toLowerCase())) {
                    context.similarExisting.push(member);
                }
            }
        }
    }

    // Design Tokens (Sample for UI elements)
    if (isComponent && dna.designSystem && dna.designSystem.tokens) {
        context.requiredTokens = [
            ...(dna.designSystem.tokens.colors || []).slice(0, 3),
            ...(dna.designSystem.tokens.dimensions || []).slice(0, 3)
        ];
    }

    // Template Structure
    if (isFeature && dna.architecture && dna.architecture.templatePatterns) {
        const bestPattern = dna.architecture.templatePatterns[0];
        if (bestPattern) {
            context.templateStructure = bestPattern.commonSubfolders;
        }
    }

    let rawOutput = `## 📋 Pre-Generation Checklist for: ${targetPath}\n\n`;

    rawOutput += `### 📛 Naming & Rules\n`;
    rawOutput += `- File Naming: ${context.namingSuggestion}\n`;
    if (context.i18nRequired) rawOutput += `- 🌍 i18n Required: DO NOT hardcode strings.\n`;
    for (const rule of context.conventionReminders) {
        rawOutput += `- 📜 Rule: ${rule}\n`;
    }

    if (context.similarExisting.length > 0) {
        rawOutput += `\n### ⚠️ Similar Existing Components\n`;
        rawOutput += `Before creating, check if you can reuse these:\n`;
        for (const sim of context.similarExisting.slice(0, 5)) {
            rawOutput += `- ${sim.name} at ${sim.filePath}:${sim.startLine}\n`;
        }
    }

    if (context.requiredTokens.length > 0) {
        rawOutput += `\n### 🎨 Design Tokens (Allowed Values)\n`;
        for (const t of context.requiredTokens) {
            rawOutput += `- ${t.name} = ${t.value}\n`;
        }
    }

    if (context.templateStructure.length > 0) {
        rawOutput += `\n### 📁 Recommended Structure\n`;
        rawOutput += `Based on feature templates, consider creating:\n`;
        for (const folder of context.templateStructure) {
            rawOutput += `- ${folder}/\n`;
        }
    }

    let finalOutput = rawOutput;
    if (compress) {
        const optimizer = new TokenOptimizerService();
        finalOutput = optimizer.optimize(rawOutput).toUnifiedString();
    }

    return finalOutput;
}

export function contextCommand(
    projectPath: string,
    targetPath: string,
    format: OutputFormat,
    compress: boolean = true
) {
    if (format === 'json') {
        // Just print raw JSON
        const contextText = getContextText(projectPath, targetPath, false); // Though this returns markdown. Wait, format='json' needs to return object.
        // I will let contextCommand handle json directly or let getContextText just return string.
        // Actually, let's keep getContextText for MCP, and contextCommand uses it.
    }
    
    try {
        const text = getContextText(projectPath, targetPath, compress);
        printResult(text, format);
    } catch (e: any) {
        throw e;
    }
}
