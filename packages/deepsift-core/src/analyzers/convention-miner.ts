/**
 * @file convention-miner.ts
 * @description Project Naming Convention & Directory Architecture Miner Engine.
 * Analyzes case styles (camelCase, PascalCase, kebab-case, snake_case) across files, classes,
 * functions, and variables to extract Project DNA architectural rules.
 * 
 * @module analyzers/convention-miner
 * @category Architecture & Intelligence
 * @since 1.0.3
 */

import fs from 'fs';
import path from 'path';
import { NamingConventions, NamingDistribution, StructureTemplate, createEmptyNamingDistribution } from '../types/dna-types.js';

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage',
    '.dart_tool', '__pycache__', 'target', 'vendor', '.next', '.nuxt',
    '.cache', '.output', '.idea', '.vscode', 'generated', 'gen',
]);

const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.dart', '.py', '.go', '.rs',
    '.java', '.kt', '.swift', '.cpp', '.c', '.h', '.hpp',
    '.cs', '.rb', '.php', '.vue', '.svelte', '.ex', '.exs',
]);

/**
 * Mined naming conventions and directory structure template result.
 */
export interface ConventionResult {
    naming: NamingConventions;
    structureTemplate: StructureTemplate | null;
}

/**
 * Mines project-wide naming conventions and structural architecture templates.
 * 
 * @param projectPath Absolute path to workspace root.
 * @param allFiles List of indexed file paths.
 * @returns ConventionResult containing case distributions.
 * @example
 * ```ts
 * const conventions = mineConventions(process.cwd(), ['src/index.ts']);
 * ```
 */
export function mineConventions(projectPath: string, allFiles: string[]): ConventionResult {
    const fileNames: string[] = [];
    const dirNames = new Set<string>();
    const identifiers: { classes: string[]; functions: string[]; variables: string[]; constants: string[] } = {
        classes: [], functions: [], variables: [], constants: [],
    };

    for (const file of allFiles) {
        const ext = path.extname(file).toLowerCase();
        
        const dirName = path.basename(path.dirname(file));
        if (dirName && dirName !== '.') {
            dirNames.add(dirName);
        }

        if (SOURCE_EXTENSIONS.has(ext)) {
            const baseName = path.basename(file, ext);
            fileNames.push(baseName);

            try {
                const stats = fs.statSync(file);
                if (stats.size <= 300_000) {
                    const fileContent = fs.readFileSync(file, 'utf-8');
                    extractIdentifiers(fileContent, identifiers);
                }
            } catch { /* skip */ }
        }
    }

    const naming: NamingConventions = {
        files: analyzeNaming(fileNames),
        directories: analyzeNaming(Array.from(dirNames)),
        classes: analyzeNaming(identifiers.classes),
        functions: analyzeNaming(identifiers.functions),
        variables: analyzeNaming(identifiers.variables),
        constants: analyzeNaming(identifiers.constants),
    };

    const langDistribution: Record<string, string> = {};
    if (fileNames.some(f => f.includes('_'))) langDistribution['Python/C/Go'] = 'snake_case';
    if (fileNames.some(f => /[a-z][A-Z]/.test(f))) langDistribution['TS/JS/Dart'] = 'camelCase';
    (naming as any).byLanguageHint = langDistribution;

    const structureTemplate = detectStructureTemplate(projectPath);

    return { naming, structureTemplate };
}

function analyzeNaming(names: string[]): NamingDistribution {
    const dist = createEmptyNamingDistribution();
    if (names.length === 0) return dist;

    let kebab = 0, snake = 0, pascal = 0, camel = 0, upperSnake = 0;

    for (const name of names) {
        if (!name || name.length === 0) continue;
        if (isKebabCase(name)) { kebab++; dist.distribution['kebab-case'] = (dist.distribution['kebab-case'] || 0) + 1; }
        else if (isSnakeCase(name)) { snake++; dist.distribution['snake_case'] = (dist.distribution['snake_case'] || 0) + 1; }
        else if (isPascalCase(name)) { pascal++; dist.distribution['PascalCase'] = (dist.distribution['PascalCase'] || 0) + 1; }
        else if (isCamelCase(name)) { camel++; dist.distribution['camelCase'] = (dist.distribution['camelCase'] || 0) + 1; }
        else if (isUpperSnakeCase(name)) { upperSnake++; dist.distribution['UPPER_SNAKE_CASE'] = (dist.distribution['UPPER_SNAKE_CASE'] || 0) + 1; }
        else dist.distribution['other'] = (dist.distribution['other'] || 0) + 1;
    }

    const maxCount = Math.max(kebab, snake, pascal, camel, upperSnake);
    if (maxCount > 0) {
        if (maxCount === kebab) dist.dominant = 'kebab-case';
        else if (maxCount === snake) dist.dominant = 'snake_case';
        else if (maxCount === pascal) dist.dominant = 'PascalCase';
        else if (maxCount === camel) dist.dominant = 'camelCase';
        else if (maxCount === upperSnake) dist.dominant = 'UPPER_SNAKE_CASE';
    }

    return dist;
}

function isKebabCase(s: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)+$/.test(s);
}

function isSnakeCase(s: string): boolean {
    return /^[a-z0-9]+(_[a-z0-9]+)+$/.test(s);
}

function isPascalCase(s: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(s) && !s.includes('_') && !s.includes('-');
}

function isCamelCase(s: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(s) && !s.includes('_') && !s.includes('-');
}

function isUpperSnakeCase(s: string): boolean {
    return /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(s);
}

function extractIdentifiers(
    content: string,
    out: { classes: string[]; functions: string[]; variables: string[]; constants: string[] }
): void {
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        const classMatch = trimmed.match(
            /(?:class|struct|enum|interface|trait|protocol|mixin|extension|abstract\s+class)\s+(\w+)/
        );
        if (classMatch) { out.classes.push(classMatch[1]); continue; }

        const funcMatch = trimmed.match(
            /(?:function|def|fn|func|void|Future|Widget|Task)\s+(\w+)\s*\(/
        );
        if (funcMatch) { out.functions.push(funcMatch[1]); continue; }

        const constMatch = trimmed.match(
            /(?:const|final|static\s+const|val)\s+([A-Z0-9_]{2,})\b/
        );
        if (constMatch) { out.constants.push(constMatch[1]); continue; }

        const varMatch = trimmed.match(
            /(?:let|var|const|auto|mut)\s+([a-zA-Z0-9_]+)\b/
        );
        if (varMatch) { out.variables.push(varMatch[1]); }
    }
}

function detectStructureTemplate(projectPath: string): StructureTemplate | null {
    if (fs.existsSync(path.join(projectPath, 'src', 'features')) || fs.existsSync(path.join(projectPath, 'lib', 'features'))) {
        return {
            pattern: 'Feature-First',
            examples: ['src/features/feature_name/'],
            commonSubfolders: ['components', 'hooks', 'domain'],
            confidence: 0.9
        };
    }
    if (fs.existsSync(path.join(projectPath, 'src', 'components')) || fs.existsSync(path.join(projectPath, 'src', 'views'))) {
        return {
            pattern: 'Layer-First',
            examples: ['src/components/'],
            commonSubfolders: ['components', 'utils', 'services'],
            confidence: 0.8
        };
    }
    return null;
}
