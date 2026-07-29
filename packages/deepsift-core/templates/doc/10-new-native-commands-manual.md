# 10. Native Core Commands & Missing CLI Manual

این سند شامل مستندات دقیق دستورات جدیدی است که به صورت بومی (Native) در موتور Zig توسعه یافته‌اند و همچنین سایر دستورات پیشرفته‌ای که در مستندات قبلی از قلم افتاده بودند.

## 🚀 1. Native Architectural Commands (Zig Core)

### `deepsift cycle`
**Usage:** `deepsift cycle [path]`
**Description:** اجرا کننده الگوریتم Tarjan's Strongly Connected Components (SCC) به صورت Zero-Cost در رم. این دستور گراف وابستگی‌های (Dependencies) پروژه رو اسکن می‌کنه و چرخه‌های مرگبار (Circular Dependencies) رو لیست می‌کنه.

### `deepsift taint`
**Usage:** `deepsift taint <source_node_id>`
**Description:** ردیاب امنیتی Data-Flow. یک متغیر یا ورودی کاربر رو می‌گیره و با پیمایش گراف (Graph Traversal)، مسیر رسیدن این متغیر به توابع Sink (مثل `eval` یا `innerHTML`) رو برای جلوگیری از آسیب‌پذیری‌ها چاپ می‌کنه.

### `deepsift figma`
**Usage:** `deepsift figma <figma_id>`
**Description:** پل ارتباطی بین دنیای Design و Code. با گرفتن ID یک نود فیگما، کامپوننت فرانت‌اند معادل اون رو در سورس‌کد با استفاده از هیروستیک‌های بومی مپ (Map) می‌کنه.

### `deepsift llm`
**Usage:** `deepsift llm "prompt"`
**Description:** ارسال مستقیم کوئری به مدل‌های Local LLM (مثل Llama.cpp) که به صورت Native به باینری DeepSift وصل شدن. بدون نیاز به واسط Node.js اجرا میشه.

### `deepsift conventions`
**Usage:** `deepsift conventions [path]`
**Description:** ابزار پایش هیروستیک نام‌گذاری (Heuristic Naming Enforcer). با توجه به زبان برنامه نویسی (مثلا Typescript یا Python)، کدهای شما رو از نظر رعایت استانداردهای `camelCase` یا `snake_case` بررسی می‌کنه.

---

## 🛡️ 2. Undocumented Core Commands

### `deepsift check-schema-drift`
**Usage:** `deepsift check-schema-drift`
**Description:** بررسی هماهنگی (Sync) بین فایل‌های JSON طراحی (Design Tokens) و CSS فرانت‌اند تا در صورت وجود Drift و ناهماهنگی، هشدار بده.

### `deepsift find-dead-code`
**Usage:** `deepsift find-dead-code [path]`
**Description:** شناسایی توابع، متغیرها و اکسپورت‌های استفاده نشده در کل پروژه با پیمایش معکوس AST.

### `deepsift gen-adr`
**Usage:** `deepsift gen-adr <title> <decision>`
**Description:** تبدیل سریع تصمیمات معماری (Insights) به فایل‌های استاندارد ADR (Architecture Decision Record) با فرمت مارک‌داون.

### `deepsift wire-trace`
**Usage:** `deepsift wire-trace [dir]`
**Description:** رهگیری جریان پیام‌های Cross-Environment شامل `postMessage`، `WebSockets` و `EventEmitters`.

### `deepsift resolve-error`
**Usage:** `deepsift resolve-error "trace string"`
**Description:** تبدیل Stacktrace خطاهای زمان اجرا به لاین‌های دقیق سورس‌کد پروژه با استفاده از گراف مرکزی.

### `deepsift testmap`
**Usage:** `deepsift testmap`
**Description:** استخراج نقشه قطعی از فایل‌های تست به فایل‌های اصلی (Source to Test Mapping) برای محاسبه Test-to-Production Ratio.

### `deepsift clones`
**Usage:** `deepsift clones [path]`
**Description:** اسکنر هوشمند کدهای تکراری. به جای تطابق متنی ساده، پنجره‌های AST رو با هم مقایسه می‌کنه و یک Blueprint ژنریک برای استخراج کدهای مشترک به یک فایل Utility ارائه می‌ده.

### `deepsift complexity`
**Usage:** `deepsift complexity [path]`
**Description:** محاسبه لحظه‌ای Cognitive و Cyclomatic Complexity. اگر تابعی بیش از حد پیچیده باشه، پیشنهاد تجزیه (Split) به صورت خودکار صادر میشه.
