# Next Bit — سایت استاتیک نشریهٔ تعاملی

## اجرا
- `node build.mjs` → خروجی در `dist/` (هیچ وابستگی npm لازم نیست؛ Node ≥ 18).
- `dist/index.html` را مستقیماً در مرورگر باز کن (روی file:// هم کار می‌کند) یا پوشهٔ `dist/` را روی هر هاست استاتیک بگذار.
- فونت‌ها (Vazirmatn، Archivo، JetBrains Mono) از Google Fonts بارگذاری می‌شوند؛ بدون اینترنت فونت‌های پیش‌فرض سیستم نمایش داده می‌شوند و همه‌چیز همچنان کار می‌کند. برای خودمیزبانی فونت، فایل‌ها را در `src/assets/fonts` بگذار و `<link>` را در `build.mjs` با `@font-face` عوض کن.

## ساختار
- `content/site.json` نام، توضیح، **siteUrl** و راه‌های تماس (قبل از انتشار واقعی پر شود؛ canonical، OG و sitemap از آن ساخته می‌شوند).
- `content/issues.json` فهرست شماره‌ها · `content/issue-01/source-text.md` متن اصلی شمارهٔ ۱ · `content/issue-01/articles.json` خروجی ایمپورتر.
- `content/experiences.json`، `timeline.json`، `sources.json`، `team.json`.
- `tools/import-text.mjs` متن Markdown را بدون تغییر جمله‌ها به JSON ساختاریافته تبدیل می‌کند؛ `tools/verify-import.mjs` وفاداری را بررسی می‌کند.
- `src/assets/` شامل `styles.css`، `app.js` (رفتار مشترک)، `reader.js` (سه حالت مطالعه + Flipbook) و `xp/*.js` (هر تجربه یک ماژول).
- تست‌ها: `tools/check-links.mjs`، `tools/test-pages.mjs`، `tools/test-xp.mjs`، `tools/test-reader.mjs` (Playwright).

## افزودن شمارهٔ ۲
1. `content/issue-02/source-text.md` را با همان قالب Markdown بساز (`# فصل …`، `## ` زیرتیتر، `### ` کادرها).
2. `tools/import-text.mjs` را برای مسیر شماره‌ی جدید پارامتری کن (ورودی/خروجی و جدول META فصل‌ها) و اجرا کن.
3. ورودی `issue-02` در `issues.json` را `status: "published"` کن؛ در `build.mjs` حلقهٔ صفحات شماره را روی همهٔ شماره‌های منتشرشده بچرخان (امروز برای `issues[0]` نوشته شده — این تنها بخشی است که برای چند شماره باید تعمیم یابد؛ داده و تجربه‌ها بازنویسی نمی‌خواهند).
4. تجربهٔ جدید: فایل `src/assets/xp/<id>.js` با `NB.xp['<id>'] = function(root, ctx){…}` + یک ورودی در `experiences.json` + یک callout در متن که در `CALL()` ایمپورتر به id نگاشت شود.

## محدودیت‌های شناخته‌شده
فرم‌ها سرور ندارند (متن آماده می‌سازند)، تصویر/جلد گرافیکی واقعی ندارد (جلد تولیدی CSS)، منابع هر ادعا باید توسط تحریریه تأیید شود، فونت‌ها خودمیزبان نیستند، Flipbook برای متن‌های خیلی طولانی هنگام اولین باز شدن چند ثانیه صفحه‌بندی می‌کند.
