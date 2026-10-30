/* Next Bit — shared behaviour (vanilla JS, no dependencies) */
(function () {
  'use strict';
  var NB = (window.NB = window.NB || { xp: {} });
  var root = document.documentElement.getAttribute('data-root') || './';
  NB.root = root;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  NB.$ = $; NB.$$ = $$;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  NB.store = store;
  var faDigits = '۰۱۲۳۴۵۶۷۸۹';
  NB.fa = function (n) { return String(n).replace(/\d/g, function (d) { return faDigits[d]; }); };
  NB.el = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  };
  NB.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---- reduced motion ---- */
  var rmBtn = $('#motion-btn');
  var rm = store('nb-reduce') === '1';
  function applyRm() { document.documentElement.setAttribute('data-reduce-motion', rm ? 'true' : 'false'); if (rmBtn) rmBtn.setAttribute('aria-pressed', rm ? 'true' : 'false'); }
  NB.reduced = function () { return rm || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); };
  applyRm();
  if (rmBtn) rmBtn.addEventListener('click', function () { rm = !rm; store('nb-reduce', rm ? '1' : '0'); applyRm(); });

  /* ---- menu ---- */
  var mb = $('#menu-btn'), nl = $('#nav-list');
  if (mb && nl) mb.addEventListener('click', function () { var o = nl.getAttribute('data-open') === 'true'; nl.setAttribute('data-open', String(!o)); mb.setAttribute('aria-expanded', String(!o)); });

  /* ---- font size ---- */
  var fs = parseInt(store('nb-fs') || '0', 10) || 0;
  function applyFs() { document.documentElement.setAttribute('data-fs', String(fs)); }
  applyFs();
  $$('button[data-fs]').forEach(function (b) { b.addEventListener('click', function () { fs = Math.max(-1, Math.min(2, fs + parseInt(b.getAttribute('data-fs'), 10))); store('nb-fs', String(fs)); applyFs(); document.dispatchEvent(new CustomEvent('nb:fs')); }); });


  /* ---- glossary popover ---- */
  var pop = null, popFor = null, el = NB.el;
  function closePop() { if (pop) { pop.remove(); pop = null; } if (popFor) { popFor.setAttribute('aria-expanded', 'false'); popFor = null; } }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.gl-ref');
    if (!a) { if (pop && !e.target.closest('.gl-pop')) closePop(); return; }
    e.preventDefault(); e.stopPropagation();
    if (popFor === a) { closePop(); return; }
    closePop(); popFor = a; a.setAttribute('aria-expanded', 'true');
    pop = el('div', { class: 'gl-pop', role: 'dialog', 'aria-label': 'تعریف ' + a.getAttribute('data-term') }, [
      el('button', { type: 'button', 'aria-label': 'بستن', text: '×', onclick: function () { closePop(); a.focus(); } }),
      el('b', { text: a.getAttribute('data-term') }), el('span', { text: a.getAttribute('data-def') }), el('br'),
      el('a', { href: a.getAttribute('href'), text: 'باز کردن در واژه‌نامه ←' })]);
    document.body.appendChild(pop);
    var r = a.getBoundingClientRect(), pr = pop.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    var left = Math.max(12, Math.min(vw - pr.width - 12, r.left + r.width / 2 - pr.width / 2));
    var top = r.bottom + 8; if (top + pr.height > vh - 8) top = Math.max(8, r.top - pr.height - 8);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop) { var f = popFor; closePop(); if (f) f.focus(); } });
  window.addEventListener('scroll', function () { closePop(); }, { passive: true });

  /* ---- reading modes (reading / interactive; flip handled by reader.js) ---- */
  NB.setMode = function (m) {
    document.body.setAttribute('data-mode', m);
    $$('.md [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
    document.dispatchEvent(new CustomEvent('nb:mode', { detail: m }));
    if (m !== 'flip') { mountVisible(); }
  };
  $$('button[data-mode]').forEach(function (b) { b.addEventListener('click', function () { var m = b.getAttribute('data-mode'); if (!document.body.hasAttribute('data-reader')) { NB.setMode(m); try { history.replaceState(null, '', location.pathname + '#' + (m === 'reading' ? '' : m)); } catch (e) {} } else { location.hash = m === 'reading' ? '#reading' : '#' + m; } }); });
  if (!document.body.hasAttribute('data-reader')) {
    if (location.hash === '#interactive') NB.setMode('interactive');
  }

  /* ---- progress bar + TOC highlight ---- */
  var pi = $('#prog-i');
  function onScroll() {
    if (document.body.getAttribute('data-mode') === 'flip') return;
    var h = document.documentElement; var max = h.scrollHeight - h.clientHeight;
    if (pi) pi.style.width = (max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var tocLinks = $$('.rd-toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {}; tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var targets = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); } }); }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---- experiences: lazy mount ---- */
  var loaded = {};
  function loadXp(id, cb) {
    if (NB.xp[id]) return cb();
    if (loaded[id]) { loaded[id].push(cb); return; }
    loaded[id] = [cb];
    var s = document.createElement('script'); s.src = root + 'assets/xp/' + id + '.js';
    s.onload = function () { loaded[id].forEach(function (f) { f(); }); };
    s.onerror = function () { loaded[id].forEach(function (f) { f(new Error('load')); }); };
    document.head.appendChild(s);
  }
  function dataScript(cb) { if (window.NB_DATA) return cb(); var s = document.createElement('script'); s.src = root + 'assets/data.js'; s.onload = cb; s.onerror = cb; document.head.appendChild(s); }
  NB.mount = function (slot) {
    if (slot.getAttribute('data-mounted')) return; slot.setAttribute('data-mounted', '1');
    var id = slot.getAttribute('data-xp'), body = $('.xp-body', slot);
    body.innerHTML = '<div class="xp-load" role="status">در حال بارگذاری…</div>';
    loadXp(id, function (err) {
      if (err || !NB.xp[id]) { body.innerHTML = '<div class="xp-err" role="alert">بارگذاری این تجربه ناموفق بود. متن آموزشی بالا همچنان قابل‌خواندن است. صفحه را دوباره بارگذاری کن.</div>'; slot.removeAttribute('data-mounted'); return; }
      dataScript(function () {
        body.innerHTML = '';
        try { NB.xp[id](body, { data: window.NB_DATA, root: root }); } catch (e) { console.error(e); body.innerHTML = '<div class="xp-err" role="alert">در اجرای این تجربه خطایی رخ داد. متن آموزشی همچنان در دسترس است.</div>'; }
      });
    });
  };
  var xio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { xio.unobserve(e.target); NB.mount(e.target); } }); }, { rootMargin: '300px' }) : null;
  function observeSlots(scope) { $$('.xp-slot[data-xp]', scope).forEach(function (s) { if (s.closest('.flip-wrap')) return; if (xio) xio.observe(s); else NB.mount(s); }); }
  function mountVisible() { if (document.body.getAttribute('data-mode') === 'interactive') $$('.xp-slot[data-xp]').forEach(function (s) { if (!s.closest('.flip-wrap')) NB.mount(s); }); }
  observeSlots(document);

  /* ---- archive filter ---- */
  var aq = $('[data-archive-q]');
  if (aq) {
    var f = 'all';
    var run = function () { var q = aq.value.trim().toLowerCase(), n = 0; $$('#ar-grid .cd').forEach(function (c) { var ok = (!q || (c.getAttribute('data-title') + ' ' + c.getAttribute('data-cat')).toLowerCase().indexOf(q) > -1) && (f === 'all' || c.tagName === 'A'); c.hidden = !ok; if (ok) n++; }); $('#ar-empty').hidden = n > 0; };
    aq.addEventListener('input', run);
    $$('[data-archive-f]').forEach(function (b) { b.addEventListener('click', function () { f = b.getAttribute('data-archive-f'); $$('[data-archive-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); run(); }); });
  }
  /* ---- experiences hub filter ---- */
  $$('[data-xf]').forEach(function (b) { b.addEventListener('click', function () { var c = b.getAttribute('data-xf'); $$('[data-xf]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); $$('.xh a').forEach(function (a) { a.hidden = !(c === 'همه' || a.getAttribute('data-cat') === c); }); }); });
  /* ---- glossary filter ---- */
  var gq = $('[data-glossary-q]');
  if (gq) gq.addEventListener('input', function () { var q = gq.value.trim().toLowerCase(), n = 0; $$('#gl-list > div').forEach(function (d) { var ok = !q || d.getAttribute('data-t').toLowerCase().indexOf(q) > -1; d.hidden = !ok; if (ok) n++; }); $('#gl-empty').hidden = n > 0; });

  /* ---- search ---- */
  var sq = $('#s-q');
  if (sq) {
    var norm = function (s) { return String(s).replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏‎ً-ْ]/g, '').replace(/[۰-۹]/g, function (d) { return faDigits.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; }).toLowerCase(); };
    var idx = null;
    var out = $('#s-res'), cnt = $('#s-count');
    var run2 = function () {
      if (!idx) idx = (window.NB_SEARCH || []).map(function (e) { return { e: e, t: norm(e.t), x: norm(e.x) }; });
      var q = norm(sq.value.trim()); out.innerHTML = '';
      if (q.length < 2) { cnt.textContent = 'حداقل دو حرف بنویس.'; return; }
      var terms = q.split(/\s+/).filter(Boolean), hits = [];
      idx.forEach(function (r) { var sc = 0; for (var i = 0; i < terms.length; i++) { var inT = r.t.indexOf(terms[i]) > -1, inX = r.x.indexOf(terms[i]) > -1; if (!inT && !inX) return; sc += (inT ? 10 : 0) + (inX ? 1 : 0); } hits.push({ r: r, sc: sc }); });
      hits.sort(function (a, b) { return b.sc - a.sc; });
      cnt.textContent = hits.length ? NB.fa(hits.length) + ' نتیجه' : 'نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کن.';
      hits.slice(0, 40).forEach(function (h) {
        var e = h.r.e, p = h.r.x.indexOf(terms[0]), sn = '';
        if (p > -1) { var raw = e.x.replace(/\s+/g, ' '); var st = Math.max(0, p - 50); sn = (st ? '… ' : '') + raw.slice(st, st + 150) + ' …'; } else sn = e.x.slice(0, 120);
        var a = NB.el('a', { href: root + e.u }, [NB.el('small', { text: e.k }), NB.el('b', { text: e.t }), NB.el('span', { class: 'muted', text: sn })]);
        out.appendChild(a);
      });
    };
    sq.addEventListener('input', run2);
    var m = location.search.match(/[?&]q=([^&]+)/); if (m) { sq.value = decodeURIComponent(m[1]); window.addEventListener('load', run2); }
  }

  /* ---- forms (static: build a message, never claims to send) ---- */
  $$('form[data-nb-form]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); var ok = true, lines = [];
      $$('input,textarea', form).forEach(function (f) {
        var er = f.parentNode.querySelector('.er'); var v = f.value.trim(); var bad = f.hasAttribute('required') && !v;
        f.setAttribute('aria-invalid', String(bad)); if (er) er.textContent = bad ? 'این فیلد لازم است.' : ''; if (bad) { if (ok) f.focus(); ok = false; }
        lines.push(f.parentNode.querySelector('label').textContent.replace(' *', '') + ': ' + v);
      });
      if (!ok) return;
      var text = '[Next Bit — ' + form.getAttribute('data-nb-form') + ']\n' + lines.join('\n');
      var out = $('#fm-out'); $('#fm-pre').textContent = text; out.setAttribute('data-show', 'true');
      var mail = $('#fm-mail'), em = form.getAttribute('data-email');
      if (em) { mail.href = 'mailto:' + em + '?subject=' + encodeURIComponent('Next Bit — ' + form.getAttribute('data-nb-form')) + '&body=' + encodeURIComponent(text); mail.hidden = false; }
      out.scrollIntoView({ block: 'nearest' });
    });
    var cp = $('#fm-copy'); if (cp) cp.addEventListener('click', function () { var t = $('#fm-pre').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { cp.textContent = 'کپی شد ✓'; }, function () { var r = document.createRange(); r.selectNodeContents($('#fm-pre')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); cp.textContent = 'متن انتخاب شد؛ Ctrl+C بزن'; }); });
  });
})();
