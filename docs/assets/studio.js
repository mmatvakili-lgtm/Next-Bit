/* Next Bit — Unified 2-Theme PDF-Synced Engine + Swiss Hardware Editorial UI
   Exact 1-to-1 palette parity with nextbit-issue-01.pdf (editorial) & nextbit-issue-01-dark.pdf (cyber).
   Deterministic chapter tracking in Individual Pages, Modern Reader & Flipbook. */
(function () {
  "use strict";
  var NB = (window.NB = window.NB || {});
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  var root = document.documentElement.getAttribute("data-root") || "./";
  var reduced = function () {
    return NB.reduced && NB.reduced();
  };
  var esc =
    NB.esc ||
    function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    };

  /* ---------- 0. Exact 15-Chapter Palettes (Copied 1:1 from tools/make-pdf.mjs) ---------- */
  var PALETTES = {
    editorial: {
      ed: {
        pg: "#F3F7F4",
        acc: "#008A20",
        surf: "#E7F0EA",
        surf2: "#DCEAE1",
        brd: "#C4DACB",
        tx: "#111A14",
        soft: "#364A3D",
        mute: "#5E7566",
        onTx: "#FFFFFF",
      },
      "ch-0": {
        pg: "#FAF3E8",
        acc: "#B45309",
        surf: "#F2E6D3",
        surf2: "#EBDAC0",
        brd: "#DEC7A4",
        tx: "#241B11",
        soft: "#503E2A",
        mute: "#7E674E",
        onTx: "#FFFFFF",
      },
      "ch-1": {
        pg: "#F8F5E6",
        acc: "#9A6B00",
        surf: "#EFEAD1",
        surf2: "#E7E0BE",
        brd: "#D9CE9F",
        tx: "#221E0F",
        soft: "#4D4529",
        mute: "#7A704C",
        onTx: "#FFFFFF",
      },
      "ch-2": {
        pg: "#F0F7EE",
        acc: "#15803D",
        surf: "#E2F0DF",
        surf2: "#D5E8D1",
        brd: "#BAD9B4",
        tx: "#111D13",
        soft: "#324E37",
        mute: "#58785E",
        onTx: "#FFFFFF",
      },
      "ch-3": {
        pg: "#ECF7F3",
        acc: "#047857",
        surf: "#DDF0E9",
        surf2: "#CEE8DF",
        brd: "#B2D9CC",
        tx: "#0E1E19",
        soft: "#2D4F44",
        mute: "#52786C",
        onTx: "#FFFFFF",
      },
      "ch-4": {
        pg: "#ECF6F7",
        acc: "#0F766E",
        surf: "#DDF0F2",
        surf2: "#CEE7EA",
        brd: "#B0D6DB",
        tx: "#0E1D1F",
        soft: "#2D4D52",
        mute: "#52767C",
        onTx: "#FFFFFF",
      },
      "ch-5": {
        pg: "#EDF5FA",
        acc: "#0284C7",
        surf: "#DFECF6",
        surf2: "#D1E4F2",
        brd: "#B3D1E8",
        tx: "#0F1B26",
        soft: "#304961",
        mute: "#55728C",
        onTx: "#FFFFFF",
      },
      "ch-6": {
        pg: "#EFF3FB",
        acc: "#1D4ED8",
        surf: "#E2E9F7",
        surf2: "#D5E0F4",
        brd: "#B8CBEB",
        tx: "#11182A",
        soft: "#334469",
        mute: "#596C94",
        onTx: "#FFFFFF",
      },
      "ch-7": {
        pg: "#F2F2FC",
        acc: "#4338CA",
        surf: "#E5E6F8",
        surf2: "#D9DAF5",
        brd: "#BFC1EC",
        tx: "#15142B",
        soft: "#3B3969",
        mute: "#626094",
        onTx: "#FFFFFF",
      },
      "ch-8": {
        pg: "#F6F1FC",
        acc: "#7C3AED",
        surf: "#ECE3F8",
        surf2: "#E3D5F5",
        brd: "#CEBBE9",
        tx: "#1C132B",
        soft: "#453566",
        mute: "#6E5B94",
        onTx: "#FFFFFF",
      },
      "ch-9": {
        pg: "#FAF0FA",
        acc: "#A21CAF",
        surf: "#F3E1F3",
        surf2: "#ECD3EC",
        brd: "#DCB8DC",
        tx: "#261226",
        soft: "#573257",
        mute: "#855885",
        onTx: "#FFFFFF",
      },
      "sp-1": {
        pg: "#FBF0F2",
        acc: "#BE123C",
        surf: "#F5E1E5",
        surf2: "#EED3D9",
        brd: "#DFB6BF",
        tx: "#261217",
        soft: "#59323B",
        mute: "#875762",
        onTx: "#FFFFFF",
      },
      "sp-2": {
        pg: "#FDF3EB",
        acc: "#C2410C",
        surf: "#F7E5D6",
        surf2: "#F1D9C5",
        brd: "#E4BF9F",
        tx: "#26160D",
        soft: "#593A28",
        mute: "#87624C",
        onTx: "#FFFFFF",
      },
      "sp-3": {
        pg: "#FBF6E8",
        acc: "#A16207",
        surf: "#F3EBD3",
        surf2: "#ECE0BF",
        brd: "#DECBA0",
        tx: "#241D0E",
        soft: "#544628",
        mute: "#82714C",
        onTx: "#FFFFFF",
      },
      gloss: {
        pg: "#F4F7F5",
        acc: "#008A20",
        surf: "#FFFFFF",
        surf2: "#E9F0EB",
        brd: "#CEDAD2",
        tx: "#121914",
        soft: "#3A4A40",
        mute: "#627569",
        onTx: "#FFFFFF",
      },
    },
    cyber: {
      ed: {
        pg: "#09110C",
        acc: "#00E028",
        surf: "#111E16",
        surf2: "#17291E",
        brd: "#24402E",
        tx: "#ECF3EE",
        soft: "#B8C9BE",
        mute: "#7E9687",
        onTx: "#060D08",
      },
      "ch-0": {
        pg: "#17120C",
        acc: "#F59E0B",
        surf: "#221A11",
        surf2: "#2C2216",
        brd: "#453522",
        tx: "#F5EFE4",
        soft: "#CFC2AC",
        mute: "#998B74",
        onTx: "#120E08",
      },
      "ch-1": {
        pg: "#16150B",
        acc: "#EAB308",
        surf: "#211F10",
        surf2: "#2B2915",
        brd: "#433F20",
        tx: "#F4F2E1",
        soft: "#CCC8A8",
        mute: "#969270",
        onTx: "#121108",
      },
      "ch-2": {
        pg: "#0A140C",
        acc: "#22C55E",
        surf: "#122215",
        surf2: "#182E1D",
        brd: "#26472E",
        tx: "#ECF5EE",
        soft: "#B6CCB9",
        mute: "#7C9980",
        onTx: "#060F08",
      },
      "ch-3": {
        pg: "#091410",
        acc: "#10B981",
        surf: "#11221B",
        surf2: "#172E25",
        brd: "#24473A",
        tx: "#ECF5F2",
        soft: "#B5CCC4",
        mute: "#7A998E",
        onTx: "#060F0B",
      },
      "ch-4": {
        pg: "#091417",
        acc: "#14B8A6",
        surf: "#102226",
        surf2: "#162E33",
        brd: "#23474F",
        tx: "#ECF4F5",
        soft: "#B4CACE",
        mute: "#7A969C",
        onTx: "#060E10",
      },
      "ch-5": {
        pg: "#09131C",
        acc: "#38BDF8",
        surf: "#10202E",
        surf2: "#162B3D",
        brd: "#23435E",
        tx: "#ECF4FA",
        soft: "#B4CAE0",
        mute: "#7B98B5",
        onTx: "#060E14",
      },
      "ch-6": {
        pg: "#0B1120",
        acc: "#60A5FA",
        surf: "#131D33",
        surf2: "#1A2745",
        brd: "#293D6B",
        tx: "#EEF3FA",
        soft: "#B8C7E0",
        mute: "#8093B5",
        onTx: "#070B14",
      },
      "ch-7": {
        pg: "#0E0F21",
        acc: "#818CF8",
        surf: "#171936",
        surf2: "#1F2247",
        brd: "#30356E",
        tx: "#EFF0FA",
        soft: "#BEC0E0",
        mute: "#8689B5",
        onTx: "#090A14",
      },
      "ch-8": {
        pg: "#130D22",
        acc: "#C084FC",
        surf: "#1E1536",
        surf2: "#281C47",
        brd: "#3E2B6E",
        tx: "#F3EEFA",
        soft: "#CBBCE0",
        mute: "#9683B5",
        onTx: "#0C0814",
      },
      "ch-9": {
        pg: "#190D1F",
        acc: "#E879F9",
        surf: "#261430",
        surf2: "#331B40",
        brd: "#4F2A63",
        tx: "#F7EEF9",
        soft: "#D5BBD9",
        mute: "#A182A6",
        onTx: "#100814",
      },
      "sp-1": {
        pg: "#1C0E13",
        acc: "#FB7185",
        surf: "#2B161D",
        surf2: "#381D26",
        brd: "#572D3B",
        tx: "#F9EEF1",
        soft: "#D9BDC5",
        mute: "#A6838D",
        onTx: "#14090C",
      },
      "sp-2": {
        pg: "#1C110C",
        acc: "#FB923C",
        surf: "#2B1B13",
        surf2: "#382319",
        brd: "#573727",
        tx: "#F9F0EB",
        soft: "#D9C3B8",
        mute: "#A68B7E",
        onTx: "#140B07",
      },
      "sp-3": {
        pg: "#19140B",
        acc: "#FBBF24",
        surf: "#261F11",
        surf2: "#332917",
        brd: "#4F4024",
        tx: "#F7F3E8",
        soft: "#D4CBB4",
        mute: "#A1967B",
        onTx: "#120F07",
      },
      gloss: {
        pg: "#09110D",
        acc: "#00E028",
        surf: "#121D17",
        surf2: "#18261E",
        brd: "#263D30",
        tx: "#EBF2EE",
        soft: "#B8C9BE",
        mute: "#809488",
        onTx: "#060D08",
      },
    },
  };

  /* Exact Slugs matching content/issue-01/articles.json */
  var CHAPTERS = [
    { id: "ed", slug: "editorial", title: "یادداشت تحریریه", code: "ED" },
    {
      id: "ch-0",
      slug: "before-computers",
      title: "۰. قبل از کامپیوتر",
      code: "00",
    },
    {
      id: "ch-1",
      slug: "gears-and-dreams",
      title: "۱. ماشین‌های مکانیکی",
      code: "01",
    },
    {
      id: "ch-2",
      slug: "zero-and-one",
      title: "۲. صفر و یک و منطق",
      code: "02",
    },
    {
      id: "ch-3",
      slug: "room-sized-computers",
      title: "۳. لامپ خلأ و ENIAC",
      code: "03",
    },
    { id: "ch-4", slug: "transistor", title: "۴. ترانزیستور", code: "04" },
    {
      id: "ch-5",
      slug: "first-programs",
      title: "۵. اولین برنامه‌ها",
      code: "05",
    },
    {
      id: "ch-6",
      slug: "personal-computing",
      title: "۶. کامپیوتر شخصی",
      code: "06",
    },
    {
      id: "ch-7",
      slug: "message-journey",
      title: "۷. اینترنت و وب",
      code: "07",
    },
    {
      id: "ch-8",
      slug: "machines-that-learn",
      title: "۸. هوش مصنوعی",
      code: "08",
    },
    { id: "ch-9", slug: "the-future", title: "۹. آیندهٔ کامپیوتر", code: "09" },
    { id: "sp-1", slug: "history-of-bugs", title: "باگ تاریخی", code: "SP1" },
    { id: "sp-2", slug: "cpu-vs-gpu", title: "نبرد فناوری‌ها", code: "SP2" },
    {
      id: "sp-3",
      slug: "sorting-algorithms",
      title: "یک دقیقه کدنویسی",
      code: "SP3",
    },
  ];
  var CH_BY_ID = {};
  CHAPTERS.forEach(function (c) {
    CH_BY_ID[c.id] = c;
  });

  function hexToRgba(hex, a) {
    var h = hex.replace("#", "");
    var n = parseInt(h, 16);
    return (
      "rgba(" +
      ((n >> 16) & 255) +
      "," +
      ((n >> 8) & 255) +
      "," +
      (n & 255) +
      "," +
      a +
      ")"
    );
  }

  function applyVars(el, pal) {
    if (!el || !pal) return;
    el.style.setProperty("--pg", pal.pg);
    el.style.setProperty("--acc", pal.acc);
    el.style.setProperty("--era", pal.acc);
    el.style.setProperty("--era-2", pal.acc);
    el.style.setProperty("--era-soft", hexToRgba(pal.acc, 0.13));
    el.style.setProperty("--era-line", hexToRgba(pal.acc, 0.42));
    el.style.setProperty("--surf", pal.surf);
    el.style.setProperty("--surf2", pal.surf2);
    el.style.setProperty("--brd", pal.brd);
    el.style.setProperty("--tx", pal.tx);
    el.style.setProperty("--soft", pal.soft);
    el.style.setProperty("--mute", pal.mute);
    el.style.setProperty("--on-tx", pal.onTx);
  }

  /* ---------- 1. Strictly 2-Theme Controller (cyber <-> editorial) ---------- */
  var currentTheme = "cyber";
  try {
    var stored =
      localStorage.getItem("nb-theme") ||
      document.documentElement.getAttribute("data-theme") ||
      "cyber";
    currentTheme =
      stored === "editorial" || stored === "warm" || stored === "light"
        ? "editorial"
        : "cyber";
  } catch (e) {}

  var activeChapterId = document.body.getAttribute("data-article") || "ed";
  if (/\/(glossary|start|sources)\//.test(location.pathname))
    activeChapterId = "gloss";
  if (/\/experiences\//.test(location.pathname)) {
    var xpSlug = (location.pathname.split("/experiences/")[1] || "").split(
      "/",
    )[0];
    activeChapterId =
      {
        "count-choices": "ch-0",
        "program-machine": "ch-1",
        "bit-lab": "ch-2",
        "logic-lab": "ch-2",
        "machine-room": "ch-3",
        "chip-factory": "ch-4",
        "code-lab": "ch-5",
        "desk-time": "ch-6",
        "request-journey": "ch-7",
        "ml-playground": "ch-8",
        "future-lab": "ch-9",
        "timeline-explorer": "ch-9",
        "sorting-visualizer": "sp-3",
      }[xpSlug] || "ed";
  }

  function paintAllChapterThemes() {
    var map = PALETTES[currentTheme] || PALETTES.cyber;
    var activePal = map[activeChapterId] || map.ed;
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.documentElement.setAttribute("data-chapter", activeChapterId);
    applyVars(document.documentElement, activePal);

    // Every Modern Reader section permanently holds its own exact PDF colors
    $$(".art-sec[data-id]").forEach(function (sec) {
      var cid = sec.getAttribute("data-id");
      applyVars(sec, map[cid] || map.ed);
    });

    // Issue 01 TOC rows & Modern Reader TOC rows carry their own exact chapter accent
    $$(".toc-l .ar[data-aid]").forEach(function (row) {
      var cid = row.getAttribute("data-aid");
      if (map[cid]) row.style.setProperty("--row-acc", map[cid].acc);
    });
    $$(".rd-toc .nb-toc-row[data-nb-chid]").forEach(function (row) {
      var cid = row.getAttribute("data-nb-chid");
      if (map[cid]) row.style.setProperty("--row-acc", map[cid].acc);
    });

    // Sync theme toggle buttons
    var tBtn = $("#theme-btn");
    if (tBtn) {
      tBtn.setAttribute(
        "aria-label",
        currentTheme === "cyber"
          ? "تغییر به تم مجله‌ای روشن"
          : "تغییر به تم تیره",
      );
      tBtn.title =
        currentTheme === "cyber"
          ? "تم فعلی: تیره (کلیک برای مجله‌ای روشن)"
          : "تم فعلی: مجله‌ای روشن (کلیک برای تیره)";
      tBtn.textContent = currentTheme === "cyber" ? "☾" : "☀";
    }
    $$("button[data-fb-theme]").forEach(function (b) {
      b.setAttribute(
        "aria-pressed",
        String(b.getAttribute("data-fb-theme") === currentTheme),
      );
    });
    // Sync all PDF download links with active theme (cyber -> dark PDF, editorial -> light PDF)
    $$('a[href*="nextbit-issue-01"]').forEach(function (a) {
      var isDark = currentTheme === "cyber";
      var file = isDark ? "nextbit-issue-01-dark.pdf" : "nextbit-issue-01.pdf";
      var href = a.getAttribute("href") || "";
      a.setAttribute(
        "href",
        href.replace(/nextbit-issue-01(?:-dark)?\.pdf/i, file),
      );
      if (a.hasAttribute("download")) a.setAttribute("download", file);
      a.title = isDark
        ? "دانلود نسخهٔ تیره (هماهنگ با تم فعلی سایت)"
        : "دانلود نسخهٔ مجله‌ای روشن (هماهنگ با تم فعلی سایت)";
      if (a.textContent.indexOf("PDF") !== -1) {
        a.textContent = isDark
          ? "↓ دانلود PDF (نسخهٔ تیره)"
          : "↓ دانلود PDF (نسخهٔ روشن)";
      }
    });
  }

  function setSiteTheme(next) {
    currentTheme = next === "editorial" ? "editorial" : "cyber";
    try {
      localStorage.setItem("nb-theme", currentTheme);
    } catch (e) {}
    paintAllChapterThemes();
  }

  function setActiveChapter(cid) {
    if (!cid || !PALETTES.cyber[cid]) cid = "ed";
    if (
      cid === activeChapterId &&
      document.documentElement.getAttribute("data-chapter") === cid
    )
      return;
    activeChapterId = cid;
    var map = PALETTES[currentTheme] || PALETTES.cyber;
    document.documentElement.setAttribute("data-chapter", cid);
    applyVars(document.documentElement, map[cid] || map.ed);
  }

  // Intercept header theme button cleanly so ONLY 2 themes exist (cyber / editorial)
  var headerThemeBtn = $("#theme-btn");
  if (headerThemeBtn) {
    headerThemeBtn.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSiteTheme(currentTheme === "cyber" ? "editorial" : "cyber");
        playClick(currentTheme === "cyber" ? 980 : 1260);
      },
      true,
    );
  }
  paintAllChapterThemes();

  /* ---------- 2. Precision 1.5px Vector Icons ---------- */
  var ICONS = {
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/></svg>',
    soundOn:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5.5a9.5 9.5 0 0 1 0 13"/></svg>',
    soundOff:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1v-9.5z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"><path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 0-4 4V4z"/><path d="M8 4v16"/></svg>',
    lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M9 9h2v2H9zM13 13h2v2h-2zM9 15h2M13 9h2"/></svg>',
    theme:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"><circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor" stroke="none"/></svg>',
  };

  /* ---------- 3. Tactile Mechanical Sound Synth (Web Audio API) ---------- */
  var sfxEnabled = true;
  try {
    sfxEnabled = localStorage.getItem("nb-sfx") !== "0";
  } catch (e) {}
  var actx = null;

  function playClick(pitch) {
    if (!sfxEnabled || reduced()) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!actx) actx = new Ctx();
      if (actx.state === "suspended") actx.resume();
      var t = actx.currentTime;
      var osc = actx.createOscillator(),
        gain = actx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch || 1150, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.022);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.025);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(t);
      osc.stop(t + 0.026);
    } catch (e) {}
  }

  function playPaperFlip() {
    if (!sfxEnabled || reduced()) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!actx) actx = new Ctx();
      if (actx.state === "suspended") actx.resume();
      var len = Math.floor(actx.sampleRate * 0.06);
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++)
        data[i] =
          (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI) * 0.24;
      var src = actx.createBufferSource();
      src.buffer = buf;
      var flt = actx.createBiquadFilter();
      flt.type = "bandpass";
      flt.frequency.value = 1650;
      flt.Q.value = 0.9;
      var g = actx.createGain();
      g.gain.value = 0.2;
      src.connect(flt);
      flt.connect(g);
      g.connect(actx.destination);
      src.start();
    } catch (e) {}
  }

  document.addEventListener(
    "pointerdown",
    function (e) {
      var el =
        e.target.closest &&
        e.target.closest(
          ".bl-sw button, .lg-sw, .cf-t, .mr button, .xbtn, .cc button, .pm-list button, .md button",
        );
      if (!el || el.disabled) return;
      playClick(el.getAttribute("aria-pressed") === "true" ? 880 : 1380);
    },
    { passive: true },
  );

  /* ---------- 4. Interactive Bit-Field Canvas Hero & Engineering Ticker ---------- */
  var hero = $(".hero");
  if (hero && !$(".nb-hero-cv", hero) && $(".hg", hero)) {
    if (!$(".nb-ticker")) {
      var tick = document.createElement("div");
      tick.className = "nb-ticker";
      tick.setAttribute("aria-hidden", "true");
      var items = [
        "ISSUE 01 // FROM ZERO & ONE TO THE FUTURE",
        "10 CHAPTERS + 3 SPECIAL REPORTS",
        "13 EXECUTABLE HARDWARE & CODE LABS",
        "UNIVERSITY OF KASHAN · COMPUTER ENGINEERING",
        "DIGITAL & PRINT · AUDIO PODCAST EDITION",
      ];
      var half = items
        .map(function (t) {
          return "<span><i></i>" + t + "</span>";
        })
        .join("");
      tick.innerHTML = '<div class="nb-ticker-track">' + half + half + "</div>";
      hero.insertAdjacentElement("afterend", tick);
    }

    if (!reduced()) {
      var cv = document.createElement("canvas");
      cv.className = "nb-hero-cv";
      cv.setAttribute("aria-hidden", "true");
      hero.insertBefore(cv, hero.firstChild);
      var ctx = cv.getContext("2d");
      var W = 0,
        H = 0,
        step = 42,
        cells = [],
        mx = -999,
        my = -999,
        visible = true;

      function resizeCv() {
        var r = hero.getBoundingClientRect(),
          dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width;
        H = r.height;
        cv.width = Math.max(1, Math.floor(W * dpr));
        cv.height = Math.max(1, Math.floor(H * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cells = [];
        for (var y = 0; y < Math.ceil(H / step) + 1; y++) {
          for (var x = 0; x < Math.ceil(W / step) + 1; x++) {
            cells.push({
              x: x * step + 18,
              y: y * step + 18,
              v: (x * 7 + y * 13) % 2,
              e: 0,
              cross: x % 4 === 0 && y % 3 === 0,
            });
          }
        }
      }
      resizeCv();
      window.addEventListener("resize", resizeCv, { passive: true });
      hero.addEventListener(
        "pointermove",
        function (e) {
          var r = hero.getBoundingClientRect();
          mx = e.clientX - r.left;
          my = e.clientY - r.top;
        },
        { passive: true },
      );
      hero.addEventListener("pointerleave", function () {
        mx = -999;
        my = -999;
      });
      if ("IntersectionObserver" in window)
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
        }).observe(hero);

      var last = 0;
      function draw(ts) {
        requestAnimationFrame(draw);
        if (!visible || ts - last < 33) return;
        last = ts;
        ctx.clearRect(0, 0, W, H);
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (var i = 0; i < cells.length; i++) {
          var c = cells[i],
            dx = c.x - mx,
            dy = c.y - my,
            dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 145) {
            var target = 1 - dist / 145;
            if (target > c.e) {
              c.e = target;
              if (dist < 42 && Math.random() < 0.08) c.v = c.v ? 0 : 1;
            }
          }
          c.e *= 0.92;
          if (c.e > 0.02) {
            ctx.fillStyle =
              "rgba(0, 217, 36, " + (0.09 + c.e * 0.58).toFixed(3) + ")";
            ctx.fillText(c.v ? "1" : "0", c.x, c.y);
          } else if (c.cross) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.075)";
            ctx.fillText("+", c.x, c.y);
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.032)";
            ctx.fillRect(c.x - 1, c.y - 1, 1.5, 1.5);
          }
        }
      }
      requestAnimationFrame(draw);
    }
  }

  /* ---------- 5. 3D Specular Foil Book Cover ---------- */
  $$(".cover").forEach(function (cov) {
    if (reduced()) return;
    if (!$(".nb-foil", cov)) {
      var foil = document.createElement("div");
      foil.className = "nb-foil";
      cov.appendChild(foil);
    }
    cov.addEventListener(
      "pointermove",
      function (e) {
        var r = cov.getBoundingClientRect(),
          px = (e.clientX - r.left) / r.width,
          py = (e.clientY - r.top) / r.height;
        cov.style.transform =
          "rotateX(" +
          ((0.5 - py) * 11).toFixed(2) +
          "deg) rotateY(" +
          ((px - 0.5) * 13).toFixed(2) +
          "deg)";
        cov.style.setProperty("--fx", (px * 100).toFixed(1) + "%");
        cov.style.setProperty("--fy", (py * 100).toFixed(1) + "%");
      },
      { passive: true },
    );
    cov.addEventListener("pointerleave", function () {
      cov.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  });

  /* ---------- 6. Archival Photo Covers & Hover-Reveal Index ---------- */
  var PHOTO_META = {
    "before-computers": { file: "abacus.jpg", fig: "FIG.00", label: "ABACUS" },
    "gears-and-dreams": {
      file: "analytical-engine-trial.jpg",
      fig: "FIG.01",
      label: "BABBAGE ENGINE",
    },
    "room-sized-computers": {
      file: "eniac.jpg",
      fig: "FIG.03",
      label: "ENIAC · 1945",
    },
    transistor: {
      file: "first-transistor.jpg",
      fig: "FIG.04",
      label: "BELL LABS · 1947",
    },
    "first-programs": {
      file: "grace-hopper.jpg",
      fig: "FIG.05",
      label: "GRACE HOPPER",
    },
    "personal-computing": {
      file: "macintosh-1984.jpg",
      fig: "FIG.06",
      label: "MACINTOSH · 1984",
    },
    "message-journey": {
      file: "cern-www-server.jpg",
      fig: "FIG.07",
      label: "CERN NEXT SERVER",
    },
    "the-future": {
      file: "quantum-computer.jpg",
      fig: "FIG.09",
      label: "IBM QUANTUM",
    },
    "history-of-bugs": {
      file: "mark2-logbook-bug.jpg",
      fig: "SP.01",
      label: "MARK II · 1947",
    },
  };
  function photoForHref(href) {
    if (!href) return null;
    for (var k in PHOTO_META)
      if (href.indexOf("/" + k + "/") !== -1) return PHOTO_META[k];
    return null;
  }

  $$(".sec .cards .xcard").forEach(function (c) {
    var m = photoForHref(c.getAttribute("href"));
    if (!m || $(".nb-card-thumb", c)) return;
    var box = document.createElement("div");
    box.className = "nb-card-thumb";
    var img = document.createElement("img");
    img.src = root + "photos/" + m.file;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = function () {
      box.remove();
    };
    box.appendChild(img);
    c.insertBefore(box, c.firstChild);
  });

  var tocList = $(".toc-l");
  if (
    tocList &&
    window.matchMedia &&
    window.matchMedia("(hover: hover)").matches
  ) {
    var prev = document.createElement("figure");
    prev.className = "nb-hover-preview";
    prev.innerHTML =
      '<img alt=""><figcaption><span class="nb-hp-lbl"></span><b class="nb-hp-fig"></b></figcaption>';
    document.body.appendChild(prev);
    var pImg = $("img", prev),
      pLbl = $(".nb-hp-lbl", prev),
      pFig = $(".nb-hp-fig", prev);
    var curFile = "",
      tx = -999,
      ty = -999,
      cx = -999,
      cy = -999,
      showing = false;
    function animPrev() {
      if (showing) {
        cx += (tx - cx) * 0.22;
        cy += (ty - cy) * 0.22;
        prev.style.transform =
          "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
        requestAnimationFrame(animPrev);
      }
    }
    $$(".toc-l .ar").forEach(function (row) {
      var m = photoForHref(row.getAttribute("href"));
      if (!m) return;
      row.addEventListener("pointerenter", function (e) {
        if (curFile !== m.file) {
          curFile = m.file;
          pImg.src = root + "photos/" + m.file;
          pLbl.textContent = m.label;
          pFig.textContent = m.fig;
        }
        tx = Math.min(window.innerWidth - 270, Math.max(16, e.clientX - 270));
        ty = Math.min(window.innerHeight - 210, Math.max(80, e.clientY - 90));
        if (!showing) {
          cx = tx;
          cy = ty;
          showing = true;
          prev.classList.add("show");
          requestAnimationFrame(animPrev);
        }
      });
      row.addEventListener(
        "pointermove",
        function (e) {
          tx = Math.min(window.innerWidth - 270, Math.max(16, e.clientX - 270));
          ty = Math.min(window.innerHeight - 210, Math.max(80, e.clientY - 90));
        },
        { passive: true },
      );
      row.addEventListener("pointerleave", function () {
        showing = false;
        prev.classList.remove("show");
      });
    });
  }

  /* ---------- 7. Live Podcast Waveform Visualizer ---------- */
  function attachWaveforms() {
    $$(".nb-ap-top, .nb-player").forEach(function (bar) {
      if ($(".nb-wave", bar)) return;
      var w = document.createElement("span");
      w.className = "nb-wave";
      w.setAttribute("aria-hidden", "true");
      w.innerHTML = Array.from({ length: 8 }, function (_, i) {
        return '<i style="--w:' + i + '"></i>';
      }).join("");
      var target = $(".nb-ap-st", bar) || $(".nb-p-title", bar);
      if (target) target.insertAdjacentElement("afterend", w);
    });
  }
  setTimeout(attachWaveforms, 250);
  setInterval(function () {
    $$(".nb-ap").forEach(function (ap) {
      var w = $(".nb-wave", ap),
        b = $(".nb-ap-play", ap);
      if (w && b) w.classList.toggle("playing", b.textContent.trim() === "⏸");
    });
    var mp = $(".nb-player");
    if (mp) {
      var mw = $(".nb-wave", mp),
        mb = $(".nb-p-play", mp);
      if (mw && mb)
        mw.classList.toggle("playing", mb.textContent.trim() === "⏸");
    }
  }, 350);

  /* ---------- 8. Header Tools & Command Palette (Ctrl + K) ---------- */
  var navTools = $(".nav-tools");
  if (navTools) {
    if (!$("#sfx-btn")) {
      var sfxBtn = document.createElement("button");
      sfxBtn.id = "sfx-btn";
      sfxBtn.type = "button";
      sfxBtn.className = "nb-hdr-btn";
      sfxBtn.setAttribute("aria-pressed", String(sfxEnabled));
      sfxBtn.setAttribute("aria-label", "صدای کلیدهای تعاملی");
      sfxBtn.innerHTML = sfxEnabled ? ICONS.soundOn : ICONS.soundOff;
      sfxBtn.addEventListener("click", function () {
        sfxEnabled = !sfxEnabled;
        try {
          localStorage.setItem("nb-sfx", sfxEnabled ? "1" : "0");
        } catch (e) {}
        sfxBtn.setAttribute("aria-pressed", String(sfxEnabled));
        sfxBtn.innerHTML = sfxEnabled ? ICONS.soundOn : ICONS.soundOff;
        if (sfxEnabled) playClick(1280);
      });
      navTools.insertBefore(sfxBtn, navTools.firstChild);
    }
    if (!$("#cmd-btn")) {
      var cmdBtn = document.createElement("button");
      cmdBtn.id = "cmd-btn";
      cmdBtn.type = "button";
      cmdBtn.className = "nb-hdr-btn";
      cmdBtn.setAttribute("aria-label", "جست‌وجوی سریع");
      cmdBtn.innerHTML = ICONS.search + "<span>جست‌وجو</span><kbd>⌘K</kbd>";
      navTools.insertBefore(cmdBtn, navTools.firstChild);
    }
  }

  var ov = document.createElement("div");
  ov.className = "nb-cmd-ov";
  ov.hidden = true;
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "جست‌وجوی سریع Next Bit");
  ov.innerHTML =
    '<div class="nb-cmd-box">' +
    '<div class="nb-cmd-top">' +
    ICONS.search +
    '<input type="search" id="nb-cmd-in" placeholder="جست‌وجوی فصل، آزمایشگاه یا واژه‌نامه…" autocomplete="off">' +
    '<button type="button" class="nb-cmd-esc">ESC</button>' +
    "</div>" +
    '<div class="nb-cmd-res" id="nb-cmd-res"></div>' +
    '<div class="nb-cmd-foot"><span>NEXT BIT // COMMAND INDEX</span><span>↑↓ NAVIGATE · ↵ OPEN</span></div>' +
    "</div>";
  document.body.appendChild(ov);

  var cmdIn = $("#nb-cmd-in", ov),
    cmdRes = $("#nb-cmd-res", ov),
    indexLoading = false,
    activeIdx = 0;
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[\u064B-\u065F]/g, "");
  }
  function ensureIndex(cb) {
    if (window.NB_SEARCH) return cb();
    if (indexLoading) {
      setTimeout(function () {
        ensureIndex(cb);
      }, 80);
      return;
    }
    indexLoading = true;
    cmdRes.innerHTML = '<div class="nb-cmd-empty">در حال بارگذاری فهرست…</div>';
    var sc = document.createElement("script");
    sc.src = root + "assets/search-index.js";
    sc.onload = function () {
      indexLoading = false;
      cb();
    };
    sc.onerror = function () {
      indexLoading = false;
      cmdRes.innerHTML =
        '<div class="nb-cmd-empty">فهرست جست‌وجو در دسترس نیست.</div>';
    };
    document.head.appendChild(sc);
  }
  function renderCmd(q) {
    var list = window.NB_SEARCH || [],
      nq = norm(q.trim());
    var hits = nq
      ? list
          .filter(function (it) {
            return norm(it.t + " " + it.x).indexOf(nq) !== -1;
          })
          .slice(0, 12)
      : list
          .filter(function (it) {
            return it.k === "مقاله" || it.k === "تجربه";
          })
          .slice(0, 8);
    activeIdx = 0;
    if (!hits.length) {
      cmdRes.innerHTML =
        '<div class="nb-cmd-empty">نتیجه‌ای برای «' +
        esc(q) +
        "» پیدا نشد.</div>";
      return;
    }
    cmdRes.innerHTML = hits
      .map(function (it, i) {
        var snip = (it.x || "").trim().slice(0, 80);
        return (
          '<a class="nb-cmd-item' +
          (i === 0 ? " on" : "") +
          '" href="' +
          root +
          it.u +
          '"><div><b>' +
          esc(it.t) +
          "</b><small>" +
          esc(snip) +
          (snip.length >= 80 ? "…" : "") +
          '</small></div><span class="nb-cmd-tag">' +
          esc(it.k) +
          "</span></a>"
        );
      })
      .join("");
  }
  function openCmd() {
    playClick(1320);
    ov.hidden = false;
    cmdIn.value = "";
    cmdIn.focus();
    ensureIndex(function () {
      renderCmd("");
    });
  }
  function closeCmd() {
    ov.hidden = true;
  }
  if ($("#cmd-btn")) $("#cmd-btn").addEventListener("click", openCmd);
  $(".nb-cmd-esc", ov).addEventListener("click", closeCmd);
  ov.addEventListener("click", function (e) {
    if (e.target === ov) closeCmd();
  });
  cmdIn.addEventListener("input", function () {
    ensureIndex(function () {
      renderCmd(cmdIn.value);
    });
  });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      ov.hidden ? openCmd() : closeCmd();
      return;
    }
    if (ov.hidden) return;
    if (e.key === "Escape") {
      closeCmd();
      return;
    }
    var items = $$(".nb-cmd-item", cmdRes);
    if (!items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[activeIdx].classList.remove("on");
      activeIdx =
        (activeIdx + (e.key === "ArrowDown" ? 1 : items.length - 1)) %
        items.length;
      items[activeIdx].classList.add("on");
      items[activeIdx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && items[activeIdx]) {
      e.preventDefault();
      location.href = items[activeIdx].getAttribute("href");
    }
  });

  /* ---------- 9. Unified Reading Progress & Deterministic Modern Reader Tracking ---------- */
  function getReadSet() {
    var set = {};
    try {
      ["nb-read-v2", "nb-read"].forEach(function (k) {
        var arr = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(arr))
          arr.forEach(function (id) {
            set[id] = true;
          });
      });
    } catch (e) {}
    return set;
  }
  function markChapterRead(id) {
    if (!id || !CH_BY_ID[id]) return;
    var set = getReadSet();
    if (set[id]) return;
    set[id] = true;
    try {
      var arr = Object.keys(set);
      localStorage.setItem("nb-read-v2", JSON.stringify(arr));
      localStorage.setItem("nb-read", JSON.stringify(arr));
    } catch (e) {}
    refreshReadUI();
  }
  function toFaNum(n) {
    return String(n).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  function refreshReadUI() {
    var set = getReadSet();
    var count = CHAPTERS.filter(function (c) {
      return set[c.id];
    }).length;
    var pct = Math.round((count / CHAPTERS.length) * 100);
    $$(".nb-prog-count").forEach(function (el) {
      el.textContent =
        toFaNum(count) + " از " + toFaNum(CHAPTERS.length) + " فصل خوانده‌شده";
    });
    $$(".nb-prog-pct").forEach(function (el) {
      el.textContent = toFaNum(pct) + "٪";
    });
    $$(".nb-prog-rail i").forEach(function (el) {
      el.style.width = pct + "%";
    });
    $$("[data-nb-chid]").forEach(function (el) {
      el.classList.toggle("is-read", !!set[el.getAttribute("data-nb-chid")]);
    });
    $$(".toc-l .ar[data-aid]").forEach(function (row) {
      var done = !!set[row.getAttribute("data-aid")];
      row.classList.toggle("is-read", done);
      var h3 = $("h3", row);
      if (done && h3 && !$(".nb-done-pill", h3)) {
        var b = document.createElement("span");
        b.className = "nb-done-pill";
        b.textContent = "✓ خوانده شد";
        h3.appendChild(b);
      }
    });
  }

  // Individual Chapter Page
  var pageArtId = document.body.getAttribute("data-article");
  if (pageArtId) {
    setTimeout(function () {
      markChapterRead(pageArtId);
    }, 4000);
    var headIn = $(".rd-head .in");
    if (headIn && !$(".nb-ch-switch", headIn)) {
      var sw = document.createElement("div");
      sw.className = "nb-ch-switch";
      sw.innerHTML =
        '<a class="nb-mini-link" href="../index.html#chapters">▤ فهرست فصل‌ها</a>' +
        '<a class="nb-mini-link" href="../read/index.html#reading">مطالعهٔ پیوسته</a>' +
        '<a class="nb-mini-link" href="../read/index.html#flip">ورق‌زدن (Flipbook)</a>';
      headIn.appendChild(sw);
    }
  }

  // Home Page direct access to Chapter-by-Chapter Hub
  var homeCta = $(".iss .cta");
  if (
    homeCta &&
    /\/(index\.html)?$/.test(location.pathname) &&
    !/\/issues\//.test(location.pathname)
  ) {
    if (!$('a[href*="issues/issue-01/index.html"]', homeCta)) {
      var chBtn = document.createElement("a");
      chBtn.className = "btn o";
      chBtn.href = root + "issues/issue-01/index.html#chapters";
      chBtn.textContent = "فصل‌به‌فصل (۱۴ بخش)";
      homeCta.insertBefore(chBtn, homeCta.children[1] || null);
    }
  }

  // Issue 01 Hub Progress Banner
  if (tocList && !$(".nb-hub-prog")) {
    tocList.id = tocList.id || "chapters";
    var set0 = getReadSet();
    var nextCh =
      CHAPTERS.find(function (c) {
        return !set0[c.id];
      }) || CHAPTERS[0];
    var hub = document.createElement("div");
    hub.className = "nb-hub-prog";
    hub.innerHTML =
      '<div class="nb-hp-info"><div class="nb-prog-top"><b class="nb-prog-count"></b><span class="nb-prog-pct"></span></div><div class="nb-prog-rail"><i></i></div></div>' +
      '<div class="nb-prog-actions"><a class="btn" href="' +
      nextCh.slug +
      '/index.html">ادامه: ' +
      esc(nextCh.title) +
      "</a></div>";
    tocList.parentNode.insertBefore(hub, tocList);
  }

  // Modern Continuous Reader: Deterministic Scroll-Position Chapter Sync (Zero Flicker)
  if (document.body.hasAttribute("data-reader")) {
    var rdToc = $(".rd-toc");
    var artSecs = $$(".art-sec[data-id]");
    if (rdToc && !$(".nb-prog-box", rdToc)) {
      var pbox = document.createElement("div");
      pbox.className = "nb-prog-box";
      pbox.innerHTML =
        '<div class="nb-prog-top"><b class="nb-prog-count"></b><span class="nb-prog-pct"></span></div>' +
        '<div class="nb-prog-rail"><i></i></div>' +
        '<div class="nb-prog-actions"><a class="nb-mini-link" href="../index.html#chapters">▤ نمای فصل‌به‌فصل</a></div>';
      rdToc.insertBefore(pbox, rdToc.firstChild);

      $$("a[data-sec]", rdToc).forEach(function (a) {
        var slug = a.getAttribute("data-sec");
        var secEl = document.getElementById(slug);
        var cid = secEl ? secEl.getAttribute("data-id") : null;
        var ch = cid ? CH_BY_ID[cid] : null;
        if (!ch) return;
        var row = document.createElement("div");
        row.className = "nb-toc-row";
        row.setAttribute("data-nb-chid", ch.id);
        a.parentNode.insertBefore(row, a);
        a.classList.add("nb-toc-main");
        a.insertAdjacentHTML(
          "afterbegin",
          '<span class="nb-read-dot" aria-hidden="true"></span>',
        );
        row.appendChild(a);

        var openA = document.createElement("a");
        openA.className = "nb-toc-open";
        openA.href = "../" + ch.slug + "/index.html";
        openA.title = "باز کردن نمای فصلی مجزا";
        openA.textContent = "↗";
        row.appendChild(openA);
      });
    }

    var scrollRaf = 0;
    function syncModernScrollChapter() {
      scrollRaf = 0;
      if (document.body.getAttribute("data-mode") === "flip" || !artSecs.length)
        return;
      var active = artSecs[0];
      for (var i = 0; i < artSecs.length; i++) {
        if (artSecs[i].getBoundingClientRect().top <= 200) active = artSecs[i];
        else break;
      }
      var cid = active.getAttribute("data-id");
      if (cid) {
        setActiveChapter(cid);
        markChapterRead(cid);
      }
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!scrollRaf)
          scrollRaf = requestAnimationFrame(syncModernScrollChapter);
      },
      { passive: true },
    );
    document.addEventListener("nb:mode", function (e) {
      if (e.detail !== "flip") setTimeout(syncModernScrollChapter, 60);
    });
    paintAllChapterThemes();
    setTimeout(syncModernScrollChapter, 120);
  }
  refreshReadUI();

  /* ---------- 10. Deterministic Flipbook Sync (MutationObserver on #fb-pgs) ---------- */
  var flipWrap = $(".flip-wrap");
  if (flipWrap && !$(".nb-fb-hud", flipWrap)) {
    var hud = document.createElement("div");
    hud.className = "nb-fb-hud";
    hud.innerHTML =
      '<div class="nb-fb-era"><i></i><span id="nb-fb-ch-name">شمارهٔ اول · جلد نشریه</span><small id="nb-fb-era-tag">ISSUE 01</small></div>' +
      '<div class="nb-fb-tools">' +
      '<div class="nb-fb-seg" role="group" aria-label="تم نشریه">' +
      '<button type="button" data-fb-theme="cyber">تم تیره</button>' +
      '<button type="button" data-fb-theme="editorial">تم مجله‌ای</button>' +
      "</div>" +
      '<button type="button" class="nb-fb-tbtn" id="nb-fb-zoom" aria-pressed="false">زوم تمرکز</button>' +
      '<a class="nb-mini-link" id="nb-fb-open-ch" href="../index.html#chapters">↗ نمای فصلی</a>' +
      "</div>";
    flipWrap.insertBefore(hud, flipWrap.firstChild);

    var fbCtl = $(".fb-ctl", flipWrap);
    var scrub = document.createElement("div");
    scrub.className = "nb-fb-scrub";
    scrub.innerHTML = "<i></i>";
    if (fbCtl) flipWrap.insertBefore(scrub, fbCtl);

    hud.addEventListener("click", function (e) {
      var tb = e.target.closest && e.target.closest("button[data-fb-theme]");
      if (tb) {
        setSiteTheme(tb.getAttribute("data-fb-theme"));
        playClick(1220);
        return;
      }
      var zb = e.target.closest && e.target.closest("#nb-fb-zoom");
      if (zb) {
        var on = flipWrap.classList.toggle("fb-zoom");
        zb.setAttribute("aria-pressed", String(on));
        playClick(on ? 1320 : 960);
      }
    });

    // Build exact title -> chapterId lookup from .art-sec DOM nodes
    var artSecsArr = $$(".art-sec[data-id]");
    var lastPgs = "";

    function syncFlipbookChapter(withSound) {
      if (document.body.getAttribute("data-mode") !== "flip") return;
      var pgsEl = $("#fb-pgs");
      var txt = pgsEl ? pgsEl.textContent.trim() : "";
      if (withSound && txt && txt !== "—" && txt !== lastPgs) playPaperFlip();
      lastPgs = txt;

      // Update scrubber bar
      var lat = txt.replace(/[۰-۹]/g, function (d) {
        return "۰۱۲۳۴۵۶۷۸۹".indexOf(d);
      });
      var nums = lat.match(/\d+/g);
      var pageNum = nums ? parseInt(nums[0], 10) : 1;
      if (nums && nums.length >= 2) {
        var tot = parseInt(nums[nums.length - 1], 10);
        if (tot > 0)
          $("i", scrub).style.width =
            Math.min(100, Math.max(4, (pageNum / tot) * 100)).toFixed(1) + "%";
      }

      // Deterministic chapter detection:
      // 1) Check visible face header text (exact title from reader.js)
      // 2) Fallback to #fb-ch select index -> artSecsArr[idx]
      var detectedId = null;
      var visFaces = $$('.face[aria-hidden="false"]', flipWrap);
      var isCoverOrToc = false;
      for (var i = 0; i < visFaces.length; i++) {
        if (visFaces[i].classList.contains("cv")) {
          isCoverOrToc = true;
          break;
        }
        var hd = $(".pg-head span:last-child", visFaces[i]);
        if (hd) {
          var htxt = hd.textContent.trim();
          if (htxt === "فهرست مطالب") {
            isCoverOrToc = true;
            continue;
          }
          for (var s = 0; s < artSecsArr.length; s++) {
            var shortT = (artSecsArr[s].getAttribute("data-title") || "")
              .split("؛")[0]
              .split(":")[0]
              .trim();
            if (shortT && htxt === shortT) {
              detectedId = artSecsArr[s].getAttribute("data-id");
              break;
            }
          }
          if (detectedId) break;
        }
      }
      if (!detectedId && !isCoverOrToc) {
        var sel = $("#fb-ch");
        var idx = sel ? parseInt(sel.value, 10) : -1;
        if (idx >= 0 && artSecsArr[idx])
          detectedId = artSecsArr[idx].getAttribute("data-id");
      }

      var cid = isCoverOrToc && !detectedId ? "ed" : detectedId || "ed";
      setActiveChapter(cid);
      var ch = CH_BY_ID[cid];
      if (ch) {
        $("#nb-fb-ch-name").textContent =
          isCoverOrToc && !detectedId ? "شمارهٔ اول · جلد و فهرست" : ch.title;
        $("#nb-fb-era-tag").textContent = "CH // " + ch.code;
        var openBtn = $("#nb-fb-open-ch");
        if (openBtn) openBtn.href = "../" + ch.slug + "/index.html";
        if (detectedId) markChapterRead(detectedId);
      }
    }

    // Observe #fb-pgs directly — reader.js updates it synchronously on EVERY flip, drag, arrow or jump
    var pgsNode = $("#fb-pgs");
    if (pgsNode && "MutationObserver" in window) {
      new MutationObserver(function () {
        syncFlipbookChapter(true);
      }).observe(pgsNode, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
    document.addEventListener("nb:mode", function (e) {
      if (e.detail === "flip")
        setTimeout(function () {
          syncFlipbookChapter(false);
        }, 120);
    });
    paintAllChapterThemes();
    setTimeout(function () {
      syncFlipbookChapter(false);
    }, 450);
  }

  /* ---------- 11. Precision Vector Mobile Dock ---------- */
  if (!$(".nb-mob-bar")) {
    var p = location.pathname;
    var isHome =
      /\/(index\.html)?$/.test(p) &&
      !/\/(issues|experiences|about|search|submit|collaborate|contact|team)\//.test(
        p,
      );
    var isIss = /\/issues\//.test(p);
    var isExp = /\/experiences\//.test(p);
    var mb = document.createElement("nav");
    mb.className = "nb-mob-bar";
    mb.setAttribute("aria-label", "ناوبری موبایل");
    mb.innerHTML =
      '<a href="' +
      root +
      'index.html"' +
      (isHome ? ' class="on"' : "") +
      ">" +
      ICONS.home +
      "<span>خانه</span></a>" +
      '<a href="' +
      root +
      'issues/issue-01/index.html"' +
      (isIss ? ' class="on"' : "") +
      ">" +
      ICONS.book +
      "<span>شماره ۱</span></a>" +
      '<a href="' +
      root +
      'experiences/index.html"' +
      (isExp ? ' class="on"' : "") +
      ">" +
      ICONS.lab +
      "<span>تجربه‌ها</span></a>" +
      '<button type="button" data-mb="cmd">' +
      ICONS.search +
      "<span>جست‌وجو</span></button>" +
      '<button type="button" data-mb="theme">' +
      ICONS.theme +
      "<span>تم</span></button>";
    mb.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button[data-mb]");
      if (!b) return;
      var act = b.getAttribute("data-mb");
      if (act === "cmd") openCmd();
      else if (act === "theme") {
        setSiteTheme(currentTheme === "cyber" ? "editorial" : "cyber");
        playClick(1200);
      }
    });
    document.body.appendChild(mb);
  }
  /* ---------- 12. Smart Auto-Hide Reader Bar, Anti-IDM Blob Audio & Real FFT Equalizer ---------- */
  // A) Auto-hide .rd-bar on scroll down in Modern/Interactive mode, reveal on scroll up
  var rdBar = $(".rd-bar");
  if (rdBar) {
    var lastScrollY = window.scrollY || 0;
    window.addEventListener(
      "scroll",
      function () {
        if (document.body.getAttribute("data-mode") === "flip") {
          rdBar.classList.remove("nb-bar-hide");
          return;
        }
        var y = window.scrollY || 0;
        if (y > 140 && y > lastScrollY + 10) rdBar.classList.add("nb-bar-hide");
        else if (y < lastScrollY - 8 || y <= 80)
          rdBar.classList.remove("nb-bar-hide");
        lastScrollY = y;
      },
      { passive: true },
    );
    document.addEventListener("nb:mode", function () {
      rdBar.classList.remove("nb-bar-hide");
    });
  }

  // B) Anti-IDM Blob Audio Proxy + Real-Time Web Audio FFT Equalizer
  (function () {
    if (
      !window.HTMLMediaElement ||
      !window.fetch ||
      location.protocol === "file:"
    )
      return;
    var proto = HTMLMediaElement.prototype;
    var srcDesc = Object.getOwnPropertyDescriptor(proto, "src");
    var nativePlay = proto.play;
    var nativePause = proto.pause;
    if (!srcDesc || !srcDesc.set || !srcDesc.get) return;

    var blobCache = {};
    var activeAudio = null;
    var eqCtx = null;
    var eqRaf = 0;

    function isAudioUrl(u) {
      return /^https?:/i.test(u) && /\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(u);
    }

    function fetchAsBlobUrl(url) {
      if (blobCache[url]) return Promise.resolve(blobCache[url]);
      return fetch(url, {
        cache: "force-cache",
        headers: { "X-Requested-With": "NextBitAudio" },
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        var ct =
          r.headers.get("content-type") ||
          (/\.wav/i.test(url) ? "audio/wav" : "audio/mpeg");
        return r.arrayBuffer().then(function (buf) {
          var bUrl = URL.createObjectURL(new Blob([buf], { type: ct }));
          blobCache[url] = bUrl;
          return bUrl;
        });
      });
    }

    function attachAnalyser(el) {
      if (el._nbAnalyser) return el._nbAnalyser;
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!eqCtx) eqCtx = new Ctx();
        var srcNode = eqCtx.createMediaElementSource(el);
        var an = eqCtx.createAnalyser();
        an.fftSize = 64;
        an.smoothingTimeConstant = 0.76;
        srcNode.connect(an);
        an.connect(eqCtx.destination);
        el._nbAnalyser = an;
        el._nbFreq = new Uint8Array(an.frequencyBinCount);
        return an;
      } catch (e) {
        return null;
      }
    }

    // Speech frequency bins (low warmth -> vocal fundamentals -> presence -> crisp highs)
    var BINS = [1, 2, 3, 4, 6, 8, 11, 14];
    function runEqLoop() {
      if (
        !activeAudio ||
        activeAudio.paused ||
        activeAudio.ended ||
        !activeAudio._nbAnalyser
      ) {
        eqRaf = 0;
        $$(".nb-wave.live").forEach(function (w) {
          w.classList.remove("live");
          $$("i", w).forEach(function (bar) {
            bar.style.height = "";
          });
        });
        return;
      }
      eqRaf = requestAnimationFrame(runEqLoop);
      var an = activeAudio._nbAnalyser;
      var data = activeAudio._nbFreq;
      an.getByteFrequencyData(data);

      var waves = $$(".nb-wave.playing");
      for (var w = 0; w < waves.length; w++) {
        waves[w].classList.add("live");
        var bars = waves[w].children;
        for (var i = 0; i < bars.length; i++) {
          var v = data[BINS[i % BINS.length]] || 0;
          var h = Math.max(3, Math.min(18, Math.round(3 + (v / 255) * 16)));
          bars[i].style.height = h + "px";
        }
      }
    }

    Object.defineProperty(proto, "src", {
      configurable: true,
      get: function () {
        return this._nbOrigSrc || srcDesc.get.call(this);
      },
      set: function (val) {
        var s = val ? String(val) : "";
        if (!s || /^blob:|^data:/i.test(s)) {
          this._nbOrigSrc = "";
          this._nbBlobReady = null;
          srcDesc.set.call(this, s);
          return;
        }
        var abs = s;
        try {
          abs = new URL(s, location.href).href;
        } catch (e) {}
        if (!isAudioUrl(abs)) {
          this._nbOrigSrc = "";
          this._nbBlobReady = null;
          srcDesc.set.call(this, s);
          return;
        }
        if (this._nbOrigSrc === abs && /^blob:/i.test(srcDesc.get.call(this)))
          return;

        var self = this;
        self._nbOrigSrc = abs;
        self._nbBlobReady = fetchAsBlobUrl(abs)
          .then(function (bUrl) {
            if (self._nbOrigSrc !== abs) return null;
            srcDesc.set.call(self, bUrl);
            return bUrl;
          })
          .catch(function () {
            if (self._nbOrigSrc === abs) srcDesc.set.call(self, abs);
            return abs;
          });
      },
    });

    proto.pause = function () {
      this._nbWantPlay = false;
      return nativePause.call(this);
    };

    proto.play = function () {
      var self = this;
      self._nbWantPlay = true;

      function startNow() {
        if (!self._nbWantPlay) return Promise.resolve();
        activeAudio = self;
        var an = attachAnalyser(self);
        if (eqCtx && eqCtx.state === "suspended")
          eqCtx.resume().catch(function () {});
        var p = nativePlay.call(self);
        if (an && !eqRaf) eqRaf = requestAnimationFrame(runEqLoop);
        return p;
      }

      if (self._nbBlobReady && !/^blob:/i.test(srcDesc.get.call(self))) {
        return self._nbBlobReady.then(function () {
          return startNow();
        });
      }
      return startNow();
    };
  })();
})();
