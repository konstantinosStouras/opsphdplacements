import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const base='research-handoff/universities/continuation-128';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const b=read(`${base}/shard-b/scope-composites/ready-manifest.json`).entries.map(e=>({file:e.path,sha256:e.sha256,operation:e.kind}));
const c=read(`${base}/shard-c/prepared/prepared-manifest.json`).files;
const all=[...b,...c];
for(const e of all)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(e.file)).digest('hex'),e.sha256,e.file);
const units=all.filter(e=>e.operation.startsWith('unit')).map(e=>e.file);
const doctoral=all.filter(e=>e.operation.startsWith('doctoral')).map(e=>e.file);
function run(args){const p=spawnSync(process.execPath,args,{stdio:'inherit'});assert.equal(p.status,0,args[0]);}
const apply=process.argv.includes('--apply');
run(['scripts/merge-university-reviews.mjs',...units,...(apply?[]:['--dry-run'])]);
// Dependent doctoral previews require the proposed unit observations to exist.
if(apply){
 run(['scripts/merge-doctoral-proposals.mjs',...doctoral,'--scope-only']);
 run(['scripts/merge-doctoral-proposals.mjs',...doctoral,'--scope-only','--apply']);
 fs.writeFileSync(`${base}/integrator/scope-composites-integrated.json`,JSON.stringify({integratedAt:'2026-10-25',programmeFactsUnchanged:true,entries:all},null,2)+'\n');
}
