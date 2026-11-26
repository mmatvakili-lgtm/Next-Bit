import fs from 'node:fs';
const src = fs.readFileSync('content/issue-01/source-text.md','utf8').replace(/\r/g,'');
const j = JSON.parse(fs.readFileSync('content/issue-01/articles.json','utf8'));
const hay = JSON.stringify(j);
const body = src.split(/\n# پیوست تحریریه/)[0];
let miss = 0, n = 0;
for (let l of body.split('\n')) {
  l = l.trim(); if (!l || l === '---') continue;
  l = l.replace(/^#{1,3}\s+/, '').replace(/^- /, '').replace(/\\\./g, '.').replace(/^\*\*(.+)\*\*$/, '$1').replace(/^\*\*(.+?):\*\*\s*/, '$1').replace(/\*\*/g,'');
  n++;
  const probe = JSON.stringify(l).slice(1, -1);
  if (!hay.includes(probe)) { miss++; console.log('MISSING:', l.slice(0, 90)); }
}
console.log('lines checked', n, 'missing', miss);
