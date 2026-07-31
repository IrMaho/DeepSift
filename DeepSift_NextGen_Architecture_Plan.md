# DeepSift Next-Gen Architecture & Implementation Plan 🚀

این سند، نقشه راه و معماری پیاده‌سازی نسل جدید موتور **DeepSift** بر پایه کدهای سطح سیستم (Zig) است. هدف از این فاز، تبدیل DeepSift از یک ابزار جستجوی صرف به قدرتمندترین "مغز ثانویه توسعه‌دهنده" (AI Coder Brain) در جهان است. 

## 🔴 فاز ۱: رفع نقاط ضعف فعلی (Immediate Fixes)

ابتدا سه ضعف کلیدی که در تست‌های سنگین شناسایی شده‌اند را با پیاده‌سازی‌های کاملاً Native و بهینه برطرف می‌کنیم:

### 1. True Schema Drift Diffing (`deepsift drift-diff`)
- **مشکل فعلی:** خروجی `check-schema-drift` خام است و فقط فایل‌های نامنطبق را لیست می‌کند.
- **راهکار Zig Native:** پیاده‌سازی یک ماژول مقایسه درخت‌نحو (AST-Level Diffing). ما در سطح Zig ساختار تایپ‌های فرانت‌اند (Interfaces/Types) و DTOهای بک‌اند را در رم استخراج کرده، یک گراف Hash-map می‌سازیم و مقایسه می‌کنیم تا دقیقاً فیلدهای اضافه، کم شده یا تغییر نام یافته را با استفاده از الگوریتم Myers Diff گزارش دهیم.
- **مزیت:** نمایش دقیق تغییرات (Diff) در کسری از میلی‌ثانیه بدون بارگذاری رشته‌های بزرگ.

### 2. Auto-Fusion for Clones & Context Explosion (`deepsift heal-clones`)
- **مشکل فعلی:** انفجار کانتکست (Context Explosion) به دلیل نمایش صدها خط کد تکراری.
- **راهکار Zig Native:** اضافه کردن ماژول `heal-clones` در Zig. این ماژول کلاستر کدهای تکراری که توسط الگوریتم AST Matching پیدا شده‌اند را می‌گیرد، توابع و متغیرهای نامشابه را به عنوان پارامتر ورودی اکسترکت می‌کند (Parameterization Engine) و یک فایل پچ استاندارد (TOON Patch) برای ترکیب (Fuse) آنها به یک هوک/کامپوننت مشترک تولید می‌کند.
- **مزیت:** خروجی ابزار دیگر یک گزارش بلند نیست، بلکه یک پیشنهاد عملیاتی قابل اعمال است.

### 3. State Mutation Matrix in Calltree
- **مشکل فعلی:** عدم تفکیک بین خواندن (Select) و تغییر (Mutate/Dispatch) وضعیت (State).
- **راهکار Zig Native:** توسعه موتور AST در `deepsift-math` برای درک جریان داده (Data-Flow Analysis). در هنگام ساخت گراف Calltree، هر Call Expression که به توابع State Store ارجاع دارد بررسی می‌شود. اگر الگو شبیه `useStore((state) => state.x)` بود تگ `[Selector]` و اگر اکشنی فراخوانی شد تگ `[Mutator]` می‌گیرد. این تگ‌ها در باینری Zig استخراج شده و به صورت JSON به Node.js پاس داده می‌شوند.

---

## 🔵 فاز ۲: پیاده‌سازی ۲۰ فیچر شاهکار (The 20 God-Tier Features)

این فیچرها به ترتیب اولویت و با معماری کاملاً Native در Zig پیاده‌سازی خواهند شد:

### بخش اول: هوش کد و Refactoring (بالاترین اولویت برای Agent)
1. **AST-Boundary Semantic Chunking:** تغییر سیستم Chunking فعلی از Token-based به AST-based. در Zig، مرزهای توابع و کلاس‌ها (Start/End Byte) استخراج شده و وکتورها دقیقاً بر اساس موجودیت‌های منطقی شکسته می‌شوند.
2. **God-Node Decomposition Planner (`deepsift plan-refactor`):** یک تحلیلگر گراف در Zig که Coupling و Cohesion توابع داخل یک فایل بزرگ را می‌سنجد و زیرگراف‌های مستقل را به عنوان کامپوننت‌های جدید پیشنهاد می‌دهد.
3. **Blast Radius Predictor (`deepsift impact`):** الگوریتم پیمایش گراف (BFS) در Zig برای پیدا کردن تمام نودهای وابسته به یک سمبل، احتساب ریسک تغییر و بازگرداندن ضریب خطر (Risk Score).
4. **AST-Based Dead Code Scorer (`deepsift purge`):** استفاده از گراف وابستگی در حافظه (Memory Mapped) برای شناسایی جزایر کد (Code Islands) که هیچ اتصال ورودی (Inbound Edge) ندارند.
5. **Automatic Interface Extractor:** پردازش AST در Zig برای استخراج Propertyهای کلاس‌ها و تولید مستقیم کد TypeScript.

### بخش دوم: معماری و State
6. **Hook Lifecycle Flow (React-Aware CFG):** توسعه گراف جریان کنترل در Zig برای تشخیص الگوهای React مانند `useEffect` و `useCallback` به همراه آرایه‌های Dependency.
7. **Event-Driven IPC Tracing (`deepsift wire-trace`):** موتور تطبیق الگو در Zig برای پیدا کردن ارسال‌های `postMessage` و همگام‌سازی آن‌ها با `onmessage` در کد پلاگین.
8. **Sandbox Boundary Leak Auditor (`deepsift audit-sandbox`):** اسکنر امنیتی فوق‌سریع در Zig که گراف وابستگی `code.ts` را به صورت بازگشتی چک می‌کند تا از عدم حضور کتابخانه‌های Browser-only اطمینان حاصل کند.

### بخش سوم: ادغام داده و هوش مصنوعی
9. **Semantic Test-Stub Generator:** تحلیلگر تایپ در Zig که با دیدن Signature یک تابع، آبجکت‌های Mock را مستقیماً تولید می‌کند.
10. **Agent Context Freeze:** سریالایز کردن وضعیت حافظه موقت گرافِ در حال پردازش در فرمت باینری (صفر و یک) و ذخیره آن برای بازیابی فوری در صورت ری‌استارت.
11. **Micro-Architecture Linter:** موتور اعتبارسنجی گراف (Graph Validation) در Zig برای چک کردن قوانین وابستگی پوشه‌ها (مثلاً لایه‌بندی Clean Architecture).
12. **Temporal God-Node Heatmap:** ادغام خروجی `git blame` با AST Nodeها برای تولید نقشه حرارتی در Zig.
13. **Dependency Vulnerability AST Tracker:** تقاطع دادن لیست آسیب‌پذیری‌ها با گراف Calltree برای یافتن فراخوانی‌های واقعی از کدهای مخرب.

### بخش چهارم: تجربه توسعه‌دهنده (DX)
14. **Websocket Agent Streaming:** استفاده از سوکت‌های محلی (Local Sockets) در Zig برای استریم مستقیم خروجی‌های طولانی به Node.js بدون ایجاد گلوگاه حافظه.
15. **Live Figma Token Sync:** اتصال سیستم پارسر Zig به خروجی JSON فیگما.
16. **Natural Language Query Path:** اتصال سریع‌ترین پیاده‌سازی BM25 در Zig به موتور پردازش پرس‌وجو.
17. **Visual DeepSift UI:** استخراج یک خروجی D3.js یا WebGL-friendly از دیتابیسِ گرافِ Zig برای نمایش تعاملی.

---

## 🛠 استراتژی پیاده‌سازی کدهای Zig (Low-Level Optimization)

برای اینکه به نهایت پرفورمنس برسیم:
- **Zero-Copy / Mmap:** تمام فایل‌ها مستقیماً با `mmap` باز می‌شوند. رشته‌ها کپی نمی‌شوند، بلکه فقط اشاره‌گرها (Pointers) و طول آن‌ها در ساختارهای زیگ ذخیره می‌شوند.
- **SIMD / Bitwise Operations:** در الگوریتم‌هایی مثل Diffing و جستجوهای درختی، از دستورات SIMD پردازنده برای مقایسه سریع‌تر بایت‌ها استفاده خواهد شد.
- **Thread-safe Arenas:** هر پردازش سنگین در ترد جداگانه با Arena محلی خودش ایزوله می‌شود و فقط خروجی‌ها با `std.Io.Mutex` به حافظه اصلی سینک می‌شوند.
