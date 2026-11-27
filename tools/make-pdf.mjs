// Next Bit — Seamless Asymmetric Editorial PDF Engine (Light & Dark Collector Editions)
// 1) 100% seamless edge-to-edge chapter backgrounds (transparent body + named @page -> ZERO color seams)
// 2) Exact 184mm print-width lock + Break-Aware Pagination Optimizer (<48% orphan tail elimination)
// 3) Binary-First Dual-Layer Numerals (crisp binary primary + faint ghosted decimal translation)
//    including native CSS @counter-style binary page numbers in @page margin boxes
// 4) Original Google Fonts Vazirmatn + baked vector SVG QR codes + portrait-safe photo crops
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const rd = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const site = rd("content/site.json");
const issuesData = rd("content/issues.json");
const team = rd("content/team.json");
const exps = rd("content/experiences.json").experiences;
const art = rd("content/issue-01/articles.json");
const enr = rd("content/issue-01/enrichment.json");

const issue = issuesData.issues[0];
const siteUrl = (
  site.siteUrl || "https://mmatvakili-lgtm.github.io/Next-Bit"
).replace(/\/$/, "");

// Bake QR SVGs synchronously inside Node VM
let qrSvgFn = null;
if (fs.existsSync("src/assets/qr.js")) {
  const sandbox = { window: {}, TextEncoder };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync("src/assets/qr.js", "utf8"), sandbox);
  if (sandbox.NB && typeof sandbox.NB.qrSvg === "function")
    qrSvgFn = sandbox.NB.qrSvg;
}
function makeQrSvg(url) {
  if (!qrSvgFn) return "";
  try {
    return qrSvgFn(url, { label: "QR" });
  } catch {
    return "";
  }
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const LAT = /[A-Za-z][A-Za-z0-9\-/.+]*(?:\s+[A-Za-z][A-Za-z0-9\-/.+]*)*/g;
const inline = (s) =>
  esc(s).replace(LAT, (m) => `<bdi class="en" dir="ltr">${m}</bdi>`);
const toFa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const toBin = (n, bits = 4) =>
  Math.max(0, Number(n) || 0)
    .toString(2)
    .padStart(bits, "0");

// Split Technical Index Tag: crisp binary primary + quiet decimal in its own hairline-separated compartment (ZERO overlap)
function binNum(bin, dec, cls = "") {
  return `<span class="bin-unit ${cls}" dir="ltr"><span class="bin-main">${esc(bin)}</span><span class="bin-dec">${esc(dec)}</span></span>`;
}

function chapterCodes(a) {
  if (a.id === "ed")
    return { bin: "0000", dec: "ED", shortBin: "0000", raw: "ED" };
  if (a.id.startsWith("sp-")) {
    const idx = parseInt(a.id.split("-")[1], 10) || 1;
    return {
      bin: `SP·${toBin(idx, 2)}`,
      dec: a.id.toUpperCase(),
      shortBin: `1${toBin(idx, 3)}`,
      raw: a.id.toUpperCase(),
    };
  }
  const n = Number(a.n) || 0;
  return {
    bin: toBin(n, 4),
    dec: String(n).padStart(2, "0"),
    shortBin: toBin(n, 4),
    raw: String(n).padStart(2, "0"),
  };
}

function photoDataUri(file) {
  const p = path.join("content/issue-01/photos", file);
  if (!fs.existsSync(p)) return null;
  const ext = path.extname(file).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;
}

function figSvg(file) {
  const p = path.join("content/issue-01/figures", file);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

// Merge enrichment identically to build.mjs
const FN_RE = /\uE000(\d+)\uE001/g;
{
  const bySlug = Object.fromEntries(art.articles.map((a) => [a.slug, a]));
  for (const ad of enr.additions || []) {
    const a = bySlug[ad.slug];
    if (!a) continue;
    if (ad.at === "start") a.blocks.unshift(ad.block);
    else a.blocks.push(ad.block);
  }
  for (const f of enr.figures || []) {
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
    if (i >= 0) a.blocks.splice(i + 1, 0, { t: "fig", ...f });
  }
  for (const f of enr.photos || []) {
    if (!fs.existsSync(path.join("content/issue-01/photos", f.file))) continue;
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
    (bs || []).forEach((b) => {
      if (b.t === "callout") walk(b.blocks, fn);
      else if (b.t === "list") b.items = b.items.map(fn);
      else if (b.t === "p" && !b.strong) b.x = fn(b.x);
    });
  for (const a of art.articles) {
    const mine = (enr.footnotes || [])
      .map((f, gi) => ({ ...f, gi }))
      .filter((f) => f.slug === a.slug);
    if (!mine.length) continue;
    const todo = new Set(mine.map((f) => f.gi));
    const applyFn = (txt) => {
      for (const f of mine) {
        if (!todo.has(f.gi)) continue;
        const i = txt.indexOf(f.match);
        if (i < 0) continue;
        todo.delete(f.gi);
        txt =
          txt.slice(0, i + f.match.length) +
          "\uE000" +
          f.gi +
          "\uE001" +
          txt.slice(i + f.match.length);
      }
      return txt;
    };
    walk(a.intro, applyFn);
    walk(a.blocks, applyFn);
    a.fn = [];
    const collectFn = (txt) => {
      for (const m of txt.matchAll(FN_RE))
        a.fn.push({ ...enr.footnotes[+m[1]], gi: +m[1], n: a.fn.length + 1 });
      return txt;
    };
    walk(a.intro, collectFn);
    walk(a.blocks, collectFn);
  }
}

const expBy = Object.fromEntries(exps.map((e) => [e.id, e]));
const editorial = {
  id: "ed",
  slug: "editorial",
  kind: "editorial",
  label: "یادداشت تحریریه",
  title: "یادداشت تحریریه",
  topic: "خوش‌آمدگویی",
  intro: [],
  blocks: art.editorial.blocks,
  readingMinutes: 2,
  n: -1,
};
const list = [editorial, ...art.articles];

const PALETTES = {
  editorial: {
    ed: {
      pg: "#F3F7F4",
      deep: "#10241A",
      deep2: "#193828",
      acc: "#008A20",
      acc2: "#C86428",
      surf: "#E7F0EA",
      surf2: "#DCEAE1",
      marg: "#ECF2EC",
      brd: "#C4DACB",
      tx: "#111A14",
      soft: "#364A3D",
      mute: "#5E7566",
      onTx: "#FFFFFF",
    },
    "ch-0": {
      pg: "#FAF3E8",
      deep: "#2B1B0E",
      deep2: "#3D2714",
      acc: "#B45309",
      acc2: "#0F766E",
      surf: "#F2E6D3",
      surf2: "#EBDAC0",
      marg: "#F5EAD8",
      brd: "#DEC7A4",
      tx: "#241B11",
      soft: "#503E2A",
      mute: "#7E674E",
      onTx: "#FFFFFF",
    },
    "ch-1": {
      pg: "#F8F5E6",
      deep: "#27210D",
      deep2: "#383014",
      acc: "#9A6B00",
      acc2: "#B45309",
      surf: "#EFEAD1",
      surf2: "#E7E0BE",
      marg: "#F3EED8",
      brd: "#D9CE9F",
      tx: "#221E0F",
      soft: "#4D4529",
      mute: "#7A704C",
      onTx: "#FFFFFF",
    },
    "ch-2": {
      pg: "#F0F7EE",
      deep: "#0E2417",
      deep2: "#163824",
      acc: "#15803D",
      acc2: "#C6622B",
      surf: "#E2F0DF",
      surf2: "#D5E8D1",
      marg: "#E8F2E4",
      brd: "#BAD9B4",
      tx: "#111D13",
      soft: "#324E37",
      mute: "#58785E",
      onTx: "#FFFFFF",
    },
    "ch-3": {
      pg: "#ECF7F3",
      deep: "#0C241D",
      deep2: "#13382D",
      acc: "#047857",
      acc2: "#C86D28",
      surf: "#DDF0E9",
      surf2: "#CEE8DF",
      marg: "#E3F2EC",
      brd: "#B2D9CC",
      tx: "#0E1E19",
      soft: "#2D4F44",
      mute: "#52786C",
      onTx: "#FFFFFF",
    },
    "ch-4": {
      pg: "#ECF6F7",
      deep: "#0C2327",
      deep2: "#13363C",
      acc: "#0F766E",
      acc2: "#C8612C",
      surf: "#DDF0F2",
      surf2: "#CEE7EA",
      marg: "#E3F1F2",
      brd: "#B0D6DB",
      tx: "#0E1D1F",
      soft: "#2D4D52",
      mute: "#52767C",
      onTx: "#FFFFFF",
    },
    "ch-5": {
      pg: "#EDF5FA",
      deep: "#0C1E2E",
      deep2: "#132F47",
      acc: "#0284C7",
      acc2: "#C86D28",
      surf: "#DFECF6",
      surf2: "#D1E4F2",
      marg: "#E5F0F7",
      brd: "#B3D1E8",
      tx: "#0F1B26",
      soft: "#304961",
      mute: "#55728C",
      onTx: "#FFFFFF",
    },
    "ch-6": {
      pg: "#EFF3FB",
      deep: "#0F1A36",
      deep2: "#172852",
      acc: "#1D4ED8",
      acc2: "#0F766E",
      surf: "#E2E9F7",
      surf2: "#D5E0F4",
      marg: "#E7EDF8",
      brd: "#B8CBEB",
      tx: "#11182A",
      soft: "#334469",
      mute: "#596C94",
      onTx: "#FFFFFF",
    },
    "ch-7": {
      pg: "#F2F2FC",
      deep: "#151438",
      deep2: "#201F54",
      acc: "#4338CA",
      acc2: "#0284C7",
      surf: "#E5E6F8",
      surf2: "#D9DAF5",
      marg: "#EAEBF9",
      brd: "#BFC1EC",
      tx: "#15142B",
      soft: "#3B3969",
      mute: "#626094",
      onTx: "#FFFFFF",
    },
    "ch-8": {
      pg: "#F6F1FC",
      deep: "#1E1238",
      deep2: "#2D1C54",
      acc: "#7C3AED",
      acc2: "#C85278",
      surf: "#ECE3F8",
      surf2: "#E3D5F5",
      marg: "#EFE7F9",
      brd: "#CEBBE9",
      tx: "#1C132B",
      soft: "#453566",
      mute: "#6E5B94",
      onTx: "#FFFFFF",
    },
    "ch-9": {
      pg: "#FAF0FA",
      deep: "#2B112D",
      deep2: "#401A43",
      acc: "#A21CAF",
      acc2: "#4338CA",
      surf: "#F3E1F3",
      surf2: "#ECD3EC",
      marg: "#F5E7F5",
      brd: "#DCB8DC",
      tx: "#261226",
      soft: "#573257",
      mute: "#855885",
      onTx: "#FFFFFF",
    },
    "sp-1": {
      pg: "#FBF0F2",
      deep: "#2E1019",
      deep2: "#451826",
      acc: "#BE123C",
      acc2: "#B45309",
      surf: "#F5E1E5",
      surf2: "#EED3D9",
      marg: "#F7E7EA",
      brd: "#DFB6BF",
      tx: "#261217",
      soft: "#59323B",
      mute: "#875762",
      onTx: "#FFFFFF",
    },
    "sp-2": {
      pg: "#FDF3EB",
      deep: "#2E170C",
      deep2: "#452312",
      acc: "#C2410C",
      acc2: "#1D4ED8",
      surf: "#F7E5D6",
      surf2: "#F1D9C5",
      marg: "#F9EADF",
      brd: "#E4BF9F",
      tx: "#26160D",
      soft: "#593A28",
      mute: "#87624C",
      onTx: "#FFFFFF",
    },
    "sp-3": {
      pg: "#FBF6E8",
      deep: "#2A1F0A",
      deep2: "#3F2F10",
      acc: "#A16207",
      acc2: "#15803D",
      surf: "#F3EBD3",
      surf2: "#ECE0BF",
      marg: "#F6EFDC",
      brd: "#DECBA0",
      tx: "#241D0E",
      soft: "#544628",
      mute: "#82714C",
      onTx: "#FFFFFF",
    },
    gloss: {
      pg: "#F4F7F5",
      deep: "#10241A",
      deep2: "#193828",
      acc: "#008A20",
      acc2: "#C86428",
      surf: "#FFFFFF",
      surf2: "#E9F0EB",
      marg: "#EDF3EE",
      brd: "#CEDAD2",
      tx: "#121914",
      soft: "#3A4A40",
      mute: "#627569",
      onTx: "#FFFFFF",
    },
  },
  dark: {
    ed: {
      pg: "#09110C",
      deep: "#112118",
      deep2: "#172E22",
      acc: "#00E028",
      acc2: "#F5A63B",
      surf: "#111E16",
      surf2: "#17291E",
      marg: "#132219",
      brd: "#24402E",
      tx: "#ECF3EE",
      soft: "#B8C9BE",
      mute: "#7E9687",
      onTx: "#060D08",
    },
    "ch-0": {
      pg: "#17120C",
      deep: "#251B10",
      deep2: "#332415",
      acc: "#F59E0B",
      acc2: "#2DD4BF",
      surf: "#221A11",
      surf2: "#2C2216",
      marg: "#261D13",
      brd: "#453522",
      tx: "#F5EFE4",
      soft: "#CFC2AC",
      mute: "#998B74",
      onTx: "#120E08",
    },
    "ch-1": {
      pg: "#16150B",
      deep: "#242210",
      deep2: "#312E15",
      acc: "#EAB308",
      acc2: "#FB923C",
      surf: "#211F10",
      surf2: "#2B2915",
      marg: "#252312",
      brd: "#433F20",
      tx: "#F4F2E1",
      soft: "#CCC8A8",
      mute: "#969270",
      onTx: "#121108",
    },
    "ch-2": {
      pg: "#0A140C",
      deep: "#122618",
      deep2: "#193521",
      acc: "#22C55E",
      acc2: "#F59E0B",
      surf: "#122215",
      surf2: "#182E1D",
      marg: "#142618",
      brd: "#26472E",
      tx: "#ECF5EE",
      soft: "#B6CCB9",
      mute: "#7C9980",
      onTx: "#060F08",
    },
    "ch-3": {
      pg: "#091410",
      deep: "#11261E",
      deep2: "#18362B",
      acc: "#10B981",
      acc2: "#FBBF24",
      surf: "#11221B",
      surf2: "#172E25",
      marg: "#13261F",
      brd: "#24473A",
      tx: "#ECF5F2",
      soft: "#B5CCC4",
      mute: "#7A998E",
      onTx: "#060F0B",
    },
    "ch-4": {
      pg: "#091417",
      deep: "#11252B",
      deep2: "#18353D",
      acc: "#14B8A6",
      acc2: "#FB923C",
      surf: "#102226",
      surf2: "#162E33",
      marg: "#12262B",
      brd: "#23474F",
      tx: "#ECF4F5",
      soft: "#B4CACE",
      mute: "#7A969C",
      onTx: "#060E10",
    },
    "ch-5": {
      pg: "#09131C",
      deep: "#112334",
      deep2: "#183148",
      acc: "#38BDF8",
      acc2: "#F59E0B",
      surf: "#10202E",
      surf2: "#162B3D",
      marg: "#122434",
      brd: "#23435E",
      tx: "#ECF4FA",
      soft: "#B4CAE0",
      mute: "#7B98B5",
      onTx: "#060E14",
    },
    "ch-6": {
      pg: "#0B1120",
      deep: "#14203B",
      deep2: "#1C2C52",
      acc: "#60A5FA",
      acc2: "#34D399",
      surf: "#131D33",
      surf2: "#1A2745",
      marg: "#152039",
      brd: "#293D6B",
      tx: "#EEF3FA",
      soft: "#B8C7E0",
      mute: "#8093B5",
      onTx: "#070B14",
    },
    "ch-7": {
      pg: "#0E0F21",
      deep: "#191B3D",
      deep2: "#232654",
      acc: "#818CF8",
      acc2: "#38BDF8",
      surf: "#171936",
      surf2: "#1F2247",
      marg: "#1A1C3C",
      brd: "#30356E",
      tx: "#EFF0FA",
      soft: "#BEC0E0",
      mute: "#8689B5",
      onTx: "#090A14",
    },
    "ch-8": {
      pg: "#130D22",
      deep: "#22173D",
      deep2: "#302054",
      acc: "#C084FC",
      acc2: "#F472B6",
      surf: "#1E1536",
      surf2: "#281C47",
      marg: "#22183C",
      brd: "#3E2B6E",
      tx: "#F3EEFA",
      soft: "#CBBCE0",
      mute: "#9683B5",
      onTx: "#0C0814",
    },
    "ch-9": {
      pg: "#190D1F",
      deep: "#2B1638",
      deep2: "#3C1F4F",
      acc: "#E879F9",
      acc2: "#818CF8",
      surf: "#261430",
      surf2: "#331B40",
      marg: "#2A1636",
      brd: "#4F2A63",
      tx: "#F7EEF9",
      soft: "#D5BBD9",
      mute: "#A182A6",
      onTx: "#100814",
    },
    "sp-1": {
      pg: "#1C0E13",
      deep: "#301720",
      deep2: "#42202C",
      acc: "#FB7185",
      acc2: "#FBBF24",
      surf: "#2B161D",
      surf2: "#381D26",
      marg: "#301820",
      brd: "#572D3B",
      tx: "#F9EEF1",
      soft: "#D9BDC5",
      mute: "#A6838D",
      onTx: "#14090C",
    },
    "sp-2": {
      pg: "#1C110C",
      deep: "#301C13",
      deep2: "#42271A",
      acc: "#FB923C",
      acc2: "#60A5FA",
      surf: "#2B1B13",
      surf2: "#382319",
      marg: "#301E15",
      brd: "#573727",
      tx: "#F9F0EB",
      soft: "#D9C3B8",
      mute: "#A68B7E",
      onTx: "#140B07",
    },
    "sp-3": {
      pg: "#19140B",
      deep: "#2B2111",
      deep2: "#3C2E17",
      acc: "#FBBF24",
      acc2: "#34D399",
      surf: "#261F11",
      surf2: "#332917",
      marg: "#2A2213",
      brd: "#4F4024",
      tx: "#F7F3E8",
      soft: "#D4CBB4",
      mute: "#A1967B",
      onTx: "#120F07",
    },
    gloss: {
      pg: "#09110D",
      deep: "#112118",
      deep2: "#172E22",
      acc: "#00E028",
      acc2: "#F5A63B",
      surf: "#121D17",
      surf2: "#18261E",
      marg: "#14221A",
      brd: "#263D30",
      tx: "#EBF2EE",
      soft: "#B8C9BE",
      mute: "#809488",
      onTx: "#060D08",
    },
  },
};

const LOGO_SVG = `<svg viewBox="-39 -2 131 104" width="46" height="36" aria-hidden="true"><g stroke-linejoin="round" stroke-width="1.6" fill="currentColor" stroke="currentColor"><polygon points="0,0 38,20.6 38,34.6 0,14"/><polygon points="40,22.8 70,39 62,46 40,36.8"/><polygon points="0,86.3 72,42.4 72,56.4 0,100"/></g><g fill="#F5F7F3" opacity="0.95"><rect x="39.6" y="0" width="13.5" height="13.5" rx="4"/><rect x="61.3" y="86.5" width="13.5" height="13.5" rx="4"/><rect x="76.8" y="86.5" width="13.5" height="13.5" rx="4"/><rect x="-37" y="44" width="22" height="11.5" rx="2.6"/><rect x="-14.5" y="44" width="22" height="11.5" rx="2.6"/></g></svg>`;

function renderText(txt, fnMap) {
  const safeStr =
    typeof txt === "string"
      ? txt
      : txt && typeof txt.x === "string"
        ? txt.x
        : "";
  const withPlaceholders = safeStr.replace(
    FN_RE,
    (_, gi) => `\uE010${gi}\uE011`,
  );
  const inlined = inline(withPlaceholders);
  return inlined.replace(/\uE010(\d+)\uE011/g, (_, gi) => {
    const num = fnMap.get(Number(gi));
    return num ? `<sup class="fn-mark">${toFa(num)}</sup>` : "";
  });
}

function qrCardHtml(url, title, subtitle, compact = false) {
  return `<div class="qr-card${compact ? " compact" : ""}">
    <div class="qr-svg">${makeQrSvg(url)}</div>
    <div class="qr-meta">
      <b>${esc(title)}</b>
      <span>${esc(subtitle)}</span>
      <code dir="ltr">${esc(url.replace(/^https?:\/\//, ""))}</code>
    </div>
  </div>`;
}

function renderXpTicket(id, noteTitle = "", noteHtml = "") {
  const e = expBy[id];
  if (!e) return "";
  const url = `${siteUrl}/experiences/${e.slug}/`;
  return `<div class="lab-showcase">
    <div class="ls-top">
      <div class="ls-badges">
        <span class="pill acc">آزمایشگاه همراه</span>
        <span class="pill dark-pill">${esc(e.experienceType)}</span>
        <span class="pill dark-pill">${esc(e.estimatedDuration)}</span>
      </div>
      <span class="ls-code">INTERACTIVE // WEB</span>
    </div>
    <div class="ls-grid">
      <div class="ls-content">
        <h4>${inline(noteTitle || e.titleFa)}</h4>
        <p class="ls-desc">${inline(e.description)}</p>
        ${noteHtml ? `<div class="ls-steps">${noteHtml}</div>` : ""}
      </div>
      <div class="ls-qr-col">
        <div class="qr-svg lg">${makeQrSvg(url)}</div>
        <small>اسکن برای اجرای زنده</small>
      </div>
    </div>
  </div>`;
}

function renderSimpleBlocks(bs, fnMap) {
  return (bs || [])
    .map((b) => {
      if (typeof b === "string") return `<p>${renderText(b, fnMap)}</p>`;
      if (b.t === "p")
        return b.strong
          ? `<p class="p-strong">${renderText(b.x, fnMap)}</p>`
          : `<p>${renderText(b.x, fnMap)}</p>`;
      if (b.t === "ex") {
        const isFa = /[،و]/.test(b.x);
        return `<div class="mini-ex ${isFa ? "fa" : "mono"}" dir="${isFa ? "rtl" : "ltr"}">${esc(b.x)}</div>`;
      }
      if (b.t === "list") {
        const tag = b.ordered ? "ol" : "ul";
        return `<${tag} class="ed-list">${b.items.map((it) => `<li>${renderText(it, fnMap)}</li>`).join("")}</${tag}>`;
      }
      return "";
    })
    .join("\n");
}

function blockChars(b) {
  if (!b) return 0;
  if (b.t === "p") return (b.x || "").length;
  if (b.t === "list") return (b.items || []).reduce((s, x) => s + x.length, 0);
  if (b.t === "ex") return 80;
  return 0;
}

function extractPullQuote(a) {
  const sum = (a.blocks || []).find(
    (b) => b.t === "callout" && b.kind === "summary",
  );
  if (sum && sum.blocks) {
    const p = sum.blocks.find(
      (b) => b.t === "p" && b.x && b.x.length > 35 && b.x.length < 180,
    );
    if (p) return p.x.replace(FN_RE, "");
  }
  return null;
}

function renderChapterFlow(blocks, fnMap, codes) {
  let html = "";
  let summaryHtml = "";
  let h2Idx = 0;
  let asymCount = 0;
  let photoCount = 0;
  const SIDE_KINDS = new Set([
    "believe",
    "bug",
    "note",
    "think",
    "exercise",
    "minute",
  ]);

  let mainBuf = [];
  let mainChars = 0;
  let sideBuf = [];

  function renderProseItem(b) {
    if (b.t === "p")
      return b.strong
        ? `<p class="p-strong">${renderText(b.x, fnMap)}</p>`
        : `<p class="p-body">${renderText(b.x, fnMap)}</p>`;
    if (b.t === "list") {
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag} class="ed-list">${b.items.map((it) => `<li>${renderText(it, fnMap)}</li>`).join("")}</${tag}>`;
    }
    if (b.t === "ex") {
      const isFa = /[،و]/.test(b.x);
      return `<div class="deep-ex"><div class="de-bar"><span>SPEC // EXAMPLE</span><i></i></div><div class="de-val ${isFa ? "fa" : "mono"}" dir="${isFa ? "rtl" : "ltr"}">${esc(b.x)}</div></div>`;
    }
    return "";
  }

  function flushBand() {
    if (!mainBuf.length && !sideBuf.length) return;
    if (sideBuf.length && mainChars >= 210) {
      const flip = asymCount % 2 === 1 ? " flip" : "";
      asymCount++;
      html += `<div class="asym-band${flip}">
        <div class="asym-main">${mainBuf.join("\n")}</div>
        <aside class="asym-side">${sideBuf.join("\n")}</aside>
      </div>`;
    } else {
      if (mainBuf.length)
        html += `<div class="prose-band">${mainBuf.join("\n")}</div>`;
      if (sideBuf.length)
        html += sideBuf
          .map((s) =>
            s.replace('class="margin-card', 'class="margin-card wide-split'),
          )
          .join("\n");
    }
    mainBuf = [];
    mainChars = 0;
    sideBuf = [];
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    if (b.t === "h2") {
      flushBand();
      h2Idx++;
      const secBin = `${codes.shortBin}·${toBin(h2Idx, 2)}`;
      const secDec = `${codes.raw}.${h2Idx}`;
      const h2Html = `<h2 class="sec-h2">${binNum(secBin, secDec, "sec-num")}<span>${inline(b.x)}</span></h2>`;
      const next = blocks[i + 1];
      if (next && (next.t === "p" || next.t === "list" || next.t === "ex")) {
        mainBuf.push(
          `<div class="sec-lead-group">${h2Html}${renderProseItem(next)}</div>`,
        );
        mainChars += blockChars(next);
        i++;
      } else {
        mainBuf.push(h2Html);
      }
      continue;
    }

    if (b.t === "p" || b.t === "list" || b.t === "ex") {
      mainBuf.push(renderProseItem(b));
      mainChars += blockChars(b);
      continue;
    }

    if (b.t === "photo") {
      flushBand();
      const uri = photoDataUri(b.file);
      if (uri) {
        const flip = photoCount % 2 === 1 ? " flip" : "";
        photoCount++;
        html += `<figure class="spread-photo${flip}">
          <div class="sp-img"><img src="${uri}" alt="${esc(b.alt || "")}"></div>
          <figcaption>
            <span class="pill acc">آرشیو تصویری</span>
            <p>${inline(b.caption || "")}</p>
            ${b.credit ? `<small>${inline(b.credit)}</small>` : ""}
          </figcaption>
        </figure>`;
      }
      continue;
    }

    if (b.t === "fig") {
      flushBand();
      const svg = figSvg(b.svg);
      if (svg) {
        html += `<figure class="spread-fig">
          <div class="sf-canvas">${svg}</div>
          <figcaption><b>نمودار مفهومی</b> — ${inline(b.caption || "")}${b.credit ? ` <small>(${inline(b.credit)})</small>` : ""}</figcaption>
        </figure>`;
      }
      continue;
    }

    if (b.t === "xp") {
      flushBand();
      html += renderXpTicket(b.id);
      continue;
    }

    if (b.t === "callout") {
      const kind = b.kind || "note";
      const inner = renderSimpleBlocks(b.blocks, fnMap);

      if (kind === "summary") {
        flushBand();
        summaryHtml = `<aside class="summary-ribbon"><div class="sr-badge">جمع‌بندی فصل</div><div class="sr-body">${inner}</div></aside>`;
        continue;
      }

      if (kind === "lab" || b.xp) {
        flushBand();
        if (b.xp) html += renderXpTicket(b.xp, b.title, inner);
        else
          html += `<aside class="margin-card wide-split kind-${esc(kind)}"><div class="mc-title">${inline(b.title)}</div><div class="mc-body">${inner}</div></aside>`;
        continue;
      }

      if (SIDE_KINDS.has(kind)) {
        const badgeText =
          kind === "believe"
            ? "باور نمی‌کنی، ولی…"
            : kind === "bug"
              ? "باگ تاریخی"
              : b.title || "یادداشت حاشیه";
        const cardHtml = `<div class="margin-card kind-${esc(kind)}"><div class="mc-title">${inline(badgeText)}</div><div class="mc-body">${inner}</div></div>`;

        if (mainChars < 230) {
          let pulled = 0;
          while (pulled < 3 && mainChars < 270 && i + 1 < blocks.length) {
            const nxt = blocks[i + 1];
            if (nxt.t === "p" || nxt.t === "list") {
              mainBuf.push(renderProseItem(nxt));
              mainChars += blockChars(nxt);
              i++;
              pulled++;
            } else break;
          }
        }
        sideBuf.push(cardHtml);
        if (sideBuf.length >= 1 && mainChars >= 250) flushBand();
        continue;
      }

      mainBuf.push(
        `<div class="margin-card wide-split kind-note"><div class="mc-title">${inline(b.title)}</div><div class="mc-body">${inner}</div></div>`,
      );
    }
  }

  flushBand();
  return { bodyHtml: html, summaryHtml };
}

function palStyle(p) {
  return `--pg:${p.pg};--deep:${p.deep};--deep2:${p.deep2};--acc:${p.acc};--acc2:${p.acc2};--surf:${p.surf};--surf2:${p.surf2};--marg:${p.marg};--brd:${p.brd};--tx:${p.tx};--soft:${p.soft};--mute:${p.mute};--on-tx:${p.onTx}`;
}

function buildHtml(mode) {
  const pals = PALETTES[mode];
  const isDark = mode === "dark";
  const coverPal = pals.ed;

  // Seamless full-bleed @page per chapter + Binary page numbering in bottom margin box (with faint decimal translation)
  const namedPageRules = Object.entries(pals)
    .map(
      ([id, p]) => `@page p-${id} {
    size: A4 portrait;
    margin: 12mm 13mm 15mm 13mm;
    background: ${p.pg};
    @bottom-left {
      content: counter(page, nb-bin);
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: ${p.acc};
      vertical-align: top;
      padding-top: 3mm;
    }
    @bottom-right {
      content: "P." counter(page, decimal-leading-zero);
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.6pt;
      font-weight: 500;
      color: ${p.mute};
      opacity: 0.34;
      vertical-align: top;
      padding-top: 3.3mm;
    }
  }`,
    )
    .join("\n  ");

  const tocRows = list
    .map((a) => {
      const p = pals[a.id] || pals.ed;
      const c = chapterCodes(a);
      return `<div class="toc-item" style="--row-acc:${p.acc};--row-surf:${p.surf}">
        ${binNum(c.bin, c.dec, "toc-num stacked")}
        <div class="toc-txt">
          <b>${inline(a.title)}</b>
          <small>${inline(a.topic || a.label || "")}</small>
        </div>
        <span class="toc-min">${toFa(a.readingMinutes || 3)} دقیقه</span>
      </div>`;
    })
    .join("\n");

  const chaptersHtml = list
    .map((a) => {
      const p = pals[a.id] || pals.ed;
      const c = chapterCodes(a);
      const chapterUrl = `${siteUrl}/issues/${issue.slug}/${a.slug}/`;
      const fnMap = new Map((a.fn || []).map((f) => [f.gi, f.n]));

      let heroPhoto = null;
      const bodyBlocks = [];
      for (const b of a.blocks || []) {
        if (!heroPhoto && b.t === "photo") {
          const uri = photoDataUri(b.file);
          if (uri) {
            heroPhoto = { uri, caption: b.caption, credit: b.credit };
            continue;
          }
        }
        bodyBlocks.push(b);
      }

      const introHtml = (a.intro || []).length
        ? `<div class="op-intro">${renderSimpleBlocks(a.intro, fnMap)}</div>`
        : "";

      const pullQuote = extractPullQuote(a);
      const { bodyHtml, summaryHtml } = renderChapterFlow(bodyBlocks, fnMap, c);

      const fnHtml = (a.fn || []).length
        ? `<footer class="fn-box">
            <div class="fn-title">پاورقی‌ها و یادداشت‌های علمی</div>
            <ol>${a.fn.map((f) => `<li><b>[${toFa(f.n)}]</b> ${inline(f.text)}</li>`).join("")}</ol>
          </footer>`
        : "";

      let closingHtml = "";
      if (summaryHtml && fnHtml) {
        closingHtml = `<div class="ch-closing-band">${summaryHtml}${fnHtml}</div>`;
      } else {
        closingHtml = summaryHtml + fnHtml;
      }

      return `<section class="chapter-wrap" data-ch="${c.raw}" style="page:p-${a.id};${palStyle(p)}">
        <div class="ch-running-top">
          <span class="crt-brand">NEXT BIT // ISSUE 0001</span>
          <span class="crt-mid">${esc(a.label || "فصل")} · ${inline(a.topic || "")}</span>
          ${binNum(c.bin, c.dec, "crt-code")}
        </div>

        <header class="ch-masthead">
          <div class="cm-left">
            <div class="cm-chips">
              <span class="pill acc">${esc(a.label || "فصل")}</span>
              <span class="pill soft-dark">${inline(a.topic || "مبانی کامپیوتر")}</span>
              <span class="pill soft-dark">${toFa(a.readingMinutes || 3)} دقیقه مطالعه</span>
            </div>
            <h1>${inline(a.title)}</h1>
            ${introHtml}
            <div class="cm-qr-row">
              ${qrCardHtml(chapterUrl, "پادکست صوتی و نسخهٔ تعاملی این فصل", "اسکن برای شنیدن و اجرای آزمایشگاه‌ها", true)}
            </div>
          </div>
          <div class="cm-right">
            ${
              heroPhoto
                ? `<figure class="cm-photo">
                    <img src="${heroPhoto.uri}" alt="">
                    <figcaption>${inline(heroPhoto.caption || "")}</figcaption>
                  </figure>`
                : `<div class="cm-emblem">
                    <span>ISSUE 0001</span>
                    ${binNum(c.bin, "DEC " + c.dec, "emblem-bin stacked")}
                    <small>${inline(a.topic || "NEXT BIT")}</small>
                  </div>`
            }
          </div>
        </header>

        ${pullQuote ? `<blockquote class="pull-quote"><span>«</span>${inline(pullQuote)}<span>»</span></blockquote>` : ""}

        <div class="ch-flow">${bodyHtml}${closingHtml}</div>
      </section>`;
    })
    .join("\n");

  const glossHtml = (art.glossary || [])
    .map(
      (g) =>
        `<div class="gl-item"><b>${inline(g.term)}</b><p>${inline(g.def)}</p></div>`,
    )
    .join("\n");

  const teamHtml = (team.members || []).length
    ? `<ul>${team.members.map((m) => `<li><b>${esc(m.name)}</b><span>${esc(m.role)}</span></li>`).join("")}</ul>`
    : `<p class="cp-note">تولیدشده توسط انجمن علمی و تیم تحریریهٔ مهندسی کامپیوتر دانشگاه کاشان</p>`;

  const spectrumBars = Object.values(pals)
    .slice(0, 14)
    .map((p) => `<i style="background:${p.acc}"></i>`)
    .join("");

  return `<!doctype html>
<html lang="fa" dir="rtl" data-pdf-mode="${mode}">
<head>
<meta charset="utf-8">
<title>${esc(site.name)} — ${esc(issue.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800;900&family=JetBrains+Mono:wght@500;700&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @counter-style nb-bin {
    system: numeric;
    symbols: "0" "1";
    pad: 6 "0";
  }

  @page { size: A4 portrait; margin: 12mm 13mm 15mm 13mm; background: ${coverPal.pg}; }
  @page poster { size: A4 portrait; margin: 0; }
  ${namedPageRules}

  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  /* CRITICAL: Transparent body so @page background fills 100% seamlessly with ZERO color seam! */
  html, body {
    margin: 0; padding: 0;
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    background: transparent !important;
    color: ${coverPal.tx};
    line-height: 1.88;
    font-size: 9.85pt;
  }
  .en, bdi.en { font-family: 'Archivo', 'Vazirmatn', sans-serif; direction: ltr; unicode-bidi: isolate; }
  code { font-family: 'JetBrains Mono', monospace; }

/* ==================== SPLIT TECHNICAL BINARY-FIRST TAGS (ZERO OVERLAP) ==================== */
  .bin-unit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    direction: ltr;
    line-height: 1;
    gap: 6px;
  }
  .bin-main {
    font-weight: 700;
    letter-spacing: 0.06em;
  }
  .bin-dec {
    font-family: 'JetBrains Mono', 'Archivo', sans-serif;
    font-size: 0.72em;
    font-weight: 600;
    opacity: 0.46;
    padding-left: 6px;
    border-left: 1px solid currentColor;
    letter-spacing: 0.03em;
  }
  .bin-unit.stacked {
    flex-direction: column;
    gap: 3px;
  }
  .bin-unit.stacked .bin-dec {
    padding-left: 0;
    padding-top: 3px;
    border-left: 0;
    border-top: 1px solid color-mix(in srgb, currentColor 28%, transparent);
    width: 100%;
    text-align: center;
    font-size: 0.68em;
    opacity: 0.48;
  }

  /* ==================== 1. FULL-BLEED POSTER COVERS ==================== */
  .cover-poster, .back-poster {
    page: poster;
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 18mm 18mm 16mm;
    display: flex; flex-direction: column; justify-content: space-between;
    background:
      radial-gradient(circle at 14% 18%, rgba(31, 224, 102, 0.22), transparent 44%),
      radial-gradient(circle at 86% 78%, rgba(245, 166, 59, 0.18), transparent 46%),
      linear-gradient(155deg, #09150F 0%, #0E1F16 54%, #07100B 100%);
    color: #F4F7F3;
    overflow: hidden;
  }
  .cover-poster { page-break-after: always; }
  .back-poster { page-break-before: always; }
  .cover-grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 26px 26px; pointer-events: none;
  }
  .cov-top {
    position: relative; z-index: 2;
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.14);
  }
  .cov-brand { display: flex; align-items: center; gap: 12px; color: #1FE066; }
  .cov-brand strong { font-family: 'Archivo', sans-serif; font-size: 21pt; letter-spacing: 0.05em; color: #FFFFFF; }
  .cov-edition {
    font-family: 'JetBrains Mono', monospace; font-size: 8.4pt;
    padding: 5px 14px; border-radius: 999px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.16);
    color: #C8DBD0; direction: ltr;
  }
  .cov-center {
    position: relative; z-index: 2; margin: auto 0;
    display: grid; grid-template-columns: 1.32fr 0.68fr; gap: 22px; align-items: center;
  }
  .cov-kicker {
    display: inline-flex; padding: 6px 16px; border-radius: 999px;
    background: rgba(31, 224, 102, 0.14); border: 1px solid rgba(31, 224, 102, 0.40);
    color: #6AF09C; font-weight: 800; font-size: 9.4pt; margin-bottom: 16px;
  }
  .cov-title { font-size: 40pt; font-weight: 900; line-height: 1.24; margin: 0 0 16px; color: #FFFFFF; }
  .cov-title span { color: #1FE066; }
  .cov-sub { font-size: 11.4pt; color: #C2D4C9; line-height: 1.9; margin: 0 0 22px; }
  .cov-art {
    position: relative;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 26px 14px; border-radius: 26px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); text-align: center;
  }
  .cov-art .cov-bin-hero .bin-main {
    font-size: 36pt; font-weight: 700; letter-spacing: 0.06em;
    background: linear-gradient(135deg, #1FE066, #F5A63B);
    -webkit-background-clip: text; color: transparent;
  }
  .cov-art .cov-bin-hero .bin-dec {
    font-size: 8.5pt; color: #9BB8A7; opacity: 0.65;
    padding-top: 6px; margin-top: 4px; letter-spacing: 0.2em;
  }
  .cov-art .bits {
    font-family: 'JetBrains Mono', monospace; font-size: 8.4pt; letter-spacing: 0.22em;
    color: #8CA898; margin-top: 12px; direction: ltr;
  }
  .cov-spectrum { display: flex; gap: 5px; margin-top: 18px; }
  .cov-spectrum i { height: 7px; flex: 1; border-radius: 999px; display: block; }
  .cov-bottom {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: end;
    padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.14);
  }
  .cov-stats { display: flex; gap: 12px; flex-wrap: wrap; }
  .cov-stat {
    padding: 10px 16px; border-radius: 16px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
  }
  .cov-stat b { display: block; font-size: 16pt; color: #1FE066; line-height: 1.2; }
  .cov-stat span { font-size: 8.4pt; color: #B8C9BE; }

  /* ==================== 2. TABLE OF CONTENTS (Exact 184mm Print Width) ==================== */
  .toc-page {
    page: p-ed;
    width: 184mm;
    margin-inline: auto;
    background: transparent !important;
    page-break-after: always;
  }
  .toc-head {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid ${coverPal.brd};
  }
  .toc-head h2 { margin: 0; font-size: 22pt; font-weight: 900; }
  .toc-head span { font-family: 'JetBrains Mono', monospace; font-size: 8.2pt; color: ${coverPal.acc}; direction: ltr; }
  .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
  .toc-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 13px; border-radius: 16px;
    background: var(--row-surf); border: 1px solid ${coverPal.brd};
    border-inline-start: 5px solid var(--row-acc); break-inside: avoid;
  }
  .toc-num {
    min-width: 54px;
    padding: 5px 7px;
    border-radius: 10px;
    background: ${coverPal.pg};
    border: 1px solid ${coverPal.brd};
    color: var(--row-acc);
    font-size: 9pt;
  }
  .toc-txt { flex: 1; min-width: 0; }
  .toc-txt b { display: block; font-size: 9.3pt; line-height: 1.45; color: ${coverPal.tx}; }
  .toc-txt small { display: block; font-size: 7.8pt; color: ${coverPal.mute}; margin-top: 2px; }
  .toc-min { font-size: 7.6pt; padding: 3px 9px; border-radius: 999px; background: ${coverPal.pg}; color: ${coverPal.soft}; white-space: nowrap; }

  /* ==================== 3. CHAPTER ARCHITECTURE (Exact 184mm Print Width) ==================== */
  .chapter-wrap {
    --sp: 1;
    --img-h: 164px;
    width: 184mm;
    margin-inline: auto;
    color: var(--tx);
    background: transparent !important;
    page-break-before: always;
  }
  .ch-running-top {
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'JetBrains Mono', 'Vazirmatn', sans-serif;
    font-size: 7.5pt; color: var(--mute);
    padding-bottom: 7px; margin-bottom: calc(10px * var(--sp));
    border-bottom: 1px solid var(--brd);
  }
  .crt-code {
    padding: 3px 10px; border-radius: 999px;
    background: var(--deep); color: var(--acc); font-size: 7.8pt;
  }
  .crt-code .bin-dec { color: #D4E4DA; opacity: 0.52; }

  .ch-masthead {
    position: relative;
    display: grid; grid-template-columns: 1.42fr 0.78fr; gap: 16px; align-items: center;
    padding: calc(16px * var(--sp)) 20px;
    border-radius: 22px;
    background:
      radial-gradient(circle at 12% 15%, color-mix(in srgb, var(--acc) 24%, transparent), transparent 50%),
      radial-gradient(circle at 90% 85%, color-mix(in srgb, var(--acc2) 18%, transparent), transparent 46%),
      linear-gradient(145deg, var(--deep) 0%, var(--deep2) 100%);
    color: #F4F7F3;
    margin-bottom: calc(12px * var(--sp));
    break-inside: avoid; overflow: hidden;
  }
  .cm-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .pill {
    display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px;
    font-size: 7.8pt; font-weight: 700; background: var(--pg); color: var(--soft); border: 1px solid var(--brd);
  }
  .pill.acc { background: var(--acc); color: var(--on-tx); border-color: var(--acc); }
  .pill.soft-dark, .pill.dark-pill {
    background: rgba(255,255,255,0.10); color: #E3EDE7; border: 1px solid rgba(255,255,255,0.18);
  }
  .ch-masthead h1 { font-size: 18pt; font-weight: 900; line-height: 1.36; margin: 0 0 8px; color: #FFFFFF; }
  .op-intro {
    font-size: 9.1pt; color: #D4E2D9; line-height: 1.76;
    padding-inline-start: 11px; border-inline-start: 3px solid var(--acc); margin-bottom: 9px;
  }
  .op-intro p { margin: 0 0 4px; }
  .cm-right { position: relative; }
  .cm-photo { margin: 0; position: relative; z-index: 2; }
  .cm-photo img {
    width: 100%; height: calc(var(--img-h) - 14px); object-fit: cover; object-position: center 18%;
    border-radius: 14px; display: block; border: 1.5px solid rgba(255,255,255,0.20);
  }
  .cm-photo figcaption { font-size: 7.3pt; color: #C2D4C9; margin-top: 5px; line-height: 1.46; }
  .cm-emblem {
    padding: 18px 14px; border-radius: 16px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); text-align: center;
  }
  .cm-emblem > span:first-child { display: block; font-family: 'JetBrains Mono', monospace; font-size: 7.2pt; color: #A6BEB0; letter-spacing: 0.14em; margin-bottom: 6px; }
  .emblem-bin { display: inline-flex; margin: 4px auto 8px; }
  .emblem-bin .bin-main { font-size: 26pt; color: var(--acc); }
  .emblem-bin .bin-dec { font-size: 8.5pt; color: #D4E4DA; opacity: 0.55; padding-top: 5px; }
  .cm-emblem small { font-size: 8.2pt; color: #E2ECE6; }

  .qr-card {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 7px 11px; border-radius: 14px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); color: #F2F6F3;
  }
  .qr-card.compact { padding: 5px 9px; }
  .qr-svg {
    width: 44px; height: 44px; flex: none;
    background: #FFFFFF; padding: 3px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
  }
  .qr-svg.lg { width: 62px; height: 62px; padding: 4px; border-radius: 11px; }
  .qr-svg svg { width: 100%; height: 100%; display: block; }
  .qr-meta b { display: block; font-size: 8pt; color: #FFFFFF; }
  .qr-meta span { display: block; font-size: 7pt; color: #C4D6CB; }
  .qr-meta code { display: block; font-size: 6.5pt; color: var(--acc); margin-top: 2px; }

  .pull-quote {
    margin: 0 0 calc(11px * var(--sp));
    padding: calc(8px * var(--sp)) 16px;
    border-top: 1.5px solid var(--brd); border-bottom: 1.5px solid var(--brd);
    text-align: center; font-size: 10.4pt; font-weight: 800; line-height: 1.68;
    color: var(--acc); break-inside: avoid;
  }
  .pull-quote span { color: var(--acc2); font-size: 13pt; padding: 0 4px; }

  /* ==================== 4. DISCIPLINED ASYMMETRIC FLOW ==================== */
  .asym-band {
    display: grid; grid-template-columns: 67% 30%; gap: 3%; align-items: start;
    margin-bottom: calc(9px * var(--sp));
  }
  .asym-band.flip { grid-template-columns: 30% 67%; }
  .asym-band.flip .asym-main { order: 2; }
  .asym-band.flip .asym-side { order: 1; }
  .prose-band { margin-bottom: calc(7px * var(--sp)); }
  .sec-lead-group { break-inside: avoid; page-break-inside: avoid; }

  .sec-h2 {
    display: flex; align-items: center; gap: 10px;
    font-size: 12.2pt; font-weight: 900; color: var(--tx);
    margin: calc(11px * var(--sp)) 0 calc(5px * var(--sp));
    padding-top: calc(6px * var(--sp));
    border-top: 1px solid var(--brd); break-after: avoid;
  }
  .sec-num {
    padding: 3px 10px; border-radius: 999px;
    background: var(--surf2); color: var(--acc); border: 1px solid var(--brd);
    font-size: 7.7pt;
  }

  p, li { break-inside: avoid; page-break-inside: avoid; orphans: 3; widows: 3; }
  .p-body { margin: 0 0 calc(7px * var(--sp)); text-align: justify; color: var(--tx); }
  .p-strong { margin: calc(7px * var(--sp)) 0 calc(4px * var(--sp)); font-weight: 800; color: var(--acc); font-size: 10pt; }
  .ed-list { margin: 4px 0 calc(7px * var(--sp)); padding-inline-start: 18px; }
  .ed-list li { margin-bottom: 2.5px; }

  .margin-card {
    padding: 10px 12px; border-radius: 15px;
    background: var(--marg); border: 1px solid var(--brd);
    border-top: 3.5px solid var(--acc2);
    margin-bottom: calc(9px * var(--sp));
    font-size: 8.5pt; line-height: 1.7; color: var(--soft); break-inside: avoid;
  }
  .margin-card.kind-believe { border-top-color: var(--acc); background: linear-gradient(160deg, var(--surf2), var(--marg)); }
  .margin-card.kind-bug { border-style: dashed; border-color: var(--acc2); border-top-style: solid; }
  .margin-card.wide-split {
    display: grid; grid-template-columns: 28% 1fr; gap: 14px; align-items: center;
    padding: 11px 15px; border-top: 1px solid var(--brd); border-inline-start: 4.5px solid var(--acc2);
  }
  .margin-card.wide-split.kind-believe { border-inline-start-color: var(--acc); }
  .mc-title { font-weight: 900; font-size: 8.8pt; color: var(--acc2); margin-bottom: 4px; }
  .margin-card.kind-believe .mc-title { color: var(--acc); }
  .mc-body p { margin: 0 0 4px; }

  .deep-ex {
    margin: calc(8px * var(--sp)) 0 calc(9px * var(--sp));
    padding: 9px 13px; border-radius: 15px;
    background: linear-gradient(145deg, var(--deep), var(--deep2));
    color: #F4F7F3; border: 1px solid color-mix(in srgb, var(--acc) 38%, transparent); break-inside: avoid;
  }
  .de-bar {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;
    font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #9BB4A5; direction: ltr;
  }
  .de-bar i { width: 7px; height: 7px; border-radius: 50%; background: var(--acc); display: block; }
  .de-val {
    font-size: 10.4pt; font-weight: 800; text-align: center; color: #FFFFFF;
    padding: 5px 10px; border-radius: 10px; background: rgba(255,255,255,0.07);
  }
  .de-val.mono { font-family: 'JetBrains Mono', monospace; color: var(--acc); }

  .spread-photo {
    margin: calc(10px * var(--sp)) 0;
    display: grid; grid-template-columns: 1.45fr 0.75fr; gap: 14px; align-items: center;
    padding: 10px; border-radius: 18px;
    background: var(--surf); border: 1px solid var(--brd); break-inside: avoid;
  }
  .spread-photo.flip { grid-template-columns: 0.75fr 1.45fr; }
  .spread-photo.flip .sp-img { order: 2; }
  .spread-photo.flip figcaption { order: 1; }
  .sp-img img {
    width: 100%; height: var(--img-h); object-fit: cover; object-position: center 20%;
    border-radius: 12px; display: block;
  }
  .spread-photo figcaption p { margin: 6px 0 3px; font-size: 8.4pt; color: var(--tx); line-height: 1.58; }
  .spread-photo figcaption small { font-size: 7.2pt; color: var(--mute); }

  .spread-fig {
    margin: calc(10px * var(--sp)) 0; padding: 10px 14px; border-radius: 18px;
    background: var(--surf); border: 1px solid var(--brd); text-align: center; break-inside: avoid;
  }
  .sf-canvas svg { max-width: 100%; max-height: calc(var(--img-h) - 10px); height: auto; }
  .spread-fig figcaption { font-size: 7.9pt; color: var(--soft); margin-top: 5px; }
  .spread-fig figcaption b { color: var(--acc); }

  .lab-showcase {
    margin: calc(10px * var(--sp)) 0;
    padding: 12px 15px; border-radius: 18px;
    background:
      radial-gradient(circle at 8% 12%, color-mix(in srgb, var(--acc) 20%, transparent), transparent 46%),
      linear-gradient(145deg, var(--deep) 0%, var(--deep2) 100%);
    color: #F4F7F3; border: 1.5px solid color-mix(in srgb, var(--acc) 45%, transparent); break-inside: avoid;
  }
  .ls-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 7px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.12);
  }
  .ls-badges { display: flex; gap: 6px; flex-wrap: wrap; }
  .ls-code { font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: var(--acc2); direction: ltr; font-weight: 700; }
  .ls-grid { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; }
  .ls-content h4 { margin: 0 0 4px; font-size: 10.8pt; font-weight: 900; color: #FFFFFF; }
  .ls-desc { margin: 0 0 4px; font-size: 8.3pt; color: #C9DBD0; line-height: 1.58; }
  .ls-steps { font-size: 8pt; color: #DFECE4; line-height: 1.58; }
  .ls-steps p { margin: 0 0 3px; }
  .ls-qr-col { text-align: center; padding-inline-start: 12px; border-inline-start: 1px dashed rgba(255,255,255,0.22); }
  .ls-qr-col small { display: block; margin-top: 4px; font-size: 7pt; color: var(--acc); font-weight: 700; }

  .ch-closing-band {
    display: grid; grid-template-columns: 58% 39%; gap: 3%; align-items: start;
    margin-top: calc(10px * var(--sp)); break-inside: avoid;
  }
  .ch-closing-band .summary-ribbon, .ch-closing-band .fn-box { margin: 0; }

  .summary-ribbon {
    margin: calc(10px * var(--sp)) 0;
    padding: 11px 15px; border-radius: 16px;
    background: linear-gradient(135deg, var(--surf2), var(--marg));
    border: 1px solid var(--brd); border-inline-start: 5px solid var(--acc); break-inside: avoid;
  }
  .sr-badge {
    display: inline-block; padding: 2px 10px; border-radius: 999px;
    background: var(--acc); color: var(--on-tx); font-size: 7.8pt; font-weight: 800; margin-bottom: 5px;
  }
  .sr-body p { margin: 0 0 4px; color: var(--tx); font-size: 9pt; line-height: 1.72; font-weight: 500; }

  .fn-mark { font-size: 7pt; color: var(--acc); font-weight: 800; padding: 0 2px; }
  .fn-box {
    margin-top: calc(9px * var(--sp)); padding: 9px 12px; border-radius: 15px;
    background: var(--surf); border: 1px solid var(--brd);
    font-size: 7.7pt; line-height: 1.62; color: var(--soft); break-inside: avoid;
  }
  .fn-title { font-weight: 800; color: var(--acc); margin-bottom: 4px; font-size: 8.1pt; }
  .fn-box ol { margin: 0; padding: 0; list-style: none; }
  .fn-box li { margin-bottom: 3px; }

  /* ==================== 5. GLOSSARY & BACK COVER ==================== */
  .gloss-page {
    page: p-gloss;
    width: 184mm;
    margin-inline: auto;
    color: var(--tx);
    background: transparent !important;
    page-break-before: always;
  }
  .gl-grid { columns: 2; column-gap: 14px; }
  .gl-item {
    break-inside: avoid; padding: 9px 12px; margin-bottom: 9px;
    border-radius: 14px; background: var(--surf);
    border: 1px solid var(--brd); border-inline-start: 3.5px solid var(--acc);
  }
  .gl-item b { display: block; color: var(--acc); font-size: 9.3pt; margin-bottom: 2px; }
  .gl-item p { margin: 0; font-size: 8.3pt; color: var(--soft); line-height: 1.62; }

  .bp-card {
    position: relative; z-index: 2; padding: 24px 26px; border-radius: 26px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14);
  }
  .bp-card h2 { margin: 0 0 10px; font-size: 20pt; color: #1FE066; }
  .bp-card p { margin: 0 0 14px; color: #CBE0D3; font-size: 10.4pt; line-height: 1.85; }
  .bp-card ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 10px 22px; font-size: 9.4pt; }
  .bp-card li span { color: #8BA897; margin-inline-start: 6px; }
  .bp-foot {
    position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;
    padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.14);
  }
  .bp-sig { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #8CA898; direction: ltr; }
</style>
</head>
<body>

  <section class="cover-poster">
    <div class="cover-grid-bg"></div>
    <div class="cov-top">
      <div class="cov-brand">${LOGO_SVG}<strong>NEXT BIT</strong></div>
      <div class="cov-edition">ISSUE 0001 // ${isDark ? "DARK COLLECTOR EDITION" : "EDITORIAL PRINT EDITION"}</div>
    </div>
    <div class="cov-center">
      <div>
        <div class="cov-kicker">نشریهٔ علمی–ترویجی مهندسی کامپیوتر · دانشگاه کاشان</div>
        <h1 class="cov-title">از <span>صفر و یک</span> تا آینده</h1>
        <p class="cov-sub">${inline(issue.summary || "")}</p>
        <div class="cov-spectrum">${spectrumBars}</div>
      </div>
      <div class="cov-art">
        ${binNum("0001", "ISSUE 01", "cov-bin-hero stacked")}
        <div class="bits">01001110 · 01000010</div>
      </div>
    </div>
    <div class="cov-bottom">
      <div class="cov-stats">
        <div class="cov-stat"><b>${toFa(list.length)}</b><span>فصل و پرونده</span></div>
        <div class="cov-stat"><b>${toFa(exps.length)}</b><span>آزمایشگاه تعاملی</span></div>
        <div class="cov-stat"><b>${toFa(list.reduce((s, a) => s + (a.readingMinutes || 0), 0))}</b><span>دقیقه مطالعه</span></div>
      </div>
      ${qrCardHtml(`${siteUrl}/`, "نسخهٔ تعاملی و پادکست کامل", "اسکن برای باز کردن سایت Next Bit")}
    </div>
  </section>

  <section class="toc-page">
    <div class="toc-head">
      <h2>فهرست شمارهٔ اول</h2>
      <span>TABLE OF CONTENTS // 1110 SECTIONS</span>
    </div>
    <div class="toc-grid">${tocRows}</div>
  </section>

  ${chaptersHtml}

  <section class="gloss-page" style="${palStyle(pals.gloss)}">
    <div class="ch-running-top">
      <span class="crt-brand">NEXT BIT // GLOSSARY</span>
      <span class="crt-mid">واژه‌نامهٔ جامع شمارهٔ اول</span>
      ${binNum("1111", "A–Z", "crt-code")}
    </div>
    <h2 style="font-size:20pt;font-weight:900;margin:0 0 12px;">واژه‌نامهٔ شمارهٔ اول</h2>
    <div class="gl-grid">${glossHtml}</div>
  </section>

  <section class="back-poster">
    <div class="cover-grid-bg"></div>
    <div class="cov-top">
      <div class="cov-brand">${LOGO_SVG}<strong>NEXT BIT</strong></div>
      <div class="cov-edition">COLOPHON &amp; ARCHIVE // ISSUE 0001</div>
    </div>
    <div class="bp-card">
      <h2>شناسنامهٔ نشریهٔ Next Bit</h2>
      <p>${inline(site.description || issue.summary || "")}</p>
      ${teamHtml}
      <div class="cov-spectrum" style="margin-top:22px">${spectrumBars}</div>
    </div>
    <div class="bp-foot">
      <div class="bp-sig">NEXT BIT MAGAZINE · ISSUE 0001<br>${esc(siteUrl)}</div>
      ${qrCardHtml(`${siteUrl}/issues/${issue.slug}/`, "آرشیو آنلاین شمارهٔ اول", "همراه با Flipbook، ۱۳ آزمایشگاه و پادکست کامل")}
    </div>
  </section>

  <!-- Exact-Width (184mm) Break-Aware Anti-Orphan Pagination Engine -->
  <script>
    (function () {
      // Exact printable A4 height with 12mm top + 15mm bottom margin: (297 - 27)mm * 3.7795px/mm = 1020px
      // Using 992px conservative threshold so Chromium print breaks never disagree with screen simulation
      var PAGE_H = 992;

      function simulatePages(ch) {
        var nodes = [];
        Array.prototype.forEach.call(ch.children, function (el) {
          if (el.classList.contains('ch-flow')) {
            Array.prototype.forEach.call(el.children, function (c) {
              if (c.classList.contains('prose-band')) {
                Array.prototype.forEach.call(c.children, function (p) { nodes.push(p); });
              } else {
                nodes.push(c);
              }
            });
          } else {
            nodes.push(el);
          }
        });
        var pages = 1, curY = 0;
        for (var i = 0; i < nodes.length; i++) {
          var el = nodes[i];
          var cs = getComputedStyle(el);
          var h = el.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
          var atomic = !el.classList.contains('asym-band');
          if (atomic && curY > 0 && curY + h > PAGE_H) {
            pages++;
            curY = h;
          } else if (curY + h > PAGE_H) {
            var over = (curY + h) - PAGE_H;
            pages += Math.floor(over / PAGE_H) + 1;
            curY = over % PAGE_H;
          } else {
            curY += h;
          }
        }
        return { pages: pages, lastFill: curY / PAGE_H };
      }

      function optimizeAll() {
        var presets = [
          { sp: 0.90, fs: '9.6pt',  lh: '1.82', img: '154px' },
          { sp: 0.80, fs: '9.35pt', lh: '1.78', img: '144px' },
          { sp: 0.72, fs: '9.15pt', lh: '1.74', img: '134px' },
          { sp: 0.64, fs: '8.95pt', lh: '1.70', img: '124px' },
          { sp: 0.56, fs: '8.8pt',  lh: '1.66', img: '116px' },
          { sp: 0.48, fs: '8.65pt', lh: '1.62', img: '108px' }
        ];
        document.querySelectorAll('.chapter-wrap').forEach(function (ch) {
          var sim = simulatePages(ch);
          // Eliminate any orphan trailing page with less than 48% content fill
          if (sim.pages > 1 && sim.lastFill < 0.48) {
            var targetPages = sim.pages - 1;
            for (var p = 0; p < presets.length; p++) {
              ch.style.setProperty('--sp', presets[p].sp);
              ch.style.setProperty('--img-h', presets[p].img);
              ch.style.fontSize = presets[p].fs;
              ch.style.lineHeight = presets[p].lh;
              var next = simulatePages(ch);
              if (next.pages <= targetPages) break;
            }
          }
        });
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { setTimeout(optimizeAll, 120); });
      } else {
        window.addEventListener('load', function () { setTimeout(optimizeAll, 120); });
      }
    })();
  </script>
</body>
</html>`;
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return "msedge.exe";
}

const browser = findBrowser();
fs.mkdirSync("dist", { recursive: true });
fs.mkdirSync("content/issue-01", { recursive: true });

for (const [mode, outName] of [
  ["editorial", "nextbit-issue-01.pdf"],
  ["dark", "nextbit-issue-01-dark.pdf"],
]) {
  const tmpHtml = path.join(
    os.tmpdir(),
    `nextbit-pdf-${mode}-${Date.now()}.html`,
  );
  const outDist = path.resolve("dist", outName);
  const outContent = path.resolve("content/issue-01", outName);

  fs.writeFileSync(tmpHtml, buildHtml(mode), "utf8");
  console.log(
    `Rendering seamless binary-editorial [${mode}] PDF with ${path.basename(browser)}...`,
  );

  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=10000",
      `--print-to-pdf=${outDist}`,
      `file:///${tmpHtml.replace(/\\/g, "/")}`,
    ],
    { stdio: "inherit" },
  );

  fs.copyFileSync(outDist, outContent);
  fs.rmSync(tmpHtml, { force: true });
  const mb = (fs.statSync(outDist).size / 1024 / 1024).toFixed(2);
  console.log(
    `✓ READY: dist/${outName} (${mb} MB) + synced to content/issue-01/`,
  );
}
