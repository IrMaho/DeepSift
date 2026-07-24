/**
 * @file gen-test.ts
 * @description Automatic unit test and mock file generator command.
 *
 * @module cli/commands/gen-test
 * @category Security & Diagnostics
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { QAGenerator } from '../../analyzers/qa-generator.js';

export async function genTestCommand(projectPath: string, targetFile: string) {
    if (!targetFile) {
        throw new Error('Please specify a target file for test generation.\nUsage: deepsift gen-test "src/services/user.ts"');
    }
    const gen = new QAGenerator(projectPath);
    const { testFilePath, content } = gen.generateBoilerplateTest(targetFile);

    fs.writeFileSync(testFilePath, content, 'utf-8');
    console.log(`\n🧪 \x1b[32mSuccessfully generated test spec:\x1b[0m ${path.relative(projectPath, testFilePath)}`);
}
