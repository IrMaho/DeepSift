/**
 * @file native-renderer.ts
 * @description Native PNG and image renderer for search result visualization pages.
 *
 * @module utils/native-renderer
 * @category Utilities & Dashboard
 * @since 1.0.3
 */
import { createCanvas } from '@napi-rs/canvas';

export interface RenderOptions {
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    reflow?: boolean;
    padding?: number;
}

export interface RenderResultPage {
    pageNumber: number;
    png: Buffer;
    lineCount: number;
}

export interface RenderResult {
    pages: RenderResultPage[];
    totalCharacters: number;
    totalLines: number;
}

export class DeepSiftNativeRenderer {
    /**
     * Renders input text cleanly onto dense high-resolution PNG pages.
     * Engineered specifically as DeepSift's native visual token cache renderer.
     */
    public static renderTextToImages(text: string, options: RenderOptions = {}): RenderResult {
        const width = options.width || 1200;
        const height = options.height || 1600;
        const fontSize = options.fontSize || 12;
        const lineHeight = options.lineHeight || 16;
        const padding = options.padding || 32;

        const maxLinesPerPage = Math.floor((height - padding * 2) / lineHeight);
        const maxCharsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.55));

        const rawLines = text.split('\n');
        const wrappedLines: string[] = [];

        for (const line of rawLines) {
            if (line.length === 0) {
                wrappedLines.push('');
                continue;
            }

            let current = line;
            while (current.length > maxCharsPerLine) {
                wrappedLines.push(current.substring(0, maxCharsPerLine));
                current = current.substring(maxCharsPerLine);
            }
            wrappedLines.push(current);
        }

        const totalLines = wrappedLines.length;
        const totalPages = Math.max(1, Math.ceil(totalLines / maxLinesPerPage));
        const pages: RenderResultPage[] = [];

        for (let p = 0; p < totalPages; p++) {
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // DeepSift Dark Canvas Aesthetic
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);

            // Subtle Header / Border Accent
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.strokeRect(padding / 2, padding / 2, width - padding, height - padding);

            // Typography Setup
            ctx.font = `${fontSize}px "Courier New", monospace`;
            ctx.fillStyle = '#94a3b8';

            const startIdx = p * maxLinesPerPage;
            const pageLines = wrappedLines.slice(startIdx, startIdx + maxLinesPerPage);

            pageLines.forEach((lineText, idx) => {
                const y = padding + idx * lineHeight + fontSize;
                
                // Highlight headers or Markdown symbols dynamically
                if (lineText.startsWith('#')) {
                    ctx.fillStyle = '#38bdf8';
                } else if (lineText.startsWith('---') || lineText.startsWith('===')) {
                    ctx.fillStyle = '#475569';
                } else if (lineText.includes('📄') || lineText.includes('🔍')) {
                    ctx.fillStyle = '#f59e0b';
                } else {
                    ctx.fillStyle = '#cbd5e1';
                }

                ctx.fillText(lineText, padding, y);
            });

            const pngBuffer = canvas.toBuffer('image/png');
            pages.push({
                pageNumber: p + 1,
                png: pngBuffer,
                lineCount: pageLines.length
            });
        }

        return {
            pages,
            totalCharacters: text.length,
            totalLines
        };
    }
}

export const renderTextToImages = DeepSiftNativeRenderer.renderTextToImages;
