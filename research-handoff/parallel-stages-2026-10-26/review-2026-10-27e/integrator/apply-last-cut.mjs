import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='research-handoff/parallel-stages-2026-10-26/review-2026-10-27e',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.ok(!fs.existsSync(root+'/integrator/last-cut-applied.json'));
const h=read('data/employment-histories.json'),ids=[];
for(const a of read(root+'/stage2-extra/audit.json').records){const i=h.records.findIndex(r=>r.id===a.id);assert.equal(hash(h.records[i]),a.priorSha256);h.records[i]=read(root+'/stage2-extra/'+a.id+'.reviewed.json');ids.push(a.id);}
const a=read(root+'/kallus-final/audit.json'),i=h.records.findIndex(r=>r.id===a.id);assert.equal(hash(h.records[i]),a.priorSha256);h.records[i]=read(root+'/kallus-final/nathan-kallus.reviewed.json');ids.push(a.id);write('data/employment-histories.json',h);
const prior=JSON.parse(execFileSync('git',['show','HEAD:data/placements.json'],{encoding:'utf8',maxBuffer:50000000})),p=read('data/placements.json');
for(const id of ['first-omlist-0870c39d7d2a38fb','first-omlist-cd6f4cd9d6b37f28']){const i=p.records.findIndex(r=>r.id===id);p.records[i]=prior.records.find(r=>r.id===id);}write('data/placements.json',p);
write(root+'/integrator/last-cut-applied.json',{historyIds:ids,preservedUnrelatedPlacementIds:['first-omlist-0870c39d7d2a38fb','first-omlist-cd6f4cd9d6b37f28'],stage2Cut:33,stage3Cut:16});
