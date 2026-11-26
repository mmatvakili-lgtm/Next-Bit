// Next Bit static site builder: content/*.json -> dist/
import fs from "node:fs";
import path from "node:path";
const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const site = rd("content/site.json"),
  issuesData = rd("content/issues.json"),
  team = rd("content/team.json");
const exps = rd("content/experiences.json").experiences,
  timeline = rd("content/timeline.json"),
  src = rd("content/sources.json");
const OUT = "dist";

// Preserve generated PDF across rebuilds so `node build.mjs` never deletes it
const pdfDist = path.join(OUT, "nextbit-issue-01.pdf");
const pdfCache = "content/issue-01/nextbit-issue-01.pdf";
if (fs.existsSync(pdfDist)) fs.copyFileSync(pdfDist, pdfCache);
if (fs.existsSync("content/issue-01/nextbit-issue-01-dark.pdf")) {
  fs.copyFileSync(
    "content/issue-01/nextbit-issue-01-dark.pdf",
    path.join(OUT, "nextbit-issue-01-dark.pdf"),
  );
}

fs.rmSync(OUT, { recursive: true, force: true });
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true });
  fs.writeFileSync(path.join(OUT, p), s);
};
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const LAT = /[A-Za-z][A-Za-z0-9\-\/.+]*(?:\s+[A-Za-z][A-Za-z0-9\-\/.+]*)*/g;
const inline = (s) =>
  esc(s).replace(LAT, (m) => `<bdi class="en" dir="ltr">${m}</bdi>`);
const toFa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const siteUrl = site.siteUrl.replace(/\/$/, "");
const placeholderUrl = /example/.test(siteUrl);

// ---------------- data
const art = rd("content/issue-01/articles.json");

// ---------------- editorial enrichment (kept outside articles.json so the author's text stays verbatim)
const enr = rd("content/issue-01/enrichment.json");
const usedPhotos = [];
const PRON = JSON.parse(
  fs.readFileSync("content/issue-01/pronounce.json", "utf8"),
).sort((x, y) => y[0].length - x[0].length);
const FN_RE = /(\d+)/g;
const clean = (s) => String(s).replace(FN_RE, "");

function applyPron(t) {
  for (const [k, v] of PRON) {
    t = t.replace(
      new RegExp(
        "(^|[^A-Za-z])" +
          k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
          "(?![A-Za-z])",
        "g",
      ),
      (m, p) => p + v,
    );
  }
  return t;
}

function collectAudioLines(bs, out) {
  for (const b of bs) {
    if (b.t === "p" || b.t === "h2" || b.t === "ex") out.push(clean(b.x));
    else if (b.t === "list") b.items.forEach((i) => out.push(clean(i)));
    else if (b.t === "callout") {
      out.push(clean(b.title));
      collectAudioLines(b.blocks, out);
    }
  }
}

function writeAudioText(a) {
  const lines = [a.title];
  collectAudioLines(a.intro || [], lines);
  collectAudioLines(a.blocks || [], lines);
  const t = applyPron(
    lines
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n"),
  );
  fs.mkdirSync("content/issue-01/audio-src", { recursive: true });
  fs.writeFileSync(`content/issue-01/audio-src/${a.slug}.txt`, t + "\n");
}

const figSvg = (f) => fs.readFileSync(`content/issue-01/figures/${f}`, "utf8");
{
  const bySlug = Object.fromEntries(art.articles.map((a) => [a.slug, a]));
  for (const ad of enr.additions) {
    const a = bySlug[ad.slug];
    if (!a) throw new Error("addition: unknown slug " + ad.slug);
    if (ad.at === "start") a.blocks.unshift(ad.block);
    else a.blocks.push(ad.block);
  }
  const replacedFigs = new Set();
  for (const f of enr.photos || []) {
    if (f.replacesFig && fs.existsSync(`content/issue-01/photos/${f.file}`))
      replacedFigs.add(f.replacesFig);
  }
  for (const f of enr.figures) {
    if (replacedFigs.has(f.id)) continue;
    const has = (b) =>
      b.t === "p"
        ? b.x.includes(f.after)
        : b.t === "callout"
          ? b.blocks.some(has)
          : b.t === "list"
            ? b.items.some((x) => x.includes(f.after))
            : false;
    const a = bySlug[f.slug];
    const i = a ? a.blocks.findIndex(has) : -1;
    if (i < 0) throw new Error("figure anchor not found: " + f.id);
    a.blocks.splice(i + 1, 0, {
      t: "fig",
      id: f.id,
      svg: f.svg,
      alt: f.alt,
      caption: f.caption,
      credit: f.credit,
    });
  }
  for (const f of enr.photos || []) {
    if (!fs.existsSync(`content/issue-01/photos/${f.file}`)) continue;
    const has = (b) =>
      b.t === "p"
        ? b.x.includes(f.after)
        : b.t === "callout"
          ? b.blocks.some(has)
          : b.t === "list"
            ? b.items.some((x) => x.includes(f.after))
            : false;
    const a = bySlug[f.slug];
    const i = a ? a.blocks.findIndex(has) : -1;
    if (i < 0) throw new Error("photo anchor not found: " + f.id);
    a.blocks.splice(i + 1, 0, { t: "photo", ...f });
    usedPhotos.push(f.file);
  }
  const walk = (bs, fn) =>
    bs.forEach((b) => {
      if (b.t === "callout") walk(b.blocks, fn);
      else if (b.t === "list") b.items = b.items.map(fn);
      else if (b.t === "p" && !b.strong) b.x = fn(b.x);
    });
  for (const a of art.articles) {
    const mine = enr.footnotes
      .map((f, gi) => ({ ...f, gi }))
      .filter((f) => f.slug === a.slug);
    if (!mine.length) continue;
    const todo = new Set(mine.map((f) => f.gi));
    walk(a.blocks, (txt) => {
      for (const f of mine) {
        if (!todo.has(f.gi)) continue;
        const i = txt.indexOf(f.match);
        if (i < 0) continue;
        todo.delete(f.gi);
        txt =
          txt.slice(0, i + f.match.length) +
          "" +
          f.gi +
          "" +
          txt.slice(i + f.match.length);
      }
      return txt;
    });
    if (todo.size)
      throw new Error(
        "footnote anchor not found: " +
          [...todo].map((g) => enr.footnotes[g].id).join(","),
      );
    a.fn = [];
    walk(a.blocks, (txt) => {
      for (const m of txt.matchAll(FN_RE))
        a.fn.push({ ...enr.footnotes[+m[1]], gi: +m[1], n: a.fn.length + 1 });
      return txt;
    });
  }
}
const issue = issuesData.issues[0];
const ISS = `issues/${issue.slug}`;
const editorial = {
  id: "ed",
  slug: "editorial",
  kind: "editorial",
  label: "یادداشت",
  title: "یادداشت تحریریه",
  topic: "خوش‌آمدگویی",
  intro: [],
  blocks: art.editorial.blocks,
  readingMinutes: 2,
  n: -1,
};
const list = [editorial, ...art.articles];
const byId = Object.fromEntries(list.map((a) => [a.id, a]));
const RELATED = {
  "sp-1": ["ch-5", "ch-9"],
  "sp-2": ["ch-4", "ch-8"],
  "sp-3": ["ch-5"],
  "ch-9": ["ch-8", "ch-4"],
};
const expBy = Object.fromEntries(exps.map((e) => [e.id, e]));
const artHref = (a, root) => `${root}${ISS}/${a.slug}/index.html`;
const xpHref = (e, root) => `${root}experiences/${e.slug}/index.html`;
const totalMin = list.reduce((s, a) => s + a.readingMinutes, 0);

// ---------------- block rendering
const KMAP = {
  believe: "believe",
  bug: "bug",
  think: "think",
  minute: "think",
  exercise: "think",
  note: "think",
  lab: "lab",
  summary: "summary",
};
function xpSlot(id, root) {
  const e = expBy[id];
  if (!e) throw new Error("unknown experience " + id);
  return `<div class="xp-slot" id="xp-${id}" data-xp="${id}" data-title="${esc(e.titleFa)}"><div class="xp-head"><div><div class="mono">${esc(e.experienceType)} · ${esc(e.difficulty)} · ${esc(e.estimatedDuration)}</div><h3>${inline(e.titleFa)}</h3><p>${inline(e.description)}</p>${e.editorialReview ? '<p><span class="tag w">پیش‌نویس برای بازبینی تحریریه</span></p>' : ""}</div><a href="${xpHref(e, root)}">صفحهٔ کامل تجربه</a></div><div class="xp-body"><noscript><p>برای اجرای این تجربه JavaScript لازم است. متن آموزشی همین بخش بدون آن هم در دسترس است.</p></noscript><div class="xp-load" role="status">در حال آماده‌سازی…</div></div></div>`;
}
const GLX = art.glossary
  .map((g, i) => ({ ...g, i }))
  .sort((x, y) => y.term.length - x.term.length);
function inlineG(s, st, root) {
  st.gl = st.gl || new Set();
  const hits = [];
  for (const g of GLX) {
    if (st.gl.has(g.i)) continue;
    const re = new RegExp(
      "(^|[^\\u0600-\\u06FF])(" +
        g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        ")(?![\\u0600-\\u06FF])",
    );
    const m = re.exec(s);
    if (!m) continue;
    const start = m.index + m[1].length,
      end = start + g.term.length;
    if (hits.some((h) => start < h.end && end > h.start)) continue;
    hits.push({ start, end, g });
    st.gl.add(g.i);
  }
  if (!hits.length) return inline(s);
  hits.sort((x, y) => x.start - y.start);
  let out = "",
    pos = 0;
  for (const h of hits) {
    out += inline(s.slice(pos, h.start));
    out += `<span class="gl-w">${inline(s.slice(h.start, h.end))}</span><a class="gl-ref" href="${root}${ISS}/glossary/index.html#gl-${h.g.i}" data-term="${esc(h.g.term)}" data-def="${esc(h.g.def)}" aria-label="تعریف «${esc(h.g.term)}» در واژه‌نامه" title="واژه‌نامه: ${esc(h.g.term)}"><i aria-hidden="true">i</i></a>`;
    pos = h.end;
  }
  return out + inline(s.slice(pos));
}
function blocks(bs, aid, root, st) {
  return bs
    .map((b) => {
      if (b.t === "p")
        return b.strong
          ? `<p><strong>${inline(b.x)}</strong></p>`
          : `<p>${fnx(inlineG(b.x, st, root), aid)}</p>`;
      if (b.t === "fig")
        return `<figure class="fig" id="fig-${b.id}">${figSvg(b.svg).replace("<svg ", `<svg role="img" aria-label="${esc(b.alt)}" `)}<figcaption>${inline(b.caption)}${b.credit ? ` <small>${inline(b.credit)}</small>` : ""}</figcaption></figure>`;
      if (b.t === "photo")
        return `<figure class="fig ph" id="fig-${b.id}"><img src="${root}photos/${b.file}"${b.w ? ` width="${b.w}"` : ""}${b.h ? ` height="${b.h}"` : ""} alt="${esc(b.alt)}" loading="lazy" decoding="async"><figcaption>${inline(b.caption)}${b.credit ? ` <small>${inline(b.credit)}${b.source ? ` · <a href="${esc(b.source)}" rel="noopener" target="_blank">منبع</a>` : ""}</small>` : ""}</figcaption></figure>`;
      if (b.t === "edtag")
        return `<p class="ed-note"><span class="tag w">افزودهٔ تحریریه — نیازمند تأیید</span> ${inline(b.x)}</p>`;
      if (b.t === "h2") {
        st.h2.push({ id: `${aid}-s${st.h2.length + 1}`, x: b.x });
        return `<h2 id="${aid}-s${st.h2.length}">${inline(b.x)}</h2>`;
      }
      if (b.t === "ex")
        return `<p class="ex${/[،و]/.test(b.x) ? " fa" : ""}" dir="${/[،و]/.test(b.x) ? "rtl" : "ltr"}">${esc(b.x)}</p>`;
      if (b.t === "list")
        return `<${b.ordered ? "ol" : "ul"}>${b.items.map((i) => `<li>${fnx(inlineG(i, st, root), aid)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
      if (b.t === "xp") {
        st.xps.push(b.id);
        return xpSlot(b.id, root);
      }
      if (b.t === "callout") {
        const k = KMAP[b.kind] || "think";
        const id = `${aid}-c${++st.c}`;
        if (b.kind === "summary") st.summaryId = id;
        if (b.xp) st.xps.push(b.xp);
        if (b.kind !== "summary" && b.kind !== "believe" && b.kind !== "bug")
          st.h2.push({ id, x: b.title, callout: true });
        return `<aside class="callout ${k}${b.xp ? " has-xp" : ""}" id="${id}" data-kind="${b.kind}"><h3>${inline(b.title)}</h3>${blocks(b.blocks, aid, root, st)}${b.xp ? xpSlot(b.xp, root) : ""}</aside>`;
      }
      throw new Error("block " + b.t);
    })
    .join("\n");
}

const fnx = (html, aid) => {
  const A = byId[aid];
  if (!A || !A.fn) return html;
  return html.replace(FN_RE, (_, gi) => {
    const f = A.fn.find((x) => x.gi === +gi);
    return `<sup class="fn-ref"><a href="#fn-${A.id}-${f.n}" id="fnr-${A.id}-${f.n}" data-term="${esc(f.title)}" data-def="${esc(f.text)}" aria-label="پاورقی ${toFa(f.n)}: ${esc(f.title)}">${toFa(f.n)}</a></sup>`;
  });
};
const fnList = (a) =>
  !a.fn || !a.fn.length
    ? ""
    : `<section class="fn-list" aria-labelledby="fnh-${a.id}"><h2 class="fn-h" id="fnh-${a.id}">پاورقی‌ها و توضیحات</h2><ol class="fn">${a.fn.map((f) => `<li id="fn-${a.id}-${f.n}"><b>${inline(f.title)}:</b> ${inline(f.text)} <a class="fn-back" href="#fnr-${a.id}-${f.n}" aria-label="بازگشت به متن">↑</a></li>`).join("")}</ol><p class="nt">این توضیح‌ها را تحریریه نوشته؛ پیش از انتشار نهایی باید با منبع تطبیق داده شوند.</p></section>`;
const audioFor = (a) =>
  ["mp3", "m4a", "ogg"]
    .map((e) => `${a.slug}.${e}`)
    .find((f) => fs.existsSync(`content/issue-01/audio/${f}`));
const usedAudio = [];
const listenCard = (a, root) => {
  const au = audioFor(a);
  if (au) usedAudio.push(au);
  const qrTarget = placeholderUrl
    ? `${root}${ISS}/${a.slug}/index.html#listen-${a.id}`
    : `${siteUrl}/${ISS}/${a.slug}/index.html#listen-${a.id}`;
  const ttsControls = `<div class="ls-ctl"><button type="button" class="btn sm" data-listen="play">▶ گوش بده</button><button type="button" class="btn sm ko" data-listen="pause" disabled>⏸ مکث</button><button type="button" class="btn sm ko" data-listen="stop" disabled>■ توقف</button><label class="ls-rate">سرعت <select data-listen-rate aria-label="سرعت گفتار"><option value="0.85">آهسته</option><option value="1" selected>عادی</option><option value="1.2">سریع</option><option value="1.5">خیلی سریع</option></select></label></div>`;
  return `<section class="listen src-hide" id="listen-${a.id}" data-art="${a.id}" data-title="${esc(a.title)}"${au ? ` data-audio="${root}audio/${au}"` : ""} aria-label="نسخهٔ صوتی"><div class="ls-main"><div class="kk mono">PODCAST · LISTEN</div><h2 class="ls-h">نسخهٔ صوتی این بخش</h2><p class="ls-p">اگر حوصلهٔ خوندن نداری، همین بخش رو به‌صورت صوتی گوش بده.</p>${au ? `<div class="nb-ap-mount"></div><details class="ls-alt"><summary>گویندهٔ خودکار مرورگر (جایگزین)</summary>${ttsControls}</details>` : `${ttsControls}<p class="ls-note" data-listen-note>صدا را گوینده‌ٔ خودکار دستگاه می‌سازد؛ کیفیت و تلفظ به صدای فارسیِ نصب‌شده روی دستگاه بستگی دارد.</p>`}</div><figure class="ls-qr"><div data-qr="${esc(qrTarget)}"></div><figcaption>با گوشی اسکن کن؛ همین بخش باز می‌شه تا گوش بدی.</figcaption></figure></section>`;
};
function renderArticle(a, root) {
  const st = { h2: [], xps: [], c: 0 };
  const intro = a.intro.length
    ? `<div class="intro">${blocks(a.intro, a.id, root, st)}</div>`
    : "";
  const body = blocks(a.blocks, a.id, root, st);
  writeAudioText(a);
  return { html: intro + body + fnList(a) + listenCard(a, root), st };
}

// ---------------- page shell
function loadLogoSvg(extraAttrs = "", animate = false) {
  let raw = fs
    .readFileSync("src/assets/NextBit.svg", "utf8")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .trim();
  if (!/viewBox=/i.test(raw)) {
    const wm = raw.match(/\bwidth="([\d.]+)/i),
      hm = raw.match(/\bheight="([\d.]+)/i);
    if (wm && hm)
      raw = raw.replace(/<svg\b/i, `<svg viewBox="0 0 ${wm[1]} ${hm[1]}"`);
  }
  raw = raw.replace(
    /(?:#000000|#000(?![0-9a-fA-F])|\bblack\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi,
    "#F5F7F3",
  );
  if (animate) {
    let idx = 0;
    raw = raw.replace(
      /<(path|polygon|rect|circle)\b([^>]*?)(\/?)>/gi,
      (_, tag, attrs, slash) => {
        const i = idx++;
        const a1 = /\bclass="/i.test(attrs)
          ? attrs.replace(/\bclass="/i, 'class="nb-pc ')
          : attrs + ' class="nb-pc"';
        const a2 = /\bstyle="/i.test(a1)
          ? a1.replace(/\bstyle="/i, `style="--i:${i};`)
          : a1 + ` style="--i:${i}"`;
        return `<${tag}${a2}${slash}>`;
      },
    );
  }
  return raw.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s+(?:width|height|fill)="[^"]*"/gi, "")
      .trim();
    return `<svg${cleaned ? " " + cleaned : ""} fill="#F5F7F3"${extraAttrs ? " " + extraAttrs : ""}>`;
  });
}
const LOGO = loadLogoSvg('aria-hidden="true"', false);
const HERO_LOGO = loadLogoSvg(
  'class="mk" role="img" aria-label="لوگوی Next Bit"',
  true,
);
const FAVICON_SVG = /xmlns=/i.test(LOGO)
  ? LOGO
  : LOGO.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
const FAVICON = "data:image/svg+xml," + encodeURIComponent(FAVICON_SVG);
const NAV = [
  ["خانه", "index.html", "home"],
  ["شماره‌ها", "issues/index.html", "issues"],
  ["تجربه‌ها", "experiences/index.html", "exp"],
  ["واژه‌نامه", `${ISS}/glossary/index.html`, "glossary"],
  ["درباره", "about/index.html", "about"],
  ["جست‌وجو", "search/index.html", "search"],
];
const sitemap = [];
function page({
  file,
  title,
  desc,
  nav,
  body,
  bodyAttr = "",
  scripts = [],
  og = "website",
  ld = null,
  noindex = false,
  extraHead = "",
}) {
  const root = "../".repeat(file.split("/").length - 1);
  const url = file === "index.html" ? "" : file.replace(/index\.html$/, "");
  const full = `${siteUrl}/${url}`;
  if (!noindex) sitemap.push(url);
  const t =
    title === site.name
      ? `${site.name} — ${site.nameFa}`
      : `${title} | ${site.name}`;
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
<link rel="stylesheet" href="${root}assets/editorial.css">
<link rel="stylesheet" href="${root}assets/studio.css">
${extraHead}${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ""}
</head>
<body ${bodyAttr}>
<a class="skip" href="#main">پرش به محتوا</a>
<header class="site-h"><div class="in nav">
<a class="brand" href="${root}index.html" aria-label="Next Bit — خانه">${LOGO}<b>NEXT BIT</b></a>
<nav aria-label="ناوبری اصلی"><ul id="nav-list">${NAV.map(([l, h, k]) => `<li><a href="${root}${h}"${nav === k ? ' aria-current="page"' : ""}>${l}</a></li>`).join("")}</ul></nav>
<div class="nav-tools"><button class="ic-btn" id="motion-btn" type="button" aria-pressed="false" title="کاهش حرکت" aria-label="کاهش حرکت">◐</button><button class="ic-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="nav-list" aria-label="منو">☰</button></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-f"><div class="in"><div class="ft">
<div><b>Next Bit</b><p>${esc(site.tagline)}</p><p class="muted">${esc(site.university)}</p></div>
<div><b>بخوان</b><a href="${root}${ISS}/index.html">شمارهٔ اول</a><a href="${root}${ISS}/read/index.html">مطالعهٔ کامل</a><a href="${root}nextbit-issue-01.pdf" download>دانلود PDF مجله</a><a href="${root}issues/index.html">آرشیو</a><a href="${root}${ISS}/glossary/index.html">واژه‌نامه</a><a href="${root}${ISS}/sources/index.html">منابع</a></div>
<div><b>تجربه کن</b><a href="${root}experiences/index.html">همهٔ تجربه‌ها</a><a href="${root}${ISS}/start/index.html">از کجا شروع کنیم؟</a><a href="${root}search/index.html">جست‌وجو</a></div>
<div><b>مشارکت</b><a href="${root}about/index.html">درباره</a><a href="${root}team/index.html">تیم</a><a href="${root}submit/index.html">ارسال مقاله</a><a href="${root}collaborate/index.html">همکاری</a><a href="${root}contact/index.html">تماس</a></div>
</div><div class="ft-end">NEXT BIT · ${esc(site.universityEn || "University of Kashan")} · static site</div></div></footer>
<script src="${root}assets/app.js" defer></script>
<script src="${root}assets/editorial.js" defer></script>
<script src="${root}assets/studio.js" defer></script>
${scripts.map((s) => `<script src="${root}assets/${s}" defer></script>`).join("\n")}
</body></html>`;
  write(file, html);
}

// ---------------- cover
function cover() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cells = Array.from({ length: 56 }, () => {
    const g = rnd() > 0.78;
    return `<i${g ? ' class="g"' : ""}>${rnd() > 0.5 ? 1 : 0}</i>`;
  }).join("");
  return `<div class="cover" role="img" aria-label="جلد شمارهٔ ۱ نکست بیت: از صفر و یک تا آینده"><div class="mx" aria-hidden="true">${cells}</div><div><div class="tl-line">ISSUE 01</div><h2>از <em>صفر و یک</em><br>تا آینده</h2></div><div class="tl-line" style="margin:0">NEXT BIT</div></div>`;
}

// ---------------- HOME
{
  const featured = [
    list.find((a) => a.id === "ch-0"),
    list.find((a) => a.id === "ch-2"),
    list.find((a) => a.id === "ch-8"),
  ];
  const expPick = [
    "bit-lab",
    "logic-lab",
    "sorting-visualizer",
    "timeline-explorer",
  ].map((i) => expBy[i]);
  page({
    file: "index.html",
    title: site.name,
    nav: "home",
    desc: site.description,
    og: "website",
    ld: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Next Bit",
      inLanguage: "fa",
      description: site.description,
      url: siteUrl + "/",
    },
    body: `<section class="dark hero"><div class="in hg"><div>
<div class="tl-line">ISSUE 01 · <span class="cur">▍</span></div>
<h1>نشریه‌ای که<br>فقط <em>خوانده</em> نمی‌شود،<br>اجرا هم می‌شود.</h1>
<p class="lead">مقاله، محیط مطالعه و آزمایشگاه‌های تعاملی برای دانشجویان و علاقه‌مندان کامپیوتر؛ از چوب‌خط تا هوش مصنوعی.</p>
<div class="cta"><a class="btn" href="${ISS}/index.html">شمارهٔ اول را بخوان</a><a class="btn o" href="experiences/index.html">تجربه‌ها را امتحان کن</a></div></div>
${HERO_LOGO}</div></section>
<section class="sec"><div class="in iss"><a href="${ISS}/index.html" aria-label="شمارهٔ اول">${cover()}</a><div>
<div class="eb">LATEST ISSUE</div><h2 class="h2">شمارهٔ ${toFa(issue.number)}: ${esc(issue.title)}</h2><p class="lead" style="margin-top:16px">${esc(issue.subtitle)}</p>
<div class="meta"><div><b>CHAPTERS</b>${toFa(art.articles.filter((a) => a.kind === "chapter").length)} فصل + ${toFa(art.articles.filter((a) => a.kind === "special").length)} پرونده ویژه</div><div><b>READING</b>حدود ${toFa(totalMin)} دقیقه</div><div><b>EXPERIENCES</b>${toFa(exps.length)} تجربهٔ تعاملی</div></div>
<div class="cta"><a class="btn k" href="${ISS}/read/index.html#flipbook">ورق بزن (Flipbook)</a><a class="btn ko" href="${ISS}/read/index.html#reading">مطالعهٔ پیوسته</a><a class="btn ko" href="${ISS}/read/index.html#interactive">فقط تجربه‌ها</a><a class="btn ko" href="nextbit-issue-01.pdf" download>⬇ دانلود PDF مجله</a></div></div></div></section>
<section class="sec" style="background:var(--paper2)"><div class="in"><div class="eb">START ANYWHERE</div><h2 class="h2">از هر جا شروع کن</h2>
<div class="cards" style="margin-top:32px">${featured.map((a) => `<a class="xcard" href="${artHref(a, "")}"><span class="mt">${esc(a.label)} · ${toFa(a.readingMinutes)} دقیقه</span><h3>${inline(a.title)}</h3><p>${inline(a.topic)}</p></a>`).join("")}</div></div></section>
<section class="sec"><div class="in"><div class="eb">TRY IT</div><h2 class="h2">یاد بگیر، با دست خودت</h2>
<div class="cards" style="margin-top:32px">${expPick.map((e) => `<a class="xcard" href="${xpHref(e, "")}"><span class="mt">${esc(e.experienceType)} · ${esc(e.estimatedDuration)}</span><h3>${inline(e.titleFa)}</h3><p>${inline(e.description)}</p></a>`).join("")}</div></div></section>
<section class="dark sec"><div class="in"><div class="eb">FOR WHO</div><h2 class="h2">برای کی؟</h2><div class="aud"><div><h3>اگر هیچ نمی‌دانی</h3><p>از «چوب‌خط» شروع می‌کنیم. اصطلاح‌ها در اولین استفاده توضیح داده می‌شوند.</p></div><div><h3>اگر دانشجوی کامپیوتری</h3><p>هر جا لازم باشد عمیق‌تر می‌شویم و بین واقعیت، پژوهش و سناریو فرق می‌گذاریم.</p></div><div><h3>اگر کنجکاوی</h3><p>هر فصل یک تجربهٔ تعاملی دارد؛ قبل از خواندن توضیح، خودت امتحانش کن.</p></div></div></div></section>`,
  });
}

// ---------------- ISSUES archive
{
  const cards = issuesData.issues
    .map((i) =>
      i.status === "published"
        ? `<a class="cd" href="${i.slug}/index.html" data-title="${esc(i.title)} ${esc(i.topic || "")}" data-cat="${esc((i.categories || []).join(" "))}" data-num="${i.number}"><div class="cv">${'<div class="tl-line">ISSUE ' + String(i.number).padStart(2, "0") + "</div>"}<h3 style="color:var(--paper);font-size:30px;font-weight:900">${esc(i.title)}</h3></div><h3>${esc(i.title)}</h3><p class="muted">${esc(i.summary)}</p></a>`
        : `<div class="cd" data-title="${esc(i.title)}" data-cat="" data-num="${i.number}"><div class="cv up"><div class="tl-line" style="color:var(--slate)">ISSUE ${String(i.number).padStart(2, "0")}</div><h3 style="font-size:26px">به‌زودی</h3></div><h3>${esc(i.title)}</h3><p class="muted">${esc(i.summary)}</p></div>`,
    )
    .join("");
  page({
    file: "issues/index.html",
    title: "آرشیو شماره‌ها",
    nav: "issues",
    desc: "همهٔ شماره‌های نشریهٔ Next Bit؛ جست‌وجو و فیلتر بر اساس موضوع.",
    body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">ARCHIVE</div><h1 class="h1">آرشیو شماره‌ها</h1></div></section>
<div class="in"><div class="ctl" role="search"><label class="vh" for="ar-q">جست‌وجوی شماره</label><input id="ar-q" class="inp" type="search" placeholder="جست‌وجو در عنوان و موضوع…" data-archive-q><div class="chips" role="group" aria-label="وضعیت"><button class="chip" type="button" data-archive-f="all" aria-pressed="true">همه</button><button class="chip" type="button" data-archive-f="pub" aria-pressed="false">منتشرشده</button></div></div>
<div class="gr" id="ar-grid">${cards}</div><p id="ar-empty" class="empty" hidden><b>موردی پیدا نشد</b>عبارت دیگری را امتحان کن.</p></div>`,
  });
}

// ---------------- ARTICLE pages + reader
const rel = (a) => (RELATED[a.id] || []).map((i) => byId[i]);
function srcBlock(a, root) {
  const ids = src.byChapter[a.id] || [];
  const items = ids
    .map((i) => src.sources[i])
    .filter(Boolean)
    .map(
      (s) =>
        `<li>${esc(s.author)}، <i>${esc(s.title)}</i>${s.venue ? "، " + esc(s.venue) : ""}${s.year ? " (" + esc(String(s.year)) + ")" : ""}${s.url ? ` — <a href="${s.url}" rel="noopener" target="_blank">پیوند</a>` : ""}</li>`,
    )
    .join("");
  return `<section class="src" aria-labelledby="${a.id}-src"><h2 id="${a.id}-src">منابع پیشنهادی برای راستی‌آزمایی</h2><p class="nt">متن این بخش ارجاع درون‌متنی ندارد؛ فهرست زیر نقطهٔ شروع بررسی تحریریه است، نه تأیید ادعاهای تک‌تک جمله‌ها. ${items ? "" : "برای این بخش هنوز منبع مشخصی ثبت نشده است؛ "}<a href="${root}${ISS}/sources/index.html">فهرست عمومی منابع شماره</a></p>${items ? `<ol>${items}</ol>` : ""}</section>`;
}
function toolbar(root, a, mode) {
  return `<div class="rd-bar" id="rd-bar"><div class="in rd-in"><a class="b" href="${root}${ISS}/index.html">← ${a ? "فهرست شماره" : "شمارهٔ اول"}</a>
<div class="md" role="group" aria-label="حالت مطالعه">${mode === "reader" ? '<button type="button" data-mode="flip" aria-pressed="false">Flipbook</button>' : `<a class="b" style="border:0;padding:0 14px;color:var(--green)" href="${root}${ISS}/read/index.html#flipbook">Flipbook</a>`}<button type="button" data-mode="reading" aria-pressed="true">مطالعهٔ مدرن</button><button type="button" data-mode="interactive" aria-pressed="false">تعاملی</button></div>
<div class="md" role="group" aria-label="اندازهٔ متن"><button type="button" data-fs="-1" aria-label="کوچک‌تر کردن متن">A−</button><button type="button" data-fs="1" aria-label="بزرگ‌تر کردن متن">A+</button></div></div><div class="prog" aria-hidden="true"><i id="prog-i"></i></div></div>`;
}
list.forEach((a, idx) => {
  const { html, st } = renderArticle(a, "../../../");
  const prev = list[idx - 1],
    next = list[idx + 1];
  const exRel = exps.filter(
    (e) => e.relatedChapters.includes(a.id) && !st.xps.includes(e.id),
  );
  const rels = rel(a);
  const root = "../../../";
  const toc = st.h2
    .map((h) => `<a href="#${h.id}">${inline(h.x)}</a>`)
    .join("");
  const desc = clean(
    a.intro[0] ? a.intro[0].x : a.blocks.find((b) => b.t === "p")?.x || a.title,
  ).slice(0, 200);
  const wm =
    a.kind === "chapter"
      ? String(a.n).padStart(2, "0")
      : a.kind === "special"
        ? "SP"
        : "NB";
  page({
    file: `${ISS}/${a.slug}/index.html`,
    title: `${a.title}`,
    nav: "issues",
    desc,
    og: "article",
    bodyAttr: 'data-mode="reading" data-article="' + a.id + '"',
    scripts: ["qr.js", "pron.js", "listen.js"],
    ld: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      inLanguage: "fa",
      isPartOf: {
        "@type": "PublicationIssue",
        issueNumber: issue.number,
        name: issue.title,
      },
    },
    body: `${toolbar(root, a, "article")}
<section class="rd-head" data-min="${a.readingMinutes}" data-wm="${wm}"><div class="in"><div class="kk">${esc(a.kind === "editorial" ? "EDITORIAL" : a.kind === "chapter" ? "CHAPTER " + String(a.n).padStart(2, "0") : "SPECIAL " + String(a.n).padStart(2, "0"))} · ${toFa(a.readingMinutes)} دقیقه</div><p class="sub" style="margin:0 0 8px">${esc(a.label)}</p><h1>${inline(a.title)}</h1></div></section>
<div class="in rd-body"><aside class="rd-toc" aria-label="فهرست این بخش"><b>CONTENTS</b>${toc || '<span class="muted">—</span>'}</aside>
<article class="prose" lang="fa"><div class="back-note"><span>حالت «تعاملی» فقط تجربه‌های این بخش را نشان می‌دهد.</span><button class="btn sm ko" type="button" data-mode="reading">بازگشت به متن</button></div>
${html}
${a.kind !== "editorial" ? srcBlock(a, root) : ""}
${exRel.length || rels.length ? `<section class="src-hide"><h2 style="font-size:22px;margin:2em 0 .4em">ادامه بده</h2><div class="rel">${exRel.map((e) => `<a href="${xpHref(e, root)}">تجربه: ${inline(e.titleFa)}</a>`).join("")}${rels.map((r) => `<a href="${artHref(r, root)}">مرتبط: ${inline(r.title.split("؛")[0])}</a>`).join("")}</div></section>` : ""}
<nav class="pn-nav src-hide" aria-label="قبلی و بعدی">${next ? `<a href="${artHref(next, root)}" rel="next"><small>NEXT →</small><b>${inline(next.title)}</b></a>` : `<a href="${root}${ISS}/glossary/index.html"><small>NEXT →</small><b>واژه‌نامه زنده</b></a>`}${prev ? `<a href="${artHref(prev, root)}" rel="prev"><small>← PREVIOUS</small><b>${inline(prev.title)}</b></a>` : `<a href="${root}${ISS}/index.html"><small>← ISSUE</small><b>صفحهٔ شماره</b></a>`}</nav>
</article></div>`,
  });
});

// extra pages (glossary, start, sources)
const gl = art.glossary;
page({
  file: `${ISS}/glossary/index.html`,
  title: "واژه‌نامه زنده",
  nav: "glossary",
  desc: "تعریف اصطلاحات شمارهٔ اول: الگوریتم، بیت، بایت، ترانزیستور، سیستم‌عامل، کامپایلر، شبکه و هوش مصنوعی.",
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">GLOSSARY</div><h1 class="h1">واژه‌نامه زنده</h1><p class="lead">اصطلاح‌های این شماره با تعریف کوتاه.</p></div></section>
<div class="in sec"><div class="ctl"><label class="vh" for="gl-q">جست‌وجو در واژه‌نامه</label><input id="gl-q" class="inp" type="search" placeholder="جست‌وجوی اصطلاح…" data-glossary-q></div><dl class="glo" id="gl-list" style="margin:0">${gl.map((g, gi) => `<div id="gl-${gi}" data-t="${esc(g.term + " " + g.def)}"><dt><b style="font-family:var(--fa);direction:rtl">${inline(g.term)}</b></dt><dd style="margin:6px 0 0">${inline(g.def)}</dd></div>`).join("")}</dl><p id="gl-empty" class="empty" hidden><b>اصطلاحی پیدا نشد</b></p></div>`,
});
page({
  file: `${ISS}/start/index.html`,
  title: art.start.title,
  nav: "issues",
  desc: "پیشنهاد مسیر یادگیری بعد از شمارهٔ اول، بر اساس علاقه: سخت‌افزار، برنامه‌نویسی، شبکه و هوش مصنوعی.",
  body: `<section class="rd-head" data-wm="→"><div class="in"><div class="kk">NEXT STEPS</div><h1>${inline(art.start.title)}</h1></div></section><div class="in" style="padding-block:48px"><article class="prose">${blocks(art.start.blocks, "start", "../../../", { h2: [], xps: [], c: 0 })}</article></div>`,
});
page({
  file: `${ISS}/sources/index.html`,
  title: art.sources.title,
  nav: "issues",
  desc: "فهرست منابع پیشنهادی برای بررسی علمی و تاریخی مطالب شمارهٔ اول.",
  body: `<section class="rd-head" data-wm="REF"><div class="in"><div class="kk">SOURCES</div><h1>${inline(art.sources.title)}</h1></div></section><div class="in" style="padding-block:48px"><article class="prose">${art.sources.intro.map((p) => `<p>${inline(p)}</p>`).join("")}
<ol>${art.sources.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>
<div class="draft-note"><b>یادداشت ویراستاری.</b> ${inline(art.sources.editorNote)}</div>
<h2>صفحهٔ اصلی سازمان‌های نام‌برده‌شده</h2><p class="muted">این پیوندها فقط به صفحهٔ اصلی سازمان می‌روند و به‌تنهایی منبع هیچ ادعای مشخصی نیستند.</p>
<div class="rel">${src.orgs.map((o) => `<a href="${o.url}" rel="noopener" target="_blank"><bdi class="en" dir="ltr">${esc(o.name)}</bdi></a>`).join("")}</div>
<h2>مراجع پیشنهادی برای راستی‌آزمایی بخش‌ها</h2><p class="muted">این مراجع توسط تیم فنی به‌عنوان نقطهٔ شروع بررسی پیشنهاد شده‌اند و جزء متن اصلی نشریه نیستند.</p>
<ol>${Object.values(src.sources)
    .map(
      (s) =>
        `<li>${esc(s.author)}، <i>${esc(s.title)}</i>${s.venue ? "، " + esc(s.venue) : ""}${s.year ? " (" + esc(String(s.year)) + ")" : ""}${s.url ? ` — <a href="${s.url}" rel="noopener" target="_blank">پیوند</a>` : ""}</li>`,
    )
    .join("")}</ol></article></div>`,
});

// READER (whole issue)
{
  const root = "../../../";
  const secs = list
    .map((a) => {
      const { html } = renderArticle(a, root);
      return `<section class="art-sec" id="${a.slug}" data-id="${a.id}" data-title="${esc(a.title)}" data-label="${esc(a.label)}"><header class="sec-h"><div class="kk mono">${esc(a.label)}</div><h2 class="sec-t">${inline(a.title)}</h2></header><div class="prose" lang="fa">${html}</div></section>`;
    })
    .join("");
  const tocs = list
    .map(
      (a) =>
        `<a href="#${a.slug}" data-sec="${a.slug}">${a.kind === "chapter" ? toFa(a.n) + ". " : ""}${inline(a.title.split("؛")[0].split(":")[0])}</a>`,
    )
    .join("");
  page({
    file: `${ISS}/read/index.html`,
    title: "مطالعهٔ کامل شمارهٔ اول",
    nav: "issues",
    desc: "متن کامل شمارهٔ اول Next Bit در سه حالت: Flipbook، مطالعهٔ مدرن و تعاملی.",
    bodyAttr: 'data-mode="reading" data-reader="1"',
    scripts: ["qr.js", "pron.js", "listen.js", "reader.js"],
    body: `${toolbar(root, null, "reader")}
<div class="reading-wrap"><div class="in rd-body"><aside class="rd-toc" aria-label="فهرست شماره"><b>CONTENTS</b>${tocs}<a href="${root}${ISS}/glossary/index.html">واژه‌نامه زنده</a><a href="${root}${ISS}/start/index.html">از کجا شروع کنیم؟</a><a href="${root}${ISS}/sources/index.html">منابع</a></aside>
<div><div class="back-note"><span>حالت «تعاملی»: فقط تجربه‌های هر فصل نمایش داده می‌شود.</span><button class="btn sm ko" type="button" data-mode="reading">بازگشت به متن</button></div>${secs}</div></div></div>
<div class="flip-wrap" id="flip-wrap" aria-label="Flipbook شمارهٔ اول"><div class="stage" id="stage" tabindex="0" aria-roledescription="کتاب ورق‌خور" aria-label="کتاب. با کلیدهای چپ و راست ورق بزن."><div class="fb-load" id="fb-load">در حال آماده‌سازی صفحه‌ها…</div></div>
<div class="fb-ctl"><button type="button" id="fb-next">صفحهٔ بعد</button><span class="pgs" id="fb-pgs" aria-live="polite">—</span><button type="button" id="fb-prev">صفحهٔ قبل</button><button type="button" id="fb-fs" class="fs-btn" aria-pressed="false">تمام‌صفحه</button></div>
<div class="fb-jump"><button type="button" id="fb-exit" class="fs-only" aria-label="خروج از تمام‌صفحه">✕ خروج</button><button type="button" class="fs-only" data-fs="-1" aria-label="کوچک‌تر کردن متن">A−</button><button type="button" class="fs-only" data-fs="1" aria-label="بزرگ‌تر کردن متن">A+</button><label for="fb-ch">فصل:</label><select id="fb-ch"></select><label for="fb-pg">صفحه:</label><input id="fb-pg" type="number" min="1" inputmode="numeric" style="width:90px"><button type="button" class="chip" id="fb-go" style="color:var(--paper);background:transparent;border-color:var(--line-d)">برو</button></div>
<p class="fb-hint">کلید ← صفحهٔ بعد · کلید → صفحهٔ قبل · کلید F تمام‌صفحه · با ماوس یا انگشت صفحه را بکش و ورق بزن · تجربه‌های تعاملی با دکمهٔ «اجرا» در پنجرهٔ جدا باز می‌شوند.</p></div>
<dialog id="xp-dialog" class="xp-dialog" aria-label="تجربهٔ تعاملی"><button type="button" class="btn sm" id="xp-close" style="margin:12px">بستن ✕</button><div id="xp-dialog-body"></div></dialog>
<noscript><p class="draft-note in">برای حالت Flipbook و تجربه‌ها JavaScript لازم است؛ متن کامل بالا بدون آن هم خوانا است.</p></noscript>`,
  });
}

// ---------------- ISSUE landing
{
  const root = "../../";
  const rows = list
    .map(
      (a) =>
        `<a class="ar" data-aid="${a.id}" href="${artHref(a, root)}"><span class="n">${a.kind === "chapter" ? String(a.n).padStart(2, "0") : a.kind === "special" ? "SP" : "✎"}</span><div><h3>${inline(a.title)}</h3><p>${inline(a.topic)}</p></div><span class="mt">${toFa(a.readingMinutes)} MIN</span></a>`,
    )
    .join("");
  const nextI = issuesData.issues.find((i) => i.number === issue.number + 1);
  page({
    file: `${ISS}/index.html`,
    title: `شمارهٔ ${issue.number}: ${issue.title}`,
    nav: "issues",
    desc: issue.subtitle,
    og: "book",
    ld: {
      "@context": "https://schema.org",
      "@type": "PublicationIssue",
      issueNumber: issue.number,
      name: issue.title,
      description: issue.subtitle,
      inLanguage: "fa",
      isPartOf: { "@type": "Periodical", name: "Next Bit" },
    },
    body: `<section class="dark hero"><div class="in sec"><div class="iss">${cover()}<div><div class="eb">ISSUE ${String(issue.number).padStart(2, "0")}</div><h1 class="h1">${esc(issue.title)}</h1><p class="lead" style="margin-top:16px">${esc(issue.subtitle)}</p>
<div class="cta" style="margin-top:28px"><a class="btn" href="read/index.html#flipbook">Flipbook</a><a class="btn o" href="read/index.html#reading">مطالعهٔ مدرن</a><a class="btn o" href="read/index.html#interactive">تعاملی</a><a class="btn o" href="${root}nextbit-issue-01.pdf" download>⬇ دانلود PDF مجله</a></div></div></div></div></section>
<section class="sec"><div class="in"><div class="meta"><div><b>TOPIC</b>${esc(issue.topic)}</div><div><b>CONTENT</b>${toFa(art.articles.filter((a) => a.kind === "chapter").length)} فصل · ${toFa(art.articles.filter((a) => a.kind === "special").length)} پرونده</div><div><b>READING TIME</b>حدود ${toFa(totalMin)} دقیقه</div><div><b>EXPERIENCES</b>${toFa(exps.length)} تجربه</div><div><b>PUBLISHED</b>${issue.publishedAt ? esc(issue.publishedAt) : "تاریخ ثبت نشده"}</div></div>
<p class="lead" style="max-width:70ch">${esc(issue.summary)}</p>
<div class="eb" style="margin-top:48px">TABLE OF CONTENTS</div><h2 class="h2" style="margin-bottom:24px">فهرست مطالب</h2><div class="toc-l">${rows}</div>
<div class="toc-l" style="margin-top:32px"><a class="ar" href="glossary/index.html"><span class="n">A–Z</span><div><h3>واژه‌نامه زنده</h3></div><span class="mt"></span></a><a class="ar" href="start/index.html"><span class="n">→</span><div><h3>از کجا شروع کنیم؟</h3></div><span class="mt"></span></a><a class="ar" href="sources/index.html"><span class="n">REF</span><div><h3>منابع و مطالعهٔ بیشتر</h3></div><span class="mt"></span></a></div>
<h2 class="h2" style="margin-top:64px">تجربه‌های این شماره</h2><div class="cards" style="margin-top:24px">${exps.map((e) => `<a class="xcard" href="${xpHref(e, root)}"><span class="mt">${esc(e.experienceType)}</span><h3>${inline(e.titleFa)}</h3></a>`).join("")}</div>
<div class="pn-nav"><a href="${root}issues/index.html"><small>← ARCHIVE</small><b>آرشیو شماره‌ها</b></a><a href="${root}issues/index.html">${nextI ? `<small>NEXT ISSUE →</small><b>${esc(nextI.title)} (${nextI.status === "upcoming" ? "به‌زودی" : ""})</b>` : "<small>NEXT ISSUE →</small><b>هنوز اعلام نشده</b>"}</a></div></div></section>`,
  });
}

// ---------------- experiences hub + pages
page({
  file: "experiences/index.html",
  title: "تجربه‌های تعاملی",
  nav: "exp",
  desc: "آزمایشگاه‌های تعاملی Next Bit: بیت، گیت منطقی، مرتب‌سازی، ماشین آموزشی، خط زمانی و آینده محاسبات.",
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">EXPERIENCES</div><h1 class="h1">تجربه‌ها</h1><p class="lead">هر تجربه یک مفهوم همان مقاله را آموزش می‌دهد.</p></div></section><div class="in sec"><div class="ctl"><div class="chips" role="group" aria-label="دسته">${["همه", ...new Set(exps.map((e) => e.category))].map((c, i) => `<button class="chip" type="button" data-xf="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join("")}</div></div><div class="xh" style="margin-top:28px">${exps
    .map(
      (e) =>
        `<a href="${e.slug}/index.html" data-cat="${esc(e.category)}"><div><div class="tags"><span class="tag">${esc(e.experienceType)}</span><span class="tag s">${esc(e.estimatedDuration)}</span>${e.editorialReview ? '<span class="tag w">پیش‌نویس</span>' : ""}</div><h3 style="margin-top:12px">${inline(e.titleFa)}</h3><p>${inline(e.description)}</p></div><span class="mono">${e.relatedChapters
          .map((c) => byId[c]?.label)
          .filter(Boolean)
          .join(" · ")}</span></a>`,
    )
    .join("")}</div></div>`,
});
exps.forEach((e) => {
  const root = "../../";
  page({
    file: `experiences/${e.slug}/index.html`,
    title: `${e.titleFa} (${e.title})`,
    nav: "exp",
    desc: e.description,
    og: "website",
    bodyAttr: 'data-mode="reading"',
    body: `<section class="rd-head" data-wm="XP"><div class="in"><div class="kk">${esc(e.experienceType.toUpperCase())} · ${esc(e.estimatedDuration)} · ${esc(e.difficulty)}</div><h1>${inline(e.titleFa)} <span class="mono" style="font-size:.5em;color:var(--green)">${esc(e.title)}</span></h1><p class="sub">${inline(e.description)}</p>${e.editorialReview ? '<p style="margin-top:12px"><span class="tag w">پیش‌نویس برای بازبینی تحریریه</span></p>' : ""}</div></section>
<div class="in" style="padding-block:40px"><div class="prose" style="max-width:960px"><div><h2 style="font-size:22px">راهنمای گام‌به‌گام</h2><ol>${e.instructions.map((s) => `<li>${inline(s)}</li>`).join("")}</ol></div>${xpSlot(e.id, root)}
<h2 style="font-size:22px">مربوط به</h2><div class="rel">${
      e.relatedChapters
        .map((c) => byId[c])
        .filter(Boolean)
        .map(
          (a) =>
            `<a href="${artHref(a, root)}">${esc(a.label)}: ${inline(a.title.split("؛")[0].split(":")[0])}</a>`,
        )
        .join("") || '<span class="muted">—</span>'
    }<a href="${root}experiences/index.html">همهٔ تجربه‌ها</a></div></div></div>`,
  });
});

// ---------------- about, team, forms, search, 404
const contactRows = Object.entries({
  ایمیل: site.contact.email,
  اینستاگرام: site.contact.instagram,
  گیت‌هاب: site.contact.github,
  تلگرام: site.contact.telegram,
})
  .map(
    ([k, v]) =>
      `<div><b>${k}</b>${v ? esc(v) : '<span class="muted">ثبت نشده</span>'}</div>`,
  )
  .join("");
page({
  file: "about/index.html",
  title: "درباره Next Bit",
  nav: "about",
  desc: "Next Bit نشریهٔ دیجیتال و تعاملی دانشجویی مهندسی کامپیوتر دانشگاه کاشان است: چرا ساخته شد، برای کیست و چطور می‌شود در آن مشارکت کرد.",
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">ABOUT</div><h1 class="h1">پشت صحنه Next Bit</h1></div></section>
<div class="in" style="padding-block:48px"><article class="prose">${blocks(art.behind.blocks, "about", "../", { h2: [], xps: [], c: 0 })}
<h2>هدف</h2><p>${esc(site.description)}</p>
<h2>شماره‌های منتشرشده</h2><p><a href="../${ISS}/index.html"><b>شمارهٔ ۱ — ${esc(issue.title)}</b></a></p>
<h2>تیم</h2>${team.members.length ? "" : '<div class="empty"><b>اطلاعات اعضای تیم هنوز ثبت نشده</b>پس از دریافت اطلاعات واقعی، این بخش تکمیل می‌شود.</div>'}
<h2>راه‌های ارتباطی</h2><div class="meta">${contactRows}</div>
<div class="cta"><a class="btn k" href="../submit/index.html">ارسال مقاله</a><a class="btn ko" href="../collaborate/index.html">همکاری</a><a class="btn ko" href="../contact/index.html">تماس</a></div></article></div>`,
});
page({
  file: "team/index.html",
  title: "تیم",
  nav: "about",
  desc: "تیم تحریریه Next Bit.",
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">TEAM</div><h1 class="h1">تیم Next Bit</h1></div></section><div class="in sec">${team.members.length ? `<div class="cards">${team.members.map((m) => `<div class="xcard"><h3>${esc(m.name)}</h3><p>${esc(m.role || "")}</p></div>`).join("")}</div>` : '<div class="empty"><b>اطلاعات اعضای تیم هنوز ثبت نشده</b>اعضا را در فایل <span class="mono">content/team.json</span> اضافه کنید؛ این صفحه به‌صورت خودکار ساخته می‌شود.</div>'}</div>`,
});
const formPage = (file, title, desc, kind, fields) =>
  page({
    file,
    title,
    nav: "about",
    desc,
    body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">${kind.toUpperCase()}</div><h1 class="h1">${title}</h1><p class="lead">${esc(desc)}</p></div></section>
<div class="in sec"><div class="draft-note" style="max-width:720px;margin-bottom:24px">این سایت استاتیک است و فرم را به هیچ سروری نمی‌فرستد. با زدن «ساخت پیام» متن آمادهٔ ارسال ساخته می‌شود و می‌توانی آن را کپی کنی${site.contact.email ? " یا با ایمیل بفرستی" : "؛ راه ارتباطی رسمی هنوز ثبت نشده است"}.</div>
<form class="fm" data-nb-form="${kind}" data-email="${esc(site.contact.email)}" novalidate>${fields.map((f) => `<div><label for="f-${f.n}">${f.l}${f.r ? " *" : ""}</label>${f.ta ? `<textarea class="ta" id="f-${f.n}" name="${f.n}"${f.r ? " required" : ""}></textarea>` : `<input class="inp" id="f-${f.n}" name="${f.n}" type="${f.type || "text"}"${f.r ? " required" : ""}>`}<div class="er" aria-live="polite"></div></div>`).join("")}<div><button class="btn k" type="submit">ساخت پیام</button></div></form>
<div class="fm-out" id="fm-out" role="status"><b>پیام آمادهٔ ارسال</b><pre id="fm-pre"></pre><div class="cta"><button class="btn sm k" type="button" id="fm-copy">کپی متن</button><a class="btn sm ko" id="fm-mail" href="#" hidden>باز کردن در ایمیل</a></div></div></div>`,
  });
formPage(
  "submit/index.html",
  "ارسال مقاله",
  "ایدهٔ مقاله یا موضوع پیشنهادی‌ات را با ما در میان بگذار.",
  "submit",
  [
    { n: "name", l: "نام", r: 1 },
    { n: "topic", l: "موضوع پیشنهادی", r: 1 },
    { n: "summary", l: "خلاصهٔ ایده", ta: 1, r: 1 },
    { n: "level", l: "سطح مخاطب (مبتدی/متوسط/پیشرفته)" },
  ],
);
formPage(
  "collaborate/index.html",
  "همکاری با Next Bit",
  "نویسنده، طراح، برنامه‌نویس بازی، پژوهشگر یا ویراستار؟ بگو چه کاری از دستت برمی‌آید.",
  "collaborate",
  [
    { n: "name", l: "نام", r: 1 },
    { n: "role", l: "نقش موردعلاقه", r: 1 },
    { n: "about", l: "کمی از تجربه‌ات بگو", ta: 1, r: 1 },
    { n: "links", l: "پیوند نمونه‌کار (اختیاری)" },
  ],
);
formPage("contact/index.html", "تماس", "پیام، سؤال یا گزارش خطا.", "contact", [
  { n: "name", l: "نام", r: 1 },
  { n: "msg", l: "پیام", ta: 1, r: 1 },
]);
page({
  file: "search/index.html",
  title: "جست‌وجو",
  nav: "search",
  desc: "جست‌وجو در متن مقاله‌ها، تجربه‌ها، واژه‌نامه و خط زمانی Next Bit.",
  scripts: ["search-index.js"],
  body: `<section class="dark"><div class="in sec" style="padding-block:56px"><div class="eb">SEARCH</div><h1 class="h1">جست‌وجو</h1></div></section><div class="in sec"><div class="ctl" role="search"><label class="vh" for="s-q">عبارت جست‌وجو</label><input id="s-q" class="inp" type="search" placeholder="مثلاً: ترانزیستور، ENIAC، بیت…" autocomplete="off"></div><p id="s-count" class="muted" role="status" aria-live="polite"></p><div class="res" id="s-res"></div></div>`,
});
write(
  "404.html",
  `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>صفحه پیدا نشد | Next Bit</title><meta name="robots" content="noindex"><style>body{margin:0;background:#0A0B0A;color:#F5F7F3;font-family:Vazirmatn,Tahoma,sans-serif;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px}h1{font:900 clamp(56px,12vw,120px)/1 monospace;color:#00C923;margin:0}a{color:#00C923;font-weight:800}</style></head><body><div><h1>404</h1><p>این صفحه وجود ندارد؛ شاید بیتش اشتباه بود!</p><p><a href="/">خانه</a> · <a href="issues/index.html">آرشیو</a></p></div></body></html>`,
);

// ---------------- data, search index & assets
const strip = (bs) =>
  bs
    .map((b) =>
      b.t === "callout"
        ? b.title + " " + strip(b.blocks)
        : b.t === "list"
          ? b.items.map(clean).join(" ")
          : b.t === "xp"
            ? ""
            : clean(b.x || ""),
    )
    .join(" ");
const SI = [];
list.forEach((a) =>
  SI.push({
    k: "مقاله",
    t: a.title,
    u: `${ISS}/${a.slug}/index.html`,
    x: strip(a.intro) + " " + strip(a.blocks),
  }),
);
exps.forEach((e) =>
  SI.push({
    k: "تجربه",
    t: `${e.titleFa} ${e.title}`,
    u: `experiences/${e.slug}/index.html`,
    x: e.description + " " + e.instructions.join(" "),
  }),
);
gl.forEach((g) =>
  SI.push({
    k: "واژه‌نامه",
    t: g.term,
    u: `${ISS}/glossary/index.html`,
    x: g.def,
  }),
);
timeline.events.forEach((e) =>
  SI.push({
    k: "خط زمانی",
    t: e.title,
    u: "experiences/timeline-explorer/index.html",
    x: `${e.date} ${e.description} ${e.significance}`,
  }),
);
write("assets/search-index.js", "window.NB_SEARCH=" + JSON.stringify(SI) + ";");
write(
  "assets/data.js",
  "window.NB_DATA=" +
    JSON.stringify({
      timeline,
      articles: list.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        label: a.label,
      })),
      siteContact: site.contact,
      issue: `${ISS}`,
      sources: src.sources,
    }) +
    ";",
);
fs.cpSync("src/assets", path.join(OUT, "assets"), { recursive: true });
write(
  "assets/pron.js",
  "window.NB_PRON=" +
    JSON.stringify(
      rd("content/issue-01/pronounce.json").map(([a, b]) => [a, b]),
    ) +
    ";",
);
if (usedPhotos.length) {
  fs.mkdirSync(path.join(OUT, "photos"), { recursive: true });
  [...new Set(usedPhotos)].forEach((f) =>
    fs.copyFileSync(
      `content/issue-01/photos/${f}`,
      path.join(OUT, "photos", f),
    ),
  );
}
if (usedAudio.length) {
  fs.mkdirSync(path.join(OUT, "audio"), { recursive: true });
  [...new Set(usedAudio)].forEach((f) =>
    fs.copyFileSync(`content/issue-01/audio/${f}`, path.join(OUT, "audio", f)),
  );
}
if (fs.existsSync(pdfCache)) fs.copyFileSync(pdfCache, pdfDist);

// ---------------- sitemap, robots
const smUrls = [...new Set(sitemap)];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smUrls.map((u) => `<url><loc>${siteUrl}/${u}</loc></url>`).join("\n")}\n</urlset>\n`,
);
write(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
console.log(
  "built",
  smUrls.length,
  "pages | photos:",
  [...new Set(usedPhotos)].length,
  "| audio:",
  [...new Set(usedAudio)].length,
  "| pdf:",
  fs.existsSync(pdfDist) ? "YES" : "NO",
);
