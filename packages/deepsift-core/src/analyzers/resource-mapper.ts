/**
 * @file resource-mapper.ts
 * @description Static resource and asset mapper for image, font, and media file discovery.
 *
 * @module analyzers/resource-mapper
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { ResourceMap } from '../types/dna-types.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif']);
const FONT_EXTENSIONS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.deepsift', 'coverage', '.dart_tool']);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.dart', '.vue', '.svelte', '.html']);

export function mapResources(
    projectPath: string,
    allFiles: string[],
    onProgress?: (phase: string, detail: string) => void
): ResourceMap {
    const images: string[] = [];
    const fonts: string[] = [];
    const sourceFiles: string[] = [];

        // Walk project to find assets and source files
    for (const full of allFiles) {
        const ext = path.extname(full).toLowerCase();
        const relPath = path.relative(projectPath, full).replace(/\\/g, '/');

        if (IMAGE_EXTENSIONS.has(ext)) {
            images.push(relPath);
        } else if (FONT_EXTENSIONS.has(ext)) {
            fonts.push(relPath);
        } else if (SOURCE_EXTENSIONS.has(ext)) {
            sourceFiles.push(full);
        }
    }

    // Analyze Icon Usage and Unused Assets
    const allCodeContent: string[] = [];
    const iconImportPatterns = [
        // React/Lucide/Heroicons
        /import\s+\{\s*([A-Za-z0-9_]+Icon)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
        // Vue/Material
        /<(?:md-icon|v-icon|Icon)>(.*?)<\//g,
        // Flutter/Dart (Icons.foo)
        /Icons\.([a-z_0-9]+)/g,
        // FontAwesome
        /fa(?:s|r|l|d|b)?\s+fa-([a-z-]+)/g
    ];

    const iconUsages = new Map<string, { source: string, examples: Set<string> }>();
    const usedAssetNames = new Set<string>();

    for (const sourceFile of sourceFiles) {
        try {
            const stats = fs.statSync(sourceFile);
            if (stats.size > 500_000) continue; // Skip huge files
            const content = fs.readFileSync(sourceFile, 'utf-8');
            allCodeContent.push(content);

            // React Icon imports
            let match;
            while ((match = iconImportPatterns[0].exec(content)) !== null) {
                const source = match[2];
                if (!iconUsages.has('Component-based')) iconUsages.set('Component-based', { source, examples: new Set() });
                iconUsages.get('Component-based')!.examples.add(match[1]);
            }

            // HTML/Vue tags
            while ((match = iconImportPatterns[1].exec(content)) !== null) {
                if (!iconUsages.has('Tag-based')) iconUsages.set('Tag-based', { source: 'html/components', examples: new Set() });
                iconUsages.get('Tag-based')!.examples.add(match[1].trim());
            }

            // Flutter Icons
            while ((match = iconImportPatterns[2].exec(content)) !== null) {
                if (!iconUsages.has('Static-class')) iconUsages.set('Static-class', { source: 'Icons', examples: new Set() });
                iconUsages.get('Static-class')!.examples.add(`Icons.${match[1]}`);
            }

            // FontAwesome
            while ((match = iconImportPatterns[3].exec(content)) !== null) {
                if (!iconUsages.has('CSS-classes')) iconUsages.set('CSS-classes', { source: 'FontAwesome', examples: new Set() });
                iconUsages.get('CSS-classes')!.examples.add(match[1]);
            }

            // Simple search for asset filenames in code
            for (const img of images) {
                const base = path.basename(img);
                const nameWithoutExt = path.basename(img, path.extname(img));
                if (content.includes(base) || content.includes(`'${nameWithoutExt}'`) || content.includes(`"${nameWithoutExt}"`)) {
                    usedAssetNames.add(img);
                }
            }
        } catch { /* skip */ }
    }

    // Determine dominant icon pattern
    let dominantIconType = 'unknown';
    let dominantSource = 'unknown';
    let exampleUsages: string[] = [];
    let maxUsages = 0;

    for (const [type, data] of iconUsages.entries()) {
        if (data.examples.size > maxUsages) {
            maxUsages = data.examples.size;
            dominantIconType = type;
            dominantSource = data.source;
            exampleUsages = Array.from(data.examples).slice(0, 5);
        }
    }

    const unusedAssets = images.filter(img => !usedAssetNames.has(img));

    return {
        imageFiles: images.slice(0, 50), // Cap to prevent massive DNA
        fontFiles: fonts.slice(0, 50),
        iconUsagePattern: {
            type: dominantIconType,
            importSource: dominantSource,
            exampleUsages
        },
        unusedAssets: unusedAssets.slice(0, 20)
    };
}
