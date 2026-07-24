/// <reference types="node" />
/**
 * @file generate-docs.ts
 * @description Build script for auto-generating DeepSift documentation artifacts during compile / build lifecycle.
 * @module scripts/generate-docs
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { docgenCommand } from '../src/cli/commands/docgen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

console.log('🚀 Running DeepSift Automatic Documentation Generator...');

docgenCommand(projectRoot, 'markdown')
    .then(() => {
        console.log('✅ Documentation build hook completed successfully.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Failed to run documentation build hook:', err);
        process.exit(1);
    });
