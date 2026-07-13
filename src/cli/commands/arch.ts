import { getProjectArchitecture } from '../../utils/architecture.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, OutputFormat } from '../cli-output.js';

export function archCommand(projectPath: string, maxDepth: number, format: OutputFormat) {
    const architectureText = getProjectArchitecture(projectPath, maxDepth);
    saveSearchLog(projectPath, ['[Architecture Scan]'], architectureText);
    printResult(architectureText, format);
}
