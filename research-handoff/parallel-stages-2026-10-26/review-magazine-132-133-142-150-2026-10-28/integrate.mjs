import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-magazine-132-133-142-150-2026-10-28', pending='research-handoff/parallel-stages-2026-10-26/pending-cornell-132-143-2026-10-28';
const read=p=>JSON.parse(fs.readFileSync(p)), write=(p,x,n=2)=>fs.writeFileSync(p,JSON.stringify(x,null,n)+'\n');
const rd=read('data/faculty-rosters.json'),pd=read('data/faculty-roster-people.json'),audit=[];
const histories=fs.readFileSync('data/employment-histories.json');
for(const number of [142]){
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
const hd=JSON.parse(histories),url=read(pending+'/proposal-142.json').sources[0].url;
for(const number of [132,133,150]){
 const base=number===150?'research-handoff/parallel-stages-2026-10-26/pending-cornell-149-150-2026-10-28':pending;
 const raw=fs.readFileSync(`${base}/proposal-${number}.json`),p=JSON.parse(raw),m=read(`${base}/manifest-${number}.json`);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),m.files[0].sha256);
 const r=hd.records.find(x=>x.id===p.id);assert(r);write(`${dir}/prior-${number}.json`,r);write(`${dir}/input-${number}.json`,p);
 const note=number===132?'Cornell’s 2020 magazine identifies Averbukh as Professor of Practice and CFEM director. This establishes the rank by 2020, not its start date; the combined LinkedIn July 2007 appointment does not establish the practice-rank start.':number===133?'Cornell’s 2020 magazine identifies Stoikov as senior research associate and head of research. The separate title appointment dates remain unknown. Galleon and Morgan Stanley consulting and Cantor vice-presidency are corroborated without new dates.':'Cornell’s director retrospectively describes Bland’s retirement in the 2020 magazine. Retirement is established by the 2020 issue; the previously announced July 1, 2019 date remains a planned date, not a verified effective date. The 1987/1988 promotion conflict remains unresolved.';
 r.otherEmploymentMentions.push({sourceUrl:url,checkedAt:'2026-10-28',sourcePublication:'Cornell ORIE Magazine, Winter 2020',evidenceNote:note});
 r.sources.push({url,checkedAt:'2026-10-28',outcome:'root-read-primary-magazine-extract',note:number===150?'Complete director message read; not the separate Bland feature.':'Complete CFEM article read; not the entire newsletter.'});
 r.coverageNote+=' Follow-up: '+note;
 if(number===150){r.otherEmploymentMentions[0].evidenceNote=r.otherEmploymentMentions[0].evidenceNote.replace('Retirement timing remains unknown.','Exact retirement date remains unknown; a later reviewed 2020 magazine establishes retirement by that issue.');}
 const before=read(`${dir}/prior-${number}.json`);assert.deepEqual(r.jobs,before.jobs);assert.deepEqual(r.firstJobAssessment,before.firstJobAssessment);
 audit.push({proposal:number,id:r.id,sourceReadByRoot:true,jobsAndFirstJobUnchanged:true,note});
}
write('data/employment-histories.json',hd);write(dir+'/audit.json',audit);
fs.writeFileSync(dir+'/README.md','# Cornell magazine corrections — 28 October 2026\n\nRoot independently read the author-hosted Cornell 2020 magazine extract, including the complete CFEM article and director message. Averbukh doctorate year 1997 added to public degree fields. Dated rank observations added for Averbukh and Stoikov; Bland retirement established only by the 2020 issue. Existing jobs, first-job conclusions and source conflicts preserved. No exact promotion or retirement dates inferred. Full newsletter and separate Bland feature not reviewed. Publication receipt follows deployment.\n');
