import fs from 'fs';
import path from 'path';
import { ProjectDNA, FileCoverage, TestDNA, TimeBomb } from '../types/dna-types.js';

function parseLcov(lcovContent: string, projectRoot: string): FileCoverage[] {
    const files: FileCoverage[] = [];
    const lines = lcovContent.split('\n');
    let currentFile: Partial<FileCoverage> | null = null;
    let totalTracked = 0;
    let totalCovered = 0;
    let uncovered: number[] = [];

    for (const line of lines) {
        if (line.startsWith('SF:')) {
            if (currentFile) {
                currentFile.lineCoverage = totalTracked > 0 ? Math.round((totalCovered / totalTracked) * 100) : 0;
                currentFile.uncoveredLines = summarizeUncovered(uncovered);
                files.push(currentFile as FileCoverage);
            }
            // Ensure path is relative to root
            let filePath = line.substring(3).trim();
            if (path.isAbsolute(filePath)) {
                filePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
            } else {
                filePath = filePath.replace(/\\/g, '/');
            }
            currentFile = { filePath };
            totalTracked = 0; totalCovered = 0; uncovered = [];
        } else if (line.startsWith('DA:')) {
            totalTracked++;
            const parts = line.substring(3).split(',');
            const lineNum = parseInt(parts[0], 10);
            const hits = parseInt(parts[1], 10);
            if (hits > 0) totalCovered++;
            else uncovered.push(lineNum);
        }
    }
    
    if (currentFile) {
        currentFile.lineCoverage = totalTracked > 0 ? Math.round((totalCovered / totalTracked) * 100) : 0;
        currentFile.uncoveredLines = summarizeUncovered(uncovered);
        files.push(currentFile as FileCoverage);
    }
    return files;
}

function summarizeUncovered(uncovered: number[]): number[] {
    return uncovered.slice(0, 50); // limit payload size
}

function detectTimeBombs(coverages: FileCoverage[], dna: ProjectDNA): { bombs: TimeBomb[], safes: string[] } {
    const bombs: TimeBomb[] = [];
    const safes: string[] = [];
    const coverageMap = new Map<string, FileCoverage>();
    
    coverages.forEach(c => coverageMap.set(c.filePath, c));

    const godNodes = dna.architecture?.graph?.godNodes || [];

    for (const coreFile of godNodes) {
        let filePath = coreFile;
        let inDegree = 15; 
        if (coreFile.includes(':')) {
            const parts = coreFile.split(':');
            inDegree = parseInt(parts[0], 10) || 15;
            filePath = parts[1];
        }

        const coverage = coverageMap.get(filePath);

        if (!coverage || coverage.lineCoverage < 50) {
            bombs.push({
                filePath: filePath,
                inDegree: inDegree,
                pageRank: 1.0, 
                coveragePercent: coverage ? coverage.lineCoverage : 0,
                riskSeverity: inDegree > 20 ? 'Critical' : 'High',
                reason: `File ${filePath} is a highly connected God Node (inDegree ~${inDegree}) but has ${coverage ? coverage.lineCoverage : 0}% test coverage.`
            });
        } else if (coverage.lineCoverage >= 80) {
            safes.push(filePath);
        }
    }

    return { bombs, safes };
}

export function integrateTestAnalyzer(projectPath: string, dna: ProjectDNA, onProgress?: (phase: string, detail: string) => void): void {
    let hasCoverageData = false;
    let fileCoverages: FileCoverage[] = [];
    
    const frameworksDetected: string[] = [];
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps['vitest']) frameworksDetected.push('vitest');
            if (deps['jest']) frameworksDetected.push('jest');
            if (deps['playwright'] || deps['@playwright/test']) frameworksDetected.push('playwright');
        } catch { /* skip */ }
    }

    const lcovPath = path.join(projectPath, 'coverage', 'lcov.info');
    if (fs.existsSync(lcovPath)) {
        try {
            const lcovContent = fs.readFileSync(lcovPath, 'utf8');
            fileCoverages = parseLcov(lcovContent, projectPath);
            hasCoverageData = true;
            if (onProgress) onProgress('testing', `Parsed LCOV coverage for ${fileCoverages.length} files.`);
        } catch (e) {
            if (onProgress) onProgress('testing', `Failed to parse LCOV coverage: ${e}`);
        }
    } else {
        if (onProgress) onProgress('testing', 'No coverage/lcov.info found. Time Bombs cannot be fully detected.');
    }

    const { bombs, safes } = detectTimeBombs(fileCoverages, dna);

    let globalCoverage = 0;
    if (fileCoverages.length > 0) {
        const total = fileCoverages.reduce((sum, c) => sum + c.lineCoverage, 0);
        globalCoverage = Math.round(total / fileCoverages.length);
    }

    dna.testing = {
        hasCoverageData,
        frameworksDetected,
        globalCoverage,
        fileCoverages,
        timeBombs: bombs,
        safeCores: safes
    };
}
