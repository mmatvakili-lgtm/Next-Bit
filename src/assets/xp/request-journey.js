(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  var STEPS = [
    { n: 'مرورگر درخواست را آماده می‌کند', d: 'آدرس را می‌خواند و یک درخواست (مثلاً HTTP) می‌سازد. اگر نسخهٔ قابل‌استفاده‌ای در حافظهٔ نهان (cache) باشد، ممکن است اصلاً به شبکه نرود.', p: 'کش قدیمی یا خراب می‌تواند نسخهٔ کهنه نشان بدهد.' },
    { n: 'نام دامنه از طریق DNS بررسی می‌شود', d: 'DNS نام دامنه را به اطلاعاتی مثل آدرس IP تبدیل می‌کند. در صورت نیاز؛ اگر جواب قبلاً ذخیره شده باشد، این مرحله سریع‌تر است.', p: 'اگر DNS جواب ندهد، مرورگر نمی‌تواند سرور را پیدا کند.', fail: 'dns' },
    { n: 'ارتباط شبکه‌ای برقرار می‌شود', d: 'بسته‌ها از طریق دستگاه‌های شبکه و مسیریاب‌ها منتقل می‌شوند. همهٔ بسته‌ها الزاماً یک مسیر را طی نمی‌کنند.', p: 'شبکهٔ کند یا قطع، از دست رفتن بسته‌ها و تلاش دوبارهٔ پروتکل‌ها باعث تأخیر می‌شود.', fail: 'net' },
    { n: 'درخواست به سرور می‌رسد', d: 'درخواست به سروری می‌رسد که صفحه یا سرویس را ارائه می‌کند؛ ممکن است پشت چند لایه (بارگذار، مرکز داده) باشد.', p: 'سرور پرمشغله یا ناحیهٔ ابری دور می‌تواند پاسخ را دیر کند.' },
    { n: 'سرور پاسخ مناسب را تولید می‌کند', d: 'ممکن است فایلی را بخواند، از پایگاه‌داده کمک بگیرد یا از سرویس‌های دیگر پاسخ بگیرد.', p: 'خطای برنامه یا ازدحام می‌تواند پاسخ خطا (مثلاً کدهای ۵xx) بسازد.', fail: 'srv' },
    { n: 'پاسخ به مرورگر برمی‌گردد', d: 'داده دوباره به بسته‌هایی تقسیم می‌شود و از شبکه برمی‌گردد.', p: 'همان محدودیت‌های شبکه این‌جا هم هست.' },
    { n: 'مرورگر محتوا را نمایش می‌دهد', d: 'HTML، تصاویر و فایل‌های دیگر پردازش و رسم می‌شوند؛ ممکن است فایل‌های بیشتری از منابع دیگر لازم شود.', p: 'تصاویر یا اسکریپت‌های حجیم، نمایش را کند می‌کنند.' }
  ];
  var PROB = { none: 'بدون مشکل', cache: 'نسخهٔ قابل‌استفاده در کش هست', dns: 'DNS پاسخ نمی‌دهد', net: 'شبکه قطع یا بسیار کند است', srv: 'سرور خطا می‌دهد' };
  NB.xp['request-journey'] = function (root) {
    var url = 'example.org', prob = 'none', i = -1;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: ببینی پشت باز شدن یک صفحه چه مراحلی است و هر مرحله چه چیزی ممکن است خراب یا کند کند. این یک مدل آموزشی است؛ جزئیات واقعی به مرورگر، شبکه، کش، پروتکل و معماری سرویس بستگی دارد و در اینجا هیچ زمان واقعی اندازه‌گیری نمی‌شود.' }));
    var ctl = el('div', { class: 'xp-ctl' });
    var us = el('select', { class: 'xsel', 'aria-label': 'آدرس نمونه', onchange: function () { url = this.value; reset(); } }, ['example.org', 'example.com', 'my-school.example'].map(function (u) { return el('option', { value: u, text: u }); }));
    var ps = el('select', { class: 'xsel', 'aria-label': 'شبیه‌سازی مشکل', onchange: function () { prob = this.value; reset(); } }, Object.keys(PROB).map(function (k) { return el('option', { value: k, text: 'مشکل: ' + PROB[k] }); }));
    ctl.appendChild(us); ctl.appendChild(ps); ctl.appendChild(el('button', { class: 'xbtn', type: 'button', text: 'مرحلهٔ بعد', onclick: next })); ctl.appendChild(el('button', { class: 'xbtn o', type: 'button', text: 'شروع مجدد', onclick: reset })); w.appendChild(ctl);
    var path = el('div', { class: 'cf-fig', style: 'flex-wrap:wrap' }); w.appendChild(path);
    var det = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(det);
    var list = el('ol', { class: 'xp-steps' }); w.appendChild(list);
    function skipped(k) { return prob === 'cache' && k >= 1 && k <= 5; }
    function next() {
      if (i >= STEPS.length - 1) return;
      var f0 = prob !== 'none' && prob !== 'cache' ? failedAt() : -1; if (f0 > -1 && i >= f0) return;
      i++; while (i < STEPS.length - 1 && skipped(i)) i++;
      draw();
    }
    function reset() { i = -1; draw(); }
    function failedAt() { var f = STEPS.findIndex(function (s) { return s.fail === prob; }); return f; }
    function draw() {
      var fa_ = prob !== 'none' && prob !== 'cache' ? failedAt() : -1; var stopped = fa_ > -1 && i >= fa_;
      path.innerHTML = '';
      STEPS.forEach(function (s, k) { var on = k <= i && !skipped(k) && !(fa_ > -1 && k > fa_); path.appendChild(el('div', { class: 'cf-t' + (on ? ' on' : ''), style: 'width:92px;height:92px;font-size:11px;opacity:' + (skipped(k) ? .35 : 1), text: fa(k + 1) + (skipped(k) ? ' (رد شد)' : '') })); if (k < STEPS.length - 1) path.appendChild(el('span', { class: 'cf-wire' + (k < i && !skipped(k + 1) && !(fa_ > -1 && k >= fa_) ? ' on' : ''), style: 'width:20px' })); });
      list.innerHTML = ''; STEPS.forEach(function (s, k) { list.appendChild(el('li', { style: 'color:' + (k === i ? 'var(--green)' : 'var(--mute-d)') + ';font-weight:' + (k === i ? 800 : 400) + ';' + (skipped(k) ? 'text-decoration:line-through' : ''), text: s.n })); });
      if (i < 0) { det.innerHTML = 'آدرس: <span class="mono">https://' + NB.esc(url) + '</span> — «مرحلهٔ بعد» را بزن.'; return; }
      var s = STEPS[i];
      det.innerHTML = '<b>مرحلهٔ ' + fa(i + 1) + ': ' + s.n + '</b><br>' + s.d + '<br><span style="color:#F2C773">چه چیزی ممکن است مشکل بسازد؟ ' + s.p + '</span>' + (prob === 'cache' && i === 0 ? '<br><b>→ این‌بار نسخهٔ ذخیره‌شده قابل‌استفاده است، پس مراحل ۲ تا ۶ رد می‌شوند.</b>' : '') + (stopped ? '<br><b style="color:#FFB4AB">✗ این‌جا درخواست شکست می‌خورد: ' + PROB[prob] + '. کاربر معمولاً با پیام خطا یا انتظار طولانی روبه‌رو می‌شود.</b>' : '') + (i === STEPS.length - 1 && !stopped ? '<br><b>✓ صفحه نمایش داده شد.</b>' : '');
    }
    root.appendChild(w); reset();
  };
})();
