(function () {
  var NB = window.NB, el = NB.el;
  var ERAS = [
    { id: 'e40', n: 'دههٔ ۱۹۴۰ تا ۱۹۵۰', t: 'ماشین‌های اتاق‌اندازه', env: 'اتاق ویژه، تجهیزات خنک‌کننده و کادر آموزش‌دیده؛ کاربر عادی کنار دستگاه نبود.', inp: 'بسته به دستگاه: کلید، کابل‌کشی یا کارت پانچ.', sto: 'حافظه‌های بسیار محدود؛ کارت و نوار برای نگهداری داده و برنامه (بسته به دستگاه).', ui: 'چراغ‌ها، کلیدها و خروجی چاپی؛ خبری از پنجره و منو نبود.' },
    { id: 'e60', n: 'دههٔ ۱۹۶۰ تا ۱۹۷۰', t: 'سامانه‌های اشتراکی و ترمینال', env: 'یک کامپیوتر مرکزی که چند نفر از طریق ترمینال از آن استفاده می‌کردند (در بسیاری از مراکز).', inp: 'کارت پانچ و ترمینال‌های متنی.', sto: 'نوار مغناطیسی و دیسک‌های بزرگ.', ui: 'عمدتاً متنی و خط فرمان.' },
    { id: 'e80', n: 'دههٔ ۱۹۷۰ تا ۱۹۸۰', t: 'رایانهٔ شخصی اولیه', env: 'کامپیوتر روی میز خانه یا دفتر؛ اولین‌بار «شخصی» بودن معنا پیدا کرد.', inp: 'صفحه‌کلید (و بعدها ماوس در برخی مدل‌ها).', sto: 'نوار کاست یا فلاپی و بعدها دیسک سخت.', ui: 'خط فرمان؛ در پایان این دوره رابط‌های گرافیکی هم به بازار آمدند.' },
    { id: 'e90', n: 'دههٔ ۱۹۸۰ تا ۱۹۹۰', t: 'رابط گرافیکی و وب', env: 'میز کار با نمایشگر رنگی و نرم‌افزارهای اداری، طراحی و بازی.', inp: 'صفحه‌کلید و ماوس.', sto: 'دیسک سخت، سی‌دی، شبکه و (با گسترش وب) محتوای آنلاین.', ui: 'پنجره، آیکون، منو و اشاره‌گر؛ مرورگر وب.' },
    { id: 'e10', n: 'دههٔ ۲۰۱۰ به بعد', t: 'موبایل و ابر', env: 'کامپیوتر در جیب؛ کار و سرگرمی همه‌جا.', inp: 'لمس، صدا و دوربین به‌علاوهٔ صفحه‌کلید.', sto: 'حافظهٔ فلش و ذخیره‌سازی ابری.', ui: 'رابط لمسی و برنامه‌های کوچک؛ خط فرمان هنوز برای توسعه‌دهندگان زنده است.' }
  ];
  var F = [['env', 'محیط کار'], ['inp', 'ابزار ورودی'], ['sto', 'ذخیره‌سازی'], ['ui', 'رابط کاربری']];
  NB.xp['desk-time'] = function (root) {
    var a = 0, b = 3;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: مقایسه کنی که محیط کار، ابزار ورودی، ذخیره‌سازی و رابط کاربری در دوره‌های مختلف چه فرقی داشتند. دوره‌بندی‌ها تقریبی‌اند؛ دستگاه‌های واقعی همیشه دقیقاً در این دسته‌ها جا نمی‌گیرند.' }));
    var mk = function (lab, get, set) { return el('label', { style: 'display:flex;gap:8px;align-items:center' }, [lab, el('select', { class: 'xsel', 'aria-label': lab, onchange: function () { set(+this.value); draw(); } }, ERAS.map(function (e, i) { return el('option', { value: i, text: e.n, selected: i === get() ? '' : null }); }))]); };
    w.appendChild(el('div', { class: 'xp-ctl' }, [mk('دورهٔ اول', function () { return a; }, function (v) { a = v; }), mk('دورهٔ دوم', function () { return b; }, function (v) { b = v; })]));
    var tbl = el('div', { class: 'xgrid2', style: 'margin-top:16px' }); w.appendChild(tbl);
    var q = el('div', { class: 'xres' }); q.appendChild(el('b', { text: 'کدام تغییر استفاده از کامپیوتر را برای افراد بیشتری آسان کرد؟' }));
    var ans = el('div', { 'aria-live': 'polite', style: 'margin-top:8px' });
    var qb = el('div', { class: 'xp-ctl', style: 'margin-top:8px' }); F.forEach(function (f) { qb.appendChild(el('button', { class: 'xbtn o', type: 'button', text: f[1], onclick: function () { ans.textContent = ({ env: 'محیط کار: وقتی کامپیوتر از اتاق ویژه به میز شخصی رسید، دسترسی بسیار بیشتر شد؛ اما بدون رابط و نرم‌افزار مناسب هنوز سخت بود.', inp: 'ابزار ورودی: ماوس و بعدها لمس، کار با اشیای روی صفحه را مستقیم‌تر کرد.', sto: 'ذخیره‌سازی: ارزان‌تر و بزرگ‌تر شدن حافظه یعنی برنامه‌ها و داده‌های بیشتری در دسترس همه.', ui: 'رابط کاربری: وقتی لازم نبود دستورها را حفظ کنی، آموزش‌دیدن کمتر لازم بود؛ ولی خط فرمان هنوز برای کارهای تخصصی مهم است.' })[f[0]] + ' (پاسخ واحد و قطعی وجود ندارد؛ معمولاً ترکیب این عوامل مهم بوده است.)'; } })); });
    q.appendChild(qb); q.appendChild(ans); w.appendChild(q);
    function draw() { tbl.innerHTML = ''; [a, b].forEach(function (i) { var e = ERAS[i]; tbl.appendChild(el('div', { class: 'xres', style: 'margin:0' }, [el('b', { text: e.n + ' — ' + e.t })].concat(F.map(function (f) { return el('p', { style: 'margin:.6em 0 0', html: '<span class="mono" style="color:var(--green);font-size:12px">' + f[1] + '</span><br>' + NB.esc(e[f[0]]) }); })))); }); }
    root.appendChild(w); draw();
  };
})();
