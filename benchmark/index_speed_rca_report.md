# 📊 DeepSift Real Full Index Speed Benchmark & Optimization Milestone Report

> **Project:** DeepSift Core Indexing Engine (`mcp_search/packages/deepsift-core`)  
> **Target Project for Indexing Audit:** `C:\Users\ASUS\Desktop\flutter_project\mcp_search\example\dashboard\app`  
> **Date:** 2026-08-01  
> **Optimization Milestone:** Bulk Transaction Commit & Multi-Worker Parallel Dispatching  
> **Benchmark Script:** [benchmark-index-speed.ts](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/scripts/benchmark-index-speed.ts)

---

## 🎯 1. Executive Summary & Optimization Milestone

با اعمال ۲ بهینه‌سازی کلیدی در ساختار دیتابیس SQLite و لایه وکتورسازی Embedder، یک **دستاورد بزرگ در افزایش سرعت Full Index و SQLite IO** حاصل گردید:

- ⚡ **کاهش ۹۹.۶ درصدی زمان نوشتن SQLite (Database Write Time):** از **`15,254.91 ms`** (۱۵.۲۵ ثانیه) به تنها **`63.87 ms`** (۶۳ میلی‌ثانیه)! (**۲۴۰ برابر سریع‌تر**)
- 🚀 **کاهش ۵۰ درصدی زمان کل Full Clean Index:** از **`26.94 ثانیه`** به **`13.61 ثانیه`**
- 🏆 **فتح نرخ پردازش تفاضلی بیش از ۵۰۰ فایل در ثانیه (Incremental Sync Throughput):** **`673.5 Files/sec`** (زمان کل ۳۷ الی ۴۱ میلی‌ثانیه!)

---

## 📊 2. Post-Optimization Real Index Benchmark Detailed Table

خروجی واقعی اجرای اسکریپت `npx tsx scripts/benchmark-index-speed.ts` پس از اعمال بهینه‌سازی‌ها:

| Indexing Sub-Phase / Component | Real Full Clean (Scenario A) | Incremental Sync (Scenario B) | Improvement / Status |
| :--- | :---: | :---: | :---: |
| 📂 **File Walker & Ignore Matcher** | `16.12 ms` | `19.77 ms` | ✅ آنی (Instant) |
| 🔑 **SHA-256 Hashing & Diff Check** | `165.89 ms` | `21.77 ms` | ✅ سریع (Fast) |
| 🌲 **AST Chunking (Tree-sitter)** | `133.17 ms` | `0.01 ms` | ✅ سریع (Fast) |
| 🧬 **Batch Embedding (Worker Threads)** | `13,233.11 ms` | `0.01 ms` | 🚨 گلوگاه مدل ONNX |
| ⚡ **SQLite / Zig Database Write & I/O** | **`63.87 ms`** | **`0.01 ms`** | 🏆 **۲۴۰ برابر سریع‌تر (۹۹.۶٪ کاهش)** |
| --------------------------------------------- | ---------------- | ---------------- | ---------- |
| 🎯 **TOTAL INDEXING E2E LATENCY** | **`13,612.22 ms` (13.6s)** | **`41.58 ms`** | 🚀 **۵۰٪ کاهش زمان کل** |
| 🚀 **Processing Throughput (Files/sec)** | **`2.1 Files/sec`** | **`673.5 Files/sec`** | 🏆 **هدف >500 F/s در Sync** |
| ⚡ **Chunk Processing Throughput** | **`6.2 Chunks/sec`** | **`0.0 Chunks/sec`** | - |

---

## 🛠️ 3. Key Code Optimizations Applied

### ۳.۱. یکپارچه‌سازی تراکنش‌های دیتابیس (Bulk Transaction Commit)
- **فایل‌های ویرایش‌شده:** [indexer.ts](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/src/core/indexer.ts#L259) و [native-store.ts](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/src/storage/native-store.ts#L278)
- **روش:** مقدار `DB_BATCH_LIMIT` به `5000` افزایش یافت و تمام عملیات‌های درج چانک و متادیتا در ۱ تراکنش یکپارچه دیتابیس به باینری زیگ ارسال گردید.
- **نتیجه:** حذف کامل Fsyncهای متوالی روی دیسک و کاهش زمان نوشتن SQLite از **`15.25 ثانیه` به `63 میلی‌ثانیه`**!

### ۳.۲. توزیع موازی واقعی Workerها و استفاده از تمام هسته‌های CPU
- **فایل‌های ویرایش‌شده:** [embedder.ts](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/src/core/embedder.ts#L30) و [embedder.ts](file:///c:/Users/ASUS/Desktop/flutter_project/mcp_search/packages/deepsift-core/src/core/embedder.ts#L140)
- **روش:** ارتقای تعداد Worker Threadها به تمام هسته‌های منطقی CPU (`os.cpus().length`) و توزیع همزمان باچ‌ها با الگوی `Promise.all`.

---

## 🏃 4. نحوه اجرای مجدد بنچمارک

```bash
cd packages/deepsift-core
npm run build
npx tsx scripts/benchmark-index-speed.ts
```
