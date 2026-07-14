import fs from 'fs';
import path from 'path';

export interface DeepSiftConfig {
    search?: {
        defaultTopK?: number;
        defaultContextLines?: number;
    };
    indexer?: {
        includeDirs?: string[];
        excludeDirs?: string[];
        includeExtensions?: string[];
        excludeExtensions?: string[];
    };
    format?: {
        outputTheme?: string;
    }
}

export const DEFAULT_CONFIG: DeepSiftConfig = {
    search: {
        defaultTopK: 10,
        defaultContextLines: 0,
    },
    indexer: {
        includeDirs: [],
        excludeDirs: [
            "node_modules", ".git", "dist", "build", "coverage", ".next",
            ".cache", ".dart_tool", ".gradle", ".idea", ".vscode", "windows", "android", "ios", "linux", "macos", "web", "public"
        ],
        includeExtensions: [],
        excludeExtensions: [".min.js", ".map", ".lock", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z", ".sqlite", ".db", ".log", ".mp4", ".avi", ".mov", ".dll", ".pdb", ".exe", ".so", ".dylib", ".lib", ".exp"]
    },
    format: {
        outputTheme: "default"
    }
};

export function loadConfig(projectPath: string): DeepSiftConfig {
    const configPath = path.join(projectPath, 'deepsift.config.json');
    if (fs.existsSync(configPath)) {
        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(raw);
            return mergeConfig(DEFAULT_CONFIG, parsed);
        } catch (e) {
            console.warn(`[DeepSift] Failed to parse deepsift.config.json. Using defaults.`);
        }
    }
    return DEFAULT_CONFIG;
}

export function saveConfig(projectPath: string, config: DeepSiftConfig) {
    const configPath = path.join(projectPath, 'deepsift.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

function mergeConfig(base: any, overrides: any): any {
    const result = { ...base };
    for (const key in overrides) {
        if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
            result[key] = mergeConfig(result[key] || {}, overrides[key]);
        } else {
            result[key] = overrides[key];
        }
    }
    return result;
}
