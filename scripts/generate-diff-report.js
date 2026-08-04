import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function generateDiffReport() {
  try {
    const args = process.argv.slice(2);
    const showPrevious = args.includes('--previous') || args.includes('-p');

    let output = '';

    if (showPrevious) {
      const log = execSync('git log -1', { encoding: 'utf8' });
      const diff = execSync('git diff HEAD~1 HEAD', { encoding: 'utf8' });
      output = [
        '--- LAST COMMIT MESSAGE ---',
        log,
        '--- LAST COMMIT DIFF ---',
        diff
      ].join('\n\n');
    } else {
      const unstagedDiff = execSync('git diff', { encoding: 'utf8' });
      const stagedDiff = execSync('git diff --cached', { encoding: 'utf8' });

      output = [
        '--- UNSTAGED CHANGES ---',
        unstagedDiff,
        '--- STAGED CHANGES ---',
        stagedDiff
      ].join('\n\n');
    }

    const outputPath = path.resolve(process.cwd(), 'git_changes_summary.txt');
    fs.writeFileSync(outputPath, output, 'utf8');

    console.log(`✅ Git diff report generated successfully at: ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate git diff report:', error.message);
    process.exit(1);
  }
}

generateDiffReport();
