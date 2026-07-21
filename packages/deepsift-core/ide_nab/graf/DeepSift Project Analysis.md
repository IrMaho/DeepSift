# Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

### User Input

عشقم پروژمو تحلیلش کن با DeepSift  و عملکرد همه فیچر هارو بهم توضیح بده 

فقط و فقط از DeepSift  برای تحلیل استفاده کن دارم این ابزار توسعه میدم و دارم تستسش میکنم

*User accepted the command `deepsift arch`*

*Viewed [INDEX.md](file:///C:/Users/ASUS/Desktop/flutter_project/mcp_search/.deepsift/outputs/INDEX.md) *

*Viewed [search_2026-07-15T23-38-21-035Z_3ff881_page_0.png](file:///C:/Users/ASUS/Desktop/flutter_project/mcp_search/.deepsift/outputs/search_2026-07-15T23-38-21-035Z_3ff881_page_0.png) *

*User accepted the command `deepsift feature "src/core"`*

*User accepted the command `deepsift feature "src/cli"`*

*User accepted the command `deepsift feature "src/analyzers"`*

### Planner Response

سلام عزیزم! خسته نباشی. من با استفاده از ابزار **DeepSift** که خودت در حال توسعه‌اش هستی، پروژه رو به طور کامل تحلیل کردم. معماری و ویژگی‌هایی که پیاده‌سازی کردی واقعاً جذاب و سطح بالاست! 

در ادامه، عملکرد بخش‌های مختلف و فیچرهای اصلی پروژه رو بر اساس تحلیل‌های DeepSift برات باز می‌کنم:

### 🧠 هسته اصلی (Core - `src/core`)
این بخش موتور پردازشی اصلی DeepSift رو تشکیل میده که وظیفه‌ی فهم و جستجوی کد رو بر عهده داره:

*   **Indexer (`indexer.ts`)**: قلب تپنده‌ی سیستم برای خواندن فایل‌هاست. این فیچر دایرکتوری‌ها رو اسکن می‌کنه، با استفاده از هش MD5 تغییرات فایل‌ها رو تشخیص میده، کدها رو به تکه‌های معنادار (Chunks) و AST تجزیه می‌کنه و در نهایت بعد از گرفتن Embedding، اونا رو به صورت Batch توی دیتابیس محلی ذخیره می‌کنه.
*   **Embedder & Workers (`embedder.ts`, `embedder-worker.ts`)**: مسئول تبدیل متن کدها به بردارهای ریاضی (Vector Embeddings) از نوع `Float32Array`. نکته‌ی جذابش اینه که از `Worker` های Node.js استفاده کردی تا بر اساس تعداد هسته‌های CPU، این پردازش سنگین رو به صورت موازی (Multi-threaded) انجام بده که پرفورمنس رو به شدت بالا می‌بره.
*   **Searcher (`searcher.ts`)**: موتور جستجوی هیبریدی قدرتمندی که هم جستجوی کلمه‌ای (Keyword) و هم جستجوی معنایی (Semantic) رو ترکیب می‌کنه. با استفاده از الگوریتم `Reciprocal Rank Fusion (RRF)` نتایج رو با هم ادغام می‌کنه و حتی به ساختارهای مهم پروژه (از طریق Project DNA) وزن بیشتری میده.
*   **Context Injector (`context-injector.ts`)**: یک سیستم هوشمند برای تزریق کانتکست به LLM. این بخش دی‌ان‌ای پروژه (مثل رنگ‌ها، فواصل، فونت‌ها و کدهای مشابه) رو استخراج می‌کنه و با فرمت `[--- DEEPSIFT CONTEXT INJECTION ---]` به صورت فشرده آماده‌سازی می‌کنه تا عامل هوش مصنوعی دقیقاً بدونه با چه استایل و قواعدی کد بزنه.

---

### 🧬 تحلیل‌گرها و تولید دی‌ان‌ای پروژه (Analyzers - `src/analyzers`)
این فیچرها کدهای شما رو کالبدشکافی می‌کنن تا **Project DNA** رو بسازن. این بخش واقعاً هوشمندانه‌ست:

*   **Graph Analyzer (`graph-analyzer.ts`)**: معماری پروژه رو به شکل یک گراف درمیاره. وابستگی‌ها (Imports/Exports) رو پیدا می‌کنه، فایل‌های مرکزی و حیاتی (Core Files) رو با الگوریتمایی مثل PageRank شناسایی می‌کنه (که توی خروجی دستور `arch` دقیقاً همینو دیدیم) و حتی می‌تونه Layer Violation ها رو تشخیص بده.
*   **Property Miner & Value Classifier (`property-miner.ts`, `value-classifier.ts`)**: این دو فیچر با استفاده از Regex و پردازش‌های هیوریستیک، دیزاین توکن‌ها (Design Tokens) رو استخراج می‌کنن. یعنی به صورت خودکار مقادیر رنگ‌ها (HEX, RGB)، ابعاد، سایه‌ها، فونت‌ها و... رو از دل کد بیرون می‌کشن تا یک دیزاین سیستم یکپارچه برای پروژه بسازن.
*   **Convention Miner (`convention-miner.ts`)**: قواعد نام‌گذاری (مثل camelCase یا PascalCase) و الگوهای ساختاری توابع و کلاس‌های پروژه رو استخراج می‌کنه تا استایل کدنویسی یکپارچه بمونه.
*   **L10n Detector (`l10n-detector.ts`)**: یک اسکنر هوشمند برای پیدا کردن کدهای مربوط به چندزبانگی (i18n/Localization). این سیستم هم توابع ترجمه رو پیدا می‌کنه و هم استرینگ‌های هاردکد شده رو گیر میندازه!
*   **Resource Mapper (`resource-mapper.ts`)**: فایل‌های استاتیک مثل عکس‌ها، فونت‌ها و آیکون‌ها رو مپ می‌کنه و چک می‌کنه که هر فایل کجا استفاده شده.
*   **Similarity Engine (`similarity-engine.ts`)**: با استفاده از Cosine Similarity، شباهت معنایی بین تکه کدهای مختلف رو حساب می‌کنه. این ابزار برای پیدا کردن کدهای تکراری (Duplication) و گروه‌بندی منطق‌های مشابه فوق‌العاده‌ست.

---

### 💻 رابط کاربری ترمینال (CLI - `src/cli`)
اینجا همون لایه‌ای هست که تمام این قدرت رو در اختیار کاربر می‌ذاره. فایل‌های `cli-entry.ts` و فولدر `commands/` دستوراتی مثل `arch` (برای دیدن گراف)، `feature` (همین چیزی که الان برای تحلیل استفاده کردم)، `dna` (برای خواندن توکن‌ها)، `read` (برای تولید توکن‌های فشرده تصویری) و `search` رو مدیریت می‌کنن.

**جمع‌بندی من:**
ابزاری که داری می‌سازی (DeepSift) معماری فوق‌العاده تمیزی داره. تفکیک وظایف بین Indexer، Analyzer ها و Searcher عالیه و استفاده از ویژگی‌هایی مثل Multi-threading برای Embedder و ادغام هوشمندانه (RRF) برای جستجو، نشون میده که روی پرفورمنس و دقت به شدت کار شده. 

اگر روی بخش خاصیش داری تست می‌گیری یا می‌خوای باگِ فیچر خاصی رو بررسی کنی، بهم بگو تا با دستورات عمیق‌ترِ DeepSift بریم تو دل کداش!