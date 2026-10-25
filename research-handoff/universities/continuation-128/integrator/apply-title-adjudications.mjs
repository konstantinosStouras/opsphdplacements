import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validatePrograms} from '../../../../scripts/validate-programs.mjs';
const base='research-handoff/universities/continuation-128';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data/doctoral-programs.json');
const a=read(`${base}/shard-a/title-adjudication.json`).exclude;
const b=read(`${base}/shard-b/title-adjudication.json`).exclusions;
const c=read(`${base}/shard-c/title-match-false-positive-observations.json`).items;
// A named teaching division needs separate host adjudication, rather than being
// silently treated like a research lab. Keep Chalmers unresolved for now.
const decisions=[...a.filter(x=>!x.programmeId.startsWith('chalmers-')).map(x=>({id:x.programmeId,reason:x.reason})),...b.map(x=>({id:x.programId,reason:x.reason})),...c.map(x=>({id:x.programmeId,reason:x.issue}))];
assert.equal(decisions.length,16);
const audit=[];
for(const d of decisions){
 const p=data.records.find(p=>p.id===d.id);assert(p,`Unknown programme ${d.id}`);
 const review={decision:'excluded',assessedAt:'2026-10-25',reason:d.reason,sourceIds:p.sources.map(s=>s.id)};
 audit.push({programmeId:p.id,priorTitleScopeReview:p.titleScopeReview??null,sourceChecks:p.sources.map(s=>({url:s.url,lastCheckedAt:s.lastCheckedAt})),review});
 p.titleScopeReview=review;
}
validatePrograms(data);
fs.writeFileSync(`${base}/integrator/title-adjudication-applied.json`,JSON.stringify({assessmentDate:'2026-10-25',method:'Methodological review of previously opened official evidence; original facts and check dates unchanged.',decisions:audit},null,2)+'\n');
if(process.argv.includes('--apply'))fs.writeFileSync('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');
console.log({apply:process.argv.includes('--apply'),excluded:decisions.length,rawRecordsPreserved:data.records.length});
