import { createRequire } from 'node:module'; const { chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright');
import fs from 'node:fs'; import path from 'node:path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const pages = walk('dist').filter((f) => f.endsWith('.html'));
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
let fails = 0;
for (const f of pages) {
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(f), { waitUntil: 'load' });
  await p.waitForTimeout(250);
  // scroll through to trigger lazy mounts
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  await p.waitForTimeout(400);
  const bad = await p.evaluate(() => [...document.querySelectorAll('.xp-err:not([hidden])')].filter((e) => e.textContent.trim()).map((e) => e.textContent.slice(0, 60)));
  const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  if (errs.length || bad.length || hs) { fails++; console.log('FAIL', f, errs, bad, hs ? 'HORIZONTAL OVERFLOW' : ''); }
  await p.close();
}
console.log('pages', pages.length, 'failures', fails);
await b.close();
