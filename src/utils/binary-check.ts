import fs from 'fs';
import path from 'path';

const BINARY_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff', '.tif',
    '.svg', '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz',
    '.exe', '.dll', '.so', '.dylib', '.lib', '.exp', '.pdb', '.obj', '.o', '.a',
    '.woff', '.woff2', '.ttf', '.eot', '.otf', '.otb',
    '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm',
    '.mp3', '.wav', '.flac', '.aac', '.ogg',
    '.wasm', '.pyc', '.pyo', '.class', '.jar',
    '.db', '.sqlite', '.sqlite3',
    '.lock', '.min.js', '.map',
    '.DS_Store',
]);

const TEXT_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.rb', '.go', '.rs', '.zig', '.c', '.cpp', '.h', '.hpp',
    '.java', '.kt', '.kts', '.scala', '.swift', '.cs', '.fs',
    '.dart', '.lua', '.php', '.pl', '.pm', '.r', '.jl',
    '.html', '.htm', '.css', '.scss', '.sass', '.less',
    '.json', '.yaml', '.yml', '.toml', '.xml', '.ini', '.cfg', '.conf',
    '.md', '.txt', '.rst', '.csv', '.tsv',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
    '.sql', '.graphql', '.proto',
    '.env', '.gitignore', '.dockerignore', '.editorconfig',
    '.vue', '.svelte', '.astro',
    '.diff', '.patch',
    '.jsonl', '.ndjson',
]);

export function isBinaryExtension(filePath: string): boolean | null {
    const ext = path.extname(filePath).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) return true;
    if (TEXT_EXTENSIONS.has(ext)) return false;
    return null;
}

export async function isBinaryFile(filePath: string): Promise<boolean> {
    const extResult = isBinaryExtension(filePath);
    if (extResult !== null) return extResult;

    try {
        const fd = await fs.promises.open(filePath, 'r');
        const buffer = Buffer.alloc(512);
        const { bytesRead } = await fd.read(buffer, 0, 512, 0);
        await fd.close();

        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}
