import { createRequire } from 'node:module'; const { chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright');
import path from 'node:path';
const SH = '/tmp/claude-0/-home-claude/d13b6a5c-03f3-5c0b-a27b-627c85326044/scratchpad/shots/';
const b = await chromium.launch();
const jobs = [['home', 'index.html', 1280, 900, false], ['issue', 'issues/issue-01/index.html', 1280, 900, false], ['bitlab', 'experiences/bit-lab/index.html', 1280, 1100, true], ['article', 'issues/issue-01/zero-and-one/index.html', 1280, 900, false], ['homem', 'index.html', 390, 800, false], ['timeline', 'experiences/timeline-explorer/index.html', 1280, 1100, true], ['ml', 'experiences/ml-playground/index.html', 1280, 1200, true]];
for (const [n, f, w, h, wait] of jobs) { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); await p.goto('file://' + path.resolve('dist/' + f)); await p.waitForTimeout(wait ? 900 : 300); await p.screenshot({ path: SH + n + '.png', fullPage: n === 'home' }); await p.close(); }
await b.close();
