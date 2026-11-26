import fs from 'node:fs'; import path from 'node:path';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk('dist').filter((f) => f.endsWith('.html')); let bad = 0, n = 0;
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of h.matchAll(/(?:href|src)="([^"#]+)(#[^"]*)?"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|data:|javascript:)/.test(u)) continue; n++;
    const t = path.normalize(path.join(path.dirname(f), u));
    if (!fs.existsSync(t)) { bad++; console.log('BROKEN', f, '->', u); }
  }
  for (const m of h.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) { bad++; console.log('BAD ANCHOR', f, '#' + m[1]); }
  // images need alt
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) { bad++; console.log('IMG NO ALT', f); }
}
console.log('links checked', n, 'files', files.length, 'problems', bad);
