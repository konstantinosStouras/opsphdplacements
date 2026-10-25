import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
const file='data/doctoral-programs.json',data=JSON.parse(fs.readFileSync(file,'utf8'));
const proposal='research-handoff/universities/continuation-133/shard-c/universite-libre-de-bruxelles.fresh-title-review.json';
const x=JSON.parse(fs.readFileSync(proposal,'utf8')),p=data.records.find(p=>p.id===x.programmeId);
assert.equal(p.titleScopeReview?.decision,'pending');
const audit={assessedAt:x.checkedAt,programmeId:p.id,proposal,priorTitleScopeReview:p.titleScopeReview,priorSpecialization:p.specialization,decision:'retain',reason:x.evidence};
const sourceIds=[];
for(const s of x.sources){const id='source-'+crypto.createHash('sha256').update(s.url+'|'+s.checkedAt).digest('hex').slice(0,14);sourceIds.push(id);if(!p.sources.some(a=>a.id===id))p.sources.push({id,url:s.url,title:s.note,notes:s.note,lastCheckedAt:s.checkedAt,sourceType:'official-primary',access:'opened-and-read'});}
const prior=p.facts.find(f=>f.field==='specialization');
p.priorFactChecks=[...(p.priorFactChecks||[]),prior];
p.facts=p.facts.filter(f=>f.field!=='specialization');
p.facts.push({field:'specialization',value:x.proposedSpecialization,lastCheckedAt:x.checkedAt,sourceIds,evidenceNote:x.evidence});
p.specialization=x.proposedSpecialization;
p.priorTitleScopeReviews=[...(p.priorTitleScopeReviews||[]),p.titleScopeReview];
delete p.titleScopeReview;
p.lastCheckedAt=x.checkedAt;p.checkedAt=x.checkedAt;
p.limitations=[...new Set([...p.limitations,'25 October clarification: named Management Science doctoral training track within the Economics and Management PhD. The 60-credit training is distinct from the doctorate; it is not counted as another degree. Prior Operations project observations do not establish a formal Operations specialization.'])];
validatePrograms(data);
if(process.argv.includes('--apply')){
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
 fs.writeFileSync('research-handoff/universities/continuation-135/ulb-title-resolution.json',JSON.stringify(audit,null,2)+'\n');
}
console.log({programme:p.id,specialization:p.specialization,apply:process.argv.includes('--apply')});
