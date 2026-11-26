import fs from 'node:fs';
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2));

// ---------- timeline: add "domain" filter (hardware/software/network/ai) + more events
const t = rd('content/timeline.json');
const dom = { tally: 'hardware', abacus: 'hardware', pascal: 'hardware', 'leibniz-machine': 'hardware', 'leibniz-binary': 'hardware', babbage: 'hardware', lovelace: 'software', turing: 'software', shannon: 'hardware', z3: 'hardware', colossus: 'hardware', eniac: 'hardware', transistor: 'hardware', fortran: 'software', ic: 'hardware', moore: 'hardware', i4004: 'hardware' };
t.domains = [{ id: 'hardware', label: 'سخت‌افزار' }, { id: 'software', label: 'نرم‌افزار' }, { id: 'network', label: 'شبکه' }, { id: 'ai', label: 'هوش مصنوعی' }];
t.events.forEach((e) => { e.domain = dom[e.id]; });
const need = { note: 'منبع دقیق (سند، نویسنده، تاریخ) باید توسط تحریریه ثبت و تأیید شود' };
const add = [
  { id: 'edvac', sort: 1945.5, date: '۱۹۴۵', title: 'گزارش «پیش‌نویس EDVAC» و ایدهٔ برنامهٔ ذخیره‌شده', category: 'idea', domain: 'hardware', chapters: ['ch-3'],
    description: 'گزارشی که معماری‌ای را شرح می‌داد که در آن برنامه و داده هر دو در حافظه نگهداری می‌شوند.', significance: 'پایهٔ بحث «معماری برنامهٔ ذخیره‌شده» که در کامپیوترهای بعدی مهم شد.', limit: 'نسبت دادن این ایده به یک فرد دقیق نیست؛ در تاریخ‌نگاری دربارهٔ سهم افراد مختلف اختلاف‌نظر وجود دارد.', source: { ref: 'chm' } },
  { id: 'manchester-baby', sort: 1948, date: '۱۹۴۸', title: 'اولین اجرای برنامهٔ ذخیره‌شده در یک ماشین الکترونیکی (Manchester Baby)', category: 'electronic', domain: 'hardware', chapters: ['ch-3', 'ch-5'],
    description: 'ماشینی آزمایشی در منچستر برای نخستین بار برنامه‌ای را که در حافظهٔ خودش ذخیره شده بود اجرا کرد.', significance: 'با معیار «اجرای برنامهٔ ذخیره‌شده در حافظهٔ الکترونیکی» یکی از نقاط عطف است.', limit: 'یک ماشین آزمایشی کوچک بود، نه محصولی تجاری.', source: need },
  { id: 'a0', sort: 1952, date: '۱۹۵۲', title: 'سیستم A-0 گریس هاپر (از نخستین کامپایلرها)', category: 'software', domain: 'software', chapters: ['ch-5'],
    description: 'ابزاری که زیربرنامه‌ها را کنار هم می‌گذاشت و کد قابل‌اجرا می‌ساخت.', significance: 'قدمی به سمت این ایده که انسان با نمادهای قابل‌فهم‌تر بنویسد و ابزار ترجمه کند.', limit: 'با کامپایلرهای امروزی از نظر قابلیت‌ها تفاوت زیادی دارد.', source: need },
  { id: 'dartmouth', sort: 1956, date: '۱۹۵۶', title: 'کارگاه دارتموث و رواج اصطلاح «هوش مصنوعی»', category: 'idea', domain: 'ai', chapters: ['ch-8'],
    description: 'پژوهشگران در دارتموث گرد هم آمدند تا دربارهٔ ساخت ماشین‌هایی بحث کنند که جنبه‌هایی از یادگیری و هوش را شبیه‌سازی کنند.', significance: 'معمولاً نقطهٔ آغاز رسمی حوزهٔ هوش مصنوعی شمرده می‌شود.', limit: 'پیش‌بینی‌های خوش‌بینانهٔ آن دوره دربارهٔ سرعت پیشرفت، بعدها محقق نشد.', source: need },
  { id: 'alto', sort: 1973, date: '۱۹۷۳', title: 'Xerox Alto: رایانهٔ پژوهشی با رابط گرافیکی', category: 'idea', domain: 'software', chapters: ['ch-6'],
    description: 'رایانه‌ای پژوهشی با صفحهٔ گرافیکی، ماوس و پنجره.', significance: 'نمونه‌ای مهم از رابط‌های گرافیکی که بعدها روی محصولات تجاری اثر گذاشت.', limit: 'محصول انبوه برای عموم نبود.', source: need },
  { id: 'arpanet', sort: 1969, date: '۱۹۶۹', title: 'اولین پیام روی ARPANET', category: 'idea', domain: 'network', chapters: ['ch-7'],
    description: 'یکی از شبکه‌های مهم اولیه برای اتصال چند دانشگاه و مرکز پژوهشی.', significance: 'بخشی از ریشه‌های تاریخی اینترنت.', limit: 'ARPANET با اینترنت امروزی یکی نیست؛ اینترنت حاصل به‌هم‌پیوستن شبکه‌های متعدد است.', source: need },
  { id: 'altair', sort: 1975, date: '۱۹۷۵', title: 'Altair 8800', category: 'hardware', domain: 'hardware', chapters: ['ch-6'],
    description: 'کیت رایانهٔ شخصی برای علاقه‌مندان.', significance: 'از نخستین رایانه‌های شخصی مطرح که علاقه‌مندان را به ساخت و برنامه‌نویسی کشاند.', limit: 'با رایانهٔ شخصی «آمادهٔ استفاده» امروزی تفاوت زیادی داشت.', source: need },
  { id: 'ibmpc', sort: 1981, date: '۱۹۸۱', title: 'IBM PC', category: 'hardware', domain: 'hardware', chapters: ['ch-6'],
    description: 'رایانهٔ شخصی شرکت IBM.', significance: 'نقش مهمی در گسترش استاندارد رایج رایانهٔ شخصی داشت.', limit: 'تنها رایانهٔ شخصی آن دوره نبود.', source: need },
  { id: 'tcpip', sort: 1983, date: '۱۹۸۳', title: 'گذار ARPANET به TCP/IP', category: 'idea', domain: 'network', chapters: ['ch-7'],
    description: 'مجموعه پروتکل‌های TCP/IP به‌عنوان زبان مشترک شبکه به کار رفت.', significance: 'امکان ارتباط شبکه‌های مختلف با یک قرارداد مشترک.', limit: 'همهٔ ارتباطات اینترنتی از TCP استفاده نمی‌کنند.', source: need },
  { id: 'mac', sort: 1984, date: '۱۹۸۴', title: 'Apple Macintosh', category: 'hardware', domain: 'software', chapters: ['ch-6'],
    description: 'رایانهٔ شخصی با رابط گرافیکی و ماوس برای کاربران عادی.', significance: 'رابط گرافیکی را برای مخاطب گسترده‌تری آشنا کرد.', limit: 'رابط گرافیکی جایگزین کامل خط فرمان نشد.', source: need },
  { id: 'www', sort: 1989.5, date: '۱۹۸۹ تا ۱۹۹۱', title: 'شکل‌گیری وب در CERN', category: 'idea', domain: 'network', chapters: ['ch-6', 'ch-7'],
    description: 'پیشنهاد و توسعهٔ سامانهٔ اسناد پیوندی، مرورگر و سرور وب در CERN.', significance: 'وب یکی از مهم‌ترین کاربردهای اینترنت شد.', limit: 'وب با اینترنت یکی نیست؛ وب یک سرویس روی اینترنت است.', source: { ref: 'cern-home', note: 'صفحهٔ اصلی سازمان؛ سند مشخص باید ثبت شود' } },
  { id: 'alexnet', sort: 2012, date: '۲۰۱۲', title: 'جهش یادگیری عمیق در تشخیص تصویر (AlexNet)', category: 'idea', domain: 'ai', chapters: ['ch-8'],
    description: 'یک شبکهٔ عصبی عمیق در یک رقابت بزرگ تشخیص تصویر نتیجهٔ بسیار بهتری از روش‌های رایج آن زمان گرفت.', significance: 'توجه پژوهشگران و صنعت را به یادگیری عمیق جلب کرد.', limit: 'یک آزمون مشخص بود؛ عملکرد خوب در یک آزمون به معنی عملکرد خوب در همهٔ موقعیت‌ها نیست.', source: need },
  { id: 'transformer', sort: 2017, date: '۲۰۱۷', title: 'معماری Transformer', category: 'idea', domain: 'ai', chapters: ['ch-8'],
    description: 'معماری‌ای مبتنی بر مکانیزم توجه که پایهٔ بسیاری از مدل‌های زبانی بزرگ شد.', significance: 'پیش‌نیاز فنی مهمی برای مدل‌های زبانی امروزی است.', limit: 'تنها عامل پیشرفت مدل‌ها نیست؛ داده، سخت‌افزار و روش آموزش هم نقش دارند.', source: need }
];
t.events = t.events.concat(add).sort((a, b) => a.sort - b.sort);
t.note = '«اولین کامپیوتر» بدون مشخص کردن تعریف، پاسخ یک‌خطی ندارد. «نوع» هر رویداد نشان می‌دهد با کدام تعریف سروکار داریم. رویدادهایی که منبع دقیق ندارند با برچسب «منبع نیازمند تأیید» نشان داده می‌شوند.';
wr('content/timeline.json', t);

// ---------- sources: add the sources named in the issue's own sources chapter
const s = rd('content/sources.json');
s.sources['cern-home'] = { title: 'CERN — صفحهٔ اصلی', author: 'CERN', url: 'https://home.cern' };
s.note = 'این منابع برای راستی‌آزمایی مطالب هر فصل پیشنهاد شده‌اند. متن فصل‌ها ارجاع درون‌متنی ندارد؛ تحریریه باید قبل از انتشار نهایی، هر ادعا را با منبع مشخص مطابقت دهد.';
s.byChapter = { note: [], 'ch-0': ['chm'], 'ch-1': ['chm', 'lovelace1843'], 'ch-2': ['leibniz1703', 'shannon1938', 'ascii1963', 'unicode', 'rfc3629'], 'ch-3': ['chm', 'eniacprog'], 'ch-4': ['nobel1956', 'moore1965', 'chm'], 'ch-5': ['chm'], 'ch-6': ['chm'], 'ch-7': ['cern-home'], 'ch-8': [], 'ch-9': [], 'sp-1': [], 'sp-2': [], 'sp-3': [] };
// organisation home pages named in the issue's own source list (homepages only: NOT sufficient for individual claims)
s.orgs = [
  { name: 'Computer History Museum', url: 'https://computerhistory.org' }, { name: 'Encyclopaedia Britannica', url: 'https://www.britannica.com' },
  { name: 'Nobel Prize', url: 'https://www.nobelprize.org' }, { name: 'IEEE', url: 'https://www.ieee.org' }, { name: 'Internet Society', url: 'https://www.internetsociety.org' },
  { name: 'CERN', url: 'https://home.cern' }, { name: 'NIST', url: 'https://www.nist.gov' }, { name: 'Unicode Consortium', url: 'https://www.unicode.org' },
  { name: 'NASA', url: 'https://www.nasa.gov' }, { name: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu' }
];
wr('content/sources.json', s);

// ---------- experiences
const x = rd('content/experiences.json');
const by = Object.fromEntries(x.experiences.map((e) => [e.id, e]));
by['sorting-visualizer'].relatedChapters = ['sp-3'];
by['timeline-explorer'].relatedChapters = ['ch-9'];
by['timeline-explorer'].description = 'خط زمانی فیلترپذیر رویدادهای سخت‌افزار، نرم‌افزار، شبکه و هوش مصنوعی. برای هر رویداد، نوعش (ابزار، ماشین مکانیکی، ایده، الکترونیکی…) و محدودیت روایت «اولین» را ببین.';
by['future-lab'].relatedChapters = ['ch-9'];
by['future-lab'].description = 'سه سناریوی فرضی و یک مدل ساده برای تمرین مصالحه‌های مهندسی (عملکرد، انرژی، هزینه، قابلیت اعتماد، تأخیر). خروجی‌ها پیش‌بینی نیستند.';
by['machine-room'].description = 'روی بخش‌های یک کامپیوتر اولیه کلیک کن تا وظیفه و محدودیت هر بخش را ببینی؛ سپس چرخهٔ واکشی، رمزگشایی و اجرا را در یک ماشین آموزشی فرضی گام‌به‌گام اجرا کن.';
const base = { relatedIssue: 'issue-01', status: 'published', difficulty: 'آسان' };
x.experiences.push(
  { ...base, id: 'code-lab', slug: 'code-lab', title: 'Code Lab', titleFa: 'آزمایشگاه کد', experienceType: 'Algorithm Visualizer', difficulty: 'متوسط', estimatedDuration: '۸ دقیقه', category: 'الگوریتم و برنامه‌نویسی', relatedChapters: ['ch-5'],
    description: 'شبه‌کد را خط‌به‌خط اجرا کن، مقدار متغیرها را ببین و یک خطای منطقی کنترل‌شده بساز تا تفاوت خطای نحوی، زمان اجرا و منطقی را ببینی.',
    instructions: ['یکی از دو برنامه (جمع چند عدد یا بزرگ‌ترین عدد) را انتخاب کن.', 'با «گام بعد» اجرا را جلو ببر و مقدار متغیرها را دنبال کن.', 'گزینهٔ «خطای منطقی» را روشن کن و ببین چرا جواب غلط می‌شود.'] },
  { ...base, id: 'desk-time', slug: 'desk-time', title: 'Desk Through Time', titleFa: 'میز کار در گذر زمان', experienceType: 'Interactive Diagram', estimatedDuration: '۵ دقیقه', category: 'رایانهٔ شخصی', relatedChapters: ['ch-6'],
    description: 'بین چند دورهٔ تاریخ کامپیوتر جابه‌جا شو و محیط کار، ورودی، ذخیره‌سازی و رابط کاربری را مقایسه کن.',
    instructions: ['یک دوره را انتخاب کن.', 'چهار ویژگی را بخوان و با دوره‌ای دیگر مقایسه کن.', 'بنویس کدام تغییر استفاده را برای افراد بیشتری آسان کرد.'] },
  { ...base, id: 'request-journey', slug: 'request-journey', title: 'Request Journey', titleFa: 'سفر یک درخواست', experienceType: 'Interactive Diagram', estimatedDuration: '۶ دقیقه', category: 'شبکه', relatedChapters: ['ch-7'],
    description: 'مسیر یک درخواست وب را از مرورگر تا سرور و برگشت دنبال کن؛ در هر مرحله ببین چه اتفاقی می‌افتد و چه چیزی ممکن است تأخیر یا خطا بسازد.',
    instructions: ['یک آدرس نمونه انتخاب کن.', 'مراحل را یکی‌یکی جلو ببر.', 'در هر مرحله علت‌های محتمل تأخیر یا خطا را بخوان.'] },
  { ...base, id: 'ml-playground', slug: 'ml-playground', title: 'Learning From Data', titleFa: 'ماشین چطور یاد می‌گیره؟', experienceType: 'Educational Simulation', difficulty: 'متوسط', estimatedDuration: '۸ دقیقه', category: 'هوش مصنوعی', relatedChapters: ['ch-8'],
    description: 'چند نمونهٔ میوه با ویژگی‌های اندازه و رنگ را به یک مدل ساده بده، داده‌های آموزشی را تغییر بده و ببین مرز تصمیم و دقت چطور تغییر می‌کند. این یک مدل آموزشی ساده است، نه بازسازی یک هوش مصنوعی واقعی.',
    instructions: ['روی نمودار کلیک کن تا نمونهٔ جدید اضافه شود.', 'کلاس نمونه را عوض کن یا نمونه‌ها را حذف کن.', 'داده‌ها را نامتوازن یا ناقص کن و تغییر نتیجه را ببین.'] }
);
by['logic-lab'].description = 'گیت‌های AND، OR، NOT و XOR را با ورودی‌های قابل‌تغییر امتحان کن، جدول درستی را ببین و مداری بساز که فقط وقتی دو ورودی متفاوت‌اند ۱ بدهد.';
by['bit-lab'].description = 'هشت کلید روشن و خاموش کن و ببین چه عددی، چه مقدار هگزادسیمالی و چه حرفی ساخته می‌شود. دو چالش (۱۰۱۱۰۱۱۰ و عدد ۱۷۳) و تفاوت ASCII و UTF-8 را امتحان کن.';
wr('content/experiences.json', x);

// ---------- issues
const i = rd('content/issues.json');
const i1 = i.issues[0];
i1.contentComplete = true; delete i1.contentNote;
i1.summary = 'سفری از چوب‌خط و چرتکه تا ماشین‌های مکانیکی، صفر و یک، لامپ خلأ، ترانزیستور، برنامه‌نویسی، رایانهٔ شخصی، اینترنت، هوش مصنوعی و سناریوهای آینده. از پایه شروع می‌کنیم تا هر کسی، از کسی که هیچ نمی‌داند تا متخصص، همراه شود.';
i1.categories = ['تاریخ', 'سیستم دودویی', 'سخت‌افزار', 'برنامه‌نویسی', 'شبکه', 'هوش مصنوعی', 'آینده'];
wr('content/issues.json', i);
console.log('ok', t.events.length, 'events', x.experiences.length, 'experiences');
