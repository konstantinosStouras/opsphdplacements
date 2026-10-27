import fs from 'node:fs';import crypto from 'node:crypto';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n'),hash=d=>crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex');
const d=read('data/employment-histories.json'),changes=read(`${b}/public-history-changes.json`);
for(const r of read(`${b}/${process.argv[2]||'shard-f'}/replacements.json`)){
 const i=d.records.findIndex(h=>h.id===r.id),old=d.records[i];if(hash(old)!==r.priorSha256)throw Error('Changed prior '+r.id);
 d.records[i]=r.replacement;delete r.replacement.addedAt;delete r.replacement.updatedAt;
 changes.push({id:r.id,name:r.replacement.name,priorSha256:r.priorSha256,reviewedSha256:hash(r.replacement),priorRoles:old.jobs.length,roles:r.replacement.jobs.length});
}
write('data/employment-histories.json',d);write(`${b}/public-history-changes.json`,changes);
console.log(JSON.stringify({histories:changes.length,priorRoles:changes.reduce((s,r)=>s+r.priorRoles,0),roles:changes.reduce((s,r)=>s+r.roles,0)}));
