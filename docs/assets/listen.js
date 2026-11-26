/* Listen mode: QR codes + in-browser text-to-speech (Web Speech API). No audio is generated or uploaded here. */
(function () {
  'use strict';
  var NB = (window.NB = window.NB || {});
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---- QR codes ---- */
  NB.renderQr = function (root) {
    $$('[data-qr]', root).forEach(function (el) {
      if (el.firstChild || !NB.qrSvg) return;
      try { var u = new URL(el.getAttribute('data-qr'), location.href); el.innerHTML = NB.qrSvg(u.href, { label: 'کد QR برای باز کردن این بخش' }); el.setAttribute('data-qr-url', u.href); } catch (e) {}
    });
  };
  NB.renderQr();

  /* ---- text to speech ---- */
  var synth = window.speechSynthesis, S = { id: null, items: [], i: 0, paused: false, active: false };
  function faVoice() { var v = synth ? synth.getVoices() : []; for (var i = 0; i < v.length; i++) if (/^fa/i.test(v[i].lang)) return v[i]; return null; }
  function sourceRoot(id) { return document.querySelector('.art-sec[data-id="' + id + '"] .prose') || document.querySelector('article.prose'); }
  var PR = (window.NB_PRON || []).slice().sort(function (a, b) { return b[0].length - a[0].length; }).map(function (p) { return [new RegExp('(^|[^A-Za-z])' + p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z])', 'g'), p[1]]; });
  function pron(t) { PR.forEach(function (p) { t = t.replace(p[0], function (m, pre) { return pre + p[1]; }); }); return t; }
  function collect(id) {
    var root = sourceRoot(id); if (!root) return [];
    var out = [];
    $$('p,li,h2,h3', root).forEach(function (el) {
      if (el.closest('.xp-slot,.fn-list,.listen,.src,.src-hide,.back-note,.fig,.ed-note') || el.classList.contains('ex')) return;
      var c = el.cloneNode(true); $$('sup.fn-ref,.gl-ref,.tag,script,style', c).forEach(function (n) { n.remove(); });
      var txt = pron((c.textContent || '').replace(/\s+/g, ' ').trim()); if (!txt || /^[\d\s×+\-=.۰-۹]+$/.test(txt)) return;
      var parts = txt.match(/[^.!?؟؛:]+[.!?؟؛:]*\s*/g) || [txt], buf = '';
      parts.forEach(function (p) { if ((buf + p).length > 200 && buf) { out.push({ el: el, t: buf.trim() }); buf = p; } else buf += p; });
      if (buf.trim()) out.push({ el: el, t: buf.trim() });
    });
    return out;
  }
  function cards(id) { return $$('.listen[data-art="' + id + '"]'); }
  function ui(id) {
    cards(id).forEach(function (c) {
      var on = S.active && S.id === id;
      c.querySelector('[data-listen=play]').textContent = on && S.paused ? '▶ ادامه' : '▶ گوش بده';
      c.querySelector('[data-listen=pause]').disabled = !(on && !S.paused);
      c.querySelector('[data-listen=stop]').disabled = !on;
      c.classList.toggle('is-playing', on && !S.paused);
    });
  }
  function note(id, msg) { cards(id).forEach(function (c) { var n = c.querySelector('[data-listen-note]'); if (n && msg) n.textContent = msg; }); }
  function mark(el) { $$('.ls-now').forEach(function (n) { n.classList.remove('ls-now'); }); if (el) { el.classList.add('ls-now'); if (document.body.getAttribute('data-mode') !== 'flip' && el.scrollIntoView) { var r = el.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight - 80) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } } }
  function speak(rate) {
    if (!S.active) return;
    if (S.i >= S.items.length) { stop(); return; }
    var it = S.items[S.i]; mark(it.el);
    var u = new SpeechSynthesisUtterance(it.t); u.lang = 'fa-IR'; var v = faVoice(); if (v) u.voice = v; u.rate = rate || S.rate || 1;
    u.onend = function () { if (S.active && !S.paused) { S.i++; speak(); } };
    u.onerror = function (e) { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; note(S.id, 'پخش صدا روی این دستگاه ممکن نشد.'); stop(); };
    synth.speak(u);
  }
  function start(id, rate) {
    if (!synth) { note(id, 'این مرورگر گوینده‌ٔ خودکار ندارد.'); return; }
    stop(); S = { id: id, items: collect(id), i: 0, paused: false, active: true, rate: rate || 1 };
    if (!S.items.length) { S.active = false; note(id, 'متنی برای خواندن پیدا نشد.'); return; }
    if (!faVoice()) note(id, 'صدای فارسی روی این دستگاه پیدا نشد؛ ممکن است تلفظ درست نباشد. از تنظیمات دستگاه یک صدای فارسی نصب کن.');
    ui(id); speak(rate);
  }
  function stop() { var id = S.id; S.active = false; S.paused = false; if (synth) synth.cancel(); mark(null); if (id) ui(id); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-listen]'); if (!b) return;
    var card = b.closest('.listen'), id = card.getAttribute('data-art'), act = b.getAttribute('data-listen');
    var sel = card.querySelector('[data-listen-rate]'), rate = sel ? parseFloat(sel.value) : 1;
    if (act === 'play') { if (S.active && S.id === id && S.paused) { S.paused = false; synth.resume(); ui(id); } else start(id, rate); }
    else if (act === 'pause') { if (S.active && S.id === id) { S.paused = true; synth.pause(); ui(id); } }
    else if (act === 'stop') stop();
  });
  document.addEventListener('change', function (e) {
    var s = e.target.closest && e.target.closest('[data-listen-rate]'); if (!s) return;
    var id = s.closest('.listen').getAttribute('data-art'); cards(id).forEach(function (c) { var x = c.querySelector('[data-listen-rate]'); if (x) x.value = s.value; });
    if (S.active && S.id === id) { var i = S.i; synth.cancel(); S.rate = parseFloat(s.value); S.i = i; S.paused = false; speak(S.rate); ui(id); }
  });
  window.addEventListener('pagehide', function () { if (synth) synth.cancel(); });
  NB.listen = { start: start, stop: stop };
})();
