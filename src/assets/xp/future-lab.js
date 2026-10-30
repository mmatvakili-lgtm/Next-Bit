(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  var SC = [
    { n: 'هوش مصنوعی در توسعه نرم‌افزار', q: 'فرض کن ابزارهای هوش مصنوعی بخش بیشتری از کارهای تکراری برنامه‌نویسی را انجام بدهند. چه مهارت‌هایی اهمیت بیشتری پیدا می‌کنند؟',
      real: 'امروز ابزارهای مبتنی بر هوش مصنوعی در تکمیل کد، توضیح خطا، تولید تست و مستندسازی استفاده می‌شوند.', res: 'پژوهش و آزمایش دربارهٔ میزان اثر این ابزارها بر کیفیت، امنیت و بهره‌وری ادامه دارد و نتایج به زمینه و روش اندازه‌گیری وابسته‌اند.', scn: 'اگر کارهای تکراری بیشتر خودکار شوند، مهارت‌هایی مثل فهم مسئله، طراحی سیستم، بررسی صحت خروجی و امنیت ممکن است اهمیت بیشتری پیدا کنند.', preset: { perf: 4, energy: 3, cost: 2, rel: 5, lat: 3 } },
    { n: 'محدودیت انرژی', q: 'فرض کن افزایش توان محاسباتی با محدودیت جدی مصرف انرژی روبه‌رو شود. چه روش‌هایی برای طراحی سخت‌افزار و نرم‌افزار کارآمدتر اهمیت پیدا می‌کنند؟',
      real: 'مراکز داده و دستگاه‌های امروزی برای کار به انرژی نیاز دارند و مصرف انرژی یک قید طراحی واقعی است.', res: 'بهینه‌سازی سخت‌افزار، شتاب‌دهنده‌های تخصصی و نرم‌افزارهای کارآمدتر از موضوعات پژوهشی و مهندسی فعال‌اند.', scn: 'اگر انرژی قید اصلی شود، ممکن است طراحی‌ها بیشتر به سمت کارایی در هر وات و الگوریتم‌های سبک‌تر بروند.', preset: { perf: 3, energy: 1, cost: 3, rel: 4, lat: 3 } },
    { n: 'پیشرفت محاسبات کوانتومی', q: 'فرض کن کامپیوترهای کوانتومی برای گروهی از مسائل کاربردی‌تر شوند. کدام مسئله‌ها ممکن است از این پیشرفت سود ببرند و چه محدودیت‌هایی همچنان باقی می‌مانند؟',
      real: 'سامانه‌های کوانتومی پژوهشی و آزمایشی وجود دارند، اما ساخت سامانه‌های پایدار و قابل‌استفاده چالش‌های فنی مهمی دارد.', res: 'پژوهش دربارهٔ الگوریتم‌ها، تصحیح خطا و سخت‌افزار ادامه دارد؛ مزیت به مسئله و الگوریتم بستگی دارد.', scn: 'ممکن است برای گروهی خاص از مسائل مفید شود؛ اما کامپیوتر کوانتومی به‌طور خودکار همهٔ کارها را سریع‌تر از کامپیوتر معمولی انجام نمی‌دهد.', preset: { perf: 5, energy: 4, cost: 5, rel: 2, lat: 4 } }
  ];
  var VARS = [['perf', 'عملکرد'], ['energy', 'مصرف انرژی'], ['cost', 'هزینه'], ['rel', 'قابلیت اعتماد'], ['lat', 'تأخیر (کندی)']];
  NB.xp['future-lab'] = function (root) {
    var s = 0, tab = 'real', vals = { perf: 3, energy: 3, cost: 3, rel: 3, lat: 3 }, BUDGET = 15;
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: تمرین تفکر مهندسی و تشخیص مصالحه‌ها، و تفاوت گذاشتن بین فناوری موجود، پژوهش در حال انجام و سناریوی احتمالی. این سناریوها پیش‌بینی قطعی نیستند.' }));
    var st = el('div', { class: 'fu-tabs', role: 'group', 'aria-label': 'سناریو' }), sb = [];
    SC.forEach(function (x, i) { var b = el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(i === 0), text: 'سناریو ' + fa(i + 1) + ': ' + x.n, onclick: function () { s = i; draw(); } }); sb.push(b); st.appendChild(b); }); w.appendChild(st);
    var q = el('div', { class: 'xres' }); w.appendChild(q);
    var tt = el('div', { class: 'fu-tabs', role: 'group', 'aria-label': 'بخش' }), tbs = {};
    [['real', 'امروز (واقعیت)'], ['res', 'در پژوهش'], ['scn', 'سناریو']].forEach(function (t) { var b = el('button', { class: 'xbtn o', type: 'button', 'aria-pressed': String(t[0] === tab), text: t[1], onclick: function () { tab = t[0]; draw(); } }); tbs[t[0]] = b; tt.appendChild(b); }); w.appendChild(tt);
    var pane = el('div', { class: 'fu-pane', 'aria-live': 'polite' }); w.appendChild(pane);
    var note = el('textarea', { class: 'xin fa', 'aria-label': 'یادداشت من', placeholder: 'پاسخ خودت را بنویس (فقط روی همین صفحه می‌ماند و ذخیره یا ارسال نمی‌شود)…', style: 'width:100%;min-height:90px;margin-top:12px;direction:rtl' }); w.appendChild(note);
    w.appendChild(el('div', { class: 'lb', style: 'margin-top:26px', text: 'TRADE-OFF MODEL' }));
    w.appendChild(el('p', { text: 'سامانه‌ای فرضی را با بودجهٔ ' + fa(BUDGET) + ' امتیاز طراحی کن. هر متغیر از ۱ تا ۵ است؛ «هزینه» و «انرژی» امتیاز بالا یعنی مصرف/هزینهٔ بیشتر، و «تأخیر» بالا یعنی کندتر. یکی را که زیاد کنی، به قیمت دیگری است. این یک مدل ساده‌شده است، نه پیش‌بینی آینده.' }));
    var presetBtn = el('button', { class: 'xbtn o', type: 'button', onclick: function () { vals = Object.assign({}, SC[s].preset); drawM(); } }); w.appendChild(presetBtn);
    var rows = el('div', { style: 'display:grid;gap:10px;margin-top:12px' }); var rin = {}; w.appendChild(rows);
    VARS.forEach(function (v) { var o = el('output', { class: 'mono', style: 'min-width:24px;display:inline-block' }); var r = el('input', { class: 'xrange', type: 'range', min: 1, max: 5, value: 3, 'aria-label': v[1], oninput: function () { vals[v[0]] = +this.value; drawM(); } }); rin[v[0]] = { r: r, o: o }; rows.appendChild(el('label', { style: 'display:flex;gap:12px;align-items:center' }, [el('span', { style: 'min-width:120px', text: v[1] }), r, o])); });
    var out = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(out);
    function drawM() {
      var sum = 0; VARS.forEach(function (v) { rin[v[0]].r.value = vals[v[0]]; rin[v[0]].o.textContent = vals[v[0]]; sum += vals[v[0]]; });
      presetBtn.textContent = 'چینش مثال برای سناریوی «' + SC[s].n + '»';
      var msgs = [];
      if (sum > BUDGET) msgs.push('✗ مجموع ' + fa(sum) + ' از بودجهٔ ' + fa(BUDGET) + ' بیشتر است؛ باید چیزی را کم کنی.'); else msgs.push('✓ مجموع ' + fa(sum) + ' از ' + fa(BUDGET) + ' (در بودجه).');
      if (vals.perf >= 4 && vals.energy <= 2) msgs.push('عملکرد بالا با مصرف انرژی کم معمولاً دشوار است؛ این ترکیب به فناوری یا طراحی خاصی نیاز دارد که هزینه‌اش را باید جای دیگر بدهی.');
      if (vals.rel >= 4 && vals.cost <= 2) msgs.push('قابلیت اعتماد بالا اغلب با افزونگی، آزمون و تصحیح خطا همراه است که معمولاً هزینه یا تأخیر می‌آورد.');
      if (vals.lat <= 2 && vals.energy <= 2) msgs.push('تأخیر کم با انرژی کم: ممکن است فقط برای بارهای کاری سبک ممکن باشد.');
      if (vals.perf <= 2 && vals.cost >= 4) msgs.push('هزینهٔ بالا با عملکرد پایین نشانهٔ مصالحهٔ نامناسب است.');
      if (msgs.length === 1) msgs.push('هر تغییر را با یک متغیر دیگر جبران کن و ببین چه پیامدی دارد. هیچ ترکیب «کاملی» وجود ندارد.');
      out.innerHTML = msgs.map(function (m) { return '<div>' + NB.esc(m) + '</div>'; }).join('');
    }
    function draw() {
      sb.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === s)); }); Object.keys(tbs).forEach(function (k) { tbs[k].setAttribute('aria-pressed', String(k === tab)); });
      q.innerHTML = '<b>' + NB.esc(SC[s].n) + '</b><br>' + NB.esc(SC[s].q);
      pane.innerHTML = '<span class="badge' + (tab === 'scn' ? ' sc' : '') + '">' + ({ real: 'واقعیت موجود', res: 'پژوهش در حال انجام', scn: 'سناریوی احتمالی — پیش‌بینی نیست' })[tab] + '</span><br>' + NB.esc(SC[s][tab]);
      drawM();
    }
    root.appendChild(w); draw();
  };
})();
