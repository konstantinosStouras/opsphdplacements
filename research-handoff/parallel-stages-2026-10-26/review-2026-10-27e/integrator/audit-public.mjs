import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const root='research-handoff/parallel-stages-2026-10-26/review-2026-10-27e';
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).filter(k=>!['addedAt','updatedAt'].includes(k)).sort().map(k=>[k,canon(x[k])])):x;
const out={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),records:{}};
for(const file of ['faculty','faculty-roster-people','faculty-rosters','placements','research-status','graduate-lists','employment-histories','institutions','employers','entities','universities','university-reviews','doctoral-programs']){
const old=JSON.parse(execFileSync('git',['show','HEAD:data/'+file+'.json'],{maxBuffer:100000000})).records,now=JSON.parse(fs.readFileSync('data/'+file+'.json','utf8')).records,key=file==='research-status'?'facultyId':'id',map=new Map(old.map(r=>[r[key],r]));
const added=now.filter(r=>!map.has(r[key])),changed=now.filter(r=>map.has(r[key])&&JSON.stringify(canon(r))!==JSON.stringify(canon(map.get(r[key])))),removed=old.filter(r=>!now.some(n=>n[key]===r[key]));
if(file==='placements')assert.deepEqual(removed.map(r=>r.id),['first-roster:cornell-university:nathan-kallus']);else assert.equal(removed.length,0,file+' removal');if(['faculty','universities','university-reviews','doctoral-programs'].includes(file))assert.equal(added.length+changed.length,0,file+' must stay unchanged');
out.records[file]={before:old.length,after:now.length,added:added.map(r=>({id:r[key],name:r.name})),changed:changed.map(r=>({id:r[key],name:r.name})),removed:removed.map(r=>({id:r[key],name:r.name}))};}
fs.writeFileSync(root+'/public-preservation-audit.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(Object.fromEntries(Object.entries(out.records).map(([k,v])=>[k,{added:v.added.length,changed:v.changed.length,total:v.after}]))));
