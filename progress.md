# ردیابی پیشرفت تسک‌های پروژه

## فاز ۰ — زیرساخت
- [x] راه‌اندازی پروژه Node.js + TypeScript
- [x] نصب وابستگی‌ها (@modelcontextprotocol/sdk, zod, @ternlight/base)
- [x] پیکربندی tsconfig.json و اسکریپت‌های build/dev
- [x] ساخت ساختار پوشه‌بندی

## فاز ۱ — هسته Embedding
- [x] پیاده‌سازی embedder.ts (لود مدل Ternlight + تابع getEmbedding)
- [x] پیاده‌سازی similarity.ts (Cosine Similarity + BM25 scoring)
- [x] تست واحد عملکرد embedding و similarity

## فاز ۲ — پارسینگ و تیکه‌بندی
- [x] پیاده‌سازی file-walker.ts (پیمایش با رعایت .gitignore)
- [x] پیاده‌سازی simple-parser.ts (تیکه‌بندی خط‌محور — fallback)
- [x] پیاده‌سازی tree-sitter-parser.ts (تیکه‌بندی AST-aware)
- [x] تعریف تایپ CodeChunk در types/index.ts

## فاز ۳ — لایه ذخیره‌سازی
- [x] پیاده‌سازی vector-store.ts (ذخیره بردارها — SQLite یا In-Memory)
- [x] پیاده‌سازی metadata-store.ts (hash فایل‌ها برای incremental indexing)
- [x] تست واحد عملیات CRUD ذخیره‌سازی

## فاز ۴ — منطق ایندکس‌سازی
- [x] پیاده‌سازی indexer.ts (ارکستراسیون: walk → chunk → embed → store)
- [x] پیاده‌سازی Incremental Indexing (فقط فایل‌های تغییریافته)
- [ ] تست عملکرد ایندکس‌سازی روی یک پروژه نمونه

## فاز ۵ — منطق جستجو
- [x] پیاده‌سازی searcher.ts (embed query → cosine search → rank → return)
- [x] پیاده‌سازی Hybrid Search (ترکیب Vector + BM25 با RRF)
- [x] فیلتر نتایج بر اساس نوع (function, class, import, config)

## فاز ۶ — ابزارهای MCP
- [x] پیاده‌سازی search-code.ts (ابزار اصلی: ورودی query → خروجی نتایج)
- [x] پیاده‌سازی index-project.ts (ابزار ایندکس دستی/بروزرسانی)
- [x] پیاده‌سازی search-status.ts (وضعیت ایندکس: تعداد فایل‌ها، آخرین بروزرسانی)

## فاز ۷ — سرور MCP
- [x] پیاده‌سازی server.ts (اتصال ابزارها + StdioTransport)
- [ ] تست end-to-end با Claude Desktop یا Antigravity
- [ ] تنظیم config در mcp_settings برای اتصال

## فاز ۸ — بهینه‌سازی و پولیش
- [x] بهینه‌سازی سرعت ایندکس‌سازی اولیه
- [x] مدیریت خطاها و edge cases
- [x] مستندسازی نصب و استفاده

## فاز ۹ — CLI Bridge (ایزوله‌سازی برای IDE های بدون MCP)
- [x] ساخت cli-entry.ts (Entry point + Argument Parser)
- [x] ساخت cli-output.ts (فرمت‌بندی خروجی: MD/JSON/Plain)
- [x] ساخت cli-paths.ts (مسیردهی لوکال .deepsift/)
- [x] پیاده‌سازی search command (تک‌کوئری + چندکوئری)
- [x] پیاده‌سازی index command (عادی + force)
- [x] پیاده‌سازی status command
- [x] پیاده‌سازی arch command
- [x] پیاده‌سازی deps command
- [x] پیاده‌سازی feature command
- [x] پیاده‌سازی history + drill commands
- [x] پیاده‌سازی init command (تزریق AGENTS.md + ایندکس اولیه)
- [x] ساخت templates/agent-instructions.md
- [x] بروزرسانی history.ts برای dual-mode (CLI + MCP)
- [x] تنظیم bin field در package.json
- [x] npm link و تست گلوبال
- [x] بروزرسانی README
- [ ] پابلیش npm (اختیاری)
