(function () {
  var NB = window.NB, el = NB.el, fa = NB.fa;
  NB.xp['program-machine'] = function (root) {
    var prog = [{ k: 's', v: 5 }, { k: 'a', v: 3 }, { k: 'p' }];
    var w = el('div'); w.appendChild(el('div', { class: 'lb', text: 'GOAL' }));
    w.appendChild(el('p', { text: 'هدف: ببینی ترتیب دستورها و داده‌ها نتیجهٔ برنامه را تعیین می‌کند. ماشین سه نوع دستور دارد: ذخیرهٔ یک عدد، اضافه‌کردن یک عدد، نمایش نتیجه. چالش: ماشین را طوری برنامه‌ریزی کن که عدد ۱۲ را نمایش بدهد.' }));
    var pal = el('div', { class: 'xp-ctl' });
    var vi = el('input', { class: 'xin', type: 'number', value: 4, min: 0, max: 99, 'aria-label': 'عدد', style: 'width:90px' });
    pal.appendChild(el('button', { class: 'xbtn o', type: 'button', text: '+ ذخیره عدد', onclick: function () { add('s'); } }));
    pal.appendChild(el('button', { class: 'xbtn o', type: 'button', text: '+ اضافه کن', onclick: function () { add('a'); } }));
    pal.appendChild(vi); pal.appendChild(el('button', { class: 'xbtn o', type: 'button', text: '+ نمایش', onclick: function () { if (prog.length < 10) { prog.push({ k: 'p' }); draw(); } } }));
    w.appendChild(pal);
    var ul = el('ul', { class: 'pm-list', style: 'margin-top:14px' }); w.appendChild(ul);
    var ctl = el('div', { class: 'xp-ctl', style: 'margin-top:12px' });
    ctl.appendChild(el('button', { class: 'xbtn', type: 'button', text: 'اجرا', onclick: run })); ctl.appendChild(el('button', { class: 'xbtn o', type: 'button', text: 'شروع مجدد', onclick: function () { prog = [{ k: 's', v: 5 }, { k: 'a', v: 3 }, { k: 'p' }]; trace.textContent = ''; res.textContent = ''; draw(); } }));
    w.appendChild(ctl);
    var trace = el('div', { class: 'pm-trace', 'aria-live': 'polite' }); var res = el('div', { class: 'xres', 'aria-live': 'polite' }); w.appendChild(trace); w.appendChild(res);
    function add(k) { var v = parseInt(vi.value, 10); if (!(v >= 0 && v <= 99)) { res.textContent = 'عدد باید بین ۰ و ۹۹ باشد.'; return; } if (prog.length >= 10) { res.textContent = 'حداکثر ۱۰ دستور.'; return; } prog.push({ k: k, v: v }); draw(); }
    var txt = function (p) { return p.k === 's' ? 'ذخیره عدد ' + p.v : p.k === 'a' ? 'اضافه کن ' + p.v : 'نمایش'; };
    function draw() {
      ul.innerHTML = '';
      prog.forEach(function (p, i) {
        var li = el('li', {}, [el('span', { class: 'i', text: String(i + 1) }), el('span', { class: 't', text: txt(p) }),
          el('button', { type: 'button', 'aria-label': 'بالا', text: '↑', disabled: i === 0 ? '' : null, onclick: function () { var t = prog[i - 1]; prog[i - 1] = prog[i]; prog[i] = t; draw(); } }),
          el('button', { type: 'button', 'aria-label': 'پایین', text: '↓', onclick: function () { if (i < prog.length - 1) { var t = prog[i + 1]; prog[i + 1] = prog[i]; prog[i] = t; draw(); } } }),
          el('button', { type: 'button', 'aria-label': 'حذف', text: '✕', onclick: function () { prog.splice(i, 1); draw(); } })]);
        if (i === 0) li.children[2].disabled = true; if (i === prog.length - 1) li.children[3].disabled = true;
        ul.appendChild(li);
      });
      if (!prog.length) ul.appendChild(el('li', { text: 'برنامه خالی است؛ دستور اضافه کن.' }));
    }
    function run() {
      var acc = null, shown = [], lines = [], err = null;
      for (var i = 0; i < prog.length && !err; i++) {
        var p = prog[i];
        if (p.k === 's') { acc = p.v; lines.push((i + 1) + '. ذخیره → ACC = ' + acc + (i && lines.length ? ' (مقدار قبلی دور ریخته شد)' : '')); }
        else if (p.k === 'a') { if (acc === null) err = 'خطا در خط ' + (i + 1) + ': هنوز هیچ عددی ذخیره نشده؛ نمی‌شود چیزی به «هیچ» اضافه کرد.'; else { acc += p.v; lines.push((i + 1) + '. اضافه → ACC = ' + acc); } }
        else { if (acc === null) err = 'خطا در خط ' + (i + 1) + ': چیزی برای نمایش وجود ندارد.'; else { shown.push(acc); lines.push((i + 1) + '. نمایش → ' + acc); } }
      }
      trace.textContent = lines.join('\n') + (err ? '\n' + err : ''); trace.style.whiteSpace = 'pre-wrap';
      if (err) res.textContent = 'برنامه متوقف شد: ' + err;
      else if (!shown.length) res.textContent = 'برنامه اجرا شد ولی چیزی نمایش نداد.';
      else res.textContent = 'خروجی: ' + shown.join('، ') + (shown.indexOf(12) > -1 ? ' ✓ چالش حل شد: ۱۲ نمایش داده شد. ' : ' — هدف ۱۲ است.') + ' همان دستورها با ترتیب دیگر می‌توانند نتیجهٔ دیگری (یا خطا) بدهند؛ ترتیب را عوض کن و امتحان کن.';
    }
    root.appendChild(w); draw();
  };
})();
