import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { mineFeatureRegistries } from './registry-miner.js';

describe('Registry Miner', () => {
    it('should discover tabs and features from registry files', () => {
        const testDir = path.resolve(__dirname, '../../test-temp-registry');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const mockRegistry = {
            tabs: [
                { id: 'color', title: 'Color Palette Generator', description: 'Generates OKLCH color palettes' },
                { id: 'typography', title: 'Typography Manager', description: 'Manages Google Fonts scales' }
            ]
        };

        fs.writeFileSync(
            path.join(testDir, 'tabs-registry.json'),
            JSON.stringify(mockRegistry, null, 2),
            'utf-8'
        );

        const discovered = mineFeatureRegistries(testDir);
        expect(discovered.length).toBe(2);
        expect(discovered[0].id).toBe('color');
        expect(discovered[0].title).toBe('Color Palette Generator');
        expect(discovered[1].id).toBe('typography');

        // Cleanup
        fs.rmSync(testDir, { recursive: true, force: true });
    });
});
