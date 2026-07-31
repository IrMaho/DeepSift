# 📁 DeepSift Performance Benchmarks

This directory contains benchmark suites, latency profiling reports, and root cause analysis documents for DeepSift Core.

## 📄 Available Benchmark Documents & Scripts

1. **[Search Speed Benchmark & RCA Report](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/benchmark/search_speed_rca_report.md)**  
   Detailed breakdown table, root cause analysis (RCA), and architectural roadmap to sub-500ms search latency.

2. **[Benchmark Speed Script (`benchmark-speed.ts`)](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/scripts/benchmark-speed.ts)**  
   Automated high-precision speed profiling script measuring module import, ONNX cold-start, embedding generation, Zig SIMD engine, and E2E CLI latency.

## 🏃 Running the Benchmark

```bash
cd packages/deepsift-core
npm run build
npx tsx scripts/benchmark-speed.ts
```