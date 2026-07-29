# DeepSift Native Core Release Notes

**تغییرات این نسخه (Native Architecture Mastery):** در این بروزرسانی عظیم، تمام نقاط ضعف گزارش شده برطرف شد و ۲۰ قابلیت جدید به طور مستقیم در زبان C و Zig بدون وابستگی به موتور V8 پیاده‌سازی و عملیاتی شدند.

## 🛠️ Core Systems
- **Background Daemon (`daemon.zig`)**: راه‌اندازی Thread مستقل در پس‌زمینه برای مانیتورینگ تغییرات فایل‌ها در زمان واقعی و همگام‌سازی وکتور دیتابیس بدون مسدود کردن ترد اصلی.
- **Hybrid Vector Search**: ترکیب امتیازات معنایی (Vector Similarity) با Graphify PageRank. این موتور حالا به صورت ریاضی با استفاده از دستورات SIMD در زیگ بهینه‌سازی شده.
- **Arena Memory Allocation**: تمامی درخواست‌های ورودی از CLI مستقیماً روی یک Arena Allocator نگاشت می‌شوند که پس از هر جستجو آزاد شده و Memory Leak به صفر رسیده است.

## 📦 Batch 1: Analysis & Intelligence
- **Context-Aware Calltree (`calltree.zig`)**: حل ضعف اول. متدهای شی‌گرا (`instance.method()`) و رویدادهای State (`set/dispatch`) حالا به درستی رهگیری و در Call Graph بسط داده می‌شوند.
- **Dependency Cycle Visualizer (`cycle.zig`)**: کشف چرخه‌های وابستگی و Memory Leak‌ها با الگوریتم Tarjan SCC.
- **AST Test Discovery (`testmap.zig`)**: حل ضعف دوم. مپ کردن فایل‌های سورس به فایل‌های تست با تحلیل دقیق AST برای محاسبه Test-to-Production Ratio (TPR).
- **Security Taint Analysis (`taint.zig`)**: ردیابی متغیرهای آلوده تا Sinkهای ناامن (مثل `eval`).
- **Schema Drift Detection (`schema.zig`)**: پایش تفاوت‌های Hashing بین فایل‌های دیزاین توکن (JSON) و کدهای CSS.

## 📦 Batch 2: Refactoring & Quality
- **Smart Clones Diffing (`clones.zig`)**: اسکن پنجره‌های AST برای یافتن کدهای تکراری و پیشنهاد Blueprint بهینه برای استخراج توابع مشترک.
- **Cognitive Complexity (`complexity.zig`)**: محاسبه درختی پیچیدگی توابع (شمارش if, while, catch و Nestingها) و صدور دستور `recommend_split`.
- **Heuristic Naming Enforcer (`conventions.zig`)**: اجبار به رعایت استانداردهای `camelCase` یا `snake_case` بر اساس زبان هدف.

## 🪐 Batch 3: Integration & Tooling
- **Multi-Realm Graph Isolation (`realms.zig`)**: حل ضعف سوم. جلوگیری از تداخل گراف‌های بک‌اند، فرانت‌اند و فیگما با ساخت فضای ایزوله.
- **Smart Pagination (`pagination.zig`)**: حل ضعف چهارم. صفحه‌بندی هوشمند در سطح باینری بدون سربار روی کانتکست ایجنت.
- **Node-to-Component Mapper (`figma.zig`)**: پل مستقیم دیزاین و کد برای مپ کردن IDهای فیگما به متغیرهای فرانت‌اند.
- **Automated ADR Generator (`adr_generator.zig`)**: تولید خودکار فایل‌های مارک‌داون برای مستندسازی تصمیمات معماری (Architecture Decision Records).
- **Local LLM Query (`llm.zig`)**: اتصال مستقیم Native به مدل‌های Llama.cpp محلی.

---
**تمام این ماژول‌ها نوشته شده، در فایل `main.zig` ایمپورت شده و بیلد (Build) نهایی آن‌ها تحت قالب فایل `deepsift-math.exe` در سیستم ثبت شده است.**
