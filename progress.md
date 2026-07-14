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

## فاز ۱۰ — PCIE v2: Project Context Intelligence Engine

### F1 — DNA Core + Types
- [x] تعریف تایپ‌های DNA (`dna-types.ts`)
- [x] پیاده‌سازی DNA orchestrator (`project-dna.ts`)
- [x] تشخیص هویت پروژه (زبان، فریم‌ورک، package manager)
- [x] فرمت‌دهی و نمایش DNA
- [x] دستور CLI `deepsift dna` + `deepsift dna --show`
- [x] دستور CLI `deepsift scan <target>` (ساختار stub)
- [x] گسترش `CodeChunk` با `family` و `metadata`
- [x] بیلد و تست موفق

### F2 — Property Miner (Design Tokens)
- [x] Value Classifier (تشخیص مشتق‌پذیر رنگ، سایز، فاصله از شکل مقدار)
- [x] Assignment Pattern Mining (استخراج الگوی انتساب عمومی)
- [x] Token Clustering (خوشه‌بندی و تشخیص Design System)
- [x] اتصال به DNA generator

### F3 — Heuristic Parser
- [x] Universal regex-heuristic engine (Strategy 2)
- [x] الگوهای عمومی function/class/import/constant
- [x] اتصال آبشاری: Tree-sitter → Heuristic → Simple

### F4 — Similarity Engine
- [x] Embedding-based component similarity
- [x] Near-duplicate detection (cosine > 0.85)
- [x] Similarity group clustering
- [x] اتصال به DNA generator

### F5 — Convention Miner
- [x] Naming convention statistics (file/class/function/variable)
- [x] Structure template detection (feature pattern mining)
- [x] اتصال به DNA generator

### F6 — L10n Detector
- [x] Generic i18n signal detection
- [x] Hardcoded string finder (مشتق‌پذیر)
- [x] اتصال به DNA generator

### F7 — Graph Analyzer
- [x] Dependency graph builder از import ها
- [x] Community detection (cluster formation)
- [x] Topology classification
- [x] اتصال به DNA generator

### F8 — Context Injector
- [x] Smart context injection به نتایج سرچ
- [x] Relevance matching (query ↔ DNA section)
- [x] حجم injection محدود (max 2KB)

### F9 — Pre-Generation Checklist
- [x] Creation context generator
- [x] Similar component warning
- [x] Convention reminder

### F10 — Resource Mapper
- [x] Asset/icon/font discovery
- [x] Unused asset detection
- [x] Icon system pattern detection

### F11 — MCP + CLI Integration
- [x] ابزارهای MCP جدید (generate_project_dna, get_project_dna, find_similar, etc.)
- [x] ادغام context-injector با `deepsift search`
- [x] دستور `deepsift context` در CLI
- [x] آپدیت agent-instructions.md v2
- [x] آپدیت README
