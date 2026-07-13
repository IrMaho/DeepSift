import path from 'path';
import { getFeatureOutline } from '../../utils/outline.js';
import { saveSearchLog } from '../../utils/history.js';
import { printResult, OutputFormat } from '../cli-output.js';

export function featureCommand(projectPath: string, featureDir: string, format: OutputFormat) {
    let targetPath = featureDir;
    if (!path.isAbsolute(featureDir)) {
        targetPath = path.join(projectPath, featureDir);
    }

    const outlineText = getFeatureOutline(targetPath);
    saveSearchLog(projectPath, [`[Feature Outline] ${featureDir}`], outlineText);
    printResult(outlineText, format);
}
