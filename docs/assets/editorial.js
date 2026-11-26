/* Next Bit — Live Editorial Engine, Unified Podcast Player & Mobile TOC */
(function () {
  "use strict";
  var NB = (window.NB = window.NB || {});
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  var fa =
    NB.fa ||
    function (n) {
      return String(n).replace(/\d/g, function (d) {
        return "۰۱۲۳۴۵۶۷۸۹"[d];
      });
    };
  var store =
    NB.store ||
    function (k, v) {
      try {
        return v === undefined
          ? localStorage.getItem(k)
          : localStorage.setItem(k, v);
      } catch (e) {
        return null;
      }
    };

  /* ---------- 1. Theme Switcher (Cyber Dark / Warm Paper / Light) ---------- */
  var THEMES = [
    { id: "cyber", icon: "☾", label: "تم شب نئونی" },
    { id: "warm", icon: "▤", label: "تم کاغذ مجله" },
    { id: "light", icon: "☀", label: "تم روشن" },
  ];
  var curTheme = store("nb-theme") || "cyber";
  if (
    !THEMES.some(function (t) {
      return t.id === curTheme;
    })
  )
    curTheme = "cyber";
  document.documentElement.setAttribute("data-theme", curTheme);

  var navTools = $(".nav-tools");
  if (navTools && !$("#theme-btn")) {
    var tBtn = document.createElement("button");
    tBtn.id = "theme-btn";
    tBtn.type = "button";
    tBtn.className = "ic-btn";
    function syncThemeBtn() {
      var t = THEMES.filter(function (x) {
        return x.id === curTheme;
      })[0];
      tBtn.textContent = t.icon;
      tBtn.title = t.label + " (کلیک برای تغییر)";
      tBtn.setAttribute("aria-label", t.label);
    }
    syncThemeBtn();
    tBtn.addEventListener("click", function () {
      var idx = THEMES.findIndex(function (x) {
        return x.id === curTheme;
      });
      curTheme = THEMES[(idx + 1) % THEMES.length].id;
      document.documentElement.setAttribute("data-theme", curTheme);
      store("nb-theme", curTheme);
      syncThemeBtn();
    });
    navTools.insertBefore(tBtn, navTools.firstChild);
  }

  /* ---------- 2. Collapsible Mobile TOC ---------- */
  $$(".rd-toc").forEach(function (toc) {
    if ($(".nb-toc-toggle", toc)) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nb-toc-toggle";
    btn.innerHTML = '<span>فهرست مطالب</span><span class="nb-toc-arr">▾</span>';
    var startClosed = window.innerWidth <= 960;
    if (startClosed) toc.classList.add("is-collapsed");
    btn.setAttribute("aria-expanded", String(!startClosed));
    btn.addEventListener("click", function () {
      var closed = toc.classList.toggle("is-collapsed");
      btn.setAttribute("aria-expanded", String(!closed));
      $(".nb-toc-arr", btn).textContent = closed ? "▾" : "▴";
    });
    toc.insertBefore(btn, toc.firstChild);
    $$("a", toc).forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.innerWidth <= 960) {
          toc.classList.add("is-collapsed");
          btn.setAttribute("aria-expanded", "false");
          $(".nb-toc-arr", btn).textContent = "▾";
        }
      });
    });
  });

  /* ---------- 3. Ambient Spotlight & Interactive Cover Matrix ---------- */
  $$(".hero, .rd-head").forEach(function (sec) {
    sec.addEventListener(
      "pointermove",
      function (e) {
        if (NB.reduced && NB.reduced()) return;
        var r = sec.getBoundingClientRect();
        sec.style.setProperty(
          "--mx",
          (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%",
        );
        sec.style.setProperty(
          "--my",
          (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%",
        );
      },
      { passive: true },
    );
  });

  $$(".cover").forEach(function (cv) {
    var cells = $$(".mx i", cv);
    function pulse(cell) {
      cell.textContent = cell.textContent === "1" ? "0" : "1";
      cell.classList.add("lit");
      setTimeout(function () {
        cell.classList.remove("lit");
      }, 650);
    }
    cells.forEach(function (c) {
      c.addEventListener("pointerenter", function () {
        pulse(c);
      });
      c.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        pulse(c);
      });
    });
  });

  /* ---------- 4. Unified Podcast Engine (One DOM Audio -> Inline + Flipbook + Floating Bar) ---------- */
  var SPEEDS = [1, 1.25, 1.5, 0.85];
  var speedIdx = 0,
    activeSrc = "",
    activeTitle = "",
    isSeeking = false;

  var masterAud = document.createElement("audio");
  masterAud.id = "nb-master-audio";
  masterAud.preload = "auto";
  masterAud.style.display = "none";
  document.body.appendChild(masterAud);

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return "00:00";
    var m = Math.floor(sec / 60),
      s = Math.floor(sec % 60);
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  // Floating mini-player
  var fBar = document.createElement("div");
  fBar.className = "nb-player";
  fBar.setAttribute("role", "region");
  fBar.setAttribute("aria-label", "پخش‌کنندهٔ پادکست");
  fBar.innerHTML =
    '<button type="button" class="nb-p-play" aria-label="پخش یا مکث">▶</button>' +
    '<div class="nb-p-mid">' +
    '<div class="nb-p-top"><span class="nb-p-title"></span><span class="nb-p-time">00:00 / 00:00</span></div>' +
    '<input type="range" class="nb-p-seek" min="0" max="1000" value="0" aria-label="موقعیت پخش">' +
    "</div>" +
    '<div class="nb-p-ctl">' +
    '<button type="button" class="nb-p-btn" data-fjump="-15" title="۱۵ ثانیه عقب">−15s</button>' +
    '<button type="button" class="nb-p-btn" data-fjump="15" title="۱۵ ثانیه جلو">+15s</button>' +
    '<button type="button" class="nb-p-btn" data-fspd="1">1×</button>' +
    '<button type="button" class="nb-p-btn" data-fclose="1" aria-label="بستن">✕</button>' +
    "</div>";
  document.body.appendChild(fBar);

  var fPlay = $(".nb-p-play", fBar),
    fTitle = $(".nb-p-title", fBar),
    fTime = $(".nb-p-time", fBar);
  var fSeek = $(".nb-p-seek", fBar),
    fSpd = $("[data-fspd]", fBar);

  function mountInlinePlayers(scope) {
    $$(".listen[data-audio]", scope || document).forEach(function (sec) {
      var mount = $(".nb-ap-mount", sec);
      if (!mount || mount.firstChild) return;
      var src = sec.getAttribute("data-audio");
      mount.innerHTML =
        '<div class="nb-ap">' +
        '<div class="nb-ap-row">' +
        '<button type="button" class="nb-ap-play" aria-label="پخش یا مکث پادکست">▶</button>' +
        '<div class="nb-ap-mid">' +
        '<div class="nb-ap-meta"><span class="nb-ap-st">آمادهٔ پخش</span><span class="nb-ap-tm">00:00 / 00:00</span></div>' +
        '<input type="range" class="nb-ap-seek" min="0" max="1000" value="0" aria-label="موقعیت پخش">' +
        "</div>" +
        "</div>" +
        '<div class="nb-ap-tools">' +
        '<button type="button" class="nb-ap-btn" data-ajump="-15">−15s</button>' +
        '<button type="button" class="nb-ap-btn" data-ajump="15">+15s</button>' +
        '<button type="button" class="nb-ap-btn" data-aspd="1">1×</button>' +
        '<a class="nb-ap-btn" href="' +
        src +
        '" download>⬇ MP3</a>' +
        "</div>" +
        "</div>";
    });
  }
  mountInlinePlayers(document);

  // Header quick launch button on single-article pages
  var mainListen = $("article.prose .listen[data-audio]");
  var rdHeadIn = $(".rd-head .in");
  var headPodBtn = null;
  if (mainListen && rdHeadIn) {
    var actWrap = document.createElement("div");
    actWrap.className = "nb-head-actions";
    headPodBtn = document.createElement("button");
    headPodBtn.type = "button";
    headPodBtn.className = "nb-pod-btn";
    headPodBtn.innerHTML =
      '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="nb-pod-lbl">🎧 گوش دادن به پادکست این فصل</span>';
    headPodBtn.addEventListener("click", function () {
      toggleTrack(
        mainListen.getAttribute("data-audio"),
        mainListen.getAttribute("data-title") ||
          ($(".rd-head h1") || {}).textContent ||
          "پادکست",
      );
    });
    actWrap.appendChild(headPodBtn);
    rdHeadIn.appendChild(actWrap);
  }

  function toggleTrack(src, title) {
    if (!src) return;
    if (activeSrc !== src) {
      activeSrc = src;
      activeTitle = title || "پادکست فصل";
      masterAud.src = src;
      masterAud.load();
      masterAud.playbackRate = SPEEDS[speedIdx];
      fTitle.textContent = activeTitle;
      fBar.classList.add("open");
      document.body.classList.add("has-player");
      masterAud.play().catch(function () {});
    } else {
      fBar.classList.add("open");
      document.body.classList.add("has-player");
      if (masterAud.paused) masterAud.play().catch(function () {});
      else masterAud.pause();
    }
    syncAllPlayers();
  }

  function syncAllPlayers() {
    var dur = masterAud.duration,
      cur = masterAud.currentTime;
    var hasDur = isFinite(dur) && dur > 0;
    var val = hasDur ? Math.round((cur / dur) * 1000) : 0;
    var tmStr = fmtTime(cur) + " / " + (hasDur ? fmtTime(dur) : "--:--");
    var playing = !masterAud.paused && !!activeSrc;

    fPlay.textContent = playing ? "⏸" : "▶";
    fTime.textContent = tmStr;
    fSpd.textContent = SPEEDS[speedIdx] + "×";
    if (!isSeeking) fSeek.value = String(val);

    if (headPodBtn && mainListen) {
      var isThis =
        activeSrc === mainListen.getAttribute("data-audio") && playing;
      $(".nb-pod-lbl", headPodBtn).textContent = isThis
        ? "⏸ توقف موقت پادکست"
        : "🎧 گوش دادن به پادکست این فصل";
    }

    $$(".listen[data-audio]").forEach(function (sec) {
      var pBtn = $(".nb-ap-play", sec),
        st = $(".nb-ap-st", sec),
        tm = $(".nb-ap-tm", sec),
        sk = $(".nb-ap-seek", sec),
        sp = $("[data-aspd]", sec);
      if (!pBtn) return;
      var match = sec.getAttribute("data-audio") === activeSrc;
      var nextIcon = match && playing ? "⏸" : "▶";
      var nextSt = match
        ? playing
          ? "در حال پخش…"
          : "متوقف شده"
        : "آمادهٔ پخش";
      var nextSp = SPEEDS[speedIdx] + "×";
      if (pBtn.textContent !== nextIcon) pBtn.textContent = nextIcon;
      if (st.textContent !== nextSt) st.textContent = nextSt;
      if (match) {
        if (tm.textContent !== tmStr) tm.textContent = tmStr;
        if (!isSeeking) sk.value = String(val);
      }
      if (sp && sp.textContent !== nextSp) sp.textContent = nextSp;
    });
  }

  [
    "timeupdate",
    "loadedmetadata",
    "play",
    "pause",
    "ended",
    "ratechange",
  ].forEach(function (ev) {
    masterAud.addEventListener(ev, syncAllPlayers);
  });

  // Floating bar controls
  fPlay.addEventListener("click", function () {
    if (activeSrc) toggleTrack(activeSrc, activeTitle);
  });
  fSeek.addEventListener("pointerdown", function () {
    isSeeking = true;
  });
  fSeek.addEventListener("pointerup", function () {
    isSeeking = false;
  });
  fSeek.addEventListener("input", function () {
    if (isFinite(masterAud.duration) && masterAud.duration > 0) {
      masterAud.currentTime =
        (parseFloat(fSeek.value) / 1000) * masterAud.duration;
    }
  });
  $$("[data-fjump]", fBar).forEach(function (b) {
    b.addEventListener("click", function () {
      if (!isFinite(masterAud.duration)) return;
      masterAud.currentTime = Math.max(
        0,
        Math.min(
          masterAud.duration,
          masterAud.currentTime + parseInt(b.getAttribute("data-fjump"), 10),
        ),
      );
    });
  });
  fSpd.addEventListener("click", function () {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    masterAud.playbackRate = SPEEDS[speedIdx];
    syncAllPlayers();
  });
  $("[data-fclose]", fBar).addEventListener("click", function () {
    masterAud.pause();
    fBar.classList.remove("open");
    document.body.classList.remove("has-player");
    syncAllPlayers();
  });

  // Delegated events for ALL inline players (including dynamically rendered Flipbook pages)
  document.addEventListener("click", function (e) {
    var sec = e.target.closest && e.target.closest(".listen[data-audio]");
    if (!sec) return;
    var src = sec.getAttribute("data-audio"),
      title = sec.getAttribute("data-title") || "پادکست فصل";
    if (e.target.closest(".nb-ap-play")) {
      e.preventDefault();
      e.stopPropagation();
      toggleTrack(src, title);
    } else if (e.target.closest("[data-ajump]")) {
      e.preventDefault();
      e.stopPropagation();
      var delta = parseInt(
        e.target.closest("[data-ajump]").getAttribute("data-ajump"),
        10,
      );
      if (activeSrc === src && isFinite(masterAud.duration)) {
        masterAud.currentTime = Math.max(
          0,
          Math.min(masterAud.duration, masterAud.currentTime + delta),
        );
      }
    } else if (e.target.closest("[data-aspd]")) {
      e.preventDefault();
      e.stopPropagation();
      speedIdx = (speedIdx + 1) % SPEEDS.length;
      masterAud.playbackRate = SPEEDS[speedIdx];
      syncAllPlayers();
    }
  });

  document.addEventListener("input", function (e) {
    if (!e.target.classList || !e.target.classList.contains("nb-ap-seek"))
      return;
    var sec = e.target.closest(".listen[data-audio]");
    if (!sec) return;
    var src = sec.getAttribute("data-audio");
    if (
      activeSrc === src &&
      isFinite(masterAud.duration) &&
      masterAud.duration > 0
    ) {
      masterAud.currentTime =
        (parseFloat(e.target.value) / 1000) * masterAud.duration;
    }
  });

  // Watch Flipbook stage safely (never re-trigger on text updates)
  var stage = $("#stage");
  if (stage && "MutationObserver" in window) {
    var stTimer = null;
    var stObs = new MutationObserver(function () {
      clearTimeout(stTimer);
      stTimer = setTimeout(function () {
        if (!stage.querySelector(".nb-ap-mount:empty")) return;
        stObs.disconnect();
        mountInlinePlayers(stage);
        syncAllPlayers();
        stObs.observe(stage, { childList: true, subtree: true });
      }, 60);
    });
    stObs.observe(stage, { childList: true, subtree: true });
  }

  /* ---------- 5. Photo Lightbox ---------- */
  document.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest("figure.fig.ph img");
    if (!img) return;
    var fig = img.closest("figure");
    var cap =
      fig && fig.querySelector("figcaption")
        ? fig.querySelector("figcaption").innerHTML
        : img.alt;
    var ov = document.createElement("div");
    ov.className = "nb-lb";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.innerHTML =
      '<button type="button" class="nb-lb-close" aria-label="بستن">✕</button><img src="' +
      img.src +
      '" alt=""><div class="nb-lb-cap">' +
      cap +
      "</div>";
    function close() {
      ov.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(ev) {
      if (ev.key === "Escape") close();
    }
    ov.addEventListener("click", function (ev) {
      if (ev.target === ov || ev.target.classList.contains("nb-lb-close"))
        close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
  });

  /* ---------- 6. Live Remaining Time & Reading Journey ---------- */
  var READ_KEY = "nb-read-v1";
  function getRead() {
    try {
      return JSON.parse(store(READ_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function markRead(id) {
    if (!id) return;
    var arr = getRead();
    if (arr.indexOf(id) === -1) {
      arr.push(id);
      store(READ_KEY, JSON.stringify(arr));
    }
  }

  var artId = document.body.getAttribute("data-article");
  var rdHeadEl = $(".rd-head");
  if (artId && rdHeadEl) {
    var totalMin = parseInt(rdHeadEl.getAttribute("data-min") || "4", 10) || 4;
    var rdIn = $(".rd-in"),
      remPill = null;
    if (rdIn) {
      remPill = document.createElement("span");
      remPill.className = "nb-rem";
      remPill.textContent = "حدود " + fa(totalMin) + " دقیقه مانده";
      rdIn.appendChild(remPill);
    }
    var marked = false;
    window.addEventListener(
      "scroll",
      function () {
        var h = document.documentElement,
          max = h.scrollHeight - h.clientHeight;
        var pct = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
        if (remPill) {
          var left = Math.max(0, Math.ceil(totalMin * (1 - pct)));
          remPill.textContent =
            pct > 0.92 ? "✓ پایان این بخش" : fa(left) + " دقیقه مانده";
        }
        if (!marked && pct > 0.78) {
          marked = true;
          markRead(artId);
        }
      },
      { passive: true },
    );
  }

  var tocList = $(".toc-l");
  if (tocList && !artId) {
    var done = getRead(),
      links = $$(".ar[data-aid]", tocList);
    if (links.length) {
      var count = 0;
      links.forEach(function (a) {
        if (done.indexOf(a.getAttribute("data-aid")) !== -1) {
          count++;
          a.classList.add("is-read");
          var h3 = $("h3", a);
          if (h3 && !$(".ar-done", h3)) {
            var sp = document.createElement("span");
            sp.className = "ar-done";
            sp.textContent = "✓ خوانده شد";
            h3.appendChild(sp);
          }
        }
      });
      var pct = Math.round((count / links.length) * 100);
      var card = document.createElement("div");
      card.className = "nb-journey";
      card.innerHTML =
        '<div class="nb-j-top"><b>پیشرفت مطالعهٔ تو در شمارهٔ اول</b><span class="mono" style="color:var(--green)">' +
        fa(count) +
        " / " +
        fa(links.length) +
        " بخش (" +
        fa(pct) +
        "٪)</span></div>" +
        '<div class="nb-j-bar"><i style="width:' +
        pct +
        '%"></i></div>';
      tocList.parentNode.insertBefore(card, tocList);
    }
  }

  /* ---------- 7. Micro-Interaction "اول حدس بزن!" ---------- */
  var GUESS = {
    "ch-0": {
      q: "مهم‌ترین ویژگی «چوب‌خط» که هنوز در کامپیوترهای امروز زنده است چیست؟",
      opts: [
        "سرعت محاسبهٔ بسیار بالا",
        "بیرون گذاشتن حافظه از ذهن در یک ساختار ماندگار",
        "توانایی اجرای برنامهٔ خودکار",
      ],
      ok: 1,
      exp: "چوب‌خط حافظه را از ذهن انسان جدا کرد و به یک ساختار بیرونی سپرد؛ همان ایده‌ای که پایهٔ حافظهٔ کامپیوتر است.",
    },
    "ch-1": {
      q: "آیا ماشین تحلیلی چارلز ببیج در زمان زندگی خودش به‌طور کامل ساخته شد؟",
      opts: [
        "بله و در دانشگاه کمبریج کار می‌کرد",
        "خیر؛ از فناوری ساخت زمان خودش جلوتر بود",
      ],
      ok: 1,
      exp: "طرح مفهومی ببیج درخشان بود اما محدودیت‌های ساخت قطعات مکانیکی دقیق مانع تکمیل آن در قرن نوزدهم شد.",
    },
    "ch-2": {
      q: "در کدگذاری UTF-8، آیا هر حرف فارسی دقیقاً یک بایت جا می‌گیرد؟",
      opts: ["بله، هر حرف همیشه ۱ بایت است", "خیر، معمولاً ۲ بایت می‌گیرد"],
      ok: 1,
      exp: "فقط نویسه‌های پایهٔ انگلیسی (ASCII) یک بایت هستند؛ بسیاری از حروف فارسی در UTF-8 با ۲ بایت ذخیره می‌شوند.",
    },
    "ch-3": {
      q: "تغییر برنامه در کامپیوترهای اولیه‌ای مثل ENIAC چطور انجام می‌شد؟",
      opts: [
        "با باز کردن فایل کد در ویرایشگر",
        "با تغییر کابل‌ها و کلیدهای فیزیکی دستگاه",
      ],
      ok: 1,
      exp: "در ENIAC برنامه‌ریزی جدید نیاز به تنظیم فیزیکی پنل‌ها و کابل‌کشی مجدد داشت و بسیار زمان‌بر بود.",
    },
    "ch-4": {
      q: "آیا قانون مور یک قانون فیزیکی تغییرناپذیر است؟",
      opts: [
        "بله، قانون فیزیک نیمه‌رساناهاست",
        "خیر، یک مشاهدهٔ تاریخی و روند صنعتی است",
      ],
      ok: 1,
      exp: "گوردون مور یک روند تجربی را مشاهده کرد؛ بیشتر شدن ترانزیستورها هم به‌تنهایی سرعت همهٔ برنامه‌ها را دو برابر نمی‌کند.",
    },
    "ch-7": {
      q: "آیا «اینترنت» و «وب» یک چیز هستند؟",
      opts: [
        "بله، دو نام برای یک شبکه هستند",
        "خیر، وب یکی از سرویس‌های روی زیرساخت اینترنت است",
      ],
      ok: 1,
      exp: "اینترنت زیرساخت اتصال شبکه‌هاست و وب (در کنار ایمیل، پیام‌رسان‌ها و...) فقط یکی از سرویس‌هایی است که روی آن اجرا می‌شود.",
    },
    "ch-8": {
      q: "اگر یک مدل زبانی پاسخی بسیار روان و مطمئن نوشت، یعنی حتماً درست است؟",
      opts: [
        "بله، لحن مطمئن نشانهٔ دقت داده است",
        "خیر، ممکن است دچار «توهم مدل» شده باشد",
      ],
      ok: 1,
      exp: "روان بودن متن تضمین‌کنندهٔ صحت اطلاعات نیست؛ در موضوعات علمی و تاریخی بررسی مستقل منابع ضروری است.",
    },
    "sp-1": {
      q: "آیا پیدا شدن پروانه در Mark II سال ۱۹۴۷ نخستین بار بود که واژهٔ «باگ» به کار رفت؟",
      opts: [
        "بله، این واژه همان روز اختراع شد",
        "خیر، مهندس‌ها (مثل ادیسون) ده‌ها سال قبل هم از آن استفاده می‌کردند",
      ],
      ok: 1,
      exp: "واژهٔ باگ از قرن نوزدهم برای عیب‌های فنی به کار می‌رفت؛ ماجرای ۱۹۴۷ اولین نمونهٔ ثبت‌شدهٔ یک حشرهٔ واقعی بود!",
    },
  };
  if (artId && GUESS[artId]) {
    var g = GUESS[artId];
    var sumBox =
      $("article.prose .callout.summary") || $("article.prose .listen");
    if (sumBox) {
      var box = document.createElement("section");
      box.className = "nb-guess";
      box.innerHTML =
        '<div class="kk">QUICK CHECK · اول حدس بزن</div><h3>' +
        g.q +
        '</h3><div class="nb-guess-opts"></div><div class="nb-guess-ans" hidden></div>';
      var optsEl = $(".nb-guess-opts", box),
        ansEl = $(".nb-guess-ans", box);
      g.opts.forEach(function (txt, idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = txt;
        b.addEventListener("click", function () {
          $$("button", optsEl).forEach(function (x, j) {
            x.disabled = true;
            if (j === g.ok) x.classList.add("ok");
            else if (j === idx) x.classList.add("no");
          });
          ansEl.hidden = false;
          ansEl.innerHTML =
            (idx === g.ok ? "<b>✓ دقیقاً! </b>" : "<b>✗ نزدیک بود! </b>") +
            g.exp;
        });
        optsEl.appendChild(b);
      });
      sumBox.parentNode.insertBefore(box, sumBox);
    }
  }

  /* ---------- 8. Pull Quotes & Scroll Reveal ---------- */
  var prose = $("article.prose");
  if (prose) {
    var ps = $$(":scope > p", prose);
    var pick = ps.find(function (p) {
      var t = (p.textContent || "").trim();
      return (
        !p.querySelector("strong") &&
        t.length >= 48 &&
        t.length <= 125 &&
        /[؟!]$/.test(t)
      );
    });
    if (pick) pick.classList.add("nb-pull");
  }

  if (
    "IntersectionObserver" in window &&
    !(NB.reduced && NB.reduced()) &&
    !document.body.hasAttribute("data-reader")
  ) {
    var targets = $$("figure.fig.ph, .callout, .nb-pull, .nb-guess, .xcard");
    var rio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in-v");
            rio.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.06 },
    );
    targets.forEach(function (el) {
      el.classList.add("nb-rev");
      rio.observe(el);
    });
  }
})();
