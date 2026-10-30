(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  var DEF = [
    { q: 'ابزاری که به محاسبه کمک می‌کند', types: ['tool'] }, { q: 'ماشین مکانیکی که عملیات ریاضی انجام می‌دهد', types: ['mechanical'] },
    { q: 'طرح یا ایدهٔ ماشینی قابل‌برنامه‌ریزی', types: ['programmable', 'idea'] }, { q: 'دستگاه دیجیتال الکترونیکی', types: ['electronic'] }
  ];
  var TYPE = { tool: 'ابزار محاسبه', mechanical: 'ماشین مکانیکی', idea: 'ایده / نظریه / استاندارد', programmable: 'قابل‌برنامه‌ریزی', electronic: 'الکترونیکی دیجیتال', hardware: 'قطعه و سخت‌افزار', software: 'برنامه‌نویسی / نرم‌افزار' };
  NB.xp['timeline-explorer'] = function (root, ctx) {
    var T = ctx.data.timeline, ev = T.events, dom = 'all', q = '', sel = ev[0].id, arts = {}; ctx.data.articles.forEach(function (a) { arts[a.id] = a; });
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: تاریخ را به‌صورت زنجیره‌ای از مسئله‌ها و پیشرفت‌ها ببینی، نه فهرستی از تاریخ‌ها. برای هر رویداد، «نوع» آن نشان می‌دهد با کدام تعریف از «کامپیوتر» سروکار داریم.' }));
    var bar = el('div', { class: 'tl-bar', role: 'group', 'aria-label': 'فیلتر حوزه' }); var fb = {};
    [{ id: 'all', label: 'همه' }].concat(T.domains).forEach(function (d) { var b = el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(d.id === 'all'), text: d.label, onclick: function () { dom = d.id; draw(); } }); fb[d.id] = b; bar.appendChild(b); }); w.appendChild(bar);
    var si = el('input', { class: 'xin fa', type: 'search', placeholder: 'جست‌وجو در رویدادها…', 'aria-label': 'جست‌وجو در رویدادها', style: 'margin-top:10px;width:100%', oninput: function () { q = this.value.trim().toLowerCase(); draw(); } }); w.appendChild(si);
    w.appendChild(el('p', { class: 'mono', style: 'color:var(--mute-d);font-size:12px;margin-top:8px', id: 'tl-count', 'aria-live': 'polite' }));
    var rail = el('div', { class: 'tl-rail', role: 'listbox', 'aria-label': 'رویدادها', 'aria-orientation': 'horizontal' }); w.appendChild(rail);
    var det = el('div', { class: 'tl-det', 'aria-live': 'polite' }); w.appendChild(det);
    var defs = el('div', { class: 'xres', style: 'border-color:var(--paper)' }); defs.appendChild(el('b', { text: '«اولین کامپیوتر» یعنی چه؟ معیار را انتخاب کن:' })); var db = el('div', { class: 'xp-ctl', style: 'margin-top:8px' });
    DEF.forEach(function (d) { db.appendChild(el('button', { class: 'xbtn o', type: 'button', text: d.q, onclick: function () { dom = 'all'; q = ''; si.value = ''; var f = ev.filter(function (e) { return d.types.indexOf(e.category) > -1; }); defs.querySelector('.dres').textContent = 'با این معیار، رویدادهای مرتبط در این خط زمانی: ' + f.map(function (e) { return e.title; }).join(' ← ') + '. به همین دلیل پاسخ یک‌خطی وجود ندارد.'; sel = f[0].id; draw(); } })); });
    defs.appendChild(db); defs.appendChild(el('div', { class: 'dres', style: 'margin-top:8px', 'aria-live': 'polite' })); w.appendChild(defs);
    function vis() { return ev.filter(function (e) { return (dom === 'all' || e.domain === dom) && (!q || (e.title + ' ' + e.description + ' ' + e.date).toLowerCase().indexOf(q) > -1); }); }
    function srcText(e) {
      var s = e.source || {}; if (s.ref && ctx.data.sources && ctx.data.sources[s.ref]) { var r = ctx.data.sources[s.ref]; return NB.esc(r.author + '، ' + r.title) + (r.year ? ' (' + r.year + ')' : '') + (s.note ? ' — ' + NB.esc(s.note) : '') + ' <i>(منبع پیشنهادی؛ تطبیق دقیق با ادعا توسط تحریریه لازم است)</i>'; }
      if (s.note && !s.ref && /فصل/.test(s.note)) return NB.esc(s.note);
      return '<span class="tag w">منبع نیازمند تأیید</span> ' + NB.esc(s.note || '');
    }
    function draw() {
      Object.keys(fb).forEach(function (k) { fb[k].setAttribute('aria-pressed', String(k === dom)); });
      var v = vis(); if (!v.length) { rail.innerHTML = ''; det.innerHTML = 'رویدادی با این فیلتر پیدا نشد.'; document.getElementById('tl-count') && (document.getElementById('tl-count').textContent = '۰ رویداد'); return; }
      if (!v.some(function (e) { return e.id === sel; })) sel = v[0].id;
      rail.innerHTML = '';
      v.forEach(function (e) { var b = el('button', { class: 'tl-ev', type: 'button', role: 'option', 'aria-selected': String(e.id === sel), tabindex: e.id === sel ? '0' : '-1', onclick: function () { sel = e.id; draw(); }, onkeydown: function (k) { var i = v.indexOf(e), n = k.key === 'ArrowLeft' || k.key === 'ArrowDown' ? i + 1 : k.key === 'ArrowRight' || k.key === 'ArrowUp' ? i - 1 : null; if (n !== null && v[n]) { k.preventDefault(); sel = v[n].id; draw(); var t = rail.querySelector('[aria-selected="true"]'); if (t) t.focus(); } } }, [el('b', { text: e.date.replace(/\d/g, function (d) { return d; }) }), el('span', { text: e.title })]); rail.appendChild(b); });
      var cnt = det.parentNode.querySelector('#tl-count') || document.getElementById('tl-count'); if (cnt) cnt.textContent = v.length + ' / ' + ev.length + ' EVENTS';
      var e = ev.filter(function (x) { return x.id === sel; })[0], i = v.indexOf(e);
      var rel = []; if (v[i - 1]) rel.push(['قبلی', v[i - 1]]); if (v[i + 1]) rel.push(['بعدی', v[i + 1]]);
      ev.forEach(function (o) { if (o.id !== e.id && o.chapters.some(function (c) { return e.chapters.indexOf(c) > -1; }) && !rel.some(function (r) { return r[1].id === o.id; }) && rel.length < 5) rel.push(['هم‌فصل', o]); });
      det.innerHTML = '<div class="dt">' + NB.esc(e.date) + (e.dateNote ? ' · ' + NB.esc(e.dateNote) : '') + '</div><h4>' + NB.esc(e.title) + '</h4><div class="tags"><span class="tag">' + NB.esc(TYPE[e.category] || e.category) + '</span><span class="tag s">' + NB.esc((T.domains.filter(function (d) { return d.id === e.domain; })[0] || {}).label || '') + '</span></div>' +
        '<dl><dt>DESCRIPTION</dt><dd>' + NB.esc(e.description) + '</dd><dt>WHY IT MATTERS</dt><dd>' + NB.esc(e.significance) + '</dd>' + (e.limit ? '<dt>LIMITS</dt><dd>' + NB.esc(e.limit) + '</dd>' : '') + '<dt>SOURCE</dt><dd>' + srcText(e) + '</dd>' +
        '<dt>CHAPTERS</dt><dd>' + e.chapters.map(function (c) { return arts[c] ? '<a href="' + ctx.root + ctx.data.issue + '/' + arts[c].slug + '/index.html">' + NB.esc(arts[c].label) + '</a>' : ''; }).join(' · ') + '</dd><dt>RELATED</dt><dd class="rl"></dd></dl>';
      var rl = det.querySelector('.rl'); rel.forEach(function (r) { rl.appendChild(el('button', { class: 'xbtn o', type: 'button', style: 'min-height:40px;padding:2px 12px;margin:2px', text: r[0] + ': ' + r[1].title, onclick: function () { dom = 'all'; q = ''; si.value = ''; sel = r[1].id; draw(); } })); });
      var cur = rail.querySelector('[aria-selected="true"]'); if (cur && (rail.scrollWidth > rail.clientWidth || rail.scrollHeight > rail.clientHeight) && !NB.reduced()) { try { rail.scrollWidth > rail.clientWidth ? cur.scrollIntoView({ block: 'nearest', inline: 'center' }) : (rail.scrollTop = cur.offsetTop - rail.clientHeight / 2 + cur.offsetHeight / 2); } catch (x) {} }
    }
    root.appendChild(w); draw();
  };
})();
