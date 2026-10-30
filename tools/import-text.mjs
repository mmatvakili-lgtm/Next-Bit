// content/issue-01/source-text.md  ->  content/issue-01/articles.json (+ glossary, start, behind, appendix)
// Rule: the author's sentences are copied verbatim. Only structure (headings, callouts, lists) is detected.
import fs from 'node:fs';
const raw = fs.readFileSync('content/issue-01/source-text.md', 'utf8').replace(/\r/g, '');
const sections = raw.split(/\n-{3,}\n/);

const DIG = /^[۰-۹0-9\s،,×+=و]+$/;
const unesc = (s) => s.replace(/\\\./g, '.');
const CALL = (t) => {
  const m = [
    [/^باور نمی‌کنی/, 'believe'], [/^باگ تاریخی$/, 'bug'], [/^جمع‌بندی$/, 'summary'], [/^توی ذهنت اجرا کن/, 'think', 'count-choices'],
    [/^یک دقیقه فکر کن/, 'think'], [/^یک دقیقه کدنویسی$/, 'minute'], [/^تمرین$/, 'exercise'], [/^نکته مهم$/, 'note'],
    [/^آزمایشگاه: ماشین رو برنامه‌ریزی کن/, 'lab', 'program-machine'], [/^آزمایشگاه Bit Lab/, 'lab', 'bit-lab'],
    [/^تجربه تعاملی: داخل یک کامپیوتر اولیه/, 'lab', 'machine-room'], [/^تجربه تعاملی: کارخانه تراشه/, 'lab', 'chip-factory'],
    [/^تجربه تعاملی: برنامه‌ات رو اجرا کن/, 'lab', 'code-lab'], [/^تجربه تعاملی: میز کار در گذر زمان/, 'lab', 'desk-time'],
    [/^تجربه تعاملی: سفر یک درخواست/, 'lab', 'request-journey'], [/^تجربه تعاملی: ماشین چطور یاد می‌گیره/, 'lab', 'ml-playground'],
    [/^Future Lab:/, 'lab', 'future-lab'], [/^تجربه تعاملی$/, 'lab', 'sorting-visualizer']
  ].find(([re]) => re.test(t));
  return m ? { kind: m[1], xp: m[2] } : null;
};
// editorial placement of experiences that have no callout of their own in the source text
const INSERT_AFTER_H2 = { 'گیت منطقی: تصمیم‌گیری در دنیای مدارها': 'logic-lab' };
const INSERT_BEFORE_SUMMARY = { 'future': 'timeline-explorer' };

function parseBody(lines, key) {
  const out = []; let cur = null; let list = null; let afterH2 = null;
  const target = () => (cur ? cur.blocks : out);
  const flushCur = () => { if (cur) { out.push(cur); cur = null; } };
  const flushInsert = () => { if (afterH2 && INSERT_AFTER_H2[afterH2]) { flushCur(); out.push({ t: 'xp', id: INSERT_AFTER_H2[afterH2], placed: 'editorial' }); } afterH2 = null; };
  for (let l of lines) {
    if (/^### /.test(l)) {
      list = null; flushInsert(); flushCur();
      const title = l.slice(4).trim(); const c = CALL(title) || { kind: 'note' };
      if (c.kind === 'summary' && INSERT_BEFORE_SUMMARY[key]) out.push({ t: 'xp', id: INSERT_BEFORE_SUMMARY[key], placed: 'editorial' });
      cur = { t: 'callout', kind: c.kind, title, xp: c.xp, blocks: [] }; continue;
    }
    if (/^## /.test(l)) { list = null; flushInsert(); flushCur(); const x = l.slice(3).trim(); out.push({ t: 'h2', x }); afterH2 = x; continue; }
    if (/^- /.test(l)) { if (!list || list.ordered) { list = { t: 'list', ordered: false, items: [] }; target().push(list); } list.items.push(l.slice(2)); continue; }
    const om = unesc(l).match(/^[۱-۹]\.\s+(.*)$/);
    if (om) { if (!list || !list.ordered) { list = { t: 'list', ordered: true, items: [] }; target().push(list); } list.items.push(om[1]); continue; }
    list = null;
    if (DIG.test(l) && /[۰-۹0-9]/.test(l)) { target().push({ t: 'ex', x: l }); continue; }
    const bm = l.match(/^\*\*(.+)\*\*$/);
    target().push(bm ? { t: 'p', x: bm[1], strong: true } : { t: 'p', x: l });
  }
  flushInsert(); flushCur();
  return out;
}
const clean = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const words = (o) => JSON.stringify(o).replace(/[{}\[\]":,]/g, ' ').split(/\s+/).filter(Boolean).length;

const META = {
  'فصل صفر': { id: 'ch-0', slug: 'before-computers', topic: 'ابزارهای محاسبه', kind: 'chapter', n: 0 },
  'فصل اول': { id: 'ch-1', slug: 'gears-and-dreams', topic: 'ماشین‌های مکانیکی', kind: 'chapter', n: 1 },
  'فصل دوم': { id: 'ch-2', slug: 'zero-and-one', topic: 'سیستم دودویی و منطق', kind: 'chapter', n: 2 },
  'فصل سوم': { id: 'ch-3', slug: 'room-sized-computers', topic: 'لامپ خلأ و ENIAC', kind: 'chapter', n: 3 },
  'فصل چهارم': { id: 'ch-4', slug: 'transistor', topic: 'ترانزیستور و تراشه', kind: 'chapter', n: 4 },
  'فصل پنجم': { id: 'ch-5', slug: 'first-programs', topic: 'برنامه‌نویسی', kind: 'chapter', n: 5 },
  'فصل ششم': { id: 'ch-6', slug: 'personal-computing', topic: 'سیستم‌عامل و کامپیوتر شخصی', kind: 'chapter', n: 6 },
  'فصل هفتم': { id: 'ch-7', slug: 'message-journey', topic: 'اینترنت و وب', kind: 'chapter', n: 7 },
  'فصل هشتم': { id: 'ch-8', slug: 'machines-that-learn', topic: 'هوش مصنوعی', kind: 'chapter', n: 8 },
  'فصل نهم': { id: 'ch-9', slug: 'the-future', topic: 'آینده محاسبات', kind: 'chapter', n: 9 },
  'پرونده ویژه اول': { id: 'sp-1', slug: 'history-of-bugs', topic: 'باگ و خطا', kind: 'special', n: 1, key: 'bug' },
  'پرونده ویژه دوم': { id: 'sp-2', slug: 'cpu-vs-gpu', topic: 'CPU و GPU', kind: 'special', n: 2, key: 'cpu' },
  'پرونده ویژه سوم': { id: 'sp-3', slug: 'sorting-algorithms', topic: 'الگوریتم مرتب‌سازی', kind: 'special', n: 3, key: 'sort' }
};
const articles = []; const extra = {};
let head = null;
sections.forEach((sec, si) => {
  const lines = clean(sec);
  if (si === 0) {
    const i = lines.indexOf('### یادداشت تحریریه');
    head = { title: lines.find((l) => l.startsWith('## ')).slice(3), tagline: lines.find((l) => /^\*\*.+\*\*$/.test(l)).slice(2, -2) };
    extra.editorial = { title: 'یادداشت تحریریه', blocks: parseBody(lines.slice(i + 1), 'ed') };
    return;
  }
  const first = lines[0].replace(/^# /, '');
  const m = META[first];
  if (m) {
    const title = lines[1].replace(/^# /, '');
    const key = m.id === 'ch-9' ? 'future' : m.key;
    const blocks = parseBody(lines.slice(2), key);
    const fb = blocks.findIndex((b) => b.t !== 'p');
    const intro = blocks.splice(0, fb < 0 ? blocks.length : fb);
    articles.push({ ...m, label: first, title, intro, blocks, readingMinutes: Math.max(1, Math.round(words([intro, blocks]) / 170)) });
  } else if (first === 'واژه‌نامه زنده') {
    extra.glossary = lines.slice(1).map((l) => { const g = l.match(/^\*\*(.+?):\*\*\s*(.+)$/); return { term: g[1], def: g[2] }; });
  } else if (first === 'از کجا شروع کنیم؟') extra.start = { title: first, blocks: parseBody(lines.slice(1), 'start') };
  else if (first === 'پشت صحنه Next Bit') extra.behind = { title: first, blocks: parseBody(lines.slice(1), 'behind') };
  else if (first === 'منابع و مطالعه بیشتر') {
    const body = lines.slice(1); const items = []; const intro = []; let note = null;
    for (const l of body) { const u = unesc(l); const mm = u.match(/^[۱-۹][۰-۹]*\.\s+(.*)$/); if (mm) items.push(mm[1]); else if (/^\*\*یادداشت ویراستاری:\*\*/.test(l)) note = l.replace(/^\*\*یادداشت ویراستاری:\*\*\s*/, ''); else intro.push(l); }
    extra.sources = { title: first, intro, items, editorNote: note };
  } else if (first.startsWith('پیوست تحریریه')) {
    extra.appendixRaw = true; // production guide, not article text -> kept in content/issue-01/appendix.md only
    fs.writeFileSync('content/issue-01/appendix.md', '# ' + first + '\n\n' + sec.split('\n').slice(2).join('\n'));
  } else console.warn('UNHANDLED SECTION', first);
});
fs.writeFileSync('content/issue-01/articles.json', JSON.stringify({ head, ...extra, articles }, null, 1));
for (const a of articles) console.log(a.id.padEnd(5), a.title.slice(0, 40).padEnd(42), 'intro', a.intro.length, 'blocks', a.blocks.length, '~', a.readingMinutes, 'min', 'xp:', a.blocks.flatMap((b) => b.t === 'xp' ? [b.id] : b.xp ? [b.xp] : []).join(','));
console.log('glossary', extra.glossary.length, 'sources', extra.sources.items.length);
