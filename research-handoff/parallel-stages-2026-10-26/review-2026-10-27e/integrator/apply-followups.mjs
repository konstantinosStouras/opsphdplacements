import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root='research-handoff/parallel-stages-2026-10-26/review-2026-10-27e';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v,indent=2)=>fs.writeFileSync(p,JSON.stringify(v,null,indent)+'\n');
assert.ok(!fs.existsSync(root+'/integrator/followups-applied.json'));
const h=read('data/employment-histories.json'),changes=[];
for(const name of fs.readdirSync(root+'/stage3/batch11').filter(n=>n.endsWith('.reviewed.json'))){const r=read(root+'/stage3/batch11/'+name),prior=read(root+'/stage3/batch11/'+name.replace('.reviewed.json','.prior.json')),i=h.records.findIndex(x=>x.id===r.id);assert.deepEqual(h.records[i],prior);h.records[i]=r;changes.push(r.id);}
const original='research-handoff/parallel-stages-2026-10-26/stage-4/';
for(const name of ['sabrina-zhai.completion-firstjob-2026-10-27.json','nicholas-johnson.education-boundary-2026-10-27.json'])fs.copyFileSync(original+name,root+'/integrator/'+name);
const p=read(root+'/integrator/nicholas-johnson.education-boundary-2026-10-27.json'),r=h.records.find(r=>r.id===p.personId);
(r.educationObservations??=[]).push({sourceUrl:p.source.url,checkedAt:p.checkedAt,studyRangeAsWritten:p.source.studyRangeAsWritten,evidenceNote:p.source.evidenceNote+' Study end is not a formal conferral date.'});
r.followupReviews.push({sourceUrl:p.source.url,checkedAt:p.checkedAt,outcome:'focused-education-and-full-experience-read',evidenceNote:p.remainingFirstJobIssue});
r.remainingUnknowns=[...new Set([...(r.remainingUnknowns||[]),p.remainingFirstJobIssue])];
write('data/employment-histories.json',h);write(root+'/integrator/followups-applied.json',{batch11HistoryIds:changes,nicholasBoundaryAdded:true});
// Snapshot later graduate-field histories; they cannot bypass the identity gate.
const lane='research-handoff/parallel-stages-2026-10-26/stage-3/',manifest=read(lane+'career-continuation-13.ready.json'),dest=root+'/stage3-batch13';fs.mkdirSync(dest,{recursive:true});
const facultyIds=new Set([...read('data/faculty.json').records,...read('data/faculty-roster-people.json').records].map(r=>r.id));const audit=[];
for(const f of manifest.files){const bytes=fs.readFileSync(lane+f.path);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);const proposal=JSON.parse(bytes);fs.writeFileSync(dest+'/'+f.path.split('/').at(-1),bytes);audit.push({id:proposal.id,name:proposal.name,publicIdentity:facultyIds.has(proposal.id),disposition:proposal.id==='roster:cornell-university:jacob-mays'?'already-integrated-equivalent-profile-observations; no duplicate jobs added':facultyIds.has(proposal.id)?'requires-individual-review':'held-person-scope; candidate history preserved only'});}
write(dest+'/manifest.json',manifest);write(dest+'/dispositions.json',audit);
