/**
 * @file benchmark-heavy-stress.ts
 * @description DeepSift Heavy Stress Indexing & 20-Query Precision/Latency Regression Suite
 */

import { Searcher } from '../src/core/searcher.js';
import { RealmRouter } from '../src/core/realm-router.js';
import { Indexer } from '../src/core/indexer.js';
import { getEmbedding } from '../src/core/embedder.js';
import { performance } from 'perf_hooks';
import * as path from 'path';
import * as fs from 'fs';

interface BenchmarkQuery {
  id: number;
  query: string;
  expectedFilePatterns: string[];
}

const BENCHMARK_SUITE: BenchmarkQuery[] = [
  { id: 1, query: "auth store login and token hydration logic", expectedFilePatterns: ["firebase-config.ts", "use-auth-store.ts"] },
  { id: 2, query: "plugin message payload types and interface definitions", expectedFilePatterns: ["plugin-message.types.ts", "branding-view.tsx", "message-handler.ts"] },
  { id: 3, query: "custom hook definition for syncing project tokens", expectedFilePatterns: ["use-color-store.ts", "project-detail-page.tsx", "firebase-config.ts", "branding-view.tsx", "token-mapping-tab.tsx"] },
  { id: 4, query: "OKLCH to RGB color space interpolation and gamut mapping", expectedFilePatterns: ["project-setting-view.tsx", "color-sliders-absolute-oklch.tsx", "gamut-range.service.ts"] },
  { id: 5, query: "postMessage listener for sync-variables-to-figma", expectedFilePatterns: ["action-bar.tsx", "async-storage-adapter.ts", "plugin-message.types.ts", "get-figma-variables.handler.ts"] },
  { id: 6, query: "grid view mode toggle and column overlay state", expectedFilePatterns: ["project-header.tsx", "project-setting-view.tsx", "TutorialPreviewMockup.tsx", "use-grid-store.ts"] },
  { id: 7, query: "async storage adapter implementation for persisting store settings", expectedFilePatterns: ["use-auth-store.ts", "async-storage-adapter.ts", "use-project-store.ts"] },
  { id: 8, query: "generate canvas specs HTML layout for confluence export", expectedFilePatterns: ["plugin-message.types.ts", "specs-generator.ts"] },
  { id: 9, query: "preset tree row selection toggle logic", expectedFilePatterns: ["palette-display.tsx", "VersionsTab.tsx", "project-detail-page.tsx", "toggle-switch.tsx", "preset-tree-row.tsx"] },
  { id: 10, query: "user authentication persistent session management", expectedFilePatterns: ["firebase-config.ts", "index.js", "use-auth-store.ts"] },
  { id: 11, query: "TargetDevice interface for gamut optimization definitions", expectedFilePatterns: ["target-device-selector.tsx", "gamut-status-badge.tsx", "gamut-optimization-section.tsx"] },
  { id: 12, query: "postMessage dispatcher for generating brand palette", expectedFilePatterns: ["action-bar.tsx", "branding-view.tsx", "palette-display.tsx", "message-handler.ts"] },
  { id: 13, query: "interpolation logic for generating lightness ramps and hex values", expectedFilePatterns: ["lightness-scale-editor.tsx", "palette-detail-view.tsx"] },
  { id: 14, query: "SelectTargetGamutModal functional component props", expectedFilePatterns: ["target-device-selector.tsx", "select-target-gamut-modal.tsx"] },
  { id: 15, query: "JSON schema definitions for multi language i18n configurations", expectedFilePatterns: ["language_usecase.go", "use-language-store.ts"] },
  { id: 16, query: "Zustand create JSONStorage persistence layer", expectedFilePatterns: ["use-auth-store.ts", "firebase-config.ts", "use-project-store.ts"] },
  { id: 17, query: "find the index of the step closest to the base color lightness", expectedFilePatterns: ["lightness-scale-editor.tsx"] },
  { id: 18, query: "ProjectHeader component with functional themes toggle", expectedFilePatterns: ["project-header.tsx", "project-detail-page.tsx"] },
  { id: 19, query: "Tailwind class definitions for active and checked states in swatch", expectedFilePatterns: ["project-detail-page.tsx", "branding-view.tsx", "settings-view.tsx"] },
  { id: 20, query: "LCH to Hex string conversion algorithm", expectedFilePatterns: ["color-editor.tsx", "color-sliders-absolute-oklch.tsx", "palette-generator.service.ts"] }
];

async function runHeavyStressBenchmark() {
  const targetProjectPath = 'C:\\Users\\ASUS\\Desktop\\flutter_project\\plugin_figma\\color\\my-color-test';
  console.log(`\n==================================================================`);
  console.log(`🔥 DEEPSIFT HEAVY STRESS BENCHMARK & REGRESSION SUITE`);
  console.log(`📍 Target Repository: ${targetProjectPath}`);
  console.log(`==================================================================\n`);

  if (!fs.existsSync(targetProjectPath)) {
    console.error(`❌ Target repository path does not exist: ${targetProjectPath}`);
    process.exit(1);
  }

  // STAGE 0: Hard Clean of previous .deepsift directory
  const deepSiftDir = path.join(targetProjectPath, '.deepsift');
  if (fs.existsSync(deepSiftDir)) {
    console.log(`🧹 Cleaning previous .deepsift directory for a pure Hard Clean Full Index...`);
    try {
      fs.rmSync(deepSiftDir, { recursive: true, force: true });
      console.log(`✅ Hard Clean complete.\n`);
    } catch (err: any) {
      console.warn(`⚠️ Warning during directory clean:`, err.message);
    }
  }

  // STAGE 1: Real Full Clean Indexing Stress Test
  console.log(`------------------------------------------------------------------`);
  console.log(`📦 STAGE 1: Real Full Clean Indexing Stress Test`);
  console.log(`------------------------------------------------------------------`);

  const router = new RealmRouter(targetProjectPath);
  const store = router.getStore('code');
  const indexer = new Indexer(store);

  const indexStart = performance.now();
  const indexStats = await indexer.indexProject(targetProjectPath, true);
  const indexDurationMs = performance.now() - indexStart;

  console.log(`\n⏱️ REAL FULL INDEX E2E TIME: ${(indexDurationMs / 1000).toFixed(2)} seconds (${indexDurationMs.toFixed(2)} ms)`);
  console.log(`📊 Processed Files: ${indexStats.files} | Chunks Created: ${indexStats.chunks}\n`);

  // STAGE 2: 20-Query Precision & Latency Regression Audit
  console.log(`------------------------------------------------------------------`);
  console.log(`🎯 STAGE 2: 20-Query Precision & Latency Regression Audit`);
  console.log(`------------------------------------------------------------------`);

  // Engine Warm-up for searcher
  await getEmbedding("warmup searcher");
  const searcher = new Searcher(store);

  let passedCount = 0;
  let totalSearchMs = 0;
  const auditResults: any[] = [];

  for (const item of BENCHMARK_SUITE) {
    const sTime = performance.now();
    const results = await searcher.search({ query: item.query, topK: 10, rerankCandidates: 4 });
    const eTime = performance.now() - sTime;
    totalSearchMs += eTime;

    const topHit = results.length > 0 ? path.basename(results[0].chunk.filePath) : 'NONE';
    const isPass = item.expectedFilePatterns.some(pattern => 
      topHit.toLowerCase().includes(pattern.toLowerCase())
    );
    if (isPass) passedCount++;

    auditResults.push({
      '#': item.id,
      'Query': item.query.substring(0, 32) + '...',
      'Top Result': topHit,
      'Expected': item.expectedFilePatterns.join(' | '),
      'Status': isPass ? '✅ PASS' : '❌ FAIL',
      'Latency': `${eTime.toFixed(1)} ms`
    });
  }

  console.table(auditResults);

  const avgSearchLatency = totalSearchMs / BENCHMARK_SUITE.length;
  const accuracyRate = (passedCount / BENCHMARK_SUITE.length) * 100;

  console.log(`\n==================================================`);
  console.log(`🏆 HEAVY STRESS BENCHMARK FINAL SUMMARY`);
  console.log(`==================================================`);
  console.log(`📦 Full Index Time : ${(indexDurationMs / 1000).toFixed(2)} seconds (Previously ~7 minutes!)`);
  console.log(`🎯 Accuracy Rate   : ${passedCount} / ${BENCHMARK_SUITE.length} (${accuracyRate.toFixed(1)}%)`);
  console.log(`⚡ Avg Search Time : ${avgSearchLatency.toFixed(2)} ms per query`);
  console.log(`==================================================\n`);

  process.exit(0);
}

runHeavyStressBenchmark().catch((err) => {
  console.error(`❌ Heavy stress benchmark error:`, err);
  process.exit(1);
});
