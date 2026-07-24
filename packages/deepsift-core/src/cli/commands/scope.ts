import fs from 'fs';
import path from 'path';

export function scopeCommand(projectPath: string, action: string, targetPath?: string) {
    const scopeFile = path.join(projectPath, '.deepsift', 'scope.json');

    if (action === 'lock') {
        if (!targetPath) throw new Error('Please specify a target folder to lock scope.\nUsage: deepsift scope lock "src/features/auth"');
        const rel = path.relative(projectPath, path.resolve(projectPath, targetPath));
        fs.writeFileSync(scopeFile, JSON.stringify({ scope: rel, lockedAt: new Date().toISOString() }, null, 2), 'utf-8');
        console.log(`\n🔒 \x1b[32mAgent scope locked to folder:\x1b[0m ${rel}`);
    } else if (action === 'unlock') {
        if (fs.existsSync(scopeFile)) fs.unlinkSync(scopeFile);
        console.log(`\n🔓 \x1b[32mAgent scope unlocked (Scanning whole project)\x1b[0m`);
    } else {
        if (fs.existsSync(scopeFile)) {
            const data = JSON.parse(fs.readFileSync(scopeFile, 'utf-8'));
            console.log(`\n🔒 \x1b[33mActive Scope Lock:\x1b[0m ${data.scope}`);
        } else {
            console.log(`\n🔓 \x1b[32mNo active scope lock.\x1b[0m`);
        }
    }
}
