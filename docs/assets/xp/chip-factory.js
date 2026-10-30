(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  NB.xp['chip-factory'] = function (root) {
    var lvl = 0;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: دیدن این‌که چطور از یک کلید کوچک (ترانزیستور) به گیت، جمع‌کننده و بخشی از یک پردازنده می‌رسیم. این یک مدل آموزشی ساده است، نه شبیه‌سازی فرایند واقعی ساخت تراشه و نه مدار CMOS واقعی.' }));
    var tabs = el('div', { class: 'cf-tabs', role: 'group', 'aria-label': 'مرحله' }); var tb = [];
    ['۱. ترانزیستور = کلید', '۲. ترکیب کلیدها = گیت', '۳. گیت‌ها = جمع‌کننده'].forEach(function (t, i) { var b = el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(i === 0), text: t, onclick: function () { lvl = i; draw(); } }); tb.push(b); tabs.appendChild(b); }); w.appendChild(tabs);
    var box = el('div', { 'aria-live': 'polite' }); w.appendChild(box);
    var A = 0, B = 0, C = 0, mode = 'series', n1 = 5, n2 = 9;
    var tog = function (label, get, set) { var b = el('button', { class: 'lg-sw', type: 'button', 'aria-pressed': String(!!get()), text: label + ' = ' + get(), onclick: function () { set(); draw(); } }); return b; };
    function t(on, text) { return el('div', { class: 'cf-t' + (on ? ' on' : ''), text: text }); }
    function wire(on) { return el('span', { class: 'cf-wire' + (on ? ' on' : '') }); }
    function draw() {
      tb.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === lvl)); }); box.innerHTML = '';
      if (lvl === 0) {
        box.appendChild(el('div', { class: 'cf-fig' }, [tog('GATE (ورودی کنترل)', function () { return A; }, function () { A ^= 1; }), wire(A), t(A, A ? 'کلید بسته\nجریان می‌رسد' : 'کلید باز\nجریان نمی‌رسد'), wire(A), t(A, 'خروجی ' + A)]));
        box.appendChild(el('div', { class: 'xres', text: 'ترانزیستور در بسیاری از کاربردها مثل یک کلید الکترونیکی کنترل‌شونده عمل می‌کند: یک سیگنال کنترل تعیین می‌کند مسیر جریان باز باشد یا بسته. در کاربردهای دیگر برای تقویت سیگنال هم استفاده می‌شود.' }));
      } else if (lvl === 1) {
        var out = mode === 'series' ? A & B : A | B;
        box.appendChild(el('div', { class: 'xp-ctl' }, [el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(mode === 'series'), text: 'دو کلید پشت‌سرهم (سری)', onclick: function () { mode = 'series'; draw(); } }), el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(mode === 'parallel'), text: 'دو کلید کنار هم (موازی)', onclick: function () { mode = 'parallel'; draw(); } })]));
        box.appendChild(el('div', { class: 'cf-fig' }, [el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, [tog('A', function () { return A; }, function () { A ^= 1; }), tog('B', function () { return B; }, function () { B ^= 1; })]), wire(out), t(out, out ? 'لامپ روشن' : 'لامپ خاموش')]));
        box.appendChild(el('div', { class: 'xres', text: mode === 'series' ? 'در حالت سری، جریان فقط وقتی می‌رسد که هر دو کلید بسته باشند → رفتار AND. ' + (out ? 'الان هر دو بسته‌اند.' : 'حداقل یکی باز است.') : 'در حالت موازی، اگر دست‌کم یک مسیر بسته باشد جریان می‌رسد → رفتار OR. ' + (out ? 'دست‌کم یک مسیر بسته است.' : 'هر دو مسیر باز است.') }));
        box.appendChild(el('div', { class: 'xres', text: 'این مدل کلیدی فقط ایدهٔ ترکیب را نشان می‌دهد؛ گیت‌های واقعی در تراشه‌ها با آرایش‌های دقیق‌تری از ترانزیستورها ساخته می‌شوند.' }));
      } else {
        var s = A ^ B ^ C, co = (A & B) | (C & (A ^ B));
        box.appendChild(el('p', { text: 'جمع‌کنندهٔ کامل یک‌بیتی: با دو گیت XOR، دو AND و یک OR ساخته می‌شود و A + B + نقلی ورودی را جمع می‌زند.' }));
        box.appendChild(el('div', { class: 'cf-fig' }, [el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, [tog('A', function () { return A; }, function () { A ^= 1; }), tog('B', function () { return B; }, function () { B ^= 1; }), tog('Cin', function () { return C; }, function () { C ^= 1; })]), wire(1), t(1, 'XOR · AND · OR'), wire(1), el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, [t(s, 'SUM = ' + s), t(co, 'Cout = ' + co)])]));
        box.appendChild(el('div', { class: 'xres', text: A + ' + ' + B + ' + ' + C + ' = ' + (A + B + C) + ' → در دودویی ' + co + s + ' (Cout=' + co + '، SUM=' + s + ')' }));
        box.appendChild(el('p', { style: 'margin-top:16px', text: 'چهار جمع‌کنندهٔ کامل پشت‌سرهم یک جمع‌کنندهٔ ۴ بیتی می‌سازند؛ نقلیِ هر طبقه به طبقهٔ بعد می‌رود. این یکی از اجزای ساده‌ی واحد محاسبات یک پردازنده است:' }));
        var i1 = el('input', { class: 'xin', type: 'number', min: 0, max: 15, value: n1, 'aria-label': 'عدد اول (۰ تا ۱۵)', style: 'width:100px', oninput: function () { n1 = clamp(this.value); show(); } });
        var i2 = el('input', { class: 'xin', type: 'number', min: 0, max: 15, value: n2, 'aria-label': 'عدد دوم (۰ تا ۱۵)', style: 'width:100px', oninput: function () { n2 = clamp(this.value); show(); } });
        var res = el('div', { class: 'xres', style: 'direction:ltr;text-align:start;font-family:var(--mono)' });
        box.appendChild(el('div', { class: 'xp-ctl' }, [i1, '+', i2])); box.appendChild(res);
        var clamp = function (v) { v = parseInt(v, 10); return isFinite(v) ? Math.max(0, Math.min(15, v)) : 0; };
        var show = function () { var c = 0, bits = [], carries = []; for (var k = 0; k < 4; k++) { var a = (n1 >> k) & 1, b = (n2 >> k) & 1, sm = a ^ b ^ c, cn = (a & b) | (c & (a ^ b)); bits.unshift(sm); carries.unshift(cn); c = cn; } res.innerHTML = n1.toString(2).padStart(4, '0') + ' + ' + n2.toString(2).padStart(4, '0') + '<br>= ' + c + ' ' + bits.join('') + ' (' + (c * 16 + parseInt(bits.join(''), 2)) + ')<br>carry per stage (MSB→LSB): ' + carries.join(' ') + (c ? '<br>⚠ نقلی از بیت چهارم بیرون زد: ۴ بیت برای این مجموع کافی نیست (overflow).' : ''); };
        show();
      }
    }
    root.appendChild(w); draw();
  };
})();
