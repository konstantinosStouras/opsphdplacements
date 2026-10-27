import fs from 'node:fs';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g';
const d=JSON.parse(fs.readFileSync('data/employment-histories.json','utf8')),patches=JSON.parse(fs.readFileSync(`${b}/readability-patches.json`,'utf8'));
for(const p of patches){let obj=d.records.find(r=>r.id===p.id);for(const k of p.path.slice(0,-1))obj=obj[k];const key=p.path.at(-1);if(obj[key]!==p.before)throw Error('Changed prose '+p.id+' '+p.path);obj[key]=p.after;}
fs.writeFileSync('data/employment-histories.json',JSON.stringify(d,null,2)+'\n');console.log(`Applied ${patches.length} guarded readability corrections.`);
