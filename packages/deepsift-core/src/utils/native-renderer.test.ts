import { describe, it, expect } from 'vitest';
import { renderTextToImages } from './native-renderer.js';

describe('DeepSift Native Visual Renderer', () => {
    it('should render markdown text to high-res PNG buffers', () => {
        const text = `# DeepSift Test Report\n\n- Component A: Operational\n- Component B: 100% Native Zig`;
        const result = renderTextToImages(text, { reflow: true });

        expect(result.pages).toBeDefined();
        expect(result.pages.length).toBeGreaterThan(0);
        expect(result.pages[0].png).toBeInstanceOf(Buffer);
        expect(result.pages[0].png.length).toBeGreaterThan(1000);
        expect(result.totalLines).toBeGreaterThan(0);
    });
});
