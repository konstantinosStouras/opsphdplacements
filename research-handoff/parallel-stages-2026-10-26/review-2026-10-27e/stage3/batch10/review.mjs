// Local file-only adjudication; no public data writes.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const out=path.dirname(fileURLToPath(import.meta.url));
const lane='research-handoff/parallel-stages-2026-10-26/stage-3';
const manifest=JSON.parse(fs.readFileSync(`${lane}/career-continuation-10.ready.json`));
const histories=JSON.parse(fs.readFileSync('data/employment-histories.json')).records;
const rawPeople=JSON.parse(fs.readFileSync('data/faculty-roster-people.json'));
const people=Array.isArray(rawPeople)?rawPeople:rawPeople.records||rawPeople.people||rawPeople.faculty;
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const write=(n,x)=>fs.writeFileSync(path.join(out,n),JSON.stringify(x,null,2)+'\n');
const audit=[];
for(const entry of manifest.files){
 const bytes=fs.readFileSync(`${lane}/${entry.path}`);
 if(sha(bytes)!==entry.sha256)throw Error('Changed proposal '+entry.path);
 const p=JSON.parse(bytes),old=histories.find(r=>r.id===p.id);
 if(!old||!people.some(r=>r.id===p.id))throw Error('Identity missing');
 const r={...structuredClone(old),checkedAt:p.checkedAt,reviewer:'Codex; Stage 3 primary-source observations locally adjudicated by integrator',identityBasis:p.identityBasis,reviewStatus:'partial',careerComplete:false,profileHistoryComplete:false,accessibleCvCaptureComplete:false,coverageNote:p.coverageNote,jobs:[],otherEmploymentMentions:[...(old.otherEmploymentMentions||[]),...(p.otherEmploymentMentions||[])],degreeFacts:[...(old.degreeFacts||[]),...(p.degreeFacts||[])],sources:p.sources,remainingUnknowns:p.remainingUnknowns,accessLimitations:p.accessLimitations,firstJobAssessment:p.firstJobAssessment,previousCoverageNotes:[...(old.previousCoverageNotes||[]),{checkedAt:old.checkedAt,coverageNote:old.coverageNote,remainingUnknowns:old.remainingUnknowns}]};
 const moved=[];
 for(const raw of p.jobs){
  const j=structuredClone(raw);let reason=null;
  if(['Laibe/Acheson Professor','Director, Center for Data Science for Enterprise and Society','Director ORIE','Founding Director, Data Science and Decision Analytics MEng','Associate Dean for Education'].includes(j.titleAsWritten))reason='Concurrent named distinction or internal administration; retained separately from employment changes.';
  if(p.id.endsWith('huseyin-topaloglu')&&j.employerAsWritten==='Cornell University / Cornell Tech')reason='Cornell Tech affiliation within the same university professorship; distinct campus observation retained, not an additional employer.';
  if(p.id.endsWith('huseyin-topaloglu')&&j.employerAsWritten==='Cornell University'){
   r.otherEmploymentMentions.push({...structuredClone(j),evidenceNote:'Original CV current named-chair wording over entire faculty period; chair award date unknown, not claimed from2002.'});
   j.titleAsWritten='Faculty member, Operations Research and Information Engineering';j.evidenceNote='Official profile dates Cornell faculty membership from2002. CV supplies current named professorship, but original rank and named-chair award date are unknown.';
  }
  if(p.id.endsWith('eva-tardos'))j.isCurrent=true;
  if(p.id.endsWith('sasha-stoikov')&&j.employerAsWritten==='Cornell University'&&j.start.year===2006){j.sourceUrl='https://people.orie.cornell.edu/sfs33/personal.htm';j.sourceType='official-profile';j.evidenceNote='Cornell-hosted chronology explicitly gives2006–2007; old2006CV alone has an open end.';}
  for(const boundary of ['start','end']){
   const d=j[boundary];const year=d?.asWritten?.match(/(?:Spring|Summer|Fall|Autumn|Winter)\s*(\d{4})/i)?.[1];
   if(year&&d.year===null){d.year=+year;d.precision='year';}
  }
  if(reason){j.evidenceNote=reason+' '+j.evidenceNote;r.otherEmploymentMentions.push(j);moved.push({title:j.titleAsWritten,reason});}else r.jobs.push(j);
 }
 if(p.id.endsWith('sasha-stoikov')){r.jobs.push({employerAsWritten:'University of Texas at Austin',titleAsWritten:'Assistant Instructor, Department of Mathematics',start:{asWritten:'2004',year:2004,month:null,precision:'year'},end:{asWritten:'2005',year:2005,month:null,precision:'year'},isCurrent:false,sourceUrl:'https://people.orie.cornell.edu/sfs33/SashaStoikovCV2006.pdf',sourceType:'cv',checkedAt:'2026-10-27',evidenceNote:'Freshly read full two-page CV and institutional chronology; this appointment was omitted from the initial proposal jobs and spans the doctorate year.'});}
 if(p.id.endsWith('eva-tardos')){r.otherEmploymentMentions=r.otherEmploymentMentions.filter(x=>!x.evidenceNote.includes('Annualreport'));r.remainingUnknowns.push('1996/1997 annual-report claims lack exact source URLs in this proposal; withheld from public assertions pending provenance.');}
 const keys=r.jobs.map(j=>JSON.stringify([j.employerAsWritten,j.titleAsWritten,j.start,j.end]));if(new Set(keys).size!==keys.length)throw Error('Duplicate role');
 const slug=path.basename(entry.path,'.json');write(`${slug}.prior.json`,old);write(`${slug}.proposal.json`,p);write(`${slug}.reviewed.json`,r);
 audit.push({id:p.id,name:p.name,sourceProposal:entry.path,sourceSha256:entry.sha256,priorSha256:sha(JSON.stringify(old)),reviewedFile:`${slug}.reviewed.json`,priorJobs:old.jobs.length,proposedJobs:p.jobs.length,acceptedJobs:r.jobs.length,movedToSupportingMentions:moved,firstJobStatus:r.firstJobAssessment.status});
}
write('audit.json',{reviewedAt:'2026-10-27',reviewType:'Local review of existing source proposals, no fresh retrieval',publicChanges:false,records:audit,acceptedJobs:audit.reduce((n,r)=>n+r.acceptedJobs,0),limitations:['All careers partial and first jobs unresolved.','Prior observations preserved; new source-specific doctorate facts do not overwrite canonical degree facts.','Old CV present labels stay bounded; no continuous tenure inferred.','All four first-job assessments remain unresolved; source-specific corrections and withheld annual-report claims recorded.']});
console.log(audit.map(r=>({name:r.name,jobs:r.acceptedJobs,moved:r.movedToSupportingMentions.length})));
