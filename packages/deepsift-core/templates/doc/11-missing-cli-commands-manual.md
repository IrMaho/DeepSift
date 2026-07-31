# 11. Missing CLI Commands Manual

این سند شامل مستندات دستورات ترمینالی DeepSift است که در اسناد قبلی مستند نشده بودند. با اضافه شدن این فایل، مجموعه 70 کامند DeepSift تکمیل می‌گردد.

### `deepsift auto-heal`
**Usage:** `deepsift auto-heal [file]`
**Description:** لوپ 4 مرحله‌ای خودکار برای تشخیص باگ، بررسی کامپایل، تولید وصله (Patch) و اعمال مجدد تا رفع کامل خطاهای فایل.

### `deepsift dead-code`
**Usage:** `deepsift dead-code`
**Description:** اسکن عمیق گراف پروژه با الگوریتم BFS و یافتن بلوک‌ها و فایل‌هایی که به هیچ نقطه ورود (Entry Point) متصل نیستند.

### `deepsift learn`
**Usage:** `deepsift learn <topic>`
**Description:** ذخیره الگوهای پرتکرار، تنظیمات و مهارت‌های جدید در حافظه ایجنت برای استفاده‌های بعدی (مانند تولید Rule یا Skill جدید).

### `deepsift memo-prompt`
**Usage:** `deepsift memo-prompt`
**Description:** استخراج دستورات ساختاریافته از DRM (حافظه تحقیقاتی) برای تزریق به Prompt اصلی ایجنت، جهت یادآوری کانتکست‌های فعال.

### `deepsift overview`
**Usage:** `deepsift overview [path]`
**Description:** یک Super-Command که در یک نگاه، معماری کلی، گره‌های اصلی (God Nodes) و خلاصه فیچرهای پروژه را گزارش می‌دهد.

### `deepsift patch-drift`
**Usage:** `deepsift patch-drift`
**Description:** تشخیص انحراف‌های ساختاری (Drift) بین وصله‌های (Patches) قبلی و کد فعلی، و پیشنهاد سینک کردن آن‌ها.

### `deepsift plan-ui`
**Usage:** `deepsift plan-ui "request"`
**Description:** تولید نقشه راه پیاده‌سازی و مشخصات بصری (Spacing, Tokens, i18n) پیش از تولید یک کامپوننت UI یا فرانت‌اند.

### `deepsift read-feature`
**Usage:** `deepsift read-feature <path>`
**Description:** ترکیب دو دستور `read` و `feature`؛ کد دقیق را به همراه درخت AST مربوط به همان کد در یک خروجی یکپارچه برمی‌گرداند.

### `deepsift resolve`
**Usage:** `deepsift resolve <symbol>`
**Description:** رهگیری و ترجمه دقیق Typeها یا Variableهای مبهم با استفاده از گراف مرکزی به منبع اصلی (Definition).

### `deepsift schema-drift`
**Usage:** `deepsift schema-drift`
**Description:** ممیزی و بررسی همگام‌سازی طرح‌واره‌ها (Schemas) بین بک‌اند و دیتابیس کلاینت تا هیچ‌گونه ناهماهنگی مخفی وجود نداشته باشد.

### `deepsift start`
**Usage:** `deepsift start`
**Description:** اجرای سرور MCP (Model Context Protocol) محلی برای اتصال ابزارها به IDE یا ایجنت‌های هوشمند.
