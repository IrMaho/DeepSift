import path from 'path';

export function getDbPath(projectPath: string): string {
    return path.join(projectPath, '.deepsift', 'cache.db');
}

export function getOutputsDir(projectPath: string): string {
    return path.join(projectPath, '.deepsift', 'outputs');
}
