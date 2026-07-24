import fs from 'fs';
import path from 'path';

export interface TestGeneratorOptions {
    targetFile: string;
    framework?: 'vitest' | 'jest' | 'pytest' | 'gotest';
}

export class QAGenerator {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public generateBoilerplateTest(targetFile: string): { testFilePath: string; content: string } {
        const fullPath = path.resolve(this.projectPath, targetFile);
        const relPath = path.relative(this.projectPath, fullPath);
        const ext = path.extname(fullPath);
        const dir = path.dirname(fullPath);
        const baseName = path.basename(fullPath, ext);

        let testFilePath = '';
        let content = '';

        if (/\.(ts|js|tsx|jsx)$/i.test(ext)) {
            testFilePath = path.join(dir, `${baseName}.test${ext}`);
            content = `import { describe, it, expect } from 'vitest';
import * as targetModule from './${baseName}.js';

describe('${baseName} Unit Tests', () => {
    it('should be defined and export expected symbols', () => {
        expect(targetModule).toBeDefined();
    });

    it('should execute basic functionality without throwing', () => {
        // Auto-generated test stub by DeepSift QAGenerator
        expect(true).toBe(true);
    });
});
`;
        } else if (ext === '.py') {
            testFilePath = path.join(dir, `test_${baseName}.py`);
            content = `import unittest
import ${baseName}

class Test${baseName.charAt(0).toUpperCase() + baseName.slice(1)}(unittest.TestCase):
    def test_initialization(self):
        self.assertIsNotNone(${baseName})

if __name__ == '__main__':
    unittest.main()
`;
        } else if (ext === '.go') {
            testFilePath = path.join(dir, `${baseName}_test.go`);
            content = `package main

import (
	"testing"
)

Test${baseName.charAt(0).toUpperCase() + baseName.slice(1)} (t *testing.T) {
	// Auto-generated test stub by DeepSift QAGenerator
}
`;
        } else {
            testFilePath = path.join(dir, `${baseName}.test${ext}`);
            content = `// Test spec for ${relPath}\n`;
        }

        return { testFilePath, content };
    }

    public generateMockDataType(typeName: string): string {
        // Scans project for type/interface definition and builds mock object
        const files = this.collectSourceFiles(this.projectPath);
        let fields: { name: string; type: string }[] = [];

        for (const file of files) {
            try {
                const code = fs.readFileSync(file, 'utf-8');
                const interfaceRegex = new RegExp(`(?:interface|type|struct)\\s+${typeName}\\s*\\{([^}]+)\\}`, 'm');
                const match = code.match(interfaceRegex);
                if (match) {
                    const body = match[1];
                    const lines = body.split('\n');
                    lines.forEach(l => {
                        const fieldMatch = l.match(/([a-zA-Z0-9_$]+)\s*[:\?]?\s*([a-zA-Z0-9_$\[\]\<\>]+)/);
                        if (fieldMatch && !l.includes('//')) {
                            fields.push({ name: fieldMatch[1], type: fieldMatch[2] });
                        }
                    });
                    break;
                }
            } catch (e) {
                // Ignore read error
            }
        }

        if (fields.length === 0) {
            return `export const mock${typeName} = {\n  id: "mock-id-123",\n  name: "Sample ${typeName}"\n};`;
        }

        const mockObj: Record<string, any> = {};
        fields.forEach(f => {
            const t = f.type.toLowerCase();
            if (t.includes('string')) mockObj[f.name] = `sample-${f.name}`;
            else if (t.includes('number')) mockObj[f.name] = 42;
            else if (t.includes('boolean')) mockObj[f.name] = true;
            else if (t.includes('array') || t.includes('[]')) mockObj[f.name] = [];
            else mockObj[f.name] = null;
        });

        return `export const mock${typeName} = ${JSON.stringify(mockObj, null, 2)};`;
    }

    public calculateTPR(): { prodLines: number; testLines: number; ratio: string } {
        const files = this.collectSourceFiles(this.projectPath);
        let prodLines = 0;
        let testLines = 0;

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const lineCount = content.split('\n').length;
                if (/\.(test|spec|e2e)\./i.test(file) || file.includes('tests/')) {
                    testLines += lineCount;
                } else {
                    prodLines += lineCount;
                }
            } catch (e) {
                // Ignore
            }
        }

        const ratio = prodLines > 0 ? (testLines / prodLines * 100).toFixed(1) + '%' : '0%';
        return { prodLines, testLines, ratio };
    }

    private collectSourceFiles(dir: string): string[] {
        const files: string[] = [];
        if (!fs.existsSync(dir)) return files;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', '.deepsift', 'dist', 'build'].includes(entry.name)) {
                    files.push(...this.collectSourceFiles(full));
                }
            } else if (/\.(ts|js|tsx|jsx|py|go|dart|rs)$/i.test(entry.name)) {
                files.push(full);
            }
        }
        return files;
    }
}
