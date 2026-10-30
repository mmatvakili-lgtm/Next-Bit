(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  NB.xp['bit-lab'] = function (root) {
    var bits = [0, 0, 0, 0, 0, 0, 0, 0], prev = 0, signed = false, chal = 0, hint = 0;
    var CH = [{ t: 'الگوی ۱۰۱۱۰۱۱۰ را بساز.', v: 182, h: ['از چپ‌ترین کلید (ارزش ۱۲۸) شروع کن؛ روشن است؟', 'روشن‌ها در ۱۰۱۱۰۱۱۰ کلیدهای ۱۲۸، ۳۲، ۱۶، ۴ و ۲ هستند.', 'جمع ۱۲۸+۳۲+۱۶+۴+۲ برابر ۱۸۲ می‌شود.'] },
      { t: 'عدد ۱۷۳ را بساز.', v: 173, h: ['بزرگ‌ترین ارزشی که در ۱۷۳ جا می‌شود ۱۲۸ است؛ آن را روشن کن.', '۱۷۳ − ۱۲۸ = ۴۵. حالا بزرگ‌ترین ارزش در ۴۵ را پیدا کن (۳۲).', '۴۵ − ۳۲ = ۱۳ = ۸ + ۴ + ۱. حالا مرحلهٔ آخر را خودت ببین.'] }];
    var val = function () { return bits.reduce(function (a, b) { return a * 2 + b; }, 0); };
    var wrap = el('div');
    wrap.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    wrap.appendChild(el('p', { text: 'هدف: بفهمی ارزش مکانی هر بیت چیست و چرا با n بیت، ۲ به توان n حالت داریم.' }));
    var ctl = el('div', { class: 'xp-ctl', style: 'margin-bottom:14px' });
    var bReset = el('button', { class: 'xbtn o', type: 'button', text: 'همه صفر', onclick: function () { set([0, 0, 0, 0, 0, 0, 0, 0]); } });
    var bRand = el('button', { class: 'xbtn o', type: 'button', text: 'مقدار تصادفی', onclick: function () { var a = []; for (var i = 0; i < 8; i++) a.push(Math.random() < .5 ? 1 : 0); set(a); } });
    var sel = el('select', { class: 'xsel', 'aria-label': 'تفسیر عددی', onchange: function () { signed = this.value === 's'; draw(); } }, [el('option', { value: 'u', text: 'بدون علامت (۰ تا ۲۵۵)' }), el('option', { value: 's', text: 'علامت‌دار (مکمل دو: ‎−۱۲۸ تا ۱۲۷)' })]);
    ctl.appendChild(bReset); ctl.appendChild(bRand); ctl.appendChild(sel); wrap.appendChild(ctl);
    var sw = el('div', { class: 'bl-sw', role: 'group', 'aria-label': 'هشت بیت' }); var btns = [];
    for (var i = 0; i < 8; i++) (function (i) {
      var w = 128 >> i; var b = el('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': 'بیت با ارزش ' + w, onclick: function () { var a = bits.slice(); a[i] ^= 1; set(a); } }, [el('span', { class: 'bl-k', text: '0' }), el('span', { text: String(w) })]);
      btns.push(b); sw.appendChild(b);
    })(i);
    wrap.appendChild(sw);
    var out = el('div', { class: 'bl-out' }); var o = {};
    ['BINARY', 'DECIMAL', 'HEX', 'ASCII'].forEach(function (k) { o[k] = el('span'); out.appendChild(el('div', {}, [el('b', { text: k }), o[k]])); });
    wrap.appendChild(out);
    var sum = el('div', { class: 'bl-sum', 'aria-live': 'polite' }); wrap.appendChild(sum);
    wrap.appendChild(el('div', { class: 'xres', html: 'با <b>n</b> بیت، <b>۲ⁿ</b> حالت داریم: ۱ بیت = ۲، ۲ بیت = ۴، ۳ بیت = ۸ … <b>۸ بیت = ۲۵۶</b> حالت (یک بایت).' }));
    /* challenge */
    var cbox = el('div', { class: 'xres', style: 'border-color:var(--paper)' }); var cmsg = el('div', { 'aria-live': 'polite', style: 'margin-top:8px' });
    var csel = el('select', { class: 'xsel', 'aria-label': 'انتخاب چالش', onchange: function () { chal = +this.value; hint = 0; draw(); } }, CH.map(function (c, i) { return el('option', { value: i, text: 'چالش ' + fa(i + 1) }); }));
    var ctext = el('b'); var hbtn = el('button', { class: 'xbtn o', type: 'button', text: 'راهنمایی', onclick: function () { hint = Math.min(3, hint + 1); draw(); } });
    cbox.appendChild(el('div', { class: 'xp-ctl' }, [csel, ctext, hbtn])); cbox.appendChild(cmsg); wrap.appendChild(cbox);
    /* text -> bytes */
    wrap.appendChild(el('div', { class: 'lb', style: 'margin-top:22px', text: 'TEXT → BYTES' }));
    wrap.appendChild(el('p', { text: 'یک متن بنویس (فارسی یا انگلیسی) و ببین در UTF-8 هر نویسه چند بایت می‌شود. در ASCII فقط ۱۲۸ نویسهٔ پایه تعریف شده است.' }));
    var ti = el('input', { class: 'xin fa', type: 'text', value: 'Hi سلام', 'aria-label': 'متن', style: 'width:100%', oninput: txt }); wrap.appendChild(ti);
    var tb = el('div', { class: 'bytes' }); var ts = el('div', { class: 'xres', 'aria-live': 'polite' }); wrap.appendChild(tb); wrap.appendChild(ts);
    function txt() {
      var s = ti.value, chars = Array.from(s), enc = new TextEncoder(), total = 0; tb.innerHTML = '';
      chars.slice(0, 24).forEach(function (c) { var by = Array.from(enc.encode(c)); total += by.length; tb.appendChild(el('div', {}, [el('b', { text: c === ' ' ? '␣' : c }), by.map(function (x) { return x.toString(2).padStart(8, '0'); }).join(' ') + ' (' + by.length + 'B)'])); });
      var all = enc.encode(s).length;
      ts.innerHTML = 'نویسه‌ها: <b>' + fa(chars.length) + '</b> · بایت‌ها در UTF-8: <b>' + fa(all) + '</b>' + (all > chars.length ? ' — پس «هر حرف دقیقاً یک بایت» همیشه درست نیست: بستگی به کدگذاری و نویسه دارد.' : ' — اینجا همهٔ نویسه‌ها ASCII هستند و هر کدام یک بایت.') + (chars.length > 24 ? ' (۲۴ نویسهٔ اول نمایش داده شد.)' : '');
    }
    function set(a) { prev = val(); bits = a; draw(); }
    function draw() {
      var v = val(), sv = signed && v >= 128 ? v - 256 : v;
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(!!bits[i])); b.firstChild.textContent = bits[i]; });
      o.BINARY.textContent = bits.join(''); o.DECIMAL.textContent = String(sv); o.HEX.textContent = '0x' + v.toString(16).toUpperCase().padStart(2, '0');
      o.ASCII.textContent = v >= 33 && v <= 126 ? String.fromCharCode(v) : v === 32 ? '␣' : '—';
      var terms = bits.map(function (b, i) { return b ? (128 >> i) : null; }).filter(function (x) { return x !== null; });
      var d = v - prev;
      sum.textContent = (terms.length ? terms.join(' + ') + ' = ' + v : '0') + (signed && v >= 128 ? '  →  مکمل دو: ' + v + ' − 256 = ' + sv : '') + (d ? '   (تغییر نسبت به قبل: ' + (d > 0 ? '+' : '') + d + ')' : '');
      ctext.textContent = CH[chal].t;
      var c = CH[chal];
      cmsg.textContent = (v === c.v ? '✓ درست است! الگوی ' + bits.join('') + ' همان ' + c.v + ' است.' : 'الان ' + v + ' است؛ هدف ' + c.v + ' (' + bits.filter(function (b, i) { return b !== ((c.v >> (7 - i)) & 1); }).length + ' بیت اختلاف).') + (hint ? '  💡 ' + c.h.slice(0, hint).join(' ') : '');
      if (chal === 1 && v === 173) cmsg.textContent += ' توجه: ۱۰۱۰۱۱۰۱ بدون علامت ۱۷۳ است؛ در حالت علامت‌دار همین الگو ‎−۸۳ می‌شود. «معنی بیت‌ها به قرارداد تفسیر بستگی دارد.»';
      prev = v;
    }
    root.appendChild(wrap); draw(); txt();
  };
})();
