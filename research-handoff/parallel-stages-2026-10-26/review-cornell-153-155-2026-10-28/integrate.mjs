import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-cornell-153-155-2026-10-28',lane='research-handoff/parallel-stages-2026-10-26/stage-3';
const read=p=>JSON.parse(fs.readFileSync(p)),w=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const histories=read('data/employment-histories.json'),ledger=read('data/research-status.json'),replacements=[],audit=[];
for(const n of [153,154,155]){
 const m=read(`${lane}/career-continuation-${n}.ready.json`),raw=fs.readFileSync(lane+'/'+m.files[0].path);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),m.files[0].sha256);
 const p=JSON.parse(raw),r=histories.records.find(x=>x.id===p.id);assert(r);w(`${dir}/input-${n}.json`,p);w(`${dir}/manifest-${n}.json`,m);w(`${dir}/prior-${n}.json`,r);
 const old=structuredClone(r);r.previousSourceObservations??=[];r.previousSourceObservations.push({checkedAt:'2026-10-28',reason:'New primary chronology evidence; superseded uncertainty retained for audit.',remainingUnknowns:old.remainingUnknowns,firstJobAssessment:old.firstJobAssessment});
 let note;
 if(n===153){
  note='Vineet Goyal’s adviser CV explicitly records Omar El Housni’s PhD in June 2020 and Cornell Tech as his first position. His own CV identifies the 2020–2021 appointment as Visiting Assistant Professor; the previously read LinkedIn history dates its start to July 2020. This supports Cornell Tech as the first documented post-PhD employer, with the visiting title preserved. Formal conferral day is unknown; repository publication on 31 July 2020 is not a degree date.';
  r.degreeFacts.push({...p.degreeFacts[0],asWritten:'PhD: June 2020'});
  r.firstJobAssessment={status:'verified',candidateEmployer:'Cornell Tech',candidatePosition:'Visiting Assistant Professor',placementYear:2020,reason:note,evidenceUrls:p.firstJobAssessment.evidenceUrls};
  r.remainingUnknowns[0]='The adviser reports PhD completion in June 2020; the formal registrar conferral day remains unknown. The dissertation download was unavailable and remains deferred. Repository publication on 31 July 2020 is not the degree date.';
  const l=structuredClone(ledger.records.find(x=>x.facultyId===p.id));w(dir+'/prior-ledger-153.json',l);
  Object.assign(l,{status:'verified',checkedAt:'2026-10-28',reason:note,employer:'Cornell University',position:'Visiting Assistant Professor',placementYear:2020,category:'other-academic',phdYearVerified:2020,phdInstitutionVerified:'Columbia University',evidenceUrl:p.sources[0].url,evidenceNote:note});
  l.sources.push({url:p.sources[0].url,title:'Vineet Goyal CV: doctoral supervision, Omar El Housni',checkedAt:'2026-10-28',note:'Individual supervision row and heading read by root; adviser-reported June 2020 completion.'});replacements.push(l);
 } else if(n===154){
  note='Imperial College London’s thesis repository explicitly records the PhD award in March 2022, separately from thesis issue in September 2021. Supervisor Marc Deisenroth reported a successful viva on 15 November 2021. These are distinct milestones. Cambridge postdoctoral employment began in 2021; the undated 2022 teaching appointment cannot be ordered against the award, so the first new post-PhD job remains unresolved.';
  r.degreeFacts.push({...p.degreeFacts[0],asWritten:'Date Awarded: 2022-03'});r.degreeEvents=[...(r.degreeEvents||[]),...p.degreeEvents];
  r.firstJobAssessment={status:'unresolved',reason:note};r.remainingUnknowns[0]='Formal PhD award is March 2022; award day and completion of any viva corrections are unknown. Cambridge postdoc endpoints and 2022 teaching months remain unknown; first new post-PhD employment is unresolved.';
  const l=structuredClone(ledger.records.find(x=>x.facultyId===p.id));w(dir+'/prior-ledger-154.json',l);Object.assign(l,{checkedAt:'2026-10-28',reason:note,phdYearVerified:2022,phdInstitutionVerified:'Imperial College London'});l.sources.push(...p.sources.map(s=>({...s,title:'Alexander Terenin: official award and supervisor viva evidence'})));replacements.push(l);
 } else {
  note='Cornell’s Spring 1980 Civil and Environmental Engineering newsletter reports Christine Shoemaker’s promotion to Associate Professor in June 1979. It does not give her prior assistant appointment dates or the end of the associate rank. The paragraph’s separate tenure statement concerns another faculty member and is not attributed to Shoemaker.';
  r.careerEvents=[...(r.careerEvents||[]),{...p.careerEvents[0],evidenceNote:note}];r.remainingUnknowns[0]='Dates for the year-long Cornell postdoc remain unknown; 1971–1972 is not inferred. Promotion to Associate Professor is documented in June 1979; assistant appointment dates and the exact associate end remain unknown.';
 }
 r.otherEmploymentMentions.push({sourceUrl:p.sources[0].url,checkedAt:'2026-10-28',evidenceNote:note});
 r.sources.push(...p.sources.filter(s=>s.checkedAt==='2026-10-28').map(s=>({...s,outcome:'root-read-individual-primary-evidence',note})));
 assert.deepEqual(r.jobs,old.jobs);assert.equal(r.careerComplete,false);audit.push({proposal:n,id:p.id,sourceReadByRoot:true,existingJobsPreserved:true,firstJobResolved:n===153});
}
w('data/employment-histories.json',histories);w(dir+'/ledger-corrections.json',replacements);w(dir+'/audit.json',audit);
fs.writeFileSync(dir+'/README.md','# Cornell corrections 153–155 — 28 October 2026\n\nRoot opened each primary source and froze the hashed proposals. Omar El Housni: adviser-reported June 2020 PhD precedes July 2020 Cornell Tech visiting appointment; first documented post-PhD employer resolved with visiting title. Alexander Terenin: March 2022 award distinguished from November 2021 viva; first job remains unresolved. Christine Shoemaker: June 1979 associate promotion added as an event without duplicate employment or inferred tenure. All existing jobs preserved; none of these careers is complete. Unavailable individual sources remain deferred.\n');
