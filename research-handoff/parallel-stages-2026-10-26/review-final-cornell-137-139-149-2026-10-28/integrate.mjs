import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-final-cornell-137-139-149-2026-10-28', pending='research-handoff/parallel-stages-2026-10-26/pending-cornell-132-143-2026-10-28';
const read=p=>JSON.parse(fs.readFileSync(p)), write=(p,x,n=2)=>fs.writeFileSync(p,JSON.stringify(x,null,n)+'\n');
const rd=read('data/faculty-rosters.json'),pd=read('data/faculty-roster-people.json'),audit=[];
const histories=fs.readFileSync('data/employment-histories.json');
for(const number of [137,139]){
 const raw=fs.readFileSync(`${pending}/proposal-${number}.json`),p=JSON.parse(raw),m=read(`${pending}/manifest-${number}.json`);
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),m.files[0].sha256);
 const r=rd.records.find(x=>x.id===p.id),a=pd.records.find(x=>x.id===p.id);assert(r&&a);
 write(`${dir}/prior-${number}.json`,{roster:r,person:a});write(`${dir}/input-${number}.json`,p);
 const v=r.review,source=p.degreeFacts[0].sourceUrl;
 v.priorDegreeFieldObservations=[...(v.priorDegreeFieldObservations||[]),{phdYear:v.phdYear,phdInstitution:v.phdInstitution,reason:v.reason,checkedAt:v.checkedAt}];
 for(const [key,change] of Object.entries(p.requestedPublicFieldUpdates)){assert.equal(a[key],change.prior);assert.equal(v[key],change.prior);a[key]=v[key]=(number===139&&key==='phdInstitution')?'University of California, Santa Barbara':change.proposed;}
 const note='Root independently read the cited individual evidence on 28 October 2026. '+p.degreeFacts[0].evidenceNote;
 const fact={...p.degreeFacts[0],evidenceNote:note};
 v.phdSourceUrl=source;v.degreeFacts=[...(v.degreeFacts||[]),fact];v.sources.push(...p.sources.slice(1).map(x=>({...x,title:'Individual corroborating degree evidence'})));v.sources.push({url:source,title:'Individual doctoral degree evidence',checkedAt:'2026-10-28',notes:note});v.reason+=' Follow-up: '+note;
 Object.assign(a,{phdInstitutionSourceUrl:source,phdCompletionStatus:'stated-by-profile',reviewReason:v.reason,degreeFacts:[...(a.degreeFacts||[]),fact]});
 a.additionalSourceUrls=[...new Set([...(a.additionalSourceUrls||[]),...p.sources.map(x=>x.url)])];if(number===137){v.degreeFacts.push(p.degreeFacts[1]);a.degreeFacts.push(p.degreeFacts[1]);v.reason+=' Older shared Complutense wording is ambiguous; the 2020 employer release explicitly separates UNED financial economics and Complutense mathematical finance. Both doctorates retained.';a.reviewReason=v.reason;}
 audit.push({proposal:number,id:p.id,updates:p.requestedPublicFieldUpdates,sourceReadByRoot:true,remainingUnknowns:p.remainingUnknowns});
}
pd.metadata.withPhdInstitutionCount=pd.records.filter(x=>x.phdInstitution).length;pd.metadata.withPhdYearCount=pd.records.filter(x=>x.phdYear!=null).length;
write('data/faculty-rosters.json',rd,1);write('data/faculty-roster-people.json',pd);write(dir+'/audit.json',audit);
assert.deepEqual(fs.readFileSync('data/employment-histories.json'),histories);
const hd=JSON.parse(histories),base='research-handoff/parallel-stages-2026-10-26/pending-cornell-149-150-2026-10-28';
const raw=fs.readFileSync(base+'/proposal-149.json'),p=JSON.parse(raw),m=read(base+'/manifest-149.json');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),m.files[0].sha256);
const r=hd.records.find(x=>x.id===p.id);assert(r);write(dir+'/prior-149.json',r);write(dir+'/input-149.json',p);
r.linkedinProfileUrl=p.profileUrl;r.linkedinCheckedAt='2026-10-28';
r.linkedinProfileCaptures=[...(r.linkedinProfileCaptures||[]),...p.linkedinObservation.profiles.map(profile=>({profileUrl:profile.url,checkedAt:'2026-10-28',identityBasis:p.identityBasis,entireLoadedExperienceRead:true,scope:profile.scope,entries:p.jobs.filter(x=>x.sourceUrl===profile.url)}))];
for(const s of p.sources){r.sources.push({...s,outcome:'root-individually-read-entire-Experience'});r.otherEmploymentMentions.push({sourceUrl:s.url,checkedAt:'2026-10-28',evidenceNote:s.url===p.profileUrl?'Individually read all two Experience entries: Cornell Leon C. Welch Professor, August 2012–present; Georgia Tech Chandler Family Chair, August 2013–August 2014. Cornell combines a later chair title with institutional tenure; the CV April 2015 chair appointment and precise existing institutional dates take precedence. No duplicate jobs added.':'Individually read the sole undated Experience entry: Cornell Leon C. Welch Professor of Engineering. Exact name, distinctive chair and Ithaca match the reviewed identity. This sparse second profile adds no employment dates or separate job.'});}
r.coverageNote+=' Two individually matched LinkedIn profiles were fully read through their Experience boundaries (two entries and one entry). Their sparse coverage does not complete the career or resolve earlier doctorate/employment ordering.';
assert.deepEqual(r.jobs,read(dir+'/prior-149.json').jobs);assert.deepEqual(r.firstJobAssessment,read(dir+'/prior-149.json').firstJobAssessment);write('data/employment-histories.json',hd);
audit.push({proposal:149,id:r.id,rootReadBothProfiles:true,accessibleExperienceEntries:3,jobsAndFirstJobUnchanged:true});write(dir+'/audit.json',audit);
fs.writeFileSync(dir+'/README.md','# Remaining Cornell corrections 137, 139, 149 — 28 October 2026\n\nRoot opened the 2013 Trading Show biography and 2020 ADIA release: financial economics PhD 2003 at UNED and mathematical finance PhD 2011 at Complutense retained separately; older ambiguous wording preserved. Wells Cornell Law education and hosted CV page 1 establish PhD 1987; individually read self-asserted ORCID education supplies Santa Barbara campus, without treating study endpoint as award day. Existing canonical campus spelling used. Dai both individually matched LinkedIn profiles read completely through Experience boundaries: two plus one entries, preserved as separate source captures without duplicate public jobs. CV chair April 2015 and exact appointment dates preserved. All careers and first-job ordering remain partial. Publication receipt follows deployment.\n');
