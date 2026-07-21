import path from 'path';
import fs from 'fs';

export const DEFAULT_REALM = 'code';

export function getRealmDir(projectPath: string, realmId: string): string {
    return path.join(projectPath, '.deepsift', 'realms', realmId);
}

export function getRealmDbPath(projectPath: string, realmId: string): string {
    return path.join(getRealmDir(projectPath, realmId), 'cache.db');
}

export function getRealmGraphPath(projectPath: string, realmId: string): string {
    return path.join(getRealmDir(projectPath, realmId), 'graph.db');
}

export function getRealmDnaPath(projectPath: string, realmId: string): string {
    return path.join(getRealmDir(projectPath, realmId), 'project-dna.toon');
}

export function ensureRealmDir(projectPath: string, realmId: string): void {
    const dir = getRealmDir(projectPath, realmId);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function getDbPath(projectPath: string): string {
    return path.join(projectPath, '.deepsift', 'cache.db');
}

export function getOutputsDir(projectPath: string): string {
    return path.join(projectPath, '.deepsift', 'outputs');
}
