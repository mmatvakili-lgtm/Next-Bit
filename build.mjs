// Next Bit static site builder: content/*.json -> dist/
import fs from 'node:fs';
import path from 'node:path';
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const site = rd('content/site.json'), issuesData = rd('content/issues.json'), team = rd('content/team.json');
const exps = rd('content/experiences.json').experiences, timeline = rd('content/timeline.json'), src = rd('content/sources.json');
const OUT = 'dist';
fs.rmSync(OUT, { recursive: true, force: true });
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), s); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LAT = /[A-Za-z][A-Za-z0-9\-\/.+]*(?:\s+[A-Za-z][A-Za-z0-9\-\/.+]*)*/g;
const inline = (s) => esc(s).replace(LAT, (m) => `<bdi class="en" dir="ltr">${m}</bdi>`);
const toFa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const siteUrl = site.siteUrl.replace(/\/$/, '');
const placeholderUrl = /example/.test(siteUrl);

// ---------------- data
const art = rd('content/issue-01/articles.json');
const issue = issuesData.issues[0];
const ISS = `issues/${issue.slug}`;
const editorial = { id: 'ed', slug: 'editorial', kind: 'editorial', label: 'یادداشت', title: 'یادداشت تحریریه', topic: 'خوش‌آمدگویی', intro: [], blocks: art.editorial.blocks, readingMinutes: 2, n: -1 };
const list = [editorial, ...art.articles];          // reading order of the issue
const byId = Object.fromEntries(list.map((a) => [a.id, a]));
const RELATED = { 'sp-1': ['ch-5', 'ch-9'], 'sp-2': ['ch-4', 'ch-8'], 'sp-3': ['ch-5'], 'ch-9': ['ch-8', 'ch-4'] };
const expBy = Object.fromEntries(exps.map((e) => [e.id, e]));
const artHref = (a, root) => `${root}${ISS}/${a.slug}/index.html`;
const xpHref = (e, root) => `${root}experiences/${e.slug}/index.html`;
const totalMin = list.reduce((s, a) => s + a.readingMinutes, 0);
const labelOf = (a) => (a.kind === 'chapter' ? a.label : a.kind === 'special' ? a.label : a.label);

// ---------------- block rendering
const KMAP = { believe: 'believe', bug: 'bug', think: 'think', minute: 'think', exercise: 'think', note: 'think', lab: 'lab', summary: 'summary' };
function xpSlot(id, root) {
  const e = expBy[id]; if (!e) throw new Error('unknown experience ' + id);
  return `<div class="xp-slot" id="xp-${id}" data-xp="${id}" data-title="${esc(e.titleFa)}"><div class="xp-head"><div><div class="mono">${esc(e.experienceType)} · ${esc(e.difficulty)} · ${esc(e.estimatedDuration)}</div><h3>${inline(e.titleFa)}</h3><p>${inline(e.description)}</p>${e.editorialReview ? '<p><span class="tag w">پیش‌نویس برای بازبینی تحریریه</span></p>' : ''}</div><a href="${xpHref(e, root)}">صفحهٔ کامل تجربه</a></div><div class="xp-body"><noscript><p>برای اجرای این تجربه JavaScript لازم است. متن آموزشی همین بخش بدون آن هم در دسترس است.</p></noscript><div class="xp-load" role="status">در حال آماده‌سازی…</div></div></div>`;
}
/* glossary cross-references: first occurrence of each glossary term per article gets a small "i" mark */
const GLX = art.glossary.map((g, i) => ({ ...g, i })).sort((x, y) => y.term.length - x.term.length);
function inlineG(s, st, root) {
  st.gl = st.gl || new Set();
  const hits = [];
  for (const g of GLX) {
    if (st.gl.has(g.i)) continue;
    const re = new RegExp('(^|[^\\u0600-\\u06FF])(' + g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\u0600-\\u06FF])');
    const m = re.exec(s); if (!m) continue;
    const start = m.index + m[1].length, end = start + g.term.length;
    if (hits.some((h) => start < h.end && end > h.start)) continue;
    hits.push({ start, end, g }); st.gl.add(g.i);
  }
  if (!hits.length) return inline(s);
  hits.sort((x, y) => x.start - y.start);
  let out = '', pos = 0;
  for (const h of hits) {
    out += inline(s.slice(pos, h.start));
    out += `<span class="gl-w">${inline(s.slice(h.start, h.end))}</span><a class="gl-ref" href="${root}${ISS}/glossary/index.html#gl-${h.g.i}" data-term="${esc(h.g.term)}" data-def="${esc(h.g.def)}" aria-label="تعریف «${esc(h.g.term)}» در واژه‌نامه" title="واژه‌نامه: ${esc(h.g.term)}"><i aria-hidden="true">i</i></a>`;
    pos = h.end;
  }
  return out + inline(s.slice(pos));
}
function blocks(bs, aid, root, st) {
  return bs.map((b) => {
    if (b.t === 'p') return b.strong ? `<p><strong>${inline(b.x)}</strong></p>` : `<p>${inlineG(b.x, st, root)}</p>`;
    if (b.t === 'h2') { st.h2.push({ id: `${aid}-s${st.h2.length + 1}`, x: b.x }); return `<h2 id="${aid}-s${st.h2.length}">${inline(b.x)}</h2>`; }
    if (b.t === 'ex') return `<p class="ex${/[،و]/.test(b.x) ? ' fa' : ''}" dir="${/[،و]/.test(b.x) ? 'rtl' : 'ltr'}">${esc(b.x)}</p>`;
    if (b.t === 'list') return `<${b.ordered ? 'ol' : 'ul'}>${b.items.map((i) => `<li>${inlineG(i, st, root)}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
    if (b.t === 'xp') { st.xps.push(b.id); return xpSlot(b.id, root); }
    if (b.t === 'callout') {
      const k = KMAP[b.kind] || 'think'; const id = `${aid}-c${++st.c}`;
      if (b.kind === 'summary') st.summaryId = id;
      if (b.xp) st.xps.push(b.xp);
      if (b.kind !== 'summary' && b.kind !== 'believe' && b.kind !== 'bug') st.h2.push({ id, x: b.title, callout: true });
      return `<aside class="callout ${k}${b.xp ? ' has-xp' : ''}" id="${id}" data-kind="${b.kind}"><h3>${inline(b.title)}</h3>${blocks(b.blocks, aid, root, st)}${b.xp ? xpSlot(b.xp, root) : ''}</aside>`;
    }
    throw new Error('block ' + b.t);
  }).join('\n');
}
function renderArticle(a, root) {
  const st = { h2: [], xps: [], c: 0 };
  const intro = a.intro.length ? `<div class="intro">${blocks(a.intro, a.id, root, st)}</div>` : '';
  const body = blocks(a.blocks, a.id, root, st);
  return { html: intro + body, st };
}

// ---------------- page shell
const LOGO = '<svg viewBox="-39 -2 131 104" aria-hidden="true"><g stroke-linejoin="round" stroke-width="1.6" fill="#00C923" stroke="#00C923"><polygon points="0,0 38,20.6 38,34.6 0,14"/><polygon points="40,22.8 70,39 62,46 40,36.8"/><polygon points="0,86.3 72,42.4 72,56.4 0,100"/></g><g fill="#F5F7F3"><rect x="39.6" y="0" width="13.5" height="13.5" rx="4"/><rect x="61.3" y="86.5" width="13.5" height="13.5" rx="4"/><rect x="76.8" y="86.5" width="13.5" height="13.5" rx="4"/><rect x="-37" y="44" width="22" height="11.5" rx="2.6"/><rect x="-14.5" y="44" width="22" height="11.5" rx="2.6"/></g></svg>';
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-39 -2 131 104"><g fill="#00C923"><polygon points="0,0 38,20.6 38,34.6 0,14"/><polygon points="40,22.8 70,39 62,46 40,36.8"/><polygon points="0,86.3 72,42.4 72,56.4 0,100"/></g></svg>');
const NAV = [['خانه', 'index.html', 'home'], ['شماره‌ها', 'issues/index.html', 'issues'], ['تجربه‌ها', 'experiences/index.html', 'exp'], ['واژه‌نامه', `${ISS}/glossary/index.html`, 'glossary'], ['درباره', 'about/index.html', 'about'], ['جست‌وجو', 'search/index.html', 'search']];
const sitemap = [];
function page({ file, title, desc, nav, body, bodyAttr = '', scripts = [], og = 'website', ld = null, noindex = false, extraHead = '' }) {
  const root = '../'.repeat(file.split('/').length - 1);
  const url = file === 'index.html' ? '' : file.replace(/index\.html$/, '');
  const full = `${siteUrl}/${url}`;
  if (!noindex) sitemap.push(url);
  const t = title === site.name ? `${site.name} — ${site.nameFa}` : `${title} | ${site.name}`;
  const html = `<!doctype html>
<html lang="fa" dir="rtl" data-root="${root}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${full}">`}
<meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="${og}"><meta property="og:locale" content="fa_IR"><meta property="og:site_name" content="Next Bit"><meta property="og:url" content="${full}"><meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0A0B0A"><link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;500;700&family=Vazirmatn:wght@300..900&display=swap">
<link rel="stylesheet" href="${root}assets/styles.css">
${extraHead}${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
</head>
<body ${bodyAttr}>
<a class="skip" href="#main">پرش به محتوا</a>
<header class="site-h"><div class="in nav">
<a class="brand" href="${root}index.html" aria-label="Next Bit — خانه">${LOGO}<b>NEXT BIT</b></a>
<nav aria-label="ناوبری اصلی"><ul id="nav-list">${NAV.map(([l, h, k]) => `<li><a href="${root}${h}"${nav === k ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></nav>
<div class="nav-tools"><button class="ic-btn" id="motion-btn" type="button" aria-pressed="false" title="کاهش حرکت" aria-label="کاهش حرکت">◐</button><button class="ic-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="nav-list" aria-label="منو">☰</button></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-f"><div class="in"><div class="ft">
<div><b>Next Bit</b><p>${esc(site.tagline)}</p><p class="muted">${esc(site.university)}</p></div>
<div><b>بخوان</b><a href="${root}${ISS}/index.html">شمارهٔ اول</a><a href="${root}${ISS}/read/index.html">مطالعهٔ کامل</a><a href="${root}issues/index.html">آرشیو</a><a href="${root}${ISS}/glossary/index.html">واژه‌نامه</a><a href="${root}${ISS}/sources/index.html">منابع</a></div>
<div><b>تجربه کن</b><a href="${root}experiences/index.html">همهٔ تجربه‌ها</a><a href="${root}${ISS}/start/index.html">از کجا شروع کنیم؟</a><a href="${root}search/index.html">جست‌وجو</a></div>
<div><b>مشارکت</b><a href="${root}about/index.html">درباره</a><a href="${root}team/index.html">تیم</a><a href="${root}submit/index.html">ارسال مقاله</a><a href="${root}collaborate/index.html">همکاری</a><a href="${root}contact/index.html">تماس</a></div>
</div><div class="ft-end">NEXT BIT · ${esc(site.universityEn || 'University of Kashan')} · static site</div></div></footer>
<script src="${root}assets/app.js" defer></script>
${scripts.map((s) => `<script src="${root}assets/${s}" defer></script>`).join('\n')}
</body></html>`;
  write(file, html);
}
const bar = (root, items) => items;

// ---------------- cover
function cover() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cells = Array.from({ length: 56 }, () => { const g = rnd() > 0.78; return `<i${g ? ' class="g"' : ''}>${rnd() > 0.5 ? 1 : 0}</i>`; }).join('');
  return `<div class="cover" role="img" aria-label="جلد شمارهٔ ۱ نکست بیت: از صفر و یک تا آینده"><div class="mx" aria-hidden="true">${cells}</div><div><div class="tl-line">ISSUE 01</div><h2>از <em>صفر و یک</em><br>تا آینده</h2></div><div class="tl-line" style="margin:0">NEXT BIT</div></div>`;
}

// ---------------- HOME
{
  const featured = [list.find((a) => a.id === 'ch-0'), list.find((a) => a.id === 'ch-2'), list.find((a) => a.id === 'ch-8')];
  const expPick = ['bit-lab', 'logic-lab', 'sorting-visualizer', 'timeline-explorer'].map((i) => expBy[i]);
  page({
    file: 'index.html', title: site.name, nav: 'home', desc: site.description, og: 'website',
    ld: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Next Bit', inLanguage: 'fa', description: site.description, url: siteUrl + '/' },
    body: `<section class="dark hero"><div class="in hg"><div>
<div class="tl-line">ISSUE 01 · <span class="cur">▍</span></div>
<h1>نشریه‌ای که<br>فقط <em>خوانده</em> نمی‌شود،<br>اجرا هم می‌شود.</h1>
<p class="lead">مقاله، محیط مطالعه و آزمایشگاه‌های تعاملی برای دانشجویان و علاقه‌مندان کامپیوتر؛ از چوب‌خط تا هوش مصنوعی.</p>
<div class="cta"><a class="btn" href="${ISS}/index.html">شمارهٔ اول را بخوان</a><a class="btn o" href="experiences/index.html">تجربه‌ها را امتحان کن</a></div></div>
<svg class="mk" viewBox="-39 -2 131 104" role="img" aria-label="لوگوی Next Bit"><g stroke-linejoin="round" stroke-width="1.6" fill="#00C923" stroke="#00C923"><g class="pc" style="--dx:-30px;--dy:-18px;--d:.05s"><polygon points="0,0 38,20.6 38,34.6 0,14"/></g><g class="pc" style="--dx:30px;--dy:0;--d:.2s"><polygon points="40,22.8 70,39 62,46 40,36.8"/></g><g class="pc" style="--dx:-30px;--dy:18px;--d:.35s"><polygon points="0,86.3 72,42.4 72,56.4 0,100"/></g></g><g fill="#F5F7F3"><rect x="39.6" y="0" width="13.5" height="13.5" rx="4"/><rect x="61.3" y="86.5" width="13.5" height="13.5" rx="4"/><rect x="76.8" y="86.5" width="13.5" height="13.5" rx="4"/><rect x="-37" y="44" width="22" height="11.5" rx="2.6"/><rect x="-14.5" y="44" width="22" height="11.5" rx="2.6"/></g></svg></div></section>
<section class="sec"><div class="in iss"><a href="${ISS}/index.html" aria-label="شمارهٔ اول">${cover()}</a><div>
<div class="eb">LATEST ISSUE</div><h2 class="h2">شمارهٔ ${toFa(issue.number)}: ${esc(issue.title)}</h2><p class="lead" style="margin-top:16px">${esc(issue.subtitle)}</p>
<div class="meta"><div><b>CHAPTERS</b>${toFa(art.articles.filter((a) => a.kind === 'chapter').length)} فصل + ${toFa(art.articles.filter((a) => a.kind === 'special').length)} پرونده ویژه</div><div><b>READING</b>حدود ${toFa(totalMin)} دقیقه</div><div><b>EXPERIENCES</b>${toFa(exps.length)} تجربهٔ تعاملی</div></div>
<div class="cta"><a class="btn k" href="${ISS}/read/index.html#flipbook">ورق بزن (Flipbook)</a><a class="btn ko" href="${ISS}/read/index.html#reading">مطالعهٔ پیوسته</a><a class="btn ko" href="${ISS}/read/index.html#interactive">فقط تجربه‌ها</a></div></div></div></section>
<section class="sec" style="background:var(--paper2)"><div class="in"><div class="eb">START ANYWHERE</div><h2 class="h2">از هر جا شروع کن</h2>
<div class="cards" style="margin-top:32px">${featured.map((a) => `<a class="xcard" href="${artHref(a, '')}"><span class="mt">${esc(a.label)} · ${toFa(a.readingMinutes)} دقیقه</span><h3>${inline(a.title)}</h3><p>${inline(a.topic)}</p></a>`).join('')}</div></div></section>
<section class="sec"><div class="in"><div class="eb">TRY IT</div><h2 class="h2">یاد بگیر، با دست خودت</h2>
<div class="cards" style="margin-top:32px">${expPick.map((e) => `<a class="xcard" href="${xpHref(e, '')}"><span class="mt">${esc(e.experienceType)} · ${esc(e.estimatedDuration)}</span><h3>${inline(e.titleFa)}</h3><p>${inline(e.description)}</p></a>`).join('')}</div></div></section>
<section class="dark sec"><div class="in"><div class="eb">FOR WHO</div><h2 class="h2">برای کی؟</h2><div class="aud"><div><h3>اگر هیچ نمی‌دانی</h3><p>از «چوب‌خط» شروع می‌کنیم. اصطلاح‌ها در اولین استفاده توضیح داده می‌شوند.</p></div><div><h3>اگر دانشجوی کامپیوتری</h3><p>هر جا لازم باشد عمیق‌تر می‌شویم و بین واقعیت، پژوهش و سناریو فرق می‌گذاریم.</p></div><div><h3>اگر کنجکاوی</h3><p>هر فصل یک تجربهٔ تعاملی دارد؛ قبل از خواندن توضیح، خودت امتحانش کن.</p></div></div></div></section>`
  });
}

// ---------------- ISSUES archive
{
  const cards = issuesData.issues.map((i) => i.status === 'published'
    ? `<a class="cd" href="${i.slug}/index.html" data-title="${esc(i.title)} ${esc(i.topic || '')}" data-cat="${esc((i.categories || []).join(' '))}" data-num="${i.number}"><div class="cv">${'<div class="tl-line">ISSUE ' + String(i.number).padStart(2, '0') + '</div>'}<h3 style="color:var(--paper);font-size:30px;font-weight:900">${esc(i.title)}</h3></div><h3>${esc(i.title)}</h3><p class="muted">${esc(i.summary)}</p></a>`
    : `<div class="cd" data-title="${esc(i.title)}" data-cat="" data-num="${i.number}"><div class="cv up"><div class="tl-line" style="color:var(--slate)">ISSUE ${String(i.number).padStart(2, '0')}</div><h3 style="font-size:26px">به‌زودی</h3></div><h3>${esc(i.title)}</h3><p class="muted">${esc(i.summary)}</p></div>`).join('');
  page({
    file: 'issues/index.html', title: 'آرشیو شماره‌ها', nav: 'issues', desc: 'همهٔ شماره‌های نشریهٔ Next Bit؛ جست‌وجو و فیلتر بر اساس موضوع.',
    body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">ARCHIVE</div><h1 class="h1">آرشیو شماره‌ها</h1></div></section>
<div class="in"><div class="ctl" role="search"><label class="vh" for="ar-q">جست‌وجوی شماره</label><input id="ar-q" class="inp" type="search" placeholder="جست‌وجو در عنوان و موضوع…" data-archive-q><div class="chips" role="group" aria-label="وضعیت"><button class="chip" type="button" data-archive-f="all" aria-pressed="true">همه</button><button class="chip" type="button" data-archive-f="pub" aria-pressed="false">منتشرشده</button></div></div>
<div class="gr" id="ar-grid">${cards}</div><p id="ar-empty" class="empty" hidden><b>موردی پیدا نشد</b>عبارت دیگری را امتحان کن.</p></div>`
  });
}

// ---------------- ARTICLE pages + reader
const rel = (a) => (RELATED[a.id] || []).map((i) => byId[i]);
function srcBlock(a, root) {
  const ids = (src.byChapter[a.id] || []);
  const items = ids.map((i) => src.sources[i]).filter(Boolean).map((s) => `<li>${esc(s.author)}، <i>${esc(s.title)}</i>${s.venue ? '، ' + esc(s.venue) : ''}${s.year ? ' (' + esc(String(s.year)) + ')' : ''}${s.url ? ` — <a href="${s.url}" rel="noopener" target="_blank">پیوند</a>` : ''}</li>`).join('');
  return `<section class="src" aria-labelledby="${a.id}-src"><h2 id="${a.id}-src">منابع پیشنهادی برای راستی‌آزمایی</h2><p class="nt">متن این بخش ارجاع درون‌متنی ندارد؛ فهرست زیر نقطهٔ شروع بررسی تحریریه است، نه تأیید ادعاهای تک‌تک جمله‌ها. ${items ? '' : 'برای این بخش هنوز منبع مشخصی ثبت نشده است؛ '}<a href="${root}${ISS}/sources/index.html">فهرست عمومی منابع شماره</a></p>${items ? `<ol>${items}</ol>` : ''}</section>`;
}
function toolbar(root, a, mode) {
  return `<div class="rd-bar" id="rd-bar"><div class="in rd-in"><a class="b" href="${root}${ISS}/index.html">← ${a ? 'فهرست شماره' : 'شمارهٔ اول'}</a>
<div class="md" role="group" aria-label="حالت مطالعه">${mode === 'reader' ? '<button type="button" data-mode="flip" aria-pressed="false">Flipbook</button>' : `<a class="b" style="border:0;padding:0 14px;color:var(--green)" href="${root}${ISS}/read/index.html#flipbook">Flipbook</a>`}<button type="button" data-mode="reading" aria-pressed="true">مطالعهٔ مدرن</button><button type="button" data-mode="interactive" aria-pressed="false">تعاملی</button></div>
<div class="md" role="group" aria-label="اندازهٔ متن"><button type="button" data-fs="-1" aria-label="کوچک‌تر کردن متن">A−</button><button type="button" data-fs="1" aria-label="بزرگ‌تر کردن متن">A+</button></div></div><div class="prog" aria-hidden="true"><i id="prog-i"></i></div></div>`;
}
list.forEach((a, idx) => {
  const { html, st } = renderArticle(a, '../../../');
  const prev = list[idx - 1], next = list[idx + 1];
  const exs = [...new Set(st.xps)].map((i) => expBy[i]).filter(Boolean);
  const exRel = exps.filter((e) => e.relatedChapters.includes(a.id) && !st.xps.includes(e.id));
  const rels = rel(a);
  const root = '../../../';
  const toc = st.h2.map((h) => `<a href="#${h.id}">${inline(h.x)}</a>`).join('');
  const desc = (a.intro[0] ? a.intro[0].x : a.blocks.find((b) => b.t === 'p')?.x || a.title).slice(0, 200);
  page({
    file: `${ISS}/${a.slug}/index.html`, title: `${a.title}`, nav: 'issues', desc, og: 'article', bodyAttr: 'data-mode="reading" data-article="' + a.id + '"', scripts: [],
    ld: { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, inLanguage: 'fa', isPartOf: { '@type': 'PublicationIssue', issueNumber: issue.number, name: issue.title } },
    body: `${toolbar(root, a, 'article')}
<section class="rd-head"><div class="in"><div class="kk">${esc(a.kind === 'editorial' ? 'EDITORIAL' : a.kind === 'chapter' ? 'CHAPTER ' + String(a.n).padStart(2, '0') : 'SPECIAL ' + String(a.n).padStart(2, '0'))} · ${toFa(a.readingMinutes)} دقیقه</div><p class="sub" style="margin:0 0 8px">${esc(a.label)}</p><h1>${inline(a.title)}</h1></div></section>
<div class="in rd-body"><aside class="rd-toc" aria-label="فهرست این بخش"><b>CONTENTS</b>${toc || '<span class="muted">—</span>'}</aside>
<article class="prose" lang="fa"><div class="back-note"><span>حالت «تعاملی» فقط تجربه‌های این بخش را نشان می‌دهد.</span><button class="btn sm ko" type="button" data-mode="reading">بازگشت به متن</button></div>
${html}
${a.kind !== 'editorial' ? srcBlock(a, root) : ''}
${exRel.length || rels.length ? `<section class="src-hide"><h2 style="font-size:22px;margin:2em 0 .4em">ادامه بده</h2><div class="rel">${exRel.map((e) => `<a href="${xpHref(e, root)}">تجربه: ${inline(e.titleFa)}</a>`).join('')}${rels.map((r) => `<a href="${artHref(r, root)}">مرتبط: ${inline(r.title.split('؛')[0])}</a>`).join('')}</div></section>` : ''}
<nav class="pn-nav src-hide" aria-label="قبلی و بعدی">${next ? `<a href="${artHref(next, root)}" rel="next"><small>NEXT →</small><b>${inline(next.title)}</b></a>` : `<a href="${root}${ISS}/glossary/index.html"><small>NEXT →</small><b>واژه‌نامه زنده</b></a>`}${prev ? `<a href="${artHref(prev, root)}" rel="prev"><small>← PREVIOUS</small><b>${inline(prev.title)}</b></a>` : `<a href="${root}${ISS}/index.html"><small>← ISSUE</small><b>صفحهٔ شماره</b></a>`}</nav>
</article></div>`
  });
});

// extra article-like pages (glossary, start, behind=about, sources)
const gl = art.glossary;
page({
  file: `${ISS}/glossary/index.html`, title: 'واژه‌نامه زنده', nav: 'glossary', desc: 'تعریف اصطلاحات شمارهٔ اول: الگوریتم، بیت، بایت، ترانزیستور، سیستم‌عامل، کامپایلر، شبکه و هوش مصنوعی.',
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">GLOSSARY</div><h1 class="h1">واژه‌نامه زنده</h1><p class="lead">اصطلاح‌های این شماره با تعریف کوتاه.</p></div></section>
<div class="in sec"><div class="ctl"><label class="vh" for="gl-q">جست‌وجو در واژه‌نامه</label><input id="gl-q" class="inp" type="search" placeholder="جست‌وجوی اصطلاح…" data-glossary-q></div><dl class="glo" id="gl-list" style="margin:0">${gl.map((g, gi) => `<div id="gl-${gi}" data-t="${esc(g.term + ' ' + g.def)}"><dt><b style="font-family:var(--fa);direction:rtl">${inline(g.term)}</b></dt><dd style="margin:6px 0 0">${inline(g.def)}</dd></div>`).join('')}</dl><p id="gl-empty" class="empty" hidden><b>اصطلاحی پیدا نشد</b></p></div>`
});
page({
  file: `${ISS}/start/index.html`, title: art.start.title, nav: 'issues', desc: 'پیشنهاد مسیر یادگیری بعد از شمارهٔ اول، بر اساس علاقه: سخت‌افزار، برنامه‌نویسی، شبکه و هوش مصنوعی.',
  body: `<section class="rd-head"><div class="in"><div class="kk">NEXT STEPS</div><h1>${inline(art.start.title)}</h1></div></section><div class="in" style="padding-block:48px"><article class="prose">${blocks(art.start.blocks, 'start', '../../../', { h2: [], xps: [], c: 0 })}</article></div>`
});
page({
  file: `${ISS}/sources/index.html`, title: art.sources.title, nav: 'issues', desc: 'فهرست منابع پیشنهادی برای بررسی علمی و تاریخی مطالب شمارهٔ اول.',
  body: `<section class="rd-head"><div class="in"><div class="kk">SOURCES</div><h1>${inline(art.sources.title)}</h1></div></section><div class="in" style="padding-block:48px"><article class="prose">${art.sources.intro.map((p) => `<p>${inline(p)}</p>`).join('')}
<ol>${art.sources.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>
<div class="draft-note"><b>یادداشت ویراستاری.</b> ${inline(art.sources.editorNote)}</div>
<h2>صفحهٔ اصلی سازمان‌های نام‌برده‌شده</h2><p class="muted">این پیوندها فقط به صفحهٔ اصلی سازمان می‌روند و به‌تنهایی منبع هیچ ادعای مشخصی نیستند.</p>
<div class="rel">${src.orgs.map((o) => `<a href="${o.url}" rel="noopener" target="_blank"><bdi class="en" dir="ltr">${esc(o.name)}</bdi></a>`).join('')}</div>
<h2>مراجع پیشنهادی برای راستی‌آزمایی بخش‌ها</h2><p class="muted">این مراجع توسط تیم فنی به‌عنوان نقطهٔ شروع بررسی پیشنهاد شده‌اند و جزء متن اصلی نشریه نیستند.</p>
<ol>${Object.values(src.sources).map((s) => `<li>${esc(s.author)}، <i>${esc(s.title)}</i>${s.venue ? '، ' + esc(s.venue) : ''}${s.year ? ' (' + esc(String(s.year)) + ')' : ''}${s.url ? ` — <a href="${s.url}" rel="noopener" target="_blank">پیوند</a>` : ''}</li>`).join('')}</ol></article></div>`
});

// READER (whole issue)
{
  const root = '../../../';
  const secs = list.map((a) => {
    const { html, st } = renderArticle(a, root);
    return `<section class="art-sec" id="${a.slug}" data-id="${a.id}" data-title="${esc(a.title)}" data-label="${esc(a.label)}"><header class="sec-h"><div class="kk mono">${esc(a.label)}</div><h2 class="sec-t">${inline(a.title)}</h2></header><div class="prose" lang="fa">${html}</div></section>`;
  }).join('');
  const tocs = list.map((a) => `<a href="#${a.slug}" data-sec="${a.slug}">${a.kind === 'chapter' ? toFa(a.n) + '. ' : ''}${inline(a.title.split('؛')[0].split(':')[0])}</a>`).join('');
  page({
    file: `${ISS}/read/index.html`, title: 'مطالعهٔ کامل شمارهٔ اول', nav: 'issues', desc: 'متن کامل شمارهٔ اول Next Bit در سه حالت: Flipbook، مطالعهٔ مدرن و تعاملی.', bodyAttr: 'data-mode="reading" data-reader="1"', scripts: ['reader.js'],
    body: `${toolbar(root, null, 'reader')}
<div class="reading-wrap"><div class="in rd-body"><aside class="rd-toc" aria-label="فهرست شماره"><b>CONTENTS</b>${tocs}<a href="${root}${ISS}/glossary/index.html">واژه‌نامه زنده</a><a href="${root}${ISS}/start/index.html">از کجا شروع کنیم؟</a><a href="${root}${ISS}/sources/index.html">منابع</a></aside>
<div><div class="back-note"><span>حالت «تعاملی»: فقط تجربه‌های هر فصل نمایش داده می‌شود.</span><button class="btn sm ko" type="button" data-mode="reading">بازگشت به متن</button></div>${secs}</div></div></div>
<div class="flip-wrap" id="flip-wrap" aria-label="Flipbook شمارهٔ اول"><div class="stage" id="stage" tabindex="0" aria-roledescription="کتاب ورق‌خور" aria-label="کتاب. با کلیدهای چپ و راست ورق بزن."><div class="fb-load" id="fb-load">در حال آماده‌سازی صفحه‌ها…</div></div>
<div class="fb-ctl"><button type="button" id="fb-next">صفحهٔ بعد</button><span class="pgs" id="fb-pgs" aria-live="polite">—</span><button type="button" id="fb-prev">صفحهٔ قبل</button><button type="button" id="fb-fs" class="fs-btn" aria-pressed="false">تمام‌صفحه</button></div>
<div class="fb-jump"><button type="button" id="fb-exit" class="fs-only" aria-label="خروج از تمام‌صفحه">✕ خروج</button><button type="button" class="fs-only" data-fs="-1" aria-label="کوچک‌تر کردن متن">A−</button><button type="button" class="fs-only" data-fs="1" aria-label="بزرگ‌تر کردن متن">A+</button><label for="fb-ch">فصل:</label><select id="fb-ch"></select><label for="fb-pg">صفحه:</label><input id="fb-pg" type="number" min="1" inputmode="numeric" style="width:90px"><button type="button" class="chip" id="fb-go" style="color:var(--paper);background:transparent;border-color:var(--line-d)">برو</button></div>
<p class="fb-hint">کلید ← صفحهٔ بعد · کلید → صفحهٔ قبل · کلید F تمام‌صفحه · با ماوس یا انگشت صفحه را بکش و ورق بزن · در موبایل با کشیدن انگشت ورق بزن · تجربه‌های تعاملی با دکمهٔ «اجرا» در پنجرهٔ جدا باز می‌شوند.</p></div>
<dialog id="xp-dialog" class="xp-dialog" aria-label="تجربهٔ تعاملی"><button type="button" class="btn sm" id="xp-close" style="margin:12px">بستن ✕</button><div id="xp-dialog-body"></div></dialog>
<noscript><p class="draft-note in">برای حالت Flipbook و تجربه‌ها JavaScript لازم است؛ متن کامل بالا بدون آن هم خوانا است.</p></noscript>`
  });
}

// ---------------- ISSUE landing
{
  const root = '../../';
  const rows = list.map((a) => `<a class="ar" href="${artHref(a, root)}"><span class="n">${a.kind === 'chapter' ? String(a.n).padStart(2, '0') : a.kind === 'special' ? 'SP' : '✎'}</span><div><h3>${inline(a.title)}</h3><p>${inline(a.topic)}</p></div><span class="mt">${toFa(a.readingMinutes)} MIN</span></a>`).join('');
  const nextI = issuesData.issues.find((i) => i.number === issue.number + 1);
  page({
    file: `${ISS}/index.html`, title: `شمارهٔ ${issue.number}: ${issue.title}`, nav: 'issues', desc: issue.subtitle, og: 'book',
    ld: { '@context': 'https://schema.org', '@type': 'PublicationIssue', issueNumber: issue.number, name: issue.title, description: issue.subtitle, inLanguage: 'fa', isPartOf: { '@type': 'Periodical', name: 'Next Bit' } },
    body: `<section class="dark hero"><div class="in sec"><div class="iss">${cover()}<div><div class="eb">ISSUE ${String(issue.number).padStart(2, '0')}</div><h1 class="h1">${esc(issue.title)}</h1><p class="lead" style="margin-top:16px">${esc(issue.subtitle)}</p>
<div class="cta" style="margin-top:28px"><a class="btn" href="read/index.html#flipbook">Flipbook</a><a class="btn o" href="read/index.html#reading">مطالعهٔ مدرن</a><a class="btn o" href="read/index.html#interactive">تعاملی</a></div></div></div></div></section>
<section class="sec"><div class="in"><div class="meta"><div><b>TOPIC</b>${esc(issue.topic)}</div><div><b>CONTENT</b>${toFa(art.articles.filter((a) => a.kind === 'chapter').length)} فصل · ${toFa(art.articles.filter((a) => a.kind === 'special').length)} پرونده</div><div><b>READING TIME</b>حدود ${toFa(totalMin)} دقیقه</div><div><b>EXPERIENCES</b>${toFa(exps.length)} تجربه</div><div><b>PUBLISHED</b>${issue.publishedAt ? esc(issue.publishedAt) : 'تاریخ ثبت نشده'}</div></div>
<p class="lead" style="max-width:70ch">${esc(issue.summary)}</p>
<div class="eb" style="margin-top:48px">TABLE OF CONTENTS</div><h2 class="h2" style="margin-bottom:24px">فهرست مطالب</h2><div class="toc-l">${rows}</div>
<div class="toc-l" style="margin-top:32px"><a class="ar" href="glossary/index.html"><span class="n">A–Z</span><div><h3>واژه‌نامه زنده</h3></div><span class="mt"></span></a><a class="ar" href="start/index.html"><span class="n">→</span><div><h3>از کجا شروع کنیم؟</h3></div><span class="mt"></span></a><a class="ar" href="sources/index.html"><span class="n">REF</span><div><h3>منابع و مطالعهٔ بیشتر</h3></div><span class="mt"></span></a></div>
<h2 class="h2" style="margin-top:64px">تجربه‌های این شماره</h2><div class="cards" style="margin-top:24px">${exps.map((e) => `<a class="xcard" href="${xpHref(e, root)}"><span class="mt">${esc(e.experienceType)}</span><h3>${inline(e.titleFa)}</h3></a>`).join('')}</div>
<div class="pn-nav"><a href="${root}issues/index.html"><small>← ARCHIVE</small><b>آرشیو شماره‌ها</b></a><a href="${root}issues/index.html">${nextI ? `<small>NEXT ISSUE →</small><b>${esc(nextI.title)} (${nextI.status === 'upcoming' ? 'به‌زودی' : ''})</b>` : '<small>NEXT ISSUE →</small><b>هنوز اعلام نشده</b>'}</a></div></div></section>`
  });
}

// ---------------- experiences hub + pages
page({
  file: 'experiences/index.html', title: 'تجربه‌های تعاملی', nav: 'exp', desc: 'آزمایشگاه‌های تعاملی Next Bit: بیت، گیت منطقی، مرتب‌سازی، ماشین آموزشی، خط زمانی و آینده محاسبات.',
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">EXPERIENCES</div><h1 class="h1">تجربه‌ها</h1><p class="lead">هر تجربه یک مفهوم همان مقاله را آموزش می‌دهد.</p></div></section><div class="in sec"><div class="ctl"><div class="chips" role="group" aria-label="دسته">${['همه', ...new Set(exps.map((e) => e.category))].map((c, i) => `<button class="chip" type="button" data-xf="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join('')}</div></div><div class="xh" style="margin-top:28px">${exps.map((e) => `<a href="${e.slug}/index.html" data-cat="${esc(e.category)}"><div><div class="tags"><span class="tag">${esc(e.experienceType)}</span><span class="tag s">${esc(e.estimatedDuration)}</span>${e.editorialReview ? '<span class="tag w">پیش‌نویس</span>' : ''}</div><h3 style="margin-top:12px">${inline(e.titleFa)}</h3><p>${inline(e.description)}</p></div><span class="mono">${e.relatedChapters.map((c) => byId[c]?.label).filter(Boolean).join(' · ')}</span></a>`).join('')}</div></div>`
});
exps.forEach((e) => {
  const root = '../../';
  page({
    file: `experiences/${e.slug}/index.html`, title: `${e.titleFa} (${e.title})`, nav: 'exp', desc: e.description, og: 'website', bodyAttr: 'data-mode="reading"',
    body: `<section class="rd-head"><div class="in"><div class="kk">${esc(e.experienceType.toUpperCase())} · ${esc(e.estimatedDuration)} · ${esc(e.difficulty)}</div><h1>${inline(e.titleFa)} <span class="mono" style="font-size:.5em;color:var(--green)">${esc(e.title)}</span></h1><p class="sub">${inline(e.description)}</p>${e.editorialReview ? '<p style="margin-top:12px"><span class="tag w">پیش‌نویس برای بازبینی تحریریه</span></p>' : ''}</div></section>
<div class="in" style="padding-block:40px"><div class="prose" style="max-width:960px"><div><h2 style="font-size:22px">راهنمای گام‌به‌گام</h2><ol>${e.instructions.map((s) => `<li>${inline(s)}</li>`).join('')}</ol></div>${xpSlot(e.id, root)}
<h2 style="font-size:22px">مربوط به</h2><div class="rel">${e.relatedChapters.map((c) => byId[c]).filter(Boolean).map((a) => `<a href="${artHref(a, root)}">${esc(a.label)}: ${inline(a.title.split('؛')[0].split(':')[0])}</a>`).join('') || '<span class="muted">—</span>'}<a href="${root}experiences/index.html">همهٔ تجربه‌ها</a></div></div></div>`
  });
});

// ---------------- about, team, forms, search, 404
const contactRows = Object.entries({ ایمیل: site.contact.email, اینستاگرام: site.contact.instagram, گیت‌هاب: site.contact.github, تلگرام: site.contact.telegram }).map(([k, v]) => `<div><b>${k}</b>${v ? esc(v) : '<span class="muted">ثبت نشده</span>'}</div>`).join('');
page({
  file: 'about/index.html', title: 'درباره Next Bit', nav: 'about', desc: 'Next Bit نشریهٔ دیجیتال و تعاملی دانشجویی مهندسی کامپیوتر دانشگاه کاشان است: چرا ساخته شد، برای کیست و چطور می‌شود در آن مشارکت کرد.',
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">ABOUT</div><h1 class="h1">پشت صحنه Next Bit</h1></div></section>
<div class="in" style="padding-block:48px"><article class="prose">${blocks(art.behind.blocks, 'about', '../', { h2: [], xps: [], c: 0 })}
<h2>هدف</h2><p>${esc(site.description)}</p>
<h2>شماره‌های منتشرشده</h2><p><a href="../${ISS}/index.html"><b>شمارهٔ ۱ — ${esc(issue.title)}</b></a></p>
<h2>تیم</h2>${team.members.length ? '' : '<div class="empty"><b>اطلاعات اعضای تیم هنوز ثبت نشده</b>پس از دریافت اطلاعات واقعی، این بخش تکمیل می‌شود.</div>'}
<h2>راه‌های ارتباطی</h2><div class="meta">${contactRows}</div>
<div class="cta"><a class="btn k" href="../submit/index.html">ارسال مقاله</a><a class="btn ko" href="../collaborate/index.html">همکاری</a><a class="btn ko" href="../contact/index.html">تماس</a></div></article></div>`
});
page({ file: 'team/index.html', title: 'تیم', nav: 'about', desc: 'تیم تحریریه Next Bit.', body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">TEAM</div><h1 class="h1">تیم Next Bit</h1></div></section><div class="in sec">${team.members.length ? `<div class="cards">${team.members.map((m) => `<div class="xcard"><h3>${esc(m.name)}</h3><p>${esc(m.role || '')}</p></div>`).join('')}</div>` : '<div class="empty"><b>اطلاعات اعضای تیم هنوز ثبت نشده</b>اعضا را در فایل <span class="mono">content/team.json</span> اضافه کنید؛ این صفحه به‌صورت خودکار ساخته می‌شود.</div>'}</div>` });
const formPage = (file, title, desc, kind, fields) => page({
  file, title, nav: 'about', desc,
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">${kind.toUpperCase()}</div><h1 class="h1">${title}</h1><p class="lead">${esc(desc)}</p></div></section>
<div class="in sec"><div class="draft-note" style="max-width:720px;margin-bottom:24px">این سایت استاتیک است و فرم را به هیچ سروری نمی‌فرستد. با زدن «ساخت پیام» متن آمادهٔ ارسال ساخته می‌شود و می‌توانی آن را کپی کنی${site.contact.email ? ' یا با ایمیل بفرستی' : '؛ راه ارتباطی رسمی هنوز ثبت نشده است'}.</div>
<form class="fm" data-nb-form="${kind}" data-email="${esc(site.contact.email)}" novalidate>${fields.map((f) => `<div><label for="f-${f.n}">${f.l}${f.r ? ' *' : ''}</label>${f.ta ? `<textarea class="ta" id="f-${f.n}" name="${f.n}"${f.r ? ' required' : ''}></textarea>` : `<input class="inp" id="f-${f.n}" name="${f.n}" type="${f.type || 'text'}"${f.r ? ' required' : ''}>`}<div class="er" aria-live="polite"></div></div>`).join('')}<div><button class="btn k" type="submit">ساخت پیام</button></div></form>
<div class="fm-out" id="fm-out" role="status"><b>پیام آمادهٔ ارسال</b><pre id="fm-pre"></pre><div class="cta"><button class="btn sm k" type="button" id="fm-copy">کپی متن</button><a class="btn sm ko" id="fm-mail" href="#" hidden>باز کردن در ایمیل</a></div></div></div>`
});
formPage('submit/index.html', 'ارسال مقاله', 'ایدهٔ مقاله یا موضوع پیشنهادی‌ات را با ما در میان بگذار.', 'submit', [{ n: 'name', l: 'نام', r: 1 }, { n: 'topic', l: 'موضوع پیشنهادی', r: 1 }, { n: 'summary', l: 'خلاصهٔ ایده', ta: 1, r: 1 }, { n: 'level', l: 'سطح مخاطب (مبتدی/متوسط/پیشرفته)' }]);
formPage('collaborate/index.html', 'همکاری با Next Bit', 'نویسنده، طراح، برنامه‌نویس بازی، پژوهشگر یا ویراستار؟ بگو چه کاری از دستت برمی‌آید.', 'collaborate', [{ n: 'name', l: 'نام', r: 1 }, { n: 'role', l: 'نقش موردعلاقه', r: 1 }, { n: 'about', l: 'کمی از تجربه‌ات بگو', ta: 1, r: 1 }, { n: 'links', l: 'پیوند نمونه‌کار (اختیاری)' }]);
formPage('contact/index.html', 'تماس', 'پیام، سؤال یا گزارش خطا.', 'contact', [{ n: 'name', l: 'نام', r: 1 }, { n: 'msg', l: 'پیام', ta: 1, r: 1 }]);
page({ file: 'search/index.html', title: 'جست‌وجو', nav: 'search', desc: 'جست‌وجو در متن مقاله‌ها، تجربه‌ها، واژه‌نامه و خط زمانی Next Bit.', scripts: ['search-index.js'], body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">SEARCH</div><h1 class="h1">جست‌وجو</h1></div></section><div class="in sec"><div class="ctl" role="search"><label class="vh" for="s-q">عبارت جست‌وجو</label><input id="s-q" class="inp" type="search" placeholder="مثلاً: ترانزیستور، ENIAC، بیت…" autocomplete="off"></div><p id="s-count" class="muted" role="status" aria-live="polite"></p><div class="res" id="s-res"></div></div>` });
write('404.html', `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>صفحه پیدا نشد | Next Bit</title><meta name="robots" content="noindex"><style>body{margin:0;background:#0A0B0A;color:#F5F7F3;font-family:Vazirmatn,Tahoma,sans-serif;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px}h1{font:900 clamp(56px,12vw,120px)/1 monospace;color:#00C923;margin:0}a{color:#00C923;font-weight:800}</style></head><body><div><h1>404</h1><p>این صفحه وجود ندارد؛ شاید بیتش اشتباه بود!</p><p><a href="/">خانه</a> · <a href="issues/index.html">آرشیو</a></p></div></body></html>`);

// ---------------- data & search index
const strip = (bs) => bs.map((b) => b.t === 'callout' ? b.title + ' ' + strip(b.blocks) : b.t === 'list' ? b.items.join(' ') : b.t === 'xp' ? '' : (b.x || '')).join(' ');
const SI = [];
list.forEach((a) => SI.push({ k: 'مقاله', t: a.title, u: `${ISS}/${a.slug}/index.html`, x: strip(a.intro) + ' ' + strip(a.blocks) }));
exps.forEach((e) => SI.push({ k: 'تجربه', t: `${e.titleFa} ${e.title}`, u: `experiences/${e.slug}/index.html`, x: e.description + ' ' + e.instructions.join(' ') }));
gl.forEach((g) => SI.push({ k: 'واژه‌نامه', t: g.term, u: `${ISS}/glossary/index.html`, x: g.def }));
timeline.events.forEach((e) => SI.push({ k: 'خط زمانی', t: e.title, u: 'experiences/timeline-explorer/index.html', x: `${e.date} ${e.description} ${e.significance}` }));
write('assets/search-index.js', 'window.NB_SEARCH=' + JSON.stringify(SI) + ';');
write('assets/data.js', 'window.NB_DATA=' + JSON.stringify({ timeline, articles: list.map((a) => ({ id: a.id, slug: a.slug, title: a.title, label: a.label })), siteContact: site.contact, issue: `${ISS}`, sources: src.sources }) + ';');
fs.cpSync('src/assets', path.join(OUT, 'assets'), { recursive: true });

// ---------------- sitemap, robots
const smUrls = [...new Set(sitemap)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smUrls.map((u) => `<url><loc>${siteUrl}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log('built', smUrls.length, 'pages', placeholderUrl ? '| WARNING: siteUrl is a placeholder (content/site.json) — canonical/OG/sitemap URLs must be updated before publishing' : '');
