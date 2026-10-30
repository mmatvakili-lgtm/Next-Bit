(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  var PROGS = {
    sum: { n: 'جمع چند عدد', def: [3, 8, 2], lines: ['total = 0', 'برای هر n در فهرست:', '    total = total + n', 'نمایش total'], bugLines: { 0: 'total = 1   ← خطای منطقی' },
      run: function (list, bug) { var st = [], tot = bug ? 1 : 0; st.push({ l: 0, v: { total: tot }, m: 'مقدار اولیه' + (bug ? ' (اشتباهاً ۱)' : '') }); list.forEach(function (n) { st.push({ l: 1, v: { total: tot, n: n }, m: 'n = ' + n }); tot += n; st.push({ l: 2, v: { total: tot, n: n }, m: 'total شد ' + tot }); }); st.push({ l: 3, v: { total: tot }, m: 'نمایش ' + tot }); return { steps: st, out: tot, expected: list.reduce(function (a, b) { return a + b; }, 0) }; } },
    max: { n: 'بزرگ‌ترین عدد', def: [4, 9, 1, 7], lines: ['best = list[0]', 'برای هر n در فهرست:', '    اگر n > best:', '        best = n', 'نمایش best'], bugLines: { 2: 'اگر n < best:   ← خطای منطقی' },
      run: function (list, bug) { var st = [], best = list[0]; st.push({ l: 0, v: { best: best }, m: 'best = اولین عدد' }); list.forEach(function (n) { st.push({ l: 1, v: { best: best, n: n }, m: 'n = ' + n }); var c = bug ? n < best : n > best; st.push({ l: 2, v: { best: best, n: n }, m: (bug ? n + ' < ' + best : n + ' > ' + best) + ' → ' + (c ? 'درست' : 'نادرست') }); if (c) { best = n; st.push({ l: 3, v: { best: best, n: n }, m: 'best شد ' + best }); } }); st.push({ l: 4, v: { best: best }, m: 'نمایش ' + best }); return { steps: st, out: best, expected: Math.max.apply(null, list) }; } }
  };
  NB.xp['code-lab'] = function (root) {
    var key = 'sum', list = PROGS.sum.def.slice(), bug = false, i = -1, tr = null;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: رابطهٔ مسئله، الگوریتم، کد و خروجی را ببینی؛ و تفاوت سه نوع خطا را بفهمی. شبه‌کد خط‌به‌خط اجرا می‌شود و مقدار متغیرها کنار آن دیده می‌شود.' }));
    var ctl = el('div', { class: 'xp-ctl' });
    var sel = el('select', { class: 'xsel', 'aria-label': 'برنامه', onchange: function () { key = this.value; list = PROGS[key].def.slice(); inp.value = list.join(', '); reset(); } }, Object.keys(PROGS).map(function (k) { return el('option', { value: k, text: PROGS[k].n }); }));
    var inp = el('input', { class: 'xin', type: 'text', value: list.join(', '), 'aria-label': 'فهرست اعداد', style: 'width:180px', onchange: function () { var p = this.value.split(/[,،\s]+/).filter(Boolean).map(Number); if (p.length >= 1 && p.length <= 8 && p.every(function (x) { return isFinite(x) && x === Math.floor(x) && Math.abs(x) < 1000; })) { list = p; err.hidden = true; reset(); } else { err.textContent = 'یک تا هشت عدد صحیح (کمتر از ۱۰۰۰) با ویرگول وارد کن.'; err.hidden = false; } } });
    var cb = el('label', { class: 'xbtn o', style: 'display:inline-flex;gap:8px;align-items:center;clip-path:none' }, [el('input', { type: 'checkbox', onchange: function () { bug = this.checked; reset(); } }), 'خطای منطقی کنترل‌شده']);
    ctl.appendChild(sel); ctl.appendChild(inp); ctl.appendChild(cb); w.appendChild(ctl);
    var err = el('div', { class: 'xp-err', role: 'alert', hidden: '', style: 'margin:10px 0' }); w.appendChild(err);
    var code = el('pre', { class: 'pm-trace', style: 'margin-top:12px;line-height:2;white-space:pre;overflow:auto' }); w.appendChild(code);
    var vars = el('div', { class: 'mr-vals' }); w.appendChild(vars);
    var c2 = el('div', { class: 'xp-ctl', style: 'margin-top:12px' });
    c2.appendChild(el('button', { class: 'xbtn', type: 'button', text: 'گام بعد', onclick: function () { if (i < tr.steps.length - 1) { i++; draw(); } } })); c2.appendChild(el('button', { class: 'xbtn o', type: 'button', text: 'اجرای کامل', onclick: function () { i = tr.steps.length - 1; draw(); } })); c2.appendChild(el('button', { class: 'xbtn o', type: 'button', text: 'شروع مجدد', onclick: reset })); w.appendChild(c2);
    var msg = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(msg);
    w.appendChild(el('div', { class: 'xres', style: 'border-color:var(--paper)', html: '<b>سه نوع خطا</b><br><b>نحوی (syntax):</b> قواعد زبان رعایت نشده، مثلاً پرانتز بسته نشده؛ برنامه اصلاً اجرا نمی‌شود.<br><b>زمان اجرا (runtime):</b> برنامه شروع می‌شود ولی وسط کار می‌ایستد، مثلاً تقسیم بر صفر یا خواندن از فهرست خالی.<br><b>منطقی (logic):</b> برنامه بدون هیچ پیام خطایی تمام می‌شود ولی جواب اشتباه است — همان چیزی که با گزینهٔ بالا می‌بینی؛ پیدا کردنش سخت‌تر است چون کامپیوتر دقیقاً همان را اجرا کرده که نوشته‌ای.' }));
    function reset() { tr = PROGS[key].run(list, bug); i = -1; draw(); }
    function draw() {
      var P = PROGS[key], cur = i >= 0 ? tr.steps[i] : null;
      code.innerHTML = '';
      P.lines.forEach(function (l, k) { var t = bug && P.bugLines[k] ? P.bugLines[k] : l; code.appendChild(el('div', { dir: 'rtl', style: 'padding:0 8px;border-inline-start:4px solid ' + (cur && cur.l === k ? 'var(--green)' : 'transparent') + ';background:' + (cur && cur.l === k ? '#0E2A13' : 'transparent') + ';white-space:pre', text: fa(k + 1) + '  ' + t })); });
      vars.innerHTML = cur ? Object.keys(cur.v).map(function (k) { return '<span>' + k + '=<b>' + cur.v[k] + '</b></span>'; }).join('') : '<span>هنوز اجرا نشده</span>';
      if (!cur) msg.textContent = 'فهرست: ' + list.join('، ') + ' — «گام بعد» را بزن.';
      else if (i === tr.steps.length - 1) msg.textContent = cur.m + '. خروجی: ' + tr.out + ' — جواب درست: ' + tr.expected + (tr.out === tr.expected ? ' ✓' : ' ✗ خروجی غلط است ولی برنامه هیچ خطایی نداد: این یک خطای منطقی است. خط علامت‌دار را پیدا کن.');
      else msg.textContent = 'خط ' + fa(cur.l + 1) + ': ' + cur.m;
    }
    root.appendChild(w); reset();
  };
})();
