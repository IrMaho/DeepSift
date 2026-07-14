import { promises as fs } from 'fs';
import path from 'path';
import ignore from 'ignore';
import { loadConfig } from './config.js';

const DEFAULT_IGNORES = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.cache',
    '.dart_tool',
    '.gradle',
    '.idea',
    '.vscode',
    '**/*.min.js',
    '**/*.map',
    '**/*.svg',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.ico',
    '**/*.woff',
    '**/*.woff2',
    '**/*.ttf',
    '**/*.eot',
    '**/*.pdf',
    '**/*.zip',
    '**/*.tar',
    '**/*.gz',
    '**/*.rar',
    '**/*.7z',
    '**/*.sqlite',
    '**/*.db',
    '**/*.log',
    '**/logs/**',
    '**/*.mp4',
    '**/*.avi',
    '**/*.mov',
    '**/*.lock',
    '**/*.dll',
    '**/*.pdb',
    '**/*.exe',
    '**/*.so',
    '**/*.dylib',
    '**/*.lib',
    '**/*.exp'
];

/**
 * Recursively walks a directory and returns a list of files that are not ignored.
 * Evaluates .gitignore if present in the root directory.
 */
export async function getFiles(rootDir: string): Promise<string[]> {
    const ig = ignore().add(DEFAULT_IGNORES);

    // Try to read .gitignore
    try {
        const gitignorePath = path.join(rootDir, '.gitignore');
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        ig.add(gitignoreContent);
    } catch (err) {
        // Ignore if .gitignore doesn't exist
    }

    const config = loadConfig(rootDir);
    if (config.indexer?.excludeDirs && config.indexer.excludeDirs.length > 0) {
        ig.add(config.indexer.excludeDirs);
    }
    if (config.indexer?.excludeExtensions && config.indexer.excludeExtensions.length > 0) {
        ig.add(config.indexer.excludeExtensions.map(ext => `**/*${ext}`));
    }

    const includeExtensions = config.indexer?.includeExtensions || [];

    const files: string[] = [];

    async function walk(currentDir: string) {
        let entries;
        try {
            entries = await fs.readdir(currentDir, { withFileTypes: true });
        } catch (err) {
            return; // Skip directories we can't read
        }

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            const isDirectory = entry.isDirectory();
            const checkPath = isDirectory ? `${relativePath}/` : relativePath;

            // Check if ignored
            if (ig.ignores(checkPath)) {
                continue;
            }

            if (isDirectory) {
                await walk(fullPath);
            } else if (entry.isFile()) {
                if (includeExtensions.length > 0) {
                    const ext = path.extname(entry.name);
                    if (!includeExtensions.includes(ext)) {
                        continue;
                    }
                }
                files.push(fullPath);
            }
        }
    }

    await walk(rootDir);
    return files;
}
