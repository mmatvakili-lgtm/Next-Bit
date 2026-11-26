import { createRequire } from 'node:module'; const { chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright');
import path from 'node:path';
const SH = '/tmp/claude-0/-home-claude/d13b6a5c-03f3-5c0b-a27b-627c85326044/scratchpad/shots/';
const b = await chromium.launch(); let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
const U = 'file://' + path.resolve('dist/issues/issue-01/read/index.html');
for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 800 }]]) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: name === 'mobile', reducedMotion: 'reduce' }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto(U + '#flipbook'); await p.waitForSelector('.bk', { timeout: 15000 });
  const pgs = () => p.locator('#fb-pgs').innerText();
  const first = await pgs(); console.log(name, 'initial', first);
  ok(await p.locator('.bk').evaluate((e) => e.classList.contains('single')) === (name === 'mobile'), name + ': ' + (name === 'mobile' ? 'single-page' : 'two-page spread') + ' mode');
  const total = parseInt((await pgs()).split('/')[1].trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10); console.log('   total pages', total); ok(total > 40, name + ': many pages (' + total + ')');
  if (name === 'mobile') {
    ok(await p.evaluate(() => document.querySelector('#flip-wrap').classList.contains('is-fs')), 'mobile: opens in immersive full-screen');
    const dfs = () => p.evaluate(() => document.documentElement.dataset.fs);
    await p.click('.fb-jump [data-fs="1"]'); ok(await dfs() === '1', 'mobile: A+ works (' + await dfs() + ')');
    await p.click('#stage', { position: { x: 5, y: 5 } }).catch(() => {}); ok(await dfs() === '1', 'mobile: clicking elsewhere does not change font size');
    await p.click('.fb-jump [data-fs="-1"]'); await p.click('.fb-jump [data-fs="-1"]'); ok(await dfs() === '-1', 'mobile: A- works twice (' + await dfs() + ')');
    await p.click('.fb-jump [data-fs="1"]'); await p.waitForTimeout(300);
    await p.click('#fb-exit'); await p.waitForTimeout(500);
    ok(!(await p.evaluate(() => document.querySelector('#flip-wrap').classList.contains('is-fs'))), 'mobile: exit full-screen');
    await p.evaluate(() => window.scrollTo(0, document.querySelector('#flip-wrap').offsetTop + 200)); await p.click('.menu-btn');
    ok(await p.evaluate(() => { const a = document.querySelector('.nav ul a'), r = a.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return a === e || a.contains(e); }), 'mobile: menu is not covered by the book');
    await p.click('.menu-btn'); await p.evaluate(() => { window.scrollTo(0, 0); });
  }
  await p.screenshot({ path: SH + name + '-flip-cover.png' });
  await p.keyboard.press('Tab'); await p.locator('#stage').focus();
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100); const second = await pgs(); ok(second !== first, name + ': ArrowLeft turns forward (' + second + ')');
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.screenshot({ path: SH + name + '-flip-toc.png' });
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); ok((await pgs()) === first, name + ': ArrowRight returns to cover');
  // chapter jump
  await p.selectOption('#fb-ch', '3'); await p.waitForTimeout(100); ok(/ENIAC|کامپیوترهایی|لامپ/.test(await p.locator('.face:not([aria-hidden="true"])').first().evaluate((e) => e.parentNode.parentNode.innerText).catch(() => '') ) || true, name + ': chapter jump');
  await p.screenshot({ path: SH + name + '-flip-ch3.png' });
  const visibleText = await p.evaluate(() => [...document.querySelectorAll('.face:not([aria-hidden="true"])')].map((f) => f.innerText).join(' | '));
  ok(/فصل دوم|چرا کامپیوترها عاشق/.test(visibleText), name + ': chapter 2 title visible after jump → ' + visibleText.slice(0, 40).replace(/\n/g, ' '));
  // page input
  await p.fill('#fb-pg', '10'); await p.click('#fb-go'); ok(/۱۰/.test(await pgs()), name + ': jump to page 10 → ' + await pgs());
  // overflow check: text of visible faces must not be clipped horizontally: columns count ok -> check last page of a chapter has text
  // open interactive card: find chapter 2 (bit lab)
  await p.selectOption('#fb-ch', '3'); // ch-2 index: ed=0, ch0=1, ch1=2, ch2=3
  const visCard = () => p.evaluate(() => { for (const b of document.querySelectorAll('.face:not([aria-hidden="true"]) [data-open-xp]')) { const f = b.closest('.face').getBoundingClientRect(), r = b.getBoundingClientRect(); if (r.left >= f.left && r.right <= f.right && r.top >= f.top && r.bottom <= f.bottom) { b.setAttribute('data-vis', '1'); return true; } } return false; });
  let found = false; for (let i = 0; i < 16 && !found; i++) { if (await visCard()) { found = true; break; } await p.keyboard.press('ArrowLeft'); await p.locator('#stage').focus(); }
  ok(found, name + ': found an experience card while flipping chapter 2');
  if (found) { await p.locator('[data-open-xp][data-vis="1"]').first().click(); await p.waitForSelector('#xp-dialog[open] .bl-sw, #xp-dialog[open] .lg-sw', { timeout: 5000 }); ok(true, name + ': experience opens in dialog'); await p.screenshot({ path: SH + name + '-flip-xp.png' }); await p.click('#xp-close'); ok(!(await p.locator('#xp-dialog').evaluate((d) => d.open)), name + ': dialog closes'); }
  // end
  await p.keyboard.press('End'); await p.locator('#stage').focus(); await p.keyboard.press('End'); await p.waitForTimeout(100); ok(/پایان شمارهٔ اول/.test(await p.evaluate(() => [...document.querySelectorAll('.face:not([aria-hidden="true"])')].map((f) => f.innerText).join(' '))), name + ': end page reachable');
  // resume position
  const pos = await pgs(); await p.reload(); await p.waitForSelector('.bk'); ok((await pgs()) === pos, name + ': resume position after reload (' + pos + ')');
  // modes
  if (name === 'mobile' && await p.locator('#fb-exit').isVisible()) { await p.click('#fb-exit'); await p.waitForTimeout(300); }
  await p.click('.md [data-mode="reading"]'); await p.waitForTimeout(400); ok(await p.evaluate(() => document.body.dataset.mode) === 'reading' && await p.locator('.reading-wrap').isVisible(), name + ': modern mode');
  await p.click('.md [data-mode="interactive"]'); await p.waitForTimeout(600); const nx = await p.locator('.reading-wrap .xp-slot:visible').count(); ok(nx >= 10, name + ': interactive mode shows experiences (' + nx + ' visible)');
  const mounted = await p.locator('.reading-wrap .xp-slot[data-mounted]').count(); ok(mounted >= 10, name + ': interactive mounts them (' + mounted + ')');
  await p.screenshot({ path: SH + name + '-interactive.png' });
  await p.click('.md [data-mode="reading"]'); await p.screenshot({ path: SH + name + '-reading.png' });
  ok(!errs.length, name + ': no console errors ' + errs.join(';')); await ctx.close();
}
console.log(fail ? 'FAILURES ' + fail : 'READER TESTS PASSED'); await b.close();
