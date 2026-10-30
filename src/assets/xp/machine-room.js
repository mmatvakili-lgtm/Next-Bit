(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  var PARTS = [
    { n: 'واحد محاسبات', en: 'ARITHMETIC UNIT', d: 'جمع و عملیات حسابی و منطقی را انجام می‌دهد؛ در کامپیوترهای الکترونیکی اولیه از مدارهای ساخته‌شده با لامپ‌های خلأ برای این کار استفاده می‌شد.', l: 'سرعت و اعتمادپذیری به تعداد قطعات، گرما و نگهداری وابسته بود.' },
    { n: 'حافظه', en: 'MEMORY', d: 'داده‌ها (و در معماری‌های بعدی، برنامه‌ها) را نگه می‌دارد تا واحد محاسبات بتواند به آن‌ها برگردد.', l: 'در بسیاری از ماشین‌های اولیه حافظه بسیار محدود بود و نوع آن از دستگاهی به دستگاه دیگر فرق می‌کرد.' },
    { n: 'ورودی', en: 'INPUT', d: 'راهی برای رساندن داده و دستور به ماشین؛ بسته به دستگاه می‌توانست کلید، کابل‌کشی، کارت پانچ یا روش‌های دیگر باشد.', l: 'تغییر وظیفهٔ ماشین می‌توانست زمان‌بر باشد و اشتباه کوچک هزینهٔ زیادی داشت.' },
    { n: 'خروجی', en: 'OUTPUT', d: 'نتیجه را به انسان می‌رساند؛ مثلاً با چاپ، کارت یا نمایشگرهای ساده.', l: 'خروجی‌ها کند و محدود بودند و خواندنشان نیاز به آموزش داشت.' },
    { n: 'قطعات الکترونیکی', en: 'COMPONENTS', d: 'لامپ‌های خلأ و مدارهای اطرافشان کلیدهای الکترونیکی ماشین بودند: وضعیت‌های منطقی را پردازش می‌کردند.', l: 'بزرگ بودند، گرما تولید می‌کردند و هزاران عدد از آن‌ها نگهداری پیچیده‌ای می‌خواست.' }
  ];
  var OPS = ['HALT', 'LOAD', 'ADD', 'STORE'];
  NB.xp['machine-room'] = function (root) {
    var w = el('div');
    w.appendChild(el('div', { class: 'lb', text: 'PART 1 — INSIDE AN EARLY COMPUTER' }));
    w.appendChild(el('p', { text: 'مدل تصویری ساده‌شده؛ روی هر بخش بزن. جزئیات واقعی هر دستگاه تاریخی با این مدل کلی فرق دارد.' }));
    var grid = el('div', { class: 'mr', role: 'group', 'aria-label': 'بخش‌های کامپیوتر' }); var bt = [];
    var det = el('div', { class: 'xres', 'aria-live': 'polite', text: 'یک بخش را انتخاب کن.' });
    PARTS.forEach(function (p, i) { var b = el('button', { type: 'button', 'aria-pressed': 'false', onclick: function () { bt.forEach(function (x, j) { x.setAttribute('aria-pressed', String(i === j)); }); det.innerHTML = '<b>' + p.n + '</b><br>وظیفه: ' + p.d + '<br>محدودیت: ' + p.l; } }, [p.n, el('small', { text: p.en })]); bt.push(b); grid.appendChild(b); });
    w.appendChild(grid); w.appendChild(det);

    w.appendChild(el('div', { class: 'lb', style: 'margin-top:28px', text: 'PART 2 — FETCH · DECODE · EXECUTE' }));
    w.appendChild(el('p', { text: 'یک ماشین آموزشی فرضی (نه شبیه‌سازی دقیق یک پردازندهٔ تجاری): حافظهٔ داده، شمارندهٔ برنامه (PC)، ثبات انباره (ACC) و چهار دستور. چالش: برنامه‌ای بنویس که خانهٔ ۰ و ۱ را جمع کند و نتیجه را در خانهٔ ۲ بگذارد.' }));
    var prog = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], mem = [5, 7, 0, 0, 0, 0, 0, 0], init = mem.slice(), pc = 0, acc = 0, ir = null, phase = 0, halted = false, cycles = 0, msg = '';
    var pl = el('div', { class: 'pm-list', style: 'gap:6px' }); var rows = [];
    prog.forEach(function (p, i) {
      var os = el('select', { class: 'xsel', 'aria-label': 'دستور خط ' + (i + 1), onchange: function () { prog[i][0] = +this.value; syncOp(i); reset(); } }, OPS.map(function (o, k) { return el('option', { value: k, text: o }); }));
      var as = el('select', { class: 'xsel', 'aria-label': 'آدرس خط ' + (i + 1), onchange: function () { prog[i][1] = +this.value; reset(); } }, [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return el('option', { value: k, text: 'خانهٔ ' + k }); }));
      var row = el('div', { style: 'display:flex;gap:8px;align-items:center;padding:6px 10px;background:var(--ink2);border:1.5px solid var(--line-d)' }, [el('span', { class: 'mono', style: 'color:var(--green);width:30px', text: String(i) }), os, as]);
      rows.push({ row: row, os: os, as: as }); pl.appendChild(row);
    });
    function syncOp(i) { rows[i].as.disabled = prog[i][0] === 0; }
    w.appendChild(pl);
    var ctl = el('div', { class: 'xp-ctl', style: 'margin-top:12px' });
    var bStep = el('button', { class: 'xbtn', type: 'button', text: 'گام بعد', onclick: step }), bRun = el('button', { class: 'xbtn o', type: 'button', text: 'اجرای کامل', onclick: function () { var g = 0; while (!halted && g++ < 60) step(); } }), bReset = el('button', { class: 'xbtn o', type: 'button', text: 'شروع مجدد', onclick: reset }), bSol = el('button', { class: 'xbtn o', type: 'button', text: 'نمایش یک راه‌حل', onclick: function () { prog = [[1, 0], [2, 1], [3, 2], [0, 0], [0, 0], [0, 0]]; rows.forEach(function (r, i) { r.os.value = prog[i][0]; r.as.value = prog[i][1]; syncOp(i); }); reset(); } });
    ctl.appendChild(bStep); ctl.appendChild(bRun); ctl.appendChild(bReset); ctl.appendChild(bSol); w.appendChild(ctl);
    var mm = el('div', { class: 'mr-vals' }); w.appendChild(mm);
    var stat = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(stat);
    function step() {
      if (halted) return;
      if (pc >= prog.length) { halted = true; msg = 'خطا: PC از انتهای برنامه گذشت. یک HALT در پایان برنامه لازم است.'; return draw(); }
      if (phase === 0) { ir = prog[pc]; msg = 'واکشی (Fetch): دستور خط ' + pc + ' از حافظهٔ برنامه خوانده شد → ' + OPS[ir[0]] + (ir[0] ? ' ' + ir[1] : ''); phase = 1; }
      else if (phase === 1) { msg = 'رمزگشایی (Decode): ' + ['توقف ماشین', 'کپی مقدار خانهٔ حافظه در ACC', 'اضافه‌کردن مقدار خانهٔ حافظه به ACC', 'نوشتن ACC در خانهٔ حافظه'][ir[0]] + '.'; phase = 2; }
      else {
        var op = ir[0], a = ir[1]; cycles++;
        if (op === 0) { halted = true; msg = 'اجرا (Execute): HALT — ماشین متوقف شد.'; }
        else { if (op === 1) acc = mem[a]; else if (op === 2) acc = acc + mem[a]; else mem[a] = acc; msg = 'اجرا (Execute): ' + OPS[op] + ' ' + a + ' → ACC = ' + acc; pc++; }
        phase = 0;
      }
      draw();
    }
    function reset() { mem = init.slice(); pc = 0; acc = 0; ir = null; phase = 0; halted = false; cycles = 0; msg = 'آمادهٔ اجرا. با «گام بعد» فقط یک مرحله جلو برو.'; draw(); }
    function draw() {
      rows.forEach(function (r, i) { r.row.style.borderColor = (i === pc && !halted) ? 'var(--green)' : ''; r.row.style.background = (i === pc && !halted) ? '#0E2A13' : ''; });
      mm.innerHTML = '<span>PC=<b>' + pc + '</b></span><span>ACC=<b>' + acc + '</b></span><span>STAGE=<b>' + ['FETCH', 'DECODE', 'EXECUTE'][phase] + '</b></span>' + mem.map(function (v, i) { return '<span>M' + i + '=<b>' + v + '</b></span>'; }).join('');
      var ok = halted && mem[2] === init[0] + init[1] && /HALT/.test(msg);
      stat.textContent = msg + (halted && /HALT/.test(msg) ? (ok ? '  ✓ چالش حل شد: خانهٔ ۲ برابر ' + init[0] + ' + ' + init[1] + ' = ' + mem[2] + ' است.' : '  ✗ هنوز خانهٔ ۲ برابر مجموع خانه‌های ۰ و ۱ نیست.') : '');
    }
    root.appendChild(w); rows.forEach(function (r, i) { syncOp(i); }); reset();
  };
})();
