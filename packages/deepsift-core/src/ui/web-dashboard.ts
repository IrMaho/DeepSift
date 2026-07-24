/**
 * @file web-dashboard.ts
 * @description Local Express web server providing interactive graph and DRM visualization dashboard on port 3333.
 *
 * @module ui/web-dashboard
 * @category Utilities & Dashboard
 * @since 1.0.3
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { loadDNA } from '../intelligence/project-dna.js';

export function launchWebDashboard(projectPath: string, port = 3333) {
    const server = http.createServer((req, res) => {
        if (req.url === '/api/dna') {
            const dna = loadDNA(projectPath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(dna || {}));
            return;
        }

        const dna = loadDNA(projectPath);
        const godNodes = dna?.architecture?.graph?.godNodes || dna?.architecture?.coreFiles || [];

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepSift Local Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        h1 { color: #38bdf8; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 20px; }
        .card { background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; }
        .card h3 { margin-top: 0; color: #f43f5e; font-size: 16px; word-break: break-all; }
        .score { font-size: 24px; font-weight: bold; color: #34d399; }
        .tag { display: inline-block; background: #0284c7; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>🔍 DeepSift Topology Dashboard (Port ${port})</h1>
    <p>Project: <strong>${path.basename(projectPath)}</strong> | God Nodes: <strong>${godNodes.length}</strong></p>
    
    <h2>⚡ God Nodes Topology</h2>
    <div class="grid">
        ${godNodes.map((gn: any) => `
            <div class="card">
                <h3>${gn.file}</h3>
                <div class="score">In-Degree: ${gn.inDegree} | Out: ${gn.outDegree}</div>
                <p><span class="tag">Connectivity: ${gn.connectivityScore}</span></p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });

    server.listen(port, () => {
        console.log(`\n🚀 DeepSift Dashboard running at \x1b[36mhttp://localhost:${port}\x1b[0m`);
    });
}
