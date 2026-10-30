(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  var NS = 'http://www.w3.org/2000/svg';
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
  // hidden "ground truth": a fruit is an orange (class 1) when the weighted sum of size and colour is high
  var truth = function (x, y) { return 0.6 * x + 0.8 * y > 0.7 ? 1 : 0; };
  var test = (function () { var r = rng(99), t = []; for (var i = 0; i < 300; i++) { var x = r(), y = r(); t.push({ x: x, y: y, c: truth(x, y) }); } return t; })();
  var NAMES = ['سیب', 'پرتقال'], COL = ['#00C923', '#F5F7F3'];
  function gen(kind) {
    var r = rng(kind.length * 7 + 3), pts = []; function add(n, cls, filter) { var g = 0; while (n > 0 && g++ < 5000) { var x = r(), y = r(); if (truth(x, y) !== cls) continue; if (filter && !filter(x, y)) continue; pts.push({ x: x, y: y, c: cls }); n--; } }
    if (kind === 'balanced') { add(10, 0); add(10, 1); }
    else if (kind === 'imbalanced') { add(18, 0); add(2, 1); }
    else if (kind === 'partial') { var f = function (x) { return x < 0.4; }; add(10, 0, f); add(10, 1, f); }
    else if (kind === 'noisy') { add(10, 0); add(10, 1); pts.forEach(function (p, i) { if (i % 4 === 1) p.c = 1 - p.c; }); }
    return pts;
  }
  function predict(pts, k, x, y) { if (!pts.length) return -1; var d = pts.map(function (p) { return { d: (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y), c: p.c }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, Math.min(k, pts.length)); var s = d.reduce(function (a, b) { return a + b.c; }, 0); return s * 2 === d.length ? d[0].c : (s * 2 > d.length ? 1 : 0); }
  NB.xp['ml-playground'] = function (root) {
    var pts = gen('balanced'), k = 3, cls = 0;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: ببینی یک مدل ساده فقط از روی داده‌های آموزشی «قاعده» را یاد می‌گیرد، و اگر داده‌ها ناقص، نامتوازن یا اشتباه باشند نتیجه بد می‌شود. محور افقی: اندازه، محور عمودی: نارنجی‌بودنِ رنگ. مدل: k نزدیک‌ترین همسایه. این آزمایش مدل واقعی هوش مصنوعی را بازسازی نمی‌کند؛ فقط به فهم مفهوم «یادگیری از داده» کمک می‌کند.' }));
    var ctl = el('div', { class: 'xp-ctl' });
    var ds = el('select', { class: 'xsel', 'aria-label': 'مجموعه داده', onchange: function () { pts = gen(this.value); draw(); } }, [['balanced', 'داده‌های متوازن'], ['imbalanced', 'نامتوازن (۱۸ سیب، ۲ پرتقال)'], ['partial', 'ناقص (فقط نمونه‌های کوچک)'], ['noisy', 'برچسب‌های اشتباه (حدود ۲۵٪)']].map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
    var kb = el('select', { class: 'xsel', 'aria-label': 'مقدار k', onchange: function () { k = +this.value; draw(); } }, [1, 3, 5].map(function (v) { return el('option', { value: v, text: 'k = ' + v, selected: v === 3 ? '' : null }); }));
    var cb = el('select', { class: 'xsel', 'aria-label': 'کلاس نمونهٔ جدید', onchange: function () { cls = +this.value; } }, NAMES.map(function (n, i) { return el('option', { value: i, text: 'افزودن: ' + n }); }));
    ctl.appendChild(ds); ctl.appendChild(kb); ctl.appendChild(cb); ctl.appendChild(el('button', { class: 'xbtn o', type: 'button', text: 'پاک‌کردن همه', onclick: function () { pts = []; draw(); } })); w.appendChild(ctl);
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'نمودار نمونه‌ها و ناحیه‌های تصمیم'); svg.style.cssText = 'width:100%;max-width:520px;background:#141815;border:2px solid var(--paper);cursor:crosshair;touch-action:manipulation;display:block;margin:14px auto';
    svg.addEventListener('click', function (e) { var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height; var hit = -1, bd = 0.03 * 0.03; pts.forEach(function (p, i) { var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if (d < bd) { bd = d; hit = i; } }); if (hit > -1) pts.splice(hit, 1); else pts.push({ x: x, y: y, c: cls }); draw(); });
    w.appendChild(svg);
    w.appendChild(el('p', { class: 'mono', style: 'text-align:center;color:var(--mute-d);font-size:12px', text: '▸ کلیک روی فضای خالی = افزودن نمونه · کلیک روی یک نقطه = حذف آن' }));
    var res = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(res);
    function draw() {
      svg.innerHTML = ''; var G = 20;
      for (var i = 0; i < G; i++) for (var j = 0; j < G; j++) { var c = predict(pts, k, (i + .5) / G, (j + .5) / G); var r = document.createElementNS(NS, 'rect'); r.setAttribute('x', i * 100 / G); r.setAttribute('y', 100 - (j + 1) * 100 / G); r.setAttribute('width', 100 / G + .2); r.setAttribute('height', 100 / G + .2); r.setAttribute('fill', c < 0 ? '#1E2420' : c === 0 ? '#00C923' : '#F5F7F3'); r.setAttribute('opacity', '.22'); svg.appendChild(r); }
      pts.forEach(function (p) { var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p.x * 100); c.setAttribute('cy', 100 - p.y * 100); c.setAttribute('r', 2); c.setAttribute('fill', COL[p.c]); c.setAttribute('stroke', '#0A0B0A'); c.setAttribute('stroke-width', .6); if (p.c === 1) { c.setAttribute('r', 2.2); } svg.appendChild(c); });
      var ok = [0, 0], tot = [0, 0]; test.forEach(function (t) { tot[t.c]++; if (predict(pts, k, t.x, t.y) === t.c) ok[t.c]++; });
      var acc = pts.length ? Math.round((ok[0] + ok[1]) / test.length * 100) : 0, r0 = Math.round(ok[0] / tot[0] * 100), r1 = Math.round(ok[1] / tot[1] * 100);
      var n0 = pts.filter(function (p) { return p.c === 0; }).length, n1 = pts.length - n0;
      res.innerHTML = pts.length ? 'نمونه‌های آموزشی: <b>' + fa(n0) + '</b> سیب و <b>' + fa(n1) + '</b> پرتقال.<br>دقت روی ۳۰۰ نمونهٔ آزمون (که مدل ندیده است): <b>' + fa(acc) + '٪</b> — تشخیص درست سیب‌ها: ' + fa(r0) + '٪، پرتقال‌ها: ' + fa(r1) + '٪.<br><span style="color:var(--mute-d)">' + (n0 + n1 > 0 && (Math.min(n0, n1) / (n0 + n1)) < .2 ? '⚠ داده نامتوازن است؛ دقت کلی ممکن است قابل‌قبول به نظر برسد ولی کلاس کم‌نمونه بد تشخیص داده می‌شود.' : 'تغییر داده‌های آموزشی را امتحان کن و ببین ناحیه‌ها و دقت چطور تغییر می‌کنند.') + '</span>' : 'هیچ دادهٔ آموزشی وجود ندارد؛ مدل نمی‌تواند چیزی یاد بگیرد. چند نمونه اضافه کن.';
    }
    root.appendChild(w); draw();
  };
})();
