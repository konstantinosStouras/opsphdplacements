// Local proposal review only. Does not write public datasets.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const out=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
const lane='research-handoff/parallel-stages-2026-10-26/stage-3';
const publicFile='data/employment-histories.json';
const histories=JSON.parse(fs.readFileSync(publicFile)).records;
const people=JSON.parse(fs.readFileSync('data/faculty-roster-people.json'));
const faculty=Array.isArray(people)?people:people.records||people.people||people.faculty;
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const write=(name,x)=>fs.writeFileSync(path.join(out,name),JSON.stringify(x,null,2)+'\n');
const audit=[];
for(const number of [6,7]) {
 const manifest=JSON.parse(fs.readFileSync(`${lane}/career-continuation-${number}.ready.json`));
 for(const entry of manifest.files) {
  const bytes=fs.readFileSync(`${lane}/${entry.path}`);
  if(hash(bytes)!==entry.sha256) throw Error('Changed proposal '+entry.path);
  const proposal=JSON.parse(bytes), old=histories.find(r=>r.id===proposal.id);
  if(!old||!faculty.some(r=>r.id===proposal.id)) throw Error('Identity missing '+proposal.id);
  const result={...structuredClone(old),checkedAt:proposal.checkedAt,reviewer:'Codex; Stage 3 primary-source observations locally adjudicated by integrator',identityBasis:proposal.identityBasis,reviewStatus:'partial',careerComplete:false,profileHistoryComplete:false,accessibleCvCaptureComplete:false,coverageNote:proposal.coverageNote,jobs:[],otherEmploymentMentions:[...(old.otherEmploymentMentions||[]),...(proposal.otherEmploymentMentions||[])],degreeFacts:[...(old.degreeFacts||[]),...(proposal.degreeFacts||[])],sources:proposal.sources,remainingUnknowns:proposal.remainingUnknowns,accessLimitations:proposal.accessLimitations,firstJobAssessment:proposal.firstJobAssessment};
  const moved=[];
  for(const sourceJob of proposal.jobs) {
   const job=structuredClone(sourceJob);
   const title=job.titleAsWritten;
   let reason=null;
   if(title==='Andrew Schultz Sesquicentennial Fellow') reason='Named faculty fellowship/distinction; no separate employment established.';
   if(title==='Faculty Fellow, Townhouses Residence Hall'||title==='Associate Director, Graduate Studies') reason='Concurrent internal faculty service; retained as supporting role, not a separate employment change.';
   if(title==='FinTech Faculty') reason='Additional Cornell teaching affiliation; no independent appointment boundary established beyond Cornell faculty role.';
   if(title==='Research Affiliate'&&job.employerAsWritten==='Lawrence Berkeley National Laboratory') reason='Earlier affiliate wording versus later research fellow; separate employment or transition not established.';
   if(reason) { job.evidenceNote=reason+' '+job.evidenceNote;result.otherEmploymentMentions.push(job);moved.push({title,reason});continue; }
   if(job.start.asWritten==='Fall 2014') job.start={...job.start,year:2014,precision:'year'};
   // Keep original exact wording, but no day inferred into schema that only supports month/year.
   if(job.employerAsWritten==='Abu Dhabi Investment Authority') job.evidenceNote+=' Current status corroborated by the separately reviewed current ADIA Lab biography; the 2020 release alone only establishes the appointment then.';
   result.jobs.push(job);
  }
  result.previousCoverageNotes=[...(old.previousCoverageNotes||[]),{checkedAt:old.checkedAt,coverageNote:old.coverageNote,remainingUnknowns:old.remainingUnknowns}];
  const slug=path.basename(entry.path,'.json');
  write(`${slug}.prior.json`,old);write(`${slug}.proposal.json`,proposal);write(`${slug}.reviewed.json`,result);
  const keys=result.jobs.map(j=>JSON.stringify([j.employerAsWritten,j.titleAsWritten,j.start,j.end]));
  if(new Set(keys).size!==keys.length)throw Error('Duplicate structured job');
  audit.push({id:proposal.id,name:proposal.name,sourceProposal:entry.path,sourceSha256:entry.sha256,priorSha256:hash(JSON.stringify(old)),reviewedFile:`${slug}.reviewed.json`,previousJobs:old.jobs.length,proposedJobs:proposal.jobs.length,acceptedJobs:result.jobs.length,movedToSupportingMentions:moved,firstJobStatus:result.firstJobAssessment.status});
 }
}
write('audit.json',{reviewedAt:'2026-10-27',reviewType:'Local adjudication of previously read Stage 3 source proposals; no new source retrieval',publicChanges:false,records:audit,totalAcceptedJobs:audit.reduce((n,r)=>n+r.acceptedJobs,0),limitations:['All four careers and first-job conclusions remain unresolved/partial.','Prior biography and degree observations preserved.','No canonical faculty or placement records changed.','Source kinds from proposals are preserved; PDFs marked cv may be press releases or interviews, identified explicitly in source notes.']});
console.log(JSON.stringify(audit.map(r=>({name:r.name,jobs:r.acceptedJobs,moved:r.movedToSupportingMentions.length}))));
