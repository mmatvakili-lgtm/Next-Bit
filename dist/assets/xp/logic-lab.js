(function () {
  var NB = window.NB, el = NB.el;
  var G = { AND: function (a, b) { return a & b; }, OR: function (a, b) { return a | b; }, XOR: function (a, b) { return a ^ b; }, NOT: function (a) { return a ? 0 : 1; } };
  var WHY = {
    AND: function (a, b, r) { return r ? 'هر دو ورودی ۱ هستند، پس خروجی ۱ است.' : 'دست‌کم یک ورودی ۰ است، پس خروجی ۰ است.'; },
    OR: function (a, b, r) { return r ? 'دست‌کم یکی از ورودی‌ها ۱ است، پس خروجی ۱ است.' : 'هر دو ورودی ۰ هستند، پس خروجی ۰ است.'; },
    XOR: function (a, b, r) { return r ? 'ورودی‌ها با هم فرق دارند، پس خروجی ۱ است.' : 'ورودی‌ها یکسان‌اند، پس خروجی ۰ است.'; },
    NOT: function (a, b, r) { return 'NOT ورودی را معکوس می‌کند: ' + a + ' → ' + r + '.'; }
  };
  NB.xp['logic-lab'] = function (root) {
    var g = 'AND', A = 0, Bv = 0;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: ببینی گیت منطقی چطور ورودی‌های دودویی را به یک خروجی تبدیل می‌کند، و جدول درستی را بخوانی.' }));
    var tabs = el('div', { class: 'cf-tabs', role: 'group', 'aria-label': 'نوع گیت' }); var tb = {};
    Object.keys(G).forEach(function (k) { tb[k] = el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(k === g), text: k, onclick: function () { g = k; draw(); } }); tabs.appendChild(tb[k]); }); w.appendChild(tabs);
    var fig = el('div', { class: 'lg-g' }); var sa = el('button', { class: 'lg-sw', type: 'button', onclick: function () { A ^= 1; draw(); } }); var sb = el('button', { class: 'lg-sw', type: 'button', onclick: function () { Bv ^= 1; draw(); } });
    var ins = el('div', { class: 'lg-in' }, [sa, sb]); var gate = el('div', { class: 'mono', style: 'font-size:22px;border:2px solid var(--green);padding:20px 26px;color:var(--green)' }); var out = el('div', { class: 'lg-out', 'aria-live': 'polite' });
    fig.appendChild(ins); fig.appendChild(el('span', { class: 'cf-wire on' })); fig.appendChild(gate); fig.appendChild(el('span', { class: 'cf-wire on' })); fig.appendChild(out); w.appendChild(fig);
    var why = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(why);
    var tbl = el('table', { class: 'lg-tb' }); w.appendChild(tbl);
    w.appendChild(el('div', { class: 'xres', text: 'در مدار واقعی، ۰ و ۱ معمولاً به بازه‌های مشخصی از ولتاژ اشاره دارند و الزاماً به معنی نبود یا وجود مطلق برق نیستند.' }));
    /* challenge */
    var ch = el('div', { class: 'xres', style: 'border-color:var(--paper)' });
    ch.appendChild(el('b', { text: 'چالش: گیتی را پیدا کن که فقط وقتی دو ورودی متفاوت‌اند خروجی ۱ بدهد.' }));
    var cm = el('div', { 'aria-live': 'polite', style: 'margin-top:8px' });
    var cb = el('div', { class: 'xp-ctl', style: 'margin-top:8px' });
    ['AND', 'OR', 'NOT', 'XOR'].forEach(function (k) { cb.appendChild(el('button', { class: 'xbtn o', type: 'button', text: 'امتحان ' + k, onclick: function () { try1(k); } })); });
    ch.appendChild(cb); ch.appendChild(cm); w.appendChild(ch);
    function try1(k) {
      if (k === 'NOT') { cm.textContent = 'NOT فقط یک ورودی دارد و دو ورودی را مقایسه نمی‌کند. گیت دیگری را امتحان کن.'; return; }
      var bad = []; [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(function (p) { if (G[k](p[0], p[1]) !== (p[0] !== p[1] ? 1 : 0)) bad.push(p.join('')); });
      cm.textContent = bad.length ? k + ' در ردیف‌های ' + bad.join('، ') + ' با خواستهٔ چالش نمی‌خواند.' : '✓ درست است! این گیت XOR (یای انحصاری) نام دارد: فقط وقتی ورودی‌ها متفاوت‌اند ۱ می‌دهد.';
    }
    function draw() {
      Object.keys(tb).forEach(function (k) { tb[k].setAttribute('aria-pressed', String(k === g)); });
      var two = g !== 'NOT'; sb.style.display = two ? '' : 'none';
      sa.textContent = (two ? 'A = ' : 'A = ') + A; sb.textContent = 'B = ' + Bv; sa.setAttribute('aria-pressed', String(!!A)); sb.setAttribute('aria-pressed', String(!!Bv));
      sa.setAttribute('aria-label', 'ورودی A، مقدار ' + A); sb.setAttribute('aria-label', 'ورودی B، مقدار ' + Bv);
      var r = G[g](A, Bv); gate.textContent = g; out.textContent = r; out.className = 'lg-out' + (r ? ' on' : '');
      why.textContent = WHY[g](A, Bv, r);
      var rows = two ? [[0, 0], [0, 1], [1, 0], [1, 1]] : [[0], [1]];
      tbl.innerHTML = '<tr>' + (two ? '<th>A</th><th>B</th>' : '<th>A</th>') + '<th>OUT</th></tr>' + rows.map(function (p) { var res = G[g](p[0], p[1]); var on = p[0] === A && (!two || p[1] === Bv); return '<tr' + (on ? ' class="on"' : '') + '>' + p.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '<td>' + res + '</td></tr>'; }).join('');
    }
    root.appendChild(w); draw();
  };
})();
