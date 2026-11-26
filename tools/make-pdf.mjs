// Next Bit Issue 01 — Vector-Sharp Dual-Theme Magazine PDF Generator
// Usage:
//   node tools/make-pdf.mjs                   (builds BOTH editorial + dark PDFs)
//   node tools/make-pdf.mjs --theme=editorial (curated multi-era light->dark magazine)
//   node tools/make-pdf.mjs --theme=dark      (all-dark cyber edition with distinct era tints)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
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

const themeArg = (
  process.argv.find((a) => a.startsWith("--theme=")) || "--theme=both"
).split("=")[1];
const modes =
  themeArg === "both"
    ? ["editorial", "dark"]
    : [themeArg === "dark" ? "dark" : "editorial"];

// Pure-JS Vector QR generator
const qrSandbox = { window: {}, TextEncoder };
vm.runInNewContext(fs.readFileSync("src/assets/qr.js", "utf8"), qrSandbox);
const makeQr = (url, label) => {
  try {
    return qrSandbox.window.NB.qrSvg(url, { label, border: 2 });
  } catch {
    return "";
  }
};

// Pure-Vector Logo Loader
const LOGO = (() => {
  if (!fs.existsSync("src/assets/NextBit.svg")) return "";
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
  return raw.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s+(?:width|height|fill)="[^"]*"/gi, "")
      .trim();
    return `<svg${cleaned ? " " + cleaned : ""} fill="#F5F7F3">`;
  });
})();

const site = rd("content/site.json");
const issuesData = rd("content/issues.json");
const exps = rd("content/experiences.json").experiences;
const art = rd("content/issue-01/articles.json");
const enr = rd("content/issue-01/enrichment.json");

const issue = issuesData.issues[0];
const ISS = `issues/${issue.slug}`;
const siteUrl = site.siteUrl.replace(/\/$/, "");
const expBy = Object.fromEntries(exps.map((e) => [e.id, e]));

const ERA_STEPS = [
  "ابزارها",
  "مکانیک",
  "دودویی",
  "الکترونیک",
  "نرم‌افزار",
  "شبکه",
  "هوش مصنوعی",
  "آینده",
];
const ERA_MAP = {
  ed: {
    pg: "era-ed",
    cls: "era-ed",
    step: -1,
    tag: "EDITORIAL",
    run: "یادداشت تحریریه",
  },
  "ch-0": {
    pg: "era-ch-0",
    cls: "era-ch-0",
    step: 0,
    tag: "CHAPTER 00 // ANCIENT TOOLS",
    run: "فصل صفر · ابزارهای محاسبه",
  },
  "ch-1": {
    pg: "era-ch-1",
    cls: "era-ch-1",
    step: 1,
    tag: "CHAPTER 01 // MECHANICAL",
    run: "فصل اول · ماشین‌های مکانیکی",
  },
  "ch-2": {
    pg: "era-ch-2",
    cls: "era-ch-2",
    step: 2,
    tag: "CHAPTER 02 // BINARY & LOGIC",
    run: "فصل دوم · صفر و یک و منطق",
  },
  "ch-3": {
    pg: "era-ch-3",
    cls: "era-ch-3",
    step: 3,
    tag: "CHAPTER 03 // VACUUM TUBES",
    run: "فصل سوم · لامپ خلأ و ENIAC",
  },
  "ch-4": {
    pg: "era-ch-4",
    cls: "era-ch-4",
    step: 3,
    tag: "CHAPTER 04 // TRANSISTOR",
    run: "فصل چهارم · ترانزیستور و تراشه",
  },
  "ch-5": {
    pg: "era-ch-5",
    cls: "era-ch-5",
    step: 4,
    tag: "CHAPTER 05 // FIRST PROGRAMS",
    run: "فصل پنجم · اولین برنامه‌ها",
  },
  "ch-6": {
    pg: "era-ch-6",
    cls: "era-ch-6",
    step: 4,
    tag: "CHAPTER 06 // PERSONAL PC",
    run: "فصل ششم · کامپیوتر شخصی",
  },
  "ch-7": {
    pg: "era-ch-7",
    cls: "era-ch-7",
    step: 5,
    tag: "CHAPTER 07 // INTERNET & WEB",
    run: "فصل هفتم · اینترنت و وب",
  },
  "ch-8": {
    pg: "era-ch-8",
    cls: "era-ch-8",
    step: 6,
    tag: "CHAPTER 08 // AI & LEARNING",
    run: "فصل هشتم · هوش مصنوعی",
  },
  "ch-9": {
    pg: "era-ch-9",
    cls: "era-ch-9",
    step: 7,
    tag: "CHAPTER 09 // THE FUTURE",
    run: "فصل نهم · آیندهٔ کامپیوتر",
  },
  "sp-1": {
    pg: "era-sp-1",
    cls: "era-sp-1",
    step: -1,
    tag: "SPECIAL 01 // HISTORY OF BUGS",
    run: "پروندهٔ ویژه ۱ · باگ تاریخی",
  },
  "sp-2": {
    pg: "era-sp-2",
    cls: "era-sp-2",
    step: -1,
    tag: "SPECIAL 02 // CPU VS GPU",
    run: "پروندهٔ ویژه ۲ · CPU یا GPU",
  },
  "sp-3": {
    pg: "era-sp-3",
    cls: "era-sp-3",
    step: -1,
    tag: "SPECIAL 03 // SORTING",
    run: "پروندهٔ ویژه ۳ · مرتب‌سازی",
  },
};

const PORTRAIT_FILES = new Set([
  "charles-babbage.jpg",
  "ada-lovelace.jpg",
  "grace-hopper.jpg",
  "macintosh-1984.jpg",
]);

const photoCache = {};
function photoDataUri(file) {
  if (photoCache[file] !== undefined) return photoCache[file];
  const full = path.join("content/issue-01/photos", file);
  if (!fs.existsSync(full)) return (photoCache[file] = null);
  const ext = path.extname(file).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return (photoCache[file] =
    `data:${mime};base64,${fs.readFileSync(full).toString("base64")}`);
}

// Apply editorial enrichment
const FN_RE = /(\d+)/g;
const figSvg = (f) => fs.readFileSync(`content/issue-01/figures/${f}`, "utf8");
{
  const bySlug = Object.fromEntries(art.articles.map((a) => [a.slug, a]));
  for (const ad of enr.additions) {
    const a = bySlug[ad.slug];
    if (!a) continue;
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
    if (i >= 0)
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
    if (i >= 0) a.blocks.splice(i + 1, 0, { t: "photo", ...f });
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
    a.fn = [];
    walk(a.blocks, (txt) => {
      for (const m of txt.matchAll(FN_RE))
        a.fn.push({ ...enr.footnotes[+m[1]], gi: +m[1], n: a.fn.length + 1 });
      return txt;
    });
  }
}

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
const totalMin = list.reduce((s, a) => s + a.readingMinutes, 0);

const fnx = (html, aid) => {
  const A = byId[aid];
  if (!A || !A.fn) return html;
  return html.replace(FN_RE, (_, gi) => {
    const f = A.fn.find((x) => x.gi === +gi);
    return f ? `<sup class="fn-ref">${toFa(f.n)}</sup>` : "";
  });
};

function xpPdfCard(id) {
  const e = expBy[id];
  if (!e) return "";
  const url = `${siteUrl}/experiences/${e.slug}/`;
  return `<div class="pdf-xp">
    <div class="pdf-xp-txt">
      <div class="kk">INTERACTIVE LAB // LIVE WEB</div>
      <h4>آزمایشگاه تعاملی: ${inline(e.titleFa)}</h4>
      <p>${inline(e.description)}</p>
      <div class="pdf-xp-hint">◀ کد QR را اسکن کن تا این آزمایشگاه زنده در مرورگر اجرا شود</div>
    </div>
    <div class="pdf-qr">${makeQr(url, e.titleFa)}<span>اجرای زنده</span></div>
  </div>`;
}

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
function renderBlocks(bs, aid, state = { pulled: false }) {
  return bs
    .map((b) => {
      if (b.t === "p") {
        if (b.strong)
          return `<p class="p-strong"><strong>${inline(b.x)}</strong></p>`;
        const plain = b.x.replace(FN_RE, "").trim();
        if (
          !state.pulled &&
          aid !== "start" &&
          plain.length >= 48 &&
          plain.length <= 125 &&
          /[؟!]$/.test(plain)
        ) {
          state.pulled = true;
          return `<blockquote class="pull-q">${fnx(inline(b.x), aid)}</blockquote>`;
        }
        return `<p>${fnx(inline(b.x), aid)}</p>`;
      }
      if (b.t === "h2") return `<h2>${inline(b.x)}</h2>`;
      if (b.t === "ex") {
        const hasMath = /[×+=]/.test(b.x);
        return `<p class="ex${hasMath ? " math" : /[،و]/.test(b.x) ? " fa" : ""}" dir="${hasMath ? "ltr" : /[،و]/.test(b.x) ? "rtl" : "ltr"}">${esc(b.x)}</p>`;
      }
      if (b.t === "list")
        return `<${b.ordered ? "ol" : "ul"}>${b.items.map((i) => `<li>${fnx(inline(i), aid)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`;
      if (b.t === "fig")
        return `<figure class="fig">${figSvg(b.svg)}<figcaption>${inline(b.caption)}${b.credit ? `<small>${inline(b.credit)}</small>` : ""}</figcaption></figure>`;
      if (b.t === "photo") {
        const uri = photoDataUri(b.file);
        if (!uri) return "";
        const isPortrait = PORTRAIT_FILES.has(b.file);
        return `<figure class="fig ph${isPortrait ? " side" : ""}"><img src="${uri}" alt="${esc(b.alt)}"><figcaption><b>${inline(b.caption)}</b>${b.credit ? `<small>${inline(b.credit)}</small>` : ""}</figcaption></figure>`;
      }
      if (b.t === "edtag") return "";
      if (b.t === "xp") return xpPdfCard(b.id);
      if (b.t === "callout") {
        const k = KMAP[b.kind] || "think";
        return `<aside class="callout ${k}"><h3>${inline(b.title)}</h3>${renderBlocks(b.blocks, aid, { pulled: true })}${b.xp ? xpPdfCard(b.xp) : ""}</aside>`;
      }
      return "";
    })
    .join("\n");
}

function eraStrip(step) {
  if (step < 0) return "";
  return `<div class="era-strip">${ERA_STEPS.map((name, i) => `<span class="${i === step ? "on" : i < step ? "past" : ""}">${name}</span>`).join("")}</div>`;
}

function footnotesHtml(a) {
  if (!a.fn || !a.fn.length) return "";
  return `<section class="fn-list"><h3>پاورقی‌ها و توضیحات تکمیلی</h3><ol>${a.fn.map((f) => `<li><b>${inline(f.title)}:</b> ${inline(f.text)}</li>`).join("")}</ol></section>`;
}

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const coverMatrix = Array.from(
  { length: 84 },
  () => `<i${rnd() > 0.76 ? ' class="g"' : ""}>${rnd() > 0.5 ? 1 : 0}</i>`,
).join("");

const tocCards = list
  .map((a) => {
    const era = ERA_MAP[a.id] || ERA_MAP["ch-2"];
    return `<div class="toc-card ${era.cls}">
    <div class="toc-top"><span class="toc-n">${a.kind === "chapter" ? String(a.n).padStart(2, "0") : a.kind === "special" ? "SP" : "ED"}</span><span class="toc-m">${toFa(a.readingMinutes)} دقیقه</span></div>
    <b>${inline(a.title)}</b>
    <small>${esc(a.label)} · ${inline(a.topic)}</small>
  </div>`;
  })
  .join("");

const chaptersHtml = list
  .map((a) => {
    const era = ERA_MAP[a.id] || ERA_MAP["ch-2"];
    const wm =
      a.kind === "chapter"
        ? String(a.n).padStart(2, "0")
        : a.kind === "special"
          ? "SP"
          : "NB";
    const podUrl = `${siteUrl}/${ISS}/${a.slug}/#listen-${a.id}`;
    return `<section class="chapter ${era.cls}" style="page:${era.pg}">
    ${eraStrip(era.step)}
    <header class="ch-head">
      <div class="ch-wm">${wm}</div>
      <div class="ch-head-grid">
        <div class="ch-head-main">
          <div class="ch-meta"><span class="kk">${era.tag}</span><span class="ch-time">${toFa(a.readingMinutes)} دقیقه مطالعه</span></div>
          <div class="ch-lbl">${esc(a.label)}</div>
          <h1>${inline(a.title)}</h1>
        </div>
        <div class="ch-pod">
          <div class="pdf-qr sm">${makeQr(podUrl, "پادکست " + a.title)}<span>🎧 پادکست</span></div>
        </div>
      </div>
    </header>
    <div class="ch-body">
      ${a.intro.length ? `<div class="intro">${renderBlocks(a.intro, a.id, { pulled: true })}</div>` : ""}
      ${renderBlocks(a.blocks, a.id, { pulled: false })}
      <div class="clr"></div>
      ${footnotesHtml(a)}
    </div>
  </section>`;
  })
  .join("\n");

const glossaryHtml = `<section class="chapter era-gloss" style="page:era-gloss">
  <header class="ch-head"><div class="ch-wm">AZ</div><div class="ch-head-main"><div class="ch-meta"><span class="kk">GLOSSARY // A–Z</span></div><h1>واژه‌نامهٔ زندهٔ شمارهٔ اول</h1></div></header>
  <div class="glo-grid">${art.glossary.map((g) => `<div class="glo-item"><b>${inline(g.term)}</b><p>${inline(g.def)}</p></div>`).join("")}</div>
</section>`;

const startHtml = `<section class="chapter era-gloss" style="page:era-gloss">
  <header class="ch-head"><div class="ch-wm">→</div><div class="ch-head-main"><div class="ch-meta"><span class="kk">NEXT STEPS &amp; SOURCES</span></div><h1>${inline(art.start.title)}</h1></div></header>
  <div class="ch-body">${renderBlocks(art.start.blocks, "start", { pulled: true })}</div>
  <h2 class="sec-sub">منابع و مطالعهٔ بیشتر</h2>
  <p class="muted" style="font-size:8.6pt;margin-bottom:8px">${inline(art.sources.intro[0] || "")}</p>
  <ol class="src-ol">${art.sources.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ol>
</section>`;

const backCoverHtml = `<section class="back-cover">
  <div class="bc-logo">${LOGO}</div>
  <div class="kk" style="color:#00E028">NEXT BIT // ISSUE 01</div>
  <h2>بیت بعدی رو تو انتخاب کن.</h2>
  <p>${esc(site.tagline)}</p>
  <div class="bc-qr">
    <div class="pdf-qr big">${makeQr(`${siteUrl}/`, "سایت Next Bit")}<span>ورود به نسخهٔ تعاملی</span></div>
  </div>
  <div class="bc-foot">${esc(siteUrl)}<br>${esc(site.university)}</div>
</section>`;

// Smooth, distinct per-chapter color worlds (15 unique worlds, gradual hue wheel)
const CHAPTER_THEMES = {
  editorial: {
    label: "EDITORIAL EDITION",
    tocBg: "#F4F6F2",
    tocTx: "#121814",
    tocCardBg: "#FFFFFF",
    tocBrd: "#D5DDD7",
    tocMute: "#56645C",
    pages: {
      ed: {
        run: "یادداشت تحریریه",
        pg: "#F3F7F4",
        acc: "#008A20",
        surf: "#E7F0EA",
        surf2: "#DCEAE1",
        brd: "#C4DACB",
        tx: "#111A14",
        soft: "#364A3D",
        mute: "#5E7566",
        wm: "#D4E6DA",
        onTx: "#FFFFFF",
      },
      "ch-0": {
        run: "فصل صفر · ابزارهای محاسبه",
        pg: "#FAF3E8",
        acc: "#B45309",
        surf: "#F2E6D3",
        surf2: "#EBDAC0",
        brd: "#DEC7A4",
        tx: "#241B11",
        soft: "#503E2A",
        mute: "#7E674E",
        wm: "#E8D6B9",
        onTx: "#FFFFFF",
      },
      "ch-1": {
        run: "فصل اول · ماشین‌های مکانیکی",
        pg: "#F8F5E6",
        acc: "#9A6B00",
        surf: "#EFEAD1",
        surf2: "#E7E0BE",
        brd: "#D9CE9F",
        tx: "#221E0F",
        soft: "#4D4529",
        mute: "#7A704C",
        wm: "#E4DCBA",
        onTx: "#FFFFFF",
      },
      "ch-2": {
        run: "فصل دوم · صفر و یک و منطق",
        pg: "#F0F7EE",
        acc: "#15803D",
        surf: "#E2F0DF",
        surf2: "#D5E8D1",
        brd: "#BAD9B4",
        tx: "#111D13",
        soft: "#324E37",
        mute: "#58785E",
        wm: "#CEE3CA",
        onTx: "#FFFFFF",
      },
      "ch-3": {
        run: "فصل سوم · لامپ خلأ و ENIAC",
        pg: "#ECF7F3",
        acc: "#047857",
        surf: "#DDF0E9",
        surf2: "#CEE8DF",
        brd: "#B2D9CC",
        tx: "#0E1E19",
        soft: "#2D4F44",
        mute: "#52786C",
        wm: "#C8E3D9",
        onTx: "#FFFFFF",
      },
      "ch-4": {
        run: "فصل چهارم · ترانزیستور",
        pg: "#ECF6F7",
        acc: "#0F766E",
        surf: "#DDF0F2",
        surf2: "#CEE7EA",
        brd: "#B0D6DB",
        tx: "#0E1D1F",
        soft: "#2D4D52",
        mute: "#52767C",
        wm: "#C7E1E5",
        onTx: "#FFFFFF",
      },
      "ch-5": {
        run: "فصل پنجم · اولین برنامه‌ها",
        pg: "#EDF5FA",
        acc: "#0284C7",
        surf: "#DFECF6",
        surf2: "#D1E4F2",
        brd: "#B3D1E8",
        tx: "#0F1B26",
        soft: "#304961",
        mute: "#55728C",
        wm: "#C9DFEE",
        onTx: "#FFFFFF",
      },
      "ch-6": {
        run: "فصل ششم · کامپیوتر شخصی",
        pg: "#EFF3FB",
        acc: "#1D4ED8",
        surf: "#E2E9F7",
        surf2: "#D5E0F4",
        brd: "#B8CBEB",
        tx: "#11182A",
        soft: "#334469",
        mute: "#596C94",
        wm: "#CCD8F0",
        onTx: "#FFFFFF",
      },
      "ch-7": {
        run: "فصل هفتم · اینترنت و وب",
        pg: "#F2F2FC",
        acc: "#4338CA",
        surf: "#E5E6F8",
        surf2: "#D9DAF5",
        brd: "#BFC1EC",
        tx: "#15142B",
        soft: "#3B3969",
        mute: "#626094",
        wm: "#D2D3F0",
        onTx: "#FFFFFF",
      },
      "ch-8": {
        run: "فصل هشتم · هوش مصنوعی",
        pg: "#F6F1FC",
        acc: "#7C3AED",
        surf: "#ECE3F8",
        surf2: "#E3D5F5",
        brd: "#CEBBE9",
        tx: "#1C132B",
        soft: "#453566",
        mute: "#6E5B94",
        wm: "#DDD0F0",
        onTx: "#FFFFFF",
      },
      "ch-9": {
        run: "فصل نهم · آیندهٔ کامپیوتر",
        pg: "#FAF0FA",
        acc: "#A21CAF",
        surf: "#F3E1F3",
        surf2: "#ECD3EC",
        brd: "#DCB8DC",
        tx: "#261226",
        soft: "#573257",
        mute: "#855885",
        wm: "#E7CCE7",
        onTx: "#FFFFFF",
      },
      "sp-1": {
        run: "پروندهٔ ویژه ۱ · باگ تاریخی",
        pg: "#FBF0F2",
        acc: "#BE123C",
        surf: "#F5E1E5",
        surf2: "#EED3D9",
        brd: "#DFB6BF",
        tx: "#261217",
        soft: "#59323B",
        mute: "#875762",
        wm: "#E9CCD2",
        onTx: "#FFFFFF",
      },
      "sp-2": {
        run: "پروندهٔ ویژه ۲ · CPU یا GPU",
        pg: "#FDF3EB",
        acc: "#C2410C",
        surf: "#F7E5D6",
        surf2: "#F1D9C5",
        brd: "#E4BF9F",
        tx: "#26160D",
        soft: "#593A28",
        mute: "#87624C",
        wm: "#ECD2BC",
        onTx: "#FFFFFF",
      },
      "sp-3": {
        run: "پروندهٔ ویژه ۳ · مرتب‌سازی",
        pg: "#FBF6E8",
        acc: "#A16207",
        surf: "#F3EBD3",
        surf2: "#ECE0BF",
        brd: "#DECBA0",
        tx: "#241D0E",
        soft: "#544628",
        mute: "#82714C",
        wm: "#E7DAB7",
        onTx: "#FFFFFF",
      },
      gloss: {
        run: "واژه‌نامه و منابع",
        pg: "#F4F7F5",
        acc: "#008A20",
        surf: "#FFFFFF",
        surf2: "#E9F0EB",
        brd: "#CEDAD2",
        tx: "#121914",
        soft: "#3A4A40",
        mute: "#627569",
        wm: "#DCE6DF",
        onTx: "#FFFFFF",
      },
    },
  },
  dark: {
    label: "CYBER DARK EDITION",
    tocBg: "#090D0B",
    tocTx: "#EBF2EE",
    tocCardBg: "#121A15",
    tocBrd: "#233329",
    tocMute: "#83968B",
    pages: {
      ed: {
        run: "یادداشت تحریریه",
        pg: "#09110C",
        acc: "#00E028",
        surf: "#111E16",
        surf2: "#17291E",
        brd: "#24402E",
        tx: "#ECF3EE",
        soft: "#B8C9BE",
        mute: "#7E9687",
        wm: "#172E1F",
        onTx: "#060D08",
      },
      "ch-0": {
        run: "فصل صفر · ابزارهای محاسبه",
        pg: "#17120C",
        acc: "#F59E0B",
        surf: "#221A11",
        surf2: "#2C2216",
        brd: "#453522",
        tx: "#F5EFE4",
        soft: "#CFC2AC",
        mute: "#998B74",
        wm: "#302517",
        onTx: "#120E08",
      },
      "ch-1": {
        run: "فصل اول · ماشین‌های مکانیکی",
        pg: "#16150B",
        acc: "#EAB308",
        surf: "#211F10",
        surf2: "#2B2915",
        brd: "#433F20",
        tx: "#F4F2E1",
        soft: "#CCC8A8",
        mute: "#969270",
        wm: "#2F2C16",
        onTx: "#121108",
      },
      "ch-2": {
        run: "فصل دوم · صفر و یک و منطق",
        pg: "#0A140C",
        acc: "#22C55E",
        surf: "#122215",
        surf2: "#182E1D",
        brd: "#26472E",
        tx: "#ECF5EE",
        soft: "#B6CCB9",
        mute: "#7C9980",
        wm: "#19331E",
        onTx: "#060F08",
      },
      "ch-3": {
        run: "فصل سوم · لامپ خلأ و ENIAC",
        pg: "#091410",
        acc: "#10B981",
        surf: "#11221B",
        surf2: "#172E25",
        brd: "#24473A",
        tx: "#ECF5F2",
        soft: "#B5CCC4",
        mute: "#7A998E",
        wm: "#183328",
        onTx: "#060F0B",
      },
      "ch-4": {
        run: "فصل چهارم · ترانزیستور",
        pg: "#091417",
        acc: "#14B8A6",
        surf: "#102226",
        surf2: "#162E33",
        brd: "#23474F",
        tx: "#ECF4F5",
        soft: "#B4CACE",
        mute: "#7A969C",
        wm: "#173238",
        onTx: "#060E10",
      },
      "ch-5": {
        run: "فصل پنجم · اولین برنامه‌ها",
        pg: "#09131C",
        acc: "#38BDF8",
        surf: "#10202E",
        surf2: "#162B3D",
        brd: "#23435E",
        tx: "#ECF4FA",
        soft: "#B4CAE0",
        mute: "#7B98B5",
        wm: "#172F42",
        onTx: "#060E14",
      },
      "ch-6": {
        run: "فصل ششم · کامپیوتر شخصی",
        pg: "#0B1120",
        acc: "#60A5FA",
        surf: "#131D33",
        surf2: "#1A2745",
        brd: "#293D6B",
        tx: "#EEF3FA",
        soft: "#B8C7E0",
        mute: "#8093B5",
        wm: "#1C2B4D",
        onTx: "#070B14",
      },
      "ch-7": {
        run: "فصل هفتم · اینترنت و وب",
        pg: "#0E0F21",
        acc: "#818CF8",
        surf: "#171936",
        surf2: "#1F2247",
        brd: "#30356E",
        tx: "#EFF0FA",
        soft: "#BEC0E0",
        mute: "#8689B5",
        wm: "#22264F",
        onTx: "#090A14",
      },
      "ch-8": {
        run: "فصل هشتم · هوش مصنوعی",
        pg: "#130D22",
        acc: "#C084FC",
        surf: "#1E1536",
        surf2: "#281C47",
        brd: "#3E2B6E",
        tx: "#F3EEFA",
        soft: "#CBBCE0",
        mute: "#9683B5",
        wm: "#2B1E4F",
        onTx: "#0C0814",
      },
      "ch-9": {
        run: "فصل نهم · آیندهٔ کامپیوتر",
        pg: "#190D1F",
        acc: "#E879F9",
        surf: "#261430",
        surf2: "#331B40",
        brd: "#4F2A63",
        tx: "#F7EEF9",
        soft: "#D5BBD9",
        mute: "#A182A6",
        wm: "#381E47",
        onTx: "#100814",
      },
      "sp-1": {
        run: "پروندهٔ ویژه ۱ · باگ تاریخی",
        pg: "#1C0E13",
        acc: "#FB7185",
        surf: "#2B161D",
        surf2: "#381D26",
        brd: "#572D3B",
        tx: "#F9EEF1",
        soft: "#D9BDC5",
        mute: "#A6838D",
        wm: "#3E202A",
        onTx: "#14090C",
      },
      "sp-2": {
        run: "پروندهٔ ویژه ۲ · CPU یا GPU",
        pg: "#1C110C",
        acc: "#FB923C",
        surf: "#2B1B13",
        surf2: "#382319",
        brd: "#573727",
        tx: "#F9F0EB",
        soft: "#D9C3B8",
        mute: "#A68B7E",
        wm: "#3E271C",
        onTx: "#140B07",
      },
      "sp-3": {
        run: "پروندهٔ ویژه ۳ · مرتب‌سازی",
        pg: "#19140B",
        acc: "#FBBF24",
        surf: "#261F11",
        surf2: "#332917",
        brd: "#4F4024",
        tx: "#F7F3E8",
        soft: "#D4CBB4",
        mute: "#A1967B",
        wm: "#382D19",
        onTx: "#120F07",
      },
      gloss: {
        run: "واژه‌نامه و منابع",
        pg: "#09110D",
        acc: "#00E028",
        surf: "#121D17",
        surf2: "#18261E",
        brd: "#263D30",
        tx: "#EBF2EE",
        soft: "#B8C9BE",
        mute: "#809488",
        wm: "#182920",
        onTx: "#060D08",
      },
    },
  },
};

function allEraCss(mode) {
  const pages = CHAPTER_THEMES[mode].pages;
  return Object.entries(pages)
    .map(
      ([name, p]) => `@page era-${name} {
  background: ${p.pg};
  @top-right { content: "NEXT BIT  ·  ${p.run}"; font-family: 'Vazirmatn', sans-serif; font-size: 7.5pt; color: ${p.mute}; border-bottom: 0.6pt solid ${p.brd}; padding-bottom: 3mm; margin-bottom: 3mm; }
  @top-left { content: "ISSUE 01"; font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: ${p.acc}; border-bottom: 0.6pt solid ${p.brd}; padding-bottom: 3mm; margin-bottom: 3mm; }
  @bottom-center { content: "—  " counter(page, persian) "  —"; font-family: 'Vazirmatn', sans-serif; font-size: 8.5pt; font-weight: 700; color: ${p.mute}; padding-top: 2mm; }
}
.era-${name} { --pg:${p.pg}; --acc:${p.acc}; --acc-bg:${p.surf}; --surf:${p.surf}; --surf2:${p.surf2}; --brd:${p.brd}; --tx:${p.tx}; --soft:${p.soft}; --mute:${p.mute}; --wm:${p.wm}; --on-tx:${p.onTx}; }`,
    )
    .join("\n");
}

function buildHtml(mode) {
  const P = CHAPTER_THEMES[mode];
  return `<!doctype html>
<html lang="fa" dir="rtl" data-pdf-mode="${mode}">
<head>
<meta charset="utf-8">
<title>Next Bit — شمارهٔ اول (${mode})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=JetBrains+Mono:wght@500;700&family=Vazirmatn:wght@400;600;700;800;900&display=swap">
<style>
@page { size: A4; margin: 16mm 13mm 16mm 13mm; }
@page :first { margin: 0; background: #070A08; @top-right{content:none} @top-left{content:none} @bottom-center{content:none} }
@page back { margin: 0; background: #070A08; @top-right{content:none} @top-left{content:none} @bottom-center{content:none} }
@page toc { background: ${P.tocBg}; @top-right{content:none} @top-left{content:none} @bottom-center{content:none} }

${allEraCss(mode)}

/* CRITICAL: transparent body so @page paints each era cleanly without black overlays */
*{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html, body{ margin:0; background:transparent !important; font-family:'Vazirmatn','Tahoma',sans-serif; font-size:9.8pt; line-height:1.92; }
h1,h2,h3,h4,p,ul,ol,figure,blockquote{ margin:0; }
.en,bdi.en{ font-family:'Archivo','Vazirmatn',sans-serif; direction:ltr; unicode-bidi:isolate; }
.kk{ font:700 7.6pt 'JetBrains Mono',monospace; letter-spacing:.08em; color:var(--acc, #00E028); direction:ltr; }
.clr{ clear:both; }
.muted{ color:var(--mute); }

/* ---- Cover (Pure Vector, Zero Rasterizing Filters) ---- */
.cover-page{
  page:first; position:relative; width:210mm; height:297mm; background:#070A08; color:#F5F7F3;
  padding:18mm; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; break-after:page;
}
.cover-page::after{ content:""; position:absolute; inset:7mm; border:1.5pt solid #174720; pointer-events:none; }
.cv-top{ display:flex; justify-content:space-between; align-items:center; direction:ltr; }
.cv-brand{ display:flex; align-items:center; gap:10px; }
.cv-brand svg{ width:46px; height:auto; }
.cv-brand b{ font:900 17pt 'Archivo',sans-serif; letter-spacing:.24em; color:#F5F7F3; }
.cv-pill{ border:1pt solid #00E028; color:#00E028; padding:4px 12px; font:700 8pt 'JetBrains Mono',monospace; background:#0B1E0F; }
.cv-mx{ display:grid; grid-template-columns:repeat(12,1fr); gap:6px; font:700 12pt 'JetBrains Mono',monospace; color:#1E2B22; direction:ltr; text-align:center; padding:7mm 0; border-top:1pt solid #1B2920; border-bottom:1pt solid #1B2920; }
.cv-mx i{ font-style:normal; } .cv-mx i.g{ color:#00E028; }
.cv-issue-tag{ display:inline-block; background:#00E028; color:#070A08; font:900 9.5pt 'JetBrains Mono',monospace; padding:4px 12px; letter-spacing:.08em; margin-bottom:5mm; direction:ltr; }
.cv-main h1{ font-size:40pt; font-weight:900; line-height:1.25; color:#F5F7F3; }
.cv-main h1 em{ font-style:normal; color:#00E028; }
.cv-main p{ font-size:12pt; color:#B9C7BF; margin-top:5mm; max-width:38ch; line-height:1.85; }
.cv-badges{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8mm; }
.cv-badges span{ background:#101A13; border:1pt solid #233829; border-inline-start:3pt solid #00E028; padding:6px 12px; font:700 8.8pt 'Vazirmatn',sans-serif; color:#EBF2EE; }
.cv-foot{ display:flex; justify-content:space-between; align-items:center; border-top:1pt solid #203025; padding-top:5mm; font-size:9.5pt; color:#B9C7BF; }

/* ---- TOC ---- */
.toc-page{ page:toc; break-after:page; color:${P.tocTx}; }
.toc-head{ display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:8px; margin-bottom:12px; border-bottom:2pt solid #00B821; }
.toc-head h2{ font-size:19pt; font-weight:900; color:${P.tocTx}; }
.toc-grid{ display:grid; grid-template-columns:1fr 1fr; gap:7px; }
.toc-card{ background:${P.tocCardBg}; border:0.8pt solid ${P.tocBrd}; border-inline-start:3.5pt solid var(--acc); padding:7px 10px; break-inside:avoid; }
.toc-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:2px; }
.toc-n{ font:900 10.5pt 'JetBrains Mono',monospace; color:var(--acc); direction:ltr; }
.toc-m{ font-size:7.6pt; color:${P.tocMute}; }
.toc-card b{ display:block; font-size:9pt; font-weight:800; line-height:1.45; color:${P.tocTx}; }
.toc-card small{ display:block; font-size:7.4pt; color:${P.tocMute}; margin-top:2px; }
.toc-banner{ margin-top:11px; background:#0A120D; color:#F5F7F3; border:1.2pt solid #00B821; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; }
.toc-banner b{ display:block; font-size:10pt; margin:2px 0; color:#F5F7F3; }
.toc-banner p{ font-size:8.3pt; color:#B9C7BF; line-height:1.6; }

/* ---- Chapters ---- */
.chapter{ break-before:page; color:var(--tx); }
.era-strip{ display:flex; justify-content:space-between; gap:4px; margin-bottom:9px; padding-bottom:6px; border-bottom:0.8pt solid var(--brd); }
.era-strip span{ flex:1; text-align:center; font-size:7pt; font-weight:700; color:var(--mute); padding:2.5px 0; border-radius:2px; }
.era-strip span.past{ color:var(--soft); }
.era-strip span.on{ background:var(--acc); color:var(--on-tx); }

.ch-head{
  position:relative; overflow:hidden; background:var(--surf);
  border:0.9pt solid var(--brd); border-inline-start:5pt solid var(--acc);
  padding:12px 15px; margin-bottom:13px;
}
/* Solid pre-blended watermark color (no opacity -> stays 100% vector when zoomed!) */
.ch-wm{ position:absolute; left:88px; bottom:-12px; font:900 62pt/1 'JetBrains Mono',monospace; color:var(--wm); pointer-events:none; direction:ltr; }
.ch-head-grid{ display:flex; justify-content:space-between; align-items:center; gap:12px; position:relative; z-index:2; }
.ch-head-main{ flex:1; min-width:0; }
.ch-meta{ display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px; }
.ch-time{ font-size:7.8pt; color:var(--mute); font-weight:600; }
.ch-lbl{ font-size:8.6pt; color:var(--soft); font-weight:700; }
.ch-head h1{ font-size:16.5pt; font-weight:900; line-height:1.4; color:var(--tx); margin-top:2px; }
.ch-pod{ flex:none; }

.ch-body > * + *{ margin-top:8px; }
.ch-body p{ text-align:justify; color:var(--tx); orphans:3; widows:3; }
.ch-body .intro{ background:var(--acc-bg); border-inline-start:3.5pt solid var(--acc); padding:9px 13px; margin-bottom:11px; }
.ch-body .intro p:first-child{ font-weight:700; font-size:10.4pt; color:var(--tx); }
.ch-body h2, .sec-sub{
  clear:both; font-size:12.5pt; font-weight:900; color:var(--tx); margin-top:15px; padding-top:7px;
  border-top:1.2pt solid var(--brd); position:relative; break-after:avoid;
}
.ch-body h2::before, .sec-sub::before{ content:""; position:absolute; top:-1.5pt; right:0; width:40px; height:2.8pt; background:var(--acc); }
.ch-body ul, .ch-body ol{ padding-inline-start:1.45em; color:var(--tx); }
.ch-body li{ margin-top:2.5px; }
.p-strong strong{ color:var(--acc); }

.pull-q{
  clear:both; margin:12px 0; padding:11px 15px; position:relative; break-inside:avoid;
  background:var(--surf); border:0.8pt solid var(--brd); border-inline-start:4.5pt solid var(--acc);
  font-size:11pt; font-weight:800; line-height:1.7; color:var(--tx);
}
.pull-q::before{ content:"«"; position:absolute; top:-4px; left:12px; font-size:26pt; line-height:1; color:var(--wm); }

.ex{
  background:var(--surf2); border:0.8pt solid var(--brd); border-inline-start:3.5pt solid var(--acc);
  padding:7px 11px; font:700 10.2pt 'JetBrains Mono',monospace; color:var(--acc); text-align:center; break-inside:avoid;
}
.ex.fa{ font-family:'Vazirmatn',sans-serif; color:var(--tx); }
.ex.math{ font-family:'Vazirmatn','JetBrains Mono',monospace; letter-spacing:.04em; }

/* Callouts (Crisp Vector Borders, Zero Rasterizing Shadows) */
.callout{ clear:both; background:var(--surf); border:0.9pt solid var(--brd); padding:10px 13px; margin-top:11px; break-inside:avoid; }
.callout > h3{ font:800 9.6pt 'Vazirmatn',sans-serif; color:var(--acc); margin-bottom:5px; display:flex; align-items:center; gap:6px; }
.callout > h3::before{ content:"▪"; color:var(--acc); font-size:12pt; line-height:1; }
.callout.believe{ background:var(--surf2); border:1.2pt solid var(--acc); }
.callout.bug{ border:1.2pt dashed var(--acc); background:var(--acc-bg); }
.callout.summary{ background:var(--surf2); border:0.9pt solid var(--brd); border-inline-start:4.5pt solid var(--acc); }
.callout > * + *{ margin-top:5px; }

/* Photos: Clean Museum Frame Without Black Pillarboxes */
figure.fig{ margin:11px 0; break-inside:avoid; }
figure.fig.ph{
  background:var(--surf); border:0.9pt solid var(--brd); border-bottom:3pt solid var(--acc);
  padding:7px; text-align:center;
}
figure.fig.ph img{
  display:block; max-width:100%; max-height:70mm; width:auto; height:auto; margin:0 auto;
  border:0.5pt solid var(--brd); image-rendering:high-quality;
}
figure.fig.ph.side{ float:left; width:43%; margin:4px 14px 10px 0; }
figure.fig.ph.side img{ max-height:60mm; }
figure.fig figcaption{ margin-top:6px; padding-top:5px; border-top:0.7pt solid var(--brd); font-size:8pt; line-height:1.58; color:var(--soft); text-align:start; }
figure.fig figcaption b{ display:block; font-weight:700; color:var(--tx); }
figure.fig figcaption small{ display:block; color:var(--mute); font-size:7.3pt; margin-top:2px; }

/* Interactive Lab QR Card */
.pdf-xp{
  clear:both; display:flex; justify-content:space-between; align-items:center; gap:12px;
  padding:10px 13px; margin:11px 0; background:var(--surf2);
  border:1.2pt solid var(--acc); border-inline-start:5pt solid var(--acc); break-inside:avoid;
}
.pdf-xp h4{ font-size:10pt; font-weight:800; color:var(--tx); margin:2px 0 3px; }
.pdf-xp p{ font-size:8.2pt; color:var(--soft); line-height:1.6; }
.pdf-xp-hint{ font-size:7.8pt; color:var(--acc); margin-top:4px; font-weight:700; }

.pdf-qr{ flex:none; width:68px; text-align:center; background:#FFFFFF; padding:4px; border:0.7pt solid #CBD5CE; }
.pdf-qr svg{ width:58px; height:58px; display:block; margin:0 auto; }
.pdf-qr span{ display:block; font-size:6.6pt; font-weight:800; color:#090D0B; margin-top:2px; }
.pdf-qr.sm{ width:64px; padding:3px; }
.pdf-qr.sm svg{ width:54px; height:54px; }
.pdf-qr.big{ width:112px; padding:7px; }
.pdf-qr.big svg{ width:96px; height:96px; }
.pdf-qr.big span{ font-size:8pt; margin-top:4px; }

/* Compact 2-Column Footnotes */
sup.fn-ref{ font:700 7.2pt 'JetBrains Mono',monospace; color:var(--acc); margin-inline:1px; }
.fn-list{ clear:both; margin-top:13px; padding:9px 12px; background:var(--surf); border-top:2pt solid var(--acc); break-inside:avoid; }
.fn-list h3{ font-size:9pt; font-weight:800; color:var(--acc); margin-bottom:5px; }
.fn-list ol{ padding-inline-start:1.3em; font-size:7.9pt; line-height:1.68; color:var(--soft); column-count:2; column-gap:16px; }
.fn-list li{ margin-bottom:4px; break-inside:avoid; }
.fn-list li b{ color:var(--tx); }

/* Glossary & Sources */
.glo-grid{ display:grid; grid-template-columns:1fr 1fr; gap:7px; }
.glo-item{ background:var(--surf); border:0.8pt solid var(--brd); border-top:2.5pt solid var(--acc); padding:7px 10px; break-inside:avoid; }
.glo-item b{ display:block; font-size:9.4pt; color:var(--tx); margin-bottom:2px; }
.glo-item p{ font-size:8.2pt; color:var(--soft); line-height:1.62; }
.src-ol{ padding-inline-start:1.4em; font-size:8.3pt; line-height:1.75; color:var(--soft); column-count:2; column-gap:16px; }
.src-ol li{ margin-bottom:4px; break-inside:avoid; }

/* Back Cover */
.back-cover{
  page:back; position:relative; break-before:page; width:210mm; height:297mm; background:#070A08; color:#F5F7F3;
  display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:12px; padding:24mm;
}
.back-cover::after{ content:""; position:absolute; inset:7mm; border:1.5pt solid #174720; pointer-events:none; }
.bc-logo svg{ width:92px; height:auto; }
.back-cover h2{ font-size:24pt; font-weight:900; color:#00E028; }
.back-cover p{ font-size:11pt; color:#B9C7BF; max-width:34ch; }
.bc-foot{ margin-top:16mm; font:600 9pt 'JetBrains Mono',monospace; color:#85968C; line-height:1.9; }
</style>
</head>
<body>
<section class="cover-page">
  <div class="cv-top">
    <div class="cv-brand">${LOGO}<b>NEXT BIT</b></div>
    <span class="cv-pill">${P.label} · 01</span>
  </div>
  <div class="cv-mx">${coverMatrix}</div>
  <div class="cv-main">
    <div class="cv-issue-tag">ISSUE 01 // UNIVERSITY OF KASHAN</div>
    <h1>از <em>صفر و یک</em><br>تا آینده</h1>
    <p>${esc(issue.subtitle)}</p>
    <div class="cv-badges">
      <span>۱۰ فصل + ۳ پروندهٔ ویژه</span>
      <span>پادکست صوتی در هر فصل (QR)</span>
      <span>۱۳ آزمایشگاه تعاملی آنلاین</span>
    </div>
  </div>
  <div class="cv-foot">
    <div><b>${esc(site.nameFa)}</b> — ${esc(site.university)}</div>
    <div class="kk" style="color:#00E028">${toFa(totalMin)} دقیقه مطالعه</div>
  </div>
</section>

<section class="toc-page">
  <div class="toc-head">
    <div><div class="kk" style="color:#008A20">TABLE OF CONTENTS</div><h2>فهرست مطالب شمارهٔ اول</h2></div>
    <span class="kk" style="color:#008A20">NEXT BIT · 01</span>
  </div>
  <div class="toc-grid">${tocCards}</div>
  <div class="toc-banner">
    <div>
      <div class="kk" style="color:#00E028">INTERACTIVE WEB EDITION</div>
      <b>نسخهٔ زنده، Flipbook و آزمایشگاه‌های تعاملی</b>
      <p>هرجا در این نشریه کد QR دیدی، با دوربین گوشی اسکن کن تا مستقیم وارد پادکست همان فصل یا آزمایشگاه تعاملی زنده شوی.</p>
    </div>
    <div class="pdf-qr">${makeQr(`${siteUrl}/`, "سایت Next Bit")}<span>ورود به سایت</span></div>
  </div>
</section>

${chaptersHtml}
${glossaryHtml}
${startHtml}
${backCoverHtml}
</body>
</html>`;
}

// Find Edge or Chrome
const candidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error("Edge/Chrome not found on this machine.");
  process.exit(1);
}

fs.mkdirSync("dist/issues/issue-01", { recursive: true });

for (const mode of modes) {
  const filename =
    mode === "dark" ? "nextbit-issue-01-dark.pdf" : "nextbit-issue-01.pdf";
  const printHtmlPath = path.resolve(`dist/issues/issue-01/print-${mode}.html`);
  const pdfOutPath = path.resolve("dist", filename);
  const pdfCachePath = path.resolve("content/issue-01", filename);

  fs.writeFileSync(printHtmlPath, buildHtml(mode), "utf8");
  console.log(
    `Rendering vector-sharp [${mode}] PDF with ${path.basename(browser)}...`,
  );

  const fileUrl = "file:///" + printHtmlPath.replace(/\\/g, "/");
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=12000",
      `--print-to-pdf=${pdfOutPath}`,
      fileUrl,
    ],
    { stdio: "inherit" },
  );

  fs.copyFileSync(pdfOutPath, pdfCachePath);
  if (fs.existsSync(printHtmlPath)) fs.unlinkSync(printHtmlPath);

  const mb = (fs.statSync(pdfOutPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ READY: dist/${filename} (${mb} MB)`);
}
