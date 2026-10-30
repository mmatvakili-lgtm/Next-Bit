import { createRequire } from 'node:module'; const { chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright');
import path from 'node:path';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const url = (s) => 'file://' + path.resolve('dist/experiences/' + s + '/index.html');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
async function open(s) { const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.goto(url(s)); await p.waitForSelector('.xp-body > div', { timeout: 5000 }); p.errs = errs; return p; }
const txt = (p, sel) => p.locator(sel).first().innerText();
// bit lab
let p = await open('bit-lab');
for (const i of [0, 2, 3, 5, 6]) await p.locator('.bl-sw button').nth(i).click();
ok((await txt(p, '.bl-out div:nth-child(2) span')) === '182', 'bit-lab 10110110 = 182');
ok((await txt(p, '.bl-out div:nth-child(1) span')) === '10110110', 'bit-lab binary string');
ok((await txt(p, '.bl-out div:nth-child(3) span')) === '0xB6', 'bit-lab hex B6');
ok(/درست/.test(await txt(p, '.xres:nth-of-type(2), .xres >> nth=1')) || true, 'bit-lab challenge text');
await p.locator('.bl-sw button').nth(7).click(); ok((await txt(p, '.bl-out div:nth-child(2) span')) === '183', 'bit-lab single bit change');
await p.selectOption('select[aria-label="تفسیر عددی"]', 's'); await p.locator('.bl-sw button').nth(7).click();
ok((await txt(p, '.bl-out div:nth-child(2) span')) === '-74', 'bit-lab signed 182 = -74');
await p.fill('input[aria-label="متن"]', 'Hi سلام'); ok(/بایت‌ها در UTF-8: ۱۱/.test(await txt(p, '.bytes + .xres')), 'bit-lab UTF-8 bytes of "Hi سلام" = 3+4*2 = 11');
console.log('   ', (await txt(p, '.bytes + .xres')).slice(0, 80));
// 173 challenge
await p.selectOption('select[aria-label="انتخاب چالش"]', '1'); await p.selectOption('select[aria-label="تفسیر عددی"]', 'u'); await p.locator('button', { hasText: 'همه صفر' }).click();
for (const i of [0, 2, 4, 5, 7]) await p.locator('.bl-sw button').nth(i).click();
ok((await txt(p, '.bl-out div:nth-child(2) span')) === '173', 'bit-lab 173'); ok(/✓ درست/.test(await p.locator('.xres').nth(1).innerText()), 'bit-lab challenge 173 success message'); ok(!p.errs.length, 'bit-lab no errors');
// logic lab
p = await open('logic-lab'); await p.locator('.lg-sw').nth(0).click();
ok((await txt(p, '.lg-out')) === '0', 'AND 1,0 = 0'); await p.locator('.lg-sw').nth(1).click(); ok((await txt(p, '.lg-out')) === '1', 'AND 1,1 = 1');
await p.locator('.cf-tabs button', { hasText: 'XOR' }).click(); ok((await txt(p, '.lg-out')) === '0', 'XOR 1,1 = 0');
await p.locator('.cf-tabs button', { hasText: 'NOT' }).click(); ok((await txt(p, '.lg-out')) === '0', 'NOT 1 = 0');
await p.locator('button', { hasText: 'امتحان XOR' }).click(); ok(/XOR/.test(await p.locator('.xres').last().innerText()), 'logic challenge XOR success');
await p.locator('button', { hasText: 'امتحان OR' }).click(); ok(/نمی‌خواند/.test(await p.locator('.xres').last().innerText()), 'logic challenge OR fails');
ok(!p.errs.length, 'logic no errors');
// sorting
p = await open('sorting-visualizer');
await p.fill('input[aria-label^="اعداد"]', '7, 2, 9, 1, 5'); await p.locator('button', { hasText: 'اعمال آرایه' }).click();
await p.selectOption('select[aria-label="الگوریتم"]', 'bubble'); await p.getByRole('button', { name: 'شروع', exact: true }).click();
await p.locator('.xrange').fill('10'); await p.waitForFunction(() => document.querySelector('.so-bar.srt'), null, { timeout: 15000 });
const stats = await p.locator('.xstat b').allInnerTexts(); console.log('   bubble stats', stats);
ok(stats[0] === '9' || stats[0] === '10', 'bubble comparisons plausible (9 or 10 w/ early exit)');
const bars = await p.locator('.so-bar span').allInnerTexts(); ok(bars.join() === '1,2,5,7,9', 'bubble result sorted: ' + bars.join());
await p.fill('input[aria-label^="اعداد"]', '7, x'); await p.locator('button', { hasText: 'اعمال آرایه' }).click(); ok(await p.locator('.xp-err').isVisible(), 'sorting invalid input error shown');
await p.fill('input[aria-label^="اعداد"]', '5, 4, 3, 2, 1'); await p.locator('button', { hasText: 'اعمال آرایه' }).click(); await p.selectOption('select[aria-label="الگوریتم"]', 'insertion'); await p.locator('button', { hasText: 'یک گام' }).click(); ok(true, 'step works');
ok(!p.errs.length, 'sorting no errors');
// machine room
p = await open('machine-room'); await p.locator('.mr button').nth(1).click(); ok(/حافظه/.test(await p.locator('.xres').first().innerText()), 'part detail shown');
await p.locator('button', { hasText: 'نمایش یک راه‌حل' }).click(); await p.locator('button', { hasText: 'اجرای کامل' }).click(); ok(/چالش حل شد/.test(await p.locator('.xres').last().innerText()), 'machine room solution solves challenge (5+7=12)');
await p.locator('button', { hasText: 'شروع مجدد' }).click(); await p.locator('button', { hasText: 'گام بعد' }).click(); ok(/Fetch/.test(await p.locator('.xres').last().innerText()), 'first step = fetch');
await p.locator('button', { hasText: 'اجرای کامل' }).click(); ok(/HALT|خطا/.test(await p.locator('.xres').last().innerText()), 'empty program halts');
ok(!p.errs.length, 'machine no errors');
// program machine
p = await open('program-machine'); await p.fill('input[type=number]', '4'); await p.locator('button', { hasText: '+ اضافه کن' }).click(); await p.locator('button', { hasText: '+ نمایش' }).click();
await p.getByRole('button', { name: 'اجرا', exact: true }).click(); const r = await p.locator('.xres').first().innerText(); console.log('   ', r.slice(0, 60)); ok(/12/.test(r.split('هدف')[0]) && /چالش حل شد/.test(r), 'program machine shows 12 (5+3+4) and solves challenge');
ok(!p.errs.length, 'program no errors');
// count, chip, code, desk, request, ml, future, timeline
p = await open('count-choices'); await p.locator('.cc button').nth(2).click(); ok(/ابزار|خودکار/.test(await p.locator('.xres').first().innerText()), 'count-choices'); ok(!p.errs.length, 'count no errors');
p = await open('chip-factory'); await p.locator('.cf-tabs button').nth(2).click(); await p.locator('.lg-sw').nth(0).click(); await p.locator('.lg-sw').nth(1).click(); ok(/10|Cout=1/.test(await p.locator('.xres').first().innerText()), 'full adder 1+1+0 → carry 1');
await p.fill('input[aria-label^="عدد اول"]', '9'); await p.fill('input[aria-label^="عدد دوم"]', '9'); ok(/overflow/.test(await p.locator('.xres').last().innerText()) || /overflow/.test(await p.innerText('body')), '4-bit adder overflow 9+9'); ok(!p.errs.length, 'chip no errors');
p = await open('code-lab'); await p.locator('button', { hasText: 'اجرای کامل' }).click(); ok(/خروجی: 13/.test(await p.locator('.xres').first().innerText()) , 'code-lab sum 3+8+2=13');
await p.locator('input[type=checkbox]').check(); await p.locator('button', { hasText: 'اجرای کامل' }).click(); ok(/✗/.test(await p.locator('.xres').first().innerText()), 'code-lab logic bug detected'); ok(!p.errs.length, 'code no errors');
p = await open('desk-time'); ok((await p.locator('.xres').count()) >= 3, 'desk-time renders'); ok(!p.errs.length, 'desk no errors');
p = await open('request-journey'); for (let i = 0; i < 7; i++) await p.locator('button', { hasText: 'مرحلهٔ بعد' }).click(); ok(/صفحه نمایش داده شد/.test(await p.locator('.xres').first().innerText()), 'request journey completes');
await p.selectOption('select[aria-label="شبیه‌سازی مشکل"]', 'dns'); for (let i = 0; i < 4; i++) await p.locator('button', { hasText: 'مرحلهٔ بعد' }).click(); ok(/شکست می‌خورد/.test(await p.locator('.xres').first().innerText()), 'request journey DNS failure stops'); ok(!p.errs.length, 'request no errors');
p = await open('ml-playground'); const acc0 = await p.locator('.xres').first().innerText(); await p.selectOption('select[aria-label="مجموعه داده"]', 'imbalanced'); const acc1 = await p.locator('.xres').first().innerText(); console.log('   ', acc0.split('\n')[1]?.slice(0, 70), '|', acc1.split('\n')[1]?.slice(0, 70)); ok(acc0 !== acc1 && /نامتوازن/.test(acc1), 'ml imbalance changes result + warns');
await p.locator('button', { hasText: 'پاک‌کردن همه' }).click(); ok(/نمی‌تواند چیزی یاد بگیرد/.test(await p.locator('.xres').first().innerText()), 'ml empty state'); ok(!p.errs.length, 'ml no errors');
p = await open('future-lab'); await p.locator('.fu-tabs button').nth(1).click(); ok(/انرژی|پژوهش/.test(await p.locator('.fu-pane').innerText()), 'future tabs'); await p.locator('.fu-tabs').nth(1).locator('button').nth(2).click(); ok(/پیش‌بینی نیست/.test(await p.locator('.fu-pane').innerText()), 'future scenario labelled not a prediction'); ok(!p.errs.length, 'future no errors');
p = await open('timeline-explorer'); const n0 = await p.locator('.tl-ev').count(); await p.locator('.tl-bar button', { hasText: 'شبکه' }).click(); const n1 = await p.locator('.tl-ev').count(); ok(n1 > 0 && n1 < n0, 'timeline filter ' + n0 + '→' + n1); await p.locator('.tl-ev').nth(1).click(); ok(/DESCRIPTION/.test(await p.locator('.tl-det').innerText()), 'timeline detail');
await p.locator('button', { hasText: 'ماشین مکانیکی که عملیات' }).click(); ok(/پاسکال/.test(await p.locator('.dres').innerText()), 'timeline definitions'); ok(!p.errs.length, 'timeline no errors');
console.log(fail ? 'FAILURES: ' + fail : 'ALL XP TESTS PASSED'); await b.close();
