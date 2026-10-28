import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-degrees-138-140-141-143-2026-10-28', pending='research-handoff/parallel-stages-2026-10-26/pending-cornell-132-143-2026-10-28';
const read=p=>JSON.parse(fs.readFileSync(p)), write=(p,x,n=2)=>fs.writeFileSync(p,JSON.stringify(x,null,n)+'\n');
const rd=read('data/faculty-rosters.json'),pd=read('data/faculty-roster-people.json'),audit=[];
const histories=fs.readFileSync('data/employment-histories.json');
for(const number of [138,140,141,143]){
 const raw=fs.readFileSync(`${pending}/proposal-${number}.json`),p=JSON.parse(raw),m=read(`${pending}/manifest-${number}.json`);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),m.files[0].sha256);
 const r=rd.records.find(x=>x.id===p.id),a=pd.records.find(x=>x.id===p.id);assert(r&&a);
 write(`${dir}/prior-${number}.json`,{roster:r,person:a});write(`${dir}/input-${number}.json`,p);
 const v=r.review,source=p.degreeFacts[0].sourceUrl;
 v.priorDegreeFieldObservations=[...(v.priorDegreeFieldObservations||[]),{phdYear:v.phdYear,phdInstitution:v.phdInstitution,reason:v.reason,checkedAt:v.checkedAt}];
 for(const [key,change] of Object.entries(p.requestedPublicFieldUpdates)){assert.equal(a[key],change.prior);assert.equal(v[key],change.prior);a[key]=v[key]=change.proposed;}
 const note='Root independently read the cited individual evidence on 28 October 2026. '+p.degreeFacts[0].evidenceNote;
 const fact={...p.degreeFacts[0],evidenceNote:note};
 v.phdSourceUrl=source;v.degreeFacts=[...(v.degreeFacts||[]),fact];v.sources.push({url:source,title:'Individual doctoral degree evidence',checkedAt:'2026-10-28',notes:note});v.reason+=' Follow-up: '+note;
 Object.assign(a,{phdInstitutionSourceUrl:source,phdCompletionStatus:'stated-by-profile',reviewReason:v.reason,degreeFacts:[...(a.degreeFacts||[]),fact]});
 a.additionalSourceUrls=[...new Set([...(a.additionalSourceUrls||[]),source])];
 audit.push({proposal:number,id:p.id,updates:p.requestedPublicFieldUpdates,sourceReadByRoot:true,remainingUnknowns:p.remainingUnknowns});
}
pd.metadata.withPhdInstitutionCount=pd.records.filter(x=>x.phdInstitution).length;pd.metadata.withPhdYearCount=pd.records.filter(x=>x.phdYear!=null).length;
write('data/faculty-rosters.json',rd,1);write('data/faculty-roster-people.json',pd);write(dir+'/audit.json',audit);
assert.deepEqual(fs.readFileSync('data/employment-histories.json'),histories);
fs.writeFileSync(dir+'/README.md','# Four Cornell degree corrections — 28 October 2026\n\nIndependently opened evidence supports Eisner: Cornell 1970; Garg: Stanford PhD 2020; Roundy: Stanford 1984; Terenin: Imperial College London 2022. Source roster and derived people updated narrowly. Proposal hashes checked. Existing careers, first-job assessments, conflicts, departure observations and original appointment check dates preserved. Exact conferral dates remain unknown; these corrections do not complete career histories. Garg CV review covered page 1 Education and Academic Employment, not the entire CV. Publication receipt follows deployment.\n');
