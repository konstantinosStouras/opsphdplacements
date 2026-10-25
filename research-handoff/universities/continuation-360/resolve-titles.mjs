import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
import {writeComplete} from '../../../scripts/write-complete.mjs';
const dir='research-handoff/universities/continuation-360',read=p=>JSON.parse(fs.readFileSync(p));
const data=read('data/doctoral-programs.json'),audit=[];
for(const x of read(dir+'/root-title-observations.json').observations){
 const p=data.records.find(r=>r.id===x.programmeId);assert.equal(p.titleScopeReview?.decision,'pending');
 const addedSourceIds=[],sourceIds=[...(x.existingSourceIds||[])]; for(const id of sourceIds)assert(p.sources.some(s=>s.id===id));
 for(const s of x.sources){const id='source-'+crypto.createHash('sha256').update(s.url+'|2026-10-25|continuation360-title').digest('hex').slice(0,14);sourceIds.push(id);assert(!p.sources.some(s=>s.id===id));p.sources.push({id,url:s.url,title:s.note,notes:s.note,lastCheckedAt:'2026-10-25',sourceType:'official-primary',access:'opened-and-read'});addedSourceIds.push(id);}
 const priorTitleScopeReview=structuredClone(p.titleScopeReview),priorHistory=structuredClone(p.priorTitleScopeReviews||[]);
 p.priorTitleScopeReviews=[...priorHistory,priorTitleScopeReview];delete p.titleScopeReview;
 p.titleScopeResolution={decision:'retain',assessedAt:'2026-10-25',reason:x.reason,sourceIds};
 const limitation='25 October title review: '+x.reason;p.limitations.push(limitation);
 audit.push({programmeId:p.id,priorTitleScopeReview,priorHistory,addedSourceIds,resolution:p.titleScopeResolution,addedLimitation:limitation});
}
validatePrograms(data);
if(process.argv.includes('--apply')){writeComplete('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');fs.writeFileSync(dir+'/title-resolution-audit.json',JSON.stringify(audit,null,2)+'\n');}
console.log({resolved:audit.map(x=>x.programmeId),apply:process.argv.includes('--apply')});
