import fs from 'node:fs';
const lines = fs.readFileSync('content/issue-01/source-text.txt','utf8').split('\n').map(s=>s.trim());
lines.forEach((l,i)=>{ if(!l) return; if(l.length<=64 && !/[.!؟:،]$/.test(l) && !l.startsWith('- ')) console.log(i+1, l); });
