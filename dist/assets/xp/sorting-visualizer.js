(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  function* bubble(a) { a = a.slice(); var n = a.length; for (var i = 0; i < n - 1; i++) { var sw = false; for (var j = 0; j < n - 1 - i; j++) { yield { t: 'cmp', i: j, j: j + 1, a: a, done: n - i, msg: 'مقایسهٔ ' + a[j] + ' و ' + a[j + 1] }; if (a[j] > a[j + 1]) { var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; sw = true; yield { t: 'swp', i: j, j: j + 1, a: a, done: n - i, msg: a[j + 1] + ' بزرگ‌تر بود؛ جابه‌جا شد' }; } } if (!sw) break; } yield { t: 'end', a: a, done: 0 }; }
  function* insertion(a) { a = a.slice(); var n = a.length; for (var i = 1; i < n; i++) { var k = a[i], j = i - 1; yield { t: 'pick', i: i, a: a, msg: 'برداشتن ' + k + ' برای جاگذاری در بخش مرتب' }; while (j >= 0) { yield { t: 'cmp', i: j, j: j + 1, a: a, msg: 'مقایسهٔ ' + a[j] + ' با ' + k }; if (a[j] > k) { a[j + 1] = a[j]; yield { t: 'swp', i: j, j: j + 1, a: a, msg: a[j] + ' یک خانه به راست رفت' }; j--; } else break; } a[j + 1] = k; } yield { t: 'end', a: a }; }
  function* selection(a) { a = a.slice(); var n = a.length; for (var i = 0; i < n - 1; i++) { var m = i; for (var j = i + 1; j < n; j++) { yield { t: 'cmp', i: m, j: j, a: a, msg: 'مقایسهٔ کمینهٔ فعلی ' + a[m] + ' با ' + a[j] }; if (a[j] < a[m]) m = j; } if (m !== i) { var t = a[i]; a[i] = a[m]; a[m] = t; yield { t: 'swp', i: i, j: m, a: a, msg: 'کمینه به جای خانهٔ ' + fa(i + 1) + ' رفت' }; } } yield { t: 'end', a: a }; }
  var ALG = { bubble: { n: 'Bubble Sort', f: bubble, d: 'عناصر مجاور را مقایسه می‌کند و اگر ترتیبشان اشتباه است جابه‌جا می‌کند؛ این کار آن‌قدر تکرار می‌شود تا آرایه مرتب شود.' }, insertion: { n: 'Insertion Sort', f: insertion, d: 'هر عنصر را برمی‌دارد و در جای درست بخش مرتب‌شدهٔ سمت چپ می‌گذارد (مثل مرتب‌کردن ورق‌ها در دست).' }, selection: { n: 'Selection Sort', f: selection, d: 'در هر دور کوچک‌ترین عنصر باقی‌مانده را پیدا می‌کند و در جای بعدی می‌گذارد.' } };
  function count(alg, arr) { var c = 0, s = 0; var g = ALG[alg].f(arr); for (var r = g.next(); !r.done; r = g.next()) { if (r.value.t === 'cmp') c++; if (r.value.t === 'swp') s++; } return { c: c, s: s }; }
  NB.xp['sorting-visualizer'] = function (root) {
    var alg = 'bubble', arr = [7, 2, 9, 1, 5], gen = null, cur = null, cmp = 0, swp = 0, timer = null, speed = 5, running = false;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: ببینی الگوریتم‌های مختلف یک مسئلهٔ یکسان را با چه تعداد مقایسه و جابه‌جایی حل می‌کنند.' }));
    var ctl = el('div', { class: 'xp-ctl' });
    var inp = el('input', { class: 'xin', type: 'text', value: '7, 2, 9, 1, 5', 'aria-label': 'اعداد با ویرگول جدا شوند', style: 'flex:1 1 220px' });
    var err = el('div', { class: 'xp-err', role: 'alert', hidden: '', style: 'margin:10px 0' });
    var apply = el('button', { class: 'xbtn', type: 'button', text: 'اعمال آرایه', onclick: parse });
    var rnd = el('button', { class: 'xbtn o', type: 'button', text: 'تصادفی', onclick: function () { var a = []; for (var i = 0; i < 8; i++) a.push(1 + Math.floor(Math.random() * 30)); inp.value = a.join(', '); parse(); } });
    ctl.appendChild(inp); ctl.appendChild(apply); ctl.appendChild(rnd); w.appendChild(ctl); w.appendChild(err);
    var c2 = el('div', { class: 'xp-ctl', style: 'margin-top:12px' });
    var sel = el('select', { class: 'xsel', 'aria-label': 'الگوریتم', onchange: function () { alg = this.value; reset(); } }, Object.keys(ALG).map(function (k) { return el('option', { value: k, text: ALG[k].n }); }));
    var bStart = el('button', { class: 'xbtn', type: 'button', onclick: toggle }); var bStep = el('button', { class: 'xbtn o', type: 'button', text: 'یک گام', onclick: function () { pause(); step(); } }); var bReset = el('button', { class: 'xbtn o', type: 'button', text: 'شروع مجدد', onclick: reset });
    var sp = el('input', { class: 'xrange', type: 'range', min: 1, max: 10, value: 5, 'aria-label': 'سرعت', oninput: function () { speed = +this.value; if (running) { clearInterval(timer); timer = setInterval(step, 1100 - speed * 100); } } });
    c2.appendChild(sel); c2.appendChild(bStart); c2.appendChild(bStep); c2.appendChild(bReset); c2.appendChild(el('label', { class: 'mono', style: 'color:var(--mute-d);font-size:12px' }, ['SPEED ', sp])); w.appendChild(c2);
    var bars = el('div', { class: 'so-bars', role: 'img' }); w.appendChild(bars);
    var st = el('div', { class: 'xstat' }); var sc = el('b'), ss = el('b'), sn = el('b'); st.appendChild(el('div', {}, [sc, 'COMPARISONS'])); st.appendChild(el('div', {}, [ss, 'SWAPS / SHIFTS'])); st.appendChild(el('div', {}, [sn, 'ITEMS'])); w.appendChild(st);
    var msg = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(msg);
    var cmpBox = el('div', { class: 'xres', style: 'border-color:var(--paper)' }); w.appendChild(cmpBox);
    w.appendChild(el('div', { class: 'xres', text: 'نکته: تعداد مقایسه‌ها به ورودی و پیاده‌سازی بستگی دارد. نتیجهٔ یک آزمایش کوچک اثبات نمی‌کند که الگوریتمی در همهٔ اندازه‌ها بهتر است؛ برای فهرست‌های بزرگ الگوریتم‌هایی مثل Merge Sort و Quick Sort معمولاً کارآمدترند.' }));
    function parse() {
      var parts = inp.value.split(/[,،\s]+/).filter(Boolean), nums = parts.map(Number);
      if (!parts.length || nums.some(function (n) { return !isFinite(n) || n < 0 || n > 99 || n !== Math.floor(n); })) { err.textContent = 'فقط عدد صحیح ۰ تا ۹۹ با ویرگول جدا کن.'; err.hidden = false; return; }
      if (nums.length < 2 || nums.length > 20) { err.textContent = 'تعداد عددها باید بین ۲ تا ۲۰ باشد.'; err.hidden = false; return; }
      err.hidden = true; arr = nums; reset();
    }
    function pause() { running = false; clearInterval(timer); bStart.textContent = cur && cur.t === 'end' ? 'تمام شد' : (gen && cmp + swp > 0 ? 'ادامه' : 'شروع'); bStart.disabled = cur && cur.t === 'end'; }
    function toggle() { if (running) { pause(); return; } running = true; bStart.textContent = 'توقف'; timer = setInterval(step, 1100 - speed * 100); }
    function step() { var r = gen.next(); if (r.done) { pause(); return; } cur = r.value; if (cur.t === 'cmp') cmp++; if (cur.t === 'swp') swp++; if (cur.t === 'end') pause(); draw(); }
    function reset() { clearInterval(timer); running = false; gen = ALG[alg].f(arr); cur = { t: 'init', a: arr.slice() }; cmp = 0; swp = 0; bStart.disabled = false; bStart.textContent = 'شروع'; draw(); }
    function draw() {
      var a = cur.a, max = Math.max.apply(null, a) || 1; bars.innerHTML = '';
      a.forEach(function (v, i) { var c = ''; if (cur.t === 'end') c = ' srt'; else if (cur.t === 'swp' && (i === cur.i || i === cur.j)) c = ' swp'; else if ((cur.t === 'cmp' && (i === cur.i || i === cur.j)) || (cur.t === 'pick' && i === cur.i)) c = ' cmp'; bars.appendChild(el('div', { class: 'so-bar' + c, style: 'height:' + Math.max(4, v / max * 100) + '%' }, [el('span', { text: v })])); });
      bars.setAttribute('aria-label', 'آرایه: ' + a.join('، '));
      sc.textContent = cmp; ss.textContent = swp; sn.textContent = a.length;
      msg.textContent = (ALG[alg].n + ': ' + ALG[alg].d) + (cur.msg ? ' — ' + cur.msg + '.' : cur.t === 'end' ? ' — آرایه مرتب شد.' : '');
      var r = ['bubble', 'insertion', 'selection'].map(function (k) { var x = count(k, arr); return ALG[k].n + ': ' + x.c + ' مقایسه، ' + x.s + ' جابه‌جایی'; });
      cmpBox.innerHTML = '<b>مقایسهٔ سه الگوریتم روی همین ورودی (اجرای کامل):</b><br>' + r.join('<br>') + '<br><span style="color:var(--mute-d)">آیا تعداد عملیات یکسان است؟ چرا؟ ورودی را عوض کن (مثلاً از قبل مرتب یا وارونه) و دوباره ببین.</span>';
    }
    root.appendChild(w); reset();
    var obs = new MutationObserver(function () { if (!document.body.contains(w)) { clearInterval(timer); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
  };
})();
