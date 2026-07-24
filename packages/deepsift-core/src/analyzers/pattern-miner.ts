/**
 * @file pattern-miner.ts
 * @description Project pattern miner extracting recurring code structures and conventions.
 *
 * @module analyzers/pattern-miner
 * @category Architecture & Intelligence
 * @since 1.0.3
 */
import fs from 'fs';
import path from 'path';
import { ProjectDNA, LearnedPattern } from '../types/dna-types.js';

const STATE_LIBS = [
    { lib: 'zustand', desc: 'Zustand is used for state management. Create small, atomic stores.' },
    { lib: 'redux', desc: 'Redux is used for state management. Prefer Redux Toolkit (RTK).' },
    { lib: 'recoil', desc: 'Recoil is used for state management. Prefer atoms and selectors.' },
    { lib: 'mobx', desc: 'MobX is used for state management. Use observables and observers.' },
    { lib: 'jotai', desc: 'Jotai is used for state management. Keep atoms primitive.' },
];

const NETWORKING_LIBS = [
    { lib: 'axios', desc: 'Axios is used for network requests. Prefer instances with interceptors.' },
    { lib: 'react-query', desc: 'React Query is used for data fetching and caching. Use useQuery and useMutation.' },
    { lib: 'swr', desc: 'SWR is used for data fetching. Use useSWR hooks.' },
    { lib: '@apollo/client', desc: 'Apollo Client is used for GraphQL requests.' },
];

const STYLING_LIBS = [
    { lib: 'styled-components', desc: 'Styled Components are used for styling. Define components outside the render loop.' },
    { lib: '@emotion/styled', desc: 'Emotion is used for styling. Use the styled API.' },
    { lib: 'tailwindcss', desc: 'Tailwind CSS is used for styling. Prefer utility classes.' },
    { lib: '@mui/material', desc: 'Material UI is used for UI components. Use the sx prop or styled API.' },
];

export function minePatterns(dna: ProjectDNA, projectRoot: string): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const components = dna.components.similarityGroups || [];
    
    const importFreq: Record<string, { count: number, files: string[] }> = {};
    let totalScanned = 0;
    
    components.forEach(group => {
        group.members.slice(0, 50).forEach(member => {
            try {
                const fullPath = path.join(projectRoot, member.filePath);
                const content = fs.readFileSync(fullPath, 'utf-8');
                totalScanned++;
                
                const importMatches = Array.from(content.matchAll(/import\s+.*?\s+from\s+['"](.*?)['"]/g));
                
                importMatches.forEach(m => {
                    const imp = m[1];
                    let baseLib = imp;
                    if (!imp.startsWith('.') && !imp.startsWith('/')) {
                        const parts = imp.split('/');
                        if (imp.startsWith('@') && parts.length > 1) {
                            baseLib = `${parts[0]}/${parts[1]}`;
                        } else {
                            baseLib = parts[0];
                        }
                    }

                    if (!importFreq[baseLib]) {
                        importFreq[baseLib] = { count: 0, files: [] };
                    }
                    if (!importFreq[baseLib].files.includes(member.filePath)) {
                        importFreq[baseLib].count++;
                        importFreq[baseLib].files.push(member.filePath);
                    }
                });
            } catch {
                // skip read error
            }
        });
    });

    if (totalScanned === 0) return patterns;

    const checkLibraryCategory = (libs: {lib: string, desc: string}[], category: LearnedPattern['category']) => {
        for (const { lib, desc } of libs) {
            const data = importFreq[lib];
            if (data && (data.count / totalScanned) > 0.4) {
                patterns.push({
                    category,
                    name: `Uses ${lib}`,
                    description: desc,
                    evidence: {
                        filePaths: data.files.slice(0, 5),
                        frequency: data.count / totalScanned
                    },
                    snippets: []
                });
            }
        }
    };

    checkLibraryCategory(STATE_LIBS, 'StateManagement');
    checkLibraryCategory(NETWORKING_LIBS, 'Networking');
    checkLibraryCategory(STYLING_LIBS, 'Styling');

    return patterns;
}
