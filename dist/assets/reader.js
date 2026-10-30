/* Next Bit — issue reader: mode routing, resume position, and the Flipbook */
(function () {
  'use strict';
  var NB = window.NB, $ = NB.$, $$ = NB.$$, el = NB.el, fa = NB.fa;
  var KEY = 'nb-pos-issue-01';
  var HASH = { flipbook: 'flip', flip: 'flip', reading: 'reading', interactive: 'interactive' };
  var built = false, B = null;
  function narrow() { return window.innerWidth <= 640; }

  /* ---------- mode routing ---------- */
  function applyHash() {
    var h = location.hash.replace('#', '');
    if (HASH[h]) { NB.setMode(HASH[h]); return; }
    if (!document.body.getAttribute('data-mode')) NB.setMode('reading');
    if (document.body.getAttribute('data-mode') === 'flip' && h) NB.setMode('reading');
  }
  document.addEventListener('nb:mode', function (e) {
    if (e.detail === 'flip') { $('#flip-wrap').scrollIntoView({ block: 'start' }); if (!built) buildFlip(); else if (B) { B.layout(true); if (narrow() && !B.userExited) B.setFs(true); } }
    else if (B && B.isFs && B.isFs()) { B.setFs(false); B.userExited = false; }
    if (e.detail === 'reading') showResume();
  });
  window.addEventListener('hashchange', applyHash);

  /* ---------- resume (reading mode) ---------- */
  var secs = $$('.art-sec');
  var lastSlug = null;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && document.body.getAttribute('data-mode') !== 'flip') { lastSlug = e.target.id; NB.store(KEY + '-sec', lastSlug); $$('.rd-toc a[data-sec]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-sec') === lastSlug); }); } }); }, { rootMargin: '-10% 0px -80% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }
  function showResume() {
    var saved = NB.store(KEY + '-sec');
    if (!saved || saved === secs[0].id || $('#resume-note') || (location.hash && !HASH[location.hash.replace('#', '')])) return;
    var sec = document.getElementById(saved); if (!sec) return;
    var note = el('div', { id: 'resume-note', class: 'back-note', style: 'display:flex' }, [el('span', { text: 'آخرین بار تا «' + sec.getAttribute('data-title') + '» خوانده بودی.' }), el('span', {}, [el('button', { class: 'btn sm k', type: 'button', text: 'ادامه از همان‌جا', onclick: function () { sec.scrollIntoView(); note.remove(); } }), ' ', el('button', { class: 'btn sm ko', type: 'button', text: 'نه، ممنون', onclick: function () { note.remove(); } })])]);
    secs[0].parentNode.insertBefore(note, secs[0]);
  }

  /* ---------- Flipbook ---------- */
  function buildFlip() {
    built = true;
    var stage = $('#stage'), load = $('#fb-load');
    var fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
    fontsReady.then(function () { B = makeBook(stage, load); B.layout(false); if (narrow()) B.setFs(true); });
  }

  /* turn a reading-mode section into flow HTML for the page columns */
  function flowFor(sec, tocHtml) {
    var f = el('div', { class: 'fl' });
    f.appendChild(el('div', { class: 'open-pg', style: 'height:auto;margin-bottom:.8em' }, [el('div', { class: 'kk', text: sec.getAttribute('data-label') }), el('h2', { text: sec.getAttribute('data-title') })]));
    var prose = $('.prose', sec);
    function add(n) { f.appendChild(n); }
    function card(slot) {
      var t = slot.getAttribute('data-title') || 'تجربهٔ تعاملی';
      var c = el('div', { class: 'xp-card' }, [el('b', { text: 'تجربهٔ تعاملی: ' + t }), el('span', { text: 'این تجربه در یک پنجرهٔ جدا اجرا می‌شود.' }), el('br'), el('button', { type: 'button', 'data-open-xp': slot.getAttribute('data-xp'), text: 'اجرا' })]);
      return c;
    }
    function walk(parent) {
      Array.prototype.slice.call(parent.children).forEach(function (n) {
        if (n.classList.contains('intro')) return walk(n);
        if (n.classList.contains('xp-slot')) return add(card(n));
        if (n.classList.contains('callout')) {
          var fc = el('div', { class: 'fc ' + (n.className.replace('callout', '').replace('has-xp', '').trim()) });
          Array.prototype.slice.call(n.children).forEach(function (k) {
            if (k.tagName === 'H3') fc.appendChild(el('b', { html: k.innerHTML }));
            else if (k.classList.contains('xp-slot')) fc.appendChild(card(k));
            else fc.appendChild(k.cloneNode(true));
          });
          return add(fc);
        }
        var c = n.cloneNode(true); c.removeAttribute('id'); $$('[id]', c).forEach(function (x) { x.removeAttribute('id'); }); add(c);
      });
    }
    walk(prose);
    var fp = f.querySelector(':scope > p'); if (fp) fp.classList.add('lead');
    return f;
  }

  function makeBook(stage, load) {
    var sections = $$('.art-sec');
    var bk = null, leaves = [], pages = [], S = 0, single = false, dims = {}, starts = [];
    var meas = el('div', { style: 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none' });
    document.body.appendChild(meas);
    var fsF = { '-1': 0.9, '0': 1, '1': 1.12, '2': 1.25 };
    var curPage = parseInt(NB.store(KEY + '-page') || '0', 10) || 0;
    var timer = null;
    var wrap = $('#flip-wrap'), fsBtn = $('#fb-fs');
    function isFs() { return wrap.classList.contains('is-fs'); }

    function sizes() {
      var F = isFs();
      var avail = F ? window.innerWidth - 16 : Math.min(stage.clientWidth || 360, 1000);
      var hB = F ? Math.max(260, (stage.clientHeight || (window.innerHeight - 150)) - 14) : window.innerHeight - 200;
      single = avail < 820;
      var two = Math.min(Math.floor(avail / 2), Math.floor(hB / 1.4));
      if (!single && two < 260) single = true;
      var pw = single ? Math.min(avail, F ? 700 : 520) : two;
      pw = Math.max(F ? 200 : 250, Math.min(pw, Math.floor(hB / 1.4)));
      var pad = Math.round(pw * 0.085);
      var fs = Math.max(14, Math.min(F ? 22 : 19, pw / (single ? 21 : 26))) * (fsF[document.documentElement.getAttribute('data-fs') || '0'] || 1);
      var cw = pw - 2 * pad, ch = Math.round(pw * 1.4) - 2 * pad - 46;
      dims = { pw: pw, ph: ch + 2 * pad + 46, pad: pad, cw: cw, ch: ch, fs: fs };
    }
    function setVars(n) { var s = n.style; s.setProperty('--cw', dims.cw + 'px'); s.setProperty('--ch', dims.ch + 'px'); s.setProperty('--pad', dims.pad + 'px'); s.setProperty('--fs', dims.fs + 'px'); }
    function countCols(flow) {
      var w = flow.cloneNode(true); w.style.setProperty('--off', '0px'); var vp = el('div', { class: 'vp' }, [w]); setVars(vp); meas.innerHTML = ''; meas.appendChild(vp);
      var n = Math.max(1, Math.round(w.scrollWidth / dims.cw)); return n;
    }
    function paginate() {
      pages = [{ t: 'cover' }]; starts = [];
      // TOC first with dummy numbers so its page count is final
      var tocFlow = function (nums) {
        var f = el('div', { class: 'fl' }, [el('div', { class: 'open-pg', style: 'height:auto;margin-bottom:.8em' }, [el('div', { class: 'kk', text: 'CONTENTS' }), el('h2', { text: 'فهرست مطالب' })])]);
        var ol = el('ol', { style: 'list-style:none;padding:0' });
        sections.forEach(function (s, i) { ol.appendChild(el('li', {}, [el('button', { type: 'button', 'data-go-sec': i, style: 'all:unset;cursor:pointer;display:flex;justify-content:space-between;gap:10px;width:100%;padding:.25em 0;border-bottom:1px solid var(--line)' }, [el('span', { text: s.getAttribute('data-title').split('؛')[0] }), el('span', { class: 'mono', text: nums ? fa(nums[i]) : '۰۰۰' })])])); });
        f.appendChild(ol); return f;
      };
      var tocN = countCols(tocFlow(null));
      for (var i = 0; i < tocN; i++) pages.push({ t: 'toc', col: i });
      sections.forEach(function (s, i) {
        var fl = flowFor(s); var n = countCols(fl); starts[i] = pages.length;
        for (var c = 0; c < n; c++) pages.push({ t: 'sec', sec: i, col: c, flow: c === 0 ? fl : null });
      });
      pages.push({ t: 'end' });
      if (!single && pages.length % 2) pages.splice(pages.length - 1, 0, { t: 'blank' });
      pages.forEach(function (p) { if (p.t === 'toc') p.nums = starts.map(function (s) { return s + 1; }); });
      B.tocFlow = tocFlow; B.flows = sections.map(function (s) { return flowFor(s); });
    }
    function pageNode(i) {
      var p = pages[i], face = el('div', {}), inner;
      if (!p) return null;
      if (p.t === 'cover') {
        face.className = 'cv'; face.innerHTML = '<div class="cvx"><div class="cv-top"><span class="kk">ISSUE 01</span><span class="kk">NEXT BIT</span></div><div class="cv-mid"><div class="cv-num" aria-hidden="true">01</div><h2>از صفر و یک<br>تا آینده</h2><p>نشریهٔ دانشجویی مهندسی کامپیوتر دانشگاه کاشان</p></div><div class="lbl">ورق بزن ‹</div></div>'; return face;
      }
      var pgIn = el('div', { class: 'pg-in' }); setVars(pgIn);
      if (p.t === 'end') pgIn.innerHTML = '<div class="end-pg"><div class="kk mono" style="color:var(--green-text)">END OF ISSUE 01</div><h2 style="font-weight:900;font-size:1.5em;line-height:1.5">پایان شمارهٔ اول</h2><p>بیت بعدی رو تو انتخاب کن.</p><a class="btn" href="glossary/index.html">واژه‌نامه</a><a class="btn" href="start/index.html">از کجا شروع کنیم؟</a><a class="btn" href="sources/index.html">منابع</a><a class="btn" href="../index.html">آرشیو شماره‌ها</a></div>';
      else if (p.t === 'blank') pgIn.innerHTML = '';
      else {
        var flow = p.t === 'toc' ? B.tocFlow(p.nums) : B.flows[p.sec].cloneNode(true);
        flow.style.setProperty('--off', (p.col * dims.cw) + 'px');
        var vp = el('div', { class: 'vp' }, [flow]); setVars(vp); pgIn.appendChild(vp);
      }
      if (p.t === 'sec' || p.t === 'toc') {
        var ht = p.t === 'toc' ? 'فهرست مطالب' : sections[p.sec].getAttribute('data-title').split('؛')[0].split(':')[0];
        pgIn.insertBefore(el('div', { class: 'pg-head' }, [el('span', { class: 'mono', text: 'NEXT BIT · 01' }), el('span', { text: ht })]), pgIn.firstChild);
      }
      pgIn.appendChild(el('div', { class: 'pg-no' }, [el('span', { text: fa(i + 1) })]));
      face.appendChild(pgIn); return face;
    }
    function build() {
      stage.innerHTML = '';
      bk = el('div', { class: 'bk' + (single ? ' single' : '') });
      bk.style.width = (single ? dims.pw : dims.pw * 2) + 'px'; bk.style.height = dims.ph + 'px';
      var per = single ? 1 : 2, L = Math.ceil(pages.length / per);
      leaves = [];
      for (var k = 0; k < L; k++) {
        var lf = el('div', { class: 'leaf' }); lf.style.height = dims.ph + 'px'; if (!single) lf.style.width = dims.pw + 'px'; else lf.style.width = dims.pw + 'px';
        var f = el('div', { class: 'face f' }); var b = el('div', { class: 'face k' });
        lf.appendChild(f); lf.appendChild(b); lf._f = f; lf._b = b; lf._fi = k * per; lf._bi = single ? -1 : k * per + 1;
        bk.appendChild(lf); leaves.push(lf);
      }
      var hn = el('button', { class: 'hot', type: 'button', style: 'left:0', 'aria-label': 'صفحهٔ بعد', text: '‹', onclick: function () { go(1); } });
      var hp = el('button', { class: 'hot', type: 'button', style: 'right:0', 'aria-label': 'صفحهٔ قبل', text: '›', onclick: function () { go(-1); } });
      bk.appendChild(hn); bk.appendChild(hp); bk._hn = hn; bk._hp = hp;
      stage.appendChild(bk);
    }
    function fill(leafIdx) {
      var lf = leaves[leafIdx]; if (!lf) return;
      [['_f', '_fi'], ['_b', '_bi']].forEach(function (a) { var face = lf[a[0]], pi = lf[a[1]]; if (face._done || pi < 0 || pi >= pages.length) return; var n = pageNode(pi); if (!n) return; face.className = 'face ' + (a[0] === '_f' ? 'f' : 'k') + (n.className === 'cv' ? ' cv' : ''); while (n.firstChild) face.appendChild(n.firstChild); face._done = true; });
    }
    /* S = number of leaves flipped */
    function render(animate) {
      var L = leaves.length;
      S = Math.max(0, Math.min(single ? L - 1 : L, S));
      leaves.forEach(function (lf, k) {
        var flipped = k < S;
        if (animate && !single && lf._fl !== undefined && lf._fl !== flipped) { lf.classList.add('turning'); (function (x) { setTimeout(function () { x.classList.remove('turning'); }, 950); })(lf); }
        lf._fl = flipped;
        lf.style.zIndex = flipped ? k + 1 : L - k;
        lf.style.transform = flipped ? (single ? 'rotateY(100deg)' : 'rotateY(180deg)') : 'none';
        lf.style.opacity = single && flipped ? '0' : '1';
        lf.style.pointerEvents = (single ? k === S : (k === S || k === S - 1)) ? 'auto' : 'none';
        var near = Math.abs(k - S) <= (single ? 1 : 2); if (near) fill(k);
        if (single) { lf.style.transform = 'none'; lf.style.display = Math.abs(k - S) <= 1 ? 'block' : 'none'; lf.style.opacity = k === S ? '1' : '0'; lf.style.visibility = k === S ? 'visible' : 'hidden'; }
        var vis = single ? k === S : (k === S || k === S - 1);
        lf._f.setAttribute('aria-hidden', String(!(vis && (single || k === S)))); lf._b.setAttribute('aria-hidden', String(!(vis && !single && k === S - 1)));
        if (vis) { [lf._f, lf._b].forEach(function (fc) { $$('button,a', fc).forEach(function (x) { x.tabIndex = 0; }); }); } else { [lf._f, lf._b].forEach(function (fc) { $$('button,a', fc).forEach(function (x) { x.tabIndex = -1; }); }); }
      });
      bk.classList.toggle('open', !single && S > 0 && S < L);
      if (!single) bk.style.transform = S === 0 ? 'translateX(' + (dims.pw / 2) + 'px)' : (S >= L ? 'translateX(' + (-dims.pw / 2) + 'px)' : 'none');
      curPage = single ? S : (S === 0 ? 0 : Math.min(pages.length - 1, S * 2 - 1));
      NB.store(KEY + '-page', String(curPage));
      var shown = single ? S + 1 : (S === 0 ? 1 : (S >= L ? pages.length : (S * 2) + '–' + (S * 2 + 1)));
      $('#fb-pgs').textContent = (single ? fa(S + 1) : String(shown).replace(/\d/g, function (d) { return fa(d); })) + ' / ' + fa(pages.length);
      $('#fb-prev').disabled = S <= 0; $('#fb-next').disabled = single ? S >= L - 1 : S >= L;
      var cur = pages[curPage]; var sel = $('#fb-ch'); if (cur && cur.t === 'sec') sel.value = String(cur.sec);
      $('#fb-pg').value = String(curPage + 1); $('#fb-pg').max = String(pages.length);
      bk._hn.disabled = $('#fb-next').disabled; bk._hp.disabled = $('#fb-prev').disabled;
    }
    function go(d) { S += d; render(true); }
    function toPage(p) { p = Math.max(0, Math.min(pages.length - 1, p)); S = single ? p : Math.ceil(p / 2); render(true); }
    B = {
      layout: function (keep) {
        var pg = keep ? curPage : curPage;
        sizes(); paginate(); build();
        var sel = $('#fb-ch'); sel.innerHTML = ''; sections.forEach(function (s, i) { sel.appendChild(el('option', { value: i, text: s.getAttribute('data-title').split('؛')[0].split(':')[0] })); });
        S = single ? Math.min(pg, pages.length - 1) : Math.ceil(Math.min(pg, pages.length - 1) / 2);
        render(false); stage.setAttribute('aria-label', 'کتاب شمارهٔ اول، ' + fa(pages.length) + ' صفحه');
      }, toPage: toPage, go: go
    };
    // controls
    
    $('#fb-next').onclick = function () { go(1); }; $('#fb-prev').onclick = function () { go(-1); };
    $('#fb-ch').onchange = function () { toPage(starts[parseInt(this.value, 10)]); };
    $('#fb-go').onclick = function () { var v = parseInt($('#fb-pg').value, 10); if (v >= 1 && v <= pages.length) toPage(v - 1); };
    $('#fb-pg').onkeydown = function (e) { if (e.key === 'Enter') $('#fb-go').click(); };
    stage.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { e.preventDefault(); go(1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(-1); } else if (e.key === 'Home') { toPage(0); } else if (e.key === 'End') { toPage(pages.length - 1); } });
    document.addEventListener('keydown', function (e) { if (e.defaultPrevented || document.body.getAttribute('data-mode') !== 'flip' || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || $('#xp-dialog').open) return; if (e.key === 'ArrowLeft') go(1); else if (e.key === 'ArrowRight') go(-1); });
    // drag to turn (pointer events: mouse + touch). dx>0 => next page (RTL book)
    var drag = null, dragged = false;
    function canGo(d) { var L = leaves.length; return d > 0 ? (single ? S < L - 1 : S < L) : S > 0; }
    function dragLeaf() { return single ? leaves[S] : (drag.dir > 0 ? leaves[S] : leaves[S - 1]); }
    function prepDrag() {
      var lf = dragLeaf(); lf.style.transition = 'none'; stage.classList.add('dragging');
      if (single) { var t = leaves[S + drag.dir]; if (t) { fill(S + drag.dir); t.style.display = 'block'; t.style.visibility = 'visible'; t.style.opacity = '1'; t.style.zIndex = '1'; } lf.style.zIndex = '999'; lf.classList.add('lift'); }
      else { lf.style.zIndex = '999'; lf.classList.add('turning'); }
    }
    function updDrag(dx) {
      var lf = dragLeaf(), pw = dims.pw, pr = Math.min(1, Math.abs(dx) / pw);
      drag.pr = pr;
      if (single) lf.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / pw * 3) + 'deg)';
      else lf.style.transform = 'rotateY(' + (drag.dir > 0 ? pr * 180 : 180 - pr * 180) + 'deg)';
    }
    function endDrag(commit) {
      var lf = dragLeaf(), d = drag.dir, pw = dims.pw; stage.classList.remove('dragging');
      if (single) {
        lf.style.transition = 'transform .24s ease-out'; lf.style.transform = commit ? 'translateX(' + (d * pw * 1.15) + 'px)' : 'translateX(0)';
        setTimeout(function () { lf.style.transition = ''; lf.style.transform = ''; lf.classList.remove('lift'); if (commit) go(d); else render(false); }, 250);
      } else {
        lf.style.transition = ''; lf.classList.remove('turning');
        if (commit) go(d); else render(true);
      }
    }
    stage.addEventListener('pointerdown', function (e) {
      dragged = false; if (drag || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('button,a,input,select,textarea')) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false, dir: 0, t: Date.now(), pr: 0 };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 10) return;
        drag.dir = dx > 0 ? 1 : -1;
        if (!canGo(drag.dir)) { drag = null; return; }
        drag.on = true; dragged = true; try { stage.setPointerCapture(e.pointerId); } catch (_) {} prepDrag();
      }
      updDrag(dx);
    });
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dd = drag; drag = null;
      if (!dd.on) return;
      var fast = (Date.now() - dd.t) < 280 && dd.pr > 0.08;
      drag = dd; endDrag(e.type === 'pointerup' && (dd.pr > 0.28 || fast)); drag = null;
    }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    stage.addEventListener('click', function (e) { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    // fullscreen (real Fullscreen API when available, otherwise an in-page full-viewport mode)
    function setFs(on) {
      if (on === isFs()) return;
      wrap.classList.toggle('is-fs', on); document.documentElement.classList.toggle('fs-lock', on);
      fsBtn.textContent = on ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'; fsBtn.setAttribute('aria-pressed', String(on));
      if (!on) B.userExited = true;
      try { if (on && !narrow() && wrap.requestFullscreen) wrap.requestFullscreen().catch(function () {}); else if (!on && document.fullscreenElement) document.exitFullscreen().catch(function () {}); } catch (_) {}
      setTimeout(function () { B.layout(true); stage.focus({ preventScroll: true }); }, 150);
    }
    fsBtn.onclick = function () { setFs(!isFs()); };
    $('#fb-exit').onclick = function () { setFs(false); };
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && isFs()) setFs(false); });
    document.addEventListener('keydown', function (e) { if (document.body.getAttribute('data-mode') !== 'flip' || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) || $('#xp-dialog').open) return; if (e.key === 'f' || e.key === 'F') setFs(!isFs()); else if (e.key === 'Escape' && isFs()) setFs(false); });
    B.setFs = setFs; B.isFs = isFs;
    // clicks inside pages: TOC entries and experience cards
    stage.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go-sec]'); if (t) { toPage(starts[parseInt(t.getAttribute('data-go-sec'), 10)]); return; }
      var x = e.target.closest('[data-open-xp]'); if (x) openXp(x.getAttribute('data-open-xp'));
      if (e.target.closest('.face.cv') && S === 0) go(1);
    });
    var lastW = window.innerWidth, lastH = window.innerHeight; window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(function () { var hc = isFs() && Math.abs(window.innerHeight - lastH) > 40; lastH = window.innerHeight; if (window.innerWidth === lastW && !hc) return; lastW = window.innerWidth; if (document.body.getAttribute('data-mode') === 'flip') B.layout(true); }, 250); });
    document.addEventListener('nb:fs', function () { if (document.body.getAttribute('data-mode') === 'flip') B.layout(true); });
    return B;
  }

  function openXp(id) {
    var src = document.querySelector('.reading-wrap .xp-slot[data-xp="' + id + '"]'); if (!src) return;
    var d = $('#xp-dialog'), body = $('#xp-dialog-body'); body.innerHTML = '';
    var c = src.cloneNode(true); c.removeAttribute('id'); c.removeAttribute('data-mounted'); $('.xp-body', c).innerHTML = ''; body.appendChild(c);
    d.showModal(); NB.mount(c);
  }
  var dlg = $('#xp-dialog'); if (dlg) { $('#xp-close').onclick = function () { dlg.close(); }; dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); }

  applyHash();
  if (document.body.getAttribute('data-mode') === 'reading') showResume();
})();
