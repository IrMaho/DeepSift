/**
 * @file config.ts
 * @description DeepSift Configuration Management Module.
 * Manages loading, merging, defaults, and saving of deepsift.config.json settings.
 * 
 * @module utils/config
 * @category Utilities
 * @since 1.0.0
 */

import fs from 'fs';
import path from 'path';

/**
 * Definition for a Knowledge Realm within DeepSift.
 */
export interface RealmDefinition {
    displayName: string;
    sourcePaths: string[];
    parserProfile: 'code' | 'skill' | 'docs';
    autoIndex: boolean;
    excludeDirs?: string[];
    isolatedDbPath?: string;
    isExternalHivemind?: boolean;
}

/**
 * Root DeepSift Configuration Interface.
 */
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
    };
    realms?: Record<string, RealmDefinition>;
}

/**
 * Default global configuration values for DeepSift.
 */
export const DEFAULT_CONFIG: DeepSiftConfig = {
    search: {
        defaultTopK: 10,
        defaultContextLines: 0,
    },
    indexer: {
        includeDirs: [],
        excludeDirs: [
            "node_modules", ".git", "dist", "build", "coverage", ".next",
            ".cache", ".dart_tool", ".gradle", ".idea", ".vscode",
            ".deepsift", ".mcp_search_outputs",
            ".zig-cache", "zig-out",
            "windows", "android", "ios", "linux", "macos", "web", "public"
        ],
        includeExtensions: [],
        excludeExtensions: [
            ".min.js", ".map", ".lock",
            ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".bmp",
            ".woff", ".woff2", ".ttf", ".eot", ".otf", ".otb",
            ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z",
            ".sqlite", ".db", ".log",
            ".mp4", ".avi", ".mov", ".mkv", ".mp3", ".wav",
            ".dll", ".pdb", ".exe", ".so", ".dylib", ".lib", ".exp",
            ".obj", ".o", ".a", ".wasm", ".bak",
            ".pyc", ".class", ".jar"
        ]
    },
    format: {
        outputTheme: "default"
    },
    realms: {
        "code": {
            displayName: "User Codebase",
            sourcePaths: ["."],
            parserProfile: "code",
            autoIndex: true,
            excludeDirs: ["skills", "docs", "node_modules", ".git"]
        },
        "skills": {
            displayName: "AI Skills Library",
            sourcePaths: ["skills"],
            parserProfile: "skill",
            autoIndex: true
        }
    }
};

/**
 * Loads project configuration from deepsift.config.json or returns default configuration.
 * 
 * @param projectPath Absolute path to the project root directory.
 * @returns Parsed and merged DeepSiftConfig object.
 * @example
 * ```ts
 * const config = loadConfig(process.cwd());
 * ```
 */
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

/**
 * Saves updated DeepSift configuration to deepsift.config.json in the project root.
 * 
 * @param projectPath Absolute path to the project root directory.
 * @param config Configuration object to persist.
 * @example
 * ```ts
 * saveConfig(process.cwd(), updatedConfig);
 * ```
 */
export function saveConfig(projectPath: string, config: DeepSiftConfig): void {
    const configPath = path.join(projectPath, 'deepsift.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Deeply merges user override configuration with base defaults.
 * 
 * @param base Base configuration object.
 * @param overrides User configuration overrides.
 * @returns Merged configuration object.
 */
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
