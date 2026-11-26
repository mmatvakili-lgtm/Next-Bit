(function () {
  var NB = window.NB, el = NB.el;
  NB.xp['count-choices'] = function (root) {
    var N = 2500, cost = 'high', rep = 'once', pick = 0;
    var W = [
      { n: '۱. همه‌چیز را در ذهنم نگه دارم', f: function () { var s = []; if (N <= 25) s.push(['good', 'برای تعداد خیلی کم کافی است.']); else s.push(['bad', 'حافظهٔ کاری انسان برای این تعداد جا ندارد و حواس‌پرتی خطا می‌سازد.']); if (cost === 'high') s.push(['bad', 'اشتباه هزینهٔ زیادی دارد و ذهن هیچ ردی برای بازبینی نمی‌گذارد.']); return s; } },
      { n: '۲. از چوب‌خط یا نشانه‌های گروه‌بندی‌شده استفاده کنم', f: function () { var s = []; if (N <= 3000) s.push(['good', 'یک بار شمردن با گروه‌های پنج‌تایی ساده و قابل‌بازبینی است؛ ردش بیرون از ذهن می‌ماند.']); else s.push(['warn', 'برای تعداد خیلی زیاد کند و خسته‌کننده می‌شود.']); if (rep === 'daily') s.push(['warn', 'تکرار روزانه‌اش هم زمان‌بر است.']); return s; } },
      { n: '۳. ابزاری بسازم که شمارش را خودکار انجام بدهد', f: function () { var s = []; if (rep === 'daily' || N > 3000) s.push(['good', 'وقتی کار بارها تکرار می‌شود یا تعداد خیلی زیاد است، هزینهٔ ساخت ابزار جبران می‌شود.']); else s.push(['warn', 'برای یک بار شمردن حدود ۲۵۰۰ قطعه، ساخت ابزار ممکن است از خود شمارش گران‌تر تمام شود.']); if (cost === 'high') s.push(['good', 'ابزار قواعد را همیشه یکسان اجرا می‌کند و خطای خستگی ندارد (البته خودش باید درست ساخته شده باشد).']); return s; } }
    ];
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'باید ۲۵۰۰ قطعه را بشمری. هر راه را انتخاب کن و شرایط را عوض کن تا ببینی «بهترین راه» به شرایط بستگی دارد. (این یک مدل استدلالی ساده است، نه داده‌ی آماری.)' }));
    var cc = el('div', { class: 'cc', role: 'group', 'aria-label': 'سه راه' }); var bs = [];
    W.forEach(function (x, i) { var b = el('button', { type: 'button', 'aria-pressed': String(i === 0), text: x.n, onclick: function () { pick = i; draw(); } }); bs.push(b); cc.appendChild(b); }); w.appendChild(cc);
    var ctl = el('div', { class: 'xp-ctl', style: 'margin-top:14px' });
    var s1 = el('select', { class: 'xsel', 'aria-label': 'تعداد', onchange: function () { N = +this.value; draw(); } }, [[25, '۲۵ قطعه'], [2500, '۲۵۰۰ قطعه'], [250000, '۲۵۰٬۰۰۰ قطعه']].map(function (o) { return el('option', { value: o[0], text: o[1], selected: o[0] === 2500 ? '' : null }); }));
    var s2 = el('select', { class: 'xsel', 'aria-label': 'هزینهٔ اشتباه', onchange: function () { cost = this.value; draw(); } }, [el('option', { value: 'low', text: 'اشتباه کم‌هزینه' }), el('option', { value: 'high', text: 'اشتباه پرهزینه', selected: '' })]);
    var s3 = el('select', { class: 'xsel', 'aria-label': 'تکرار', onchange: function () { rep = this.value; draw(); } }, [el('option', { value: 'once', text: 'فقط یک بار' }), el('option', { value: 'daily', text: 'هر روز تکرار می‌شود' })]);
    ctl.appendChild(s1); ctl.appendChild(s2); ctl.appendChild(s3); w.appendChild(ctl);
    var out = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(out);
    w.appendChild(el('div', { class: 'xres', text: 'پاسخ به شرایط بستگی دارد؛ ولی همین مسئلهٔ ساده نشان می‌دهد چرا انسان به سمت ابزارهای محاسباتی رفت.' }));
    function draw() {
      bs.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === pick)); });
      out.innerHTML = '<b>' + W[pick].n + '</b><ul style="margin:8px 0 0;padding-inline-start:1.2em">' + W[pick].f().map(function (r) { return '<li>' + (r[0] === 'good' ? '✓ ' : r[0] === 'bad' ? '✗ ' : '△ ') + r[1] + '</li>'; }).join('') + '</ul>';
    }
    root.appendChild(w); draw();
  };
})();
