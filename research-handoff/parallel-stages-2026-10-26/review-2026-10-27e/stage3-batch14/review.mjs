// Local file-only adjudication; no public data writes.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const out=path.dirname(fileURLToPath(import.meta.url));
const lane='research-handoff/parallel-stages-2026-10-26/stage-3';
const manifest=JSON.parse(fs.readFileSync(`${lane}/career-continuation-14.ready.json`));
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
 const r={...structuredClone(old),checkedAt:p.checkedAt,reviewer:'Codex; Stage 3 primary-source observations locally adjudicated by integrator',identityBasis:p.identityBasis,reviewStatus:'partial',careerComplete:false,profileHistoryComplete:false,accessibleCvCaptureComplete:false,coverageNote:p.coverageNote,jobs:structuredClone(old.jobs||[]),otherEmploymentMentions:[...(old.otherEmploymentMentions||[]),...(p.otherEmploymentMentions||[])],degreeFacts:[...(old.degreeFacts||[]),...(p.degreeFacts||[])],sources:p.sources,remainingUnknowns:p.remainingUnknowns,accessLimitations:p.accessLimitations,firstJobAssessment:p.firstJobAssessment,previousCoverageNotes:[...(old.previousCoverageNotes||[]),{checkedAt:old.checkedAt,coverageNote:old.coverageNote,remainingUnknowns:old.remainingUnknowns}]};
 const moved=[];
 for(const raw of p.jobs){
  const j=structuredClone(raw);let reason=null;
  if(/Emerit/i.test(j.titleAsWritten))reason='Emeritus status without separately established employment; retained as supporting observation.';
  if(/^(?:Co-Director|Director|Acting .*Director|Associate Director|Associate Dean|Chair )/.test(j.titleAsWritten))reason='Concurrent internal leadership duty, retained separately from employment.';
  if(j.titleAsWritten==='Lee Teng-Hui Professor')reason='Named chair designation within existing professorship.';
  if(j.titleAsWritten==='Mission President')reason='Service appointment; employment status not established.';
  if(/^(?:Extended visit|Month-long February visit|Visiting role|Joint visiting role|Lecturer shortcourse)/.test(j.titleAsWritten))reason='Visit or short-course activity without explicit employment appointment title.';
  if(j.end?.asWritten?.includes('present'))j.isCurrent=null;
  for(const boundary of ['start','end']){
   const d=j[boundary];const year=d?.asWritten?.match(/(?:Spring|Summer|Fall|Autumn|Winter)\s*(\d{4})/i)?.[1];
   if(year&&d.year===null){d.year=+year;d.precision='year';}
  }
  if(reason){j.evidenceNote=reason+' '+j.evidenceNote;r.otherEmploymentMentions.push(j);moved.push({title:j.titleAsWritten,reason});}else r.jobs.push(j);
 }
 const keys=r.jobs.map(j=>JSON.stringify([j.employerAsWritten,j.titleAsWritten,j.start,j.end]));if(new Set(keys).size!==keys.length)throw Error('Duplicate role');
 const slug=path.basename(entry.path,'.json');write(`${slug}.prior.json`,old);write(`${slug}.proposal.json`,p);write(`${slug}.reviewed.json`,r);
 audit.push({id:p.id,name:p.name,sourceProposal:entry.path,sourceSha256:entry.sha256,priorSha256:sha(JSON.stringify(old)),reviewedFile:`${slug}.reviewed.json`,priorJobs:old.jobs.length,proposedJobs:p.jobs.length,acceptedJobs:r.jobs.length,movedToSupportingMentions:moved,firstJobStatus:r.firstJobAssessment.status});
}
write('audit.json',{reviewedAt:'2026-10-27',reviewType:'Local review of existing source proposals, no fresh retrieval',publicChanges:false,records:audit,acceptedJobs:audit.reduce((n,r)=>n+r.acceptedJobs,0),limitations:['All careers partial and first jobs unresolved.','Prior observations preserved; new source-specific doctorate facts do not overwrite canonical degree facts.','Old CV present labels stay bounded; no continuous tenure inferred.','Resnick first-new-post-PhD-job decision supplied separately. Jackson 1978/1980 doctorate conflict retained. Invalid June31 source date remains unnormalized.']});
console.log(audit.map(r=>({name:r.name,jobs:r.acceptedJobs,moved:r.movedToSupportingMentions.length})));
