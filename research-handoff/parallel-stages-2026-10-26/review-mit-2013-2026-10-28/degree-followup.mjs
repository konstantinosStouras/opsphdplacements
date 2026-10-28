import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=new URL('.',import.meta.url),D='2026-10-28';
const read=f=>JSON.parse(fs.readFileSync(f)),write=(f,v,n=2)=>fs.writeFileSync(f,JSON.stringify(v,null,n)+'\n');
const delta=read('research-handoff/parallel-stages-2026-10-26/stage-4/mit-2013-degree-delta-2026-10-28.json');write(new URL('degree-delta-reviewed.json',dir),delta);
const g=read('data/graduate-lists.json'),h=read('data/employment-histories.json'),url=delta.sourceUrl;
for(const x of delta.records.filter(x=>x.degreeCompletionMilestone)){
 const r=g.records.find(r=>r.id===x.personId||r.facultyId===x.personId&&r.listedYear===2013);assert(r);
 r.degreeMilestones.push({kind:'reported-completion',displayText:'Adviser reports graduation in August 2013.',sourceUrl:url,checkedAt:D,evidenceNote:x.name+' is individually named in the graduated PhD students list.',limitation:'Reported academic completion is separate from formal degree conferral.',formalAwardDateAssigned:false});
 if(x.firstJobAssessment){
  assert(!r.firstJobReview);const hr=h.records.find(r=>r.id===x.personId);
  r.degreeReview.period={year:2013,month:null,precision:'year',asWritten:'2013'};r.degreeReview.sourceUrl=url;r.degreeReview.evidenceNote='Adviser reports August 2013 graduation; exact identity corroborated by Farias co-advising and individual thesis/profile.';
  const v={status:'verified',definition:'Earliest documented new appointment after doctorate completion',employer:'LinkedIn',title:null,start:{asWritten:'September 2013',year:2013,month:9,precision:'month'},sector:'industry',appointmentType:'unknown',checkedAt:D,reason:'Adviser explicitly reports August 2013 graduation; the individually read complete accessible profile dates the next employee appointment at LinkedIn from September 2013. Earlier 2012 internship remains separate.',sources:[{url,checkedAt:D,evidenceNote:'Individual adviser entry dates graduation to August 2013 and names co-adviser Farias.'},{url:hr.profileUrl,checkedAt:D,evidenceNote:'Full accessible chronology dates LinkedIn employee entry September 2013–June 2016; retrospective Staff Engineer label does not establish initial rank.'}],degreeBoundary:'Reported academic completion August 2013 precedes employee appointment September 2013. Formal conferral day/month are not assigned.',limitations:['Initial title and exact appointment day unknown.','ORC September thesis timing is separate from adviser-reported August graduation.','Complete real-world employment history remains unproven.']};
  r.firstJobReview=v;hr.firstJobAssessment=structuredClone(v);hr.degreeReview=structuredClone(r.degreeReview);hr.degreeMilestones=structuredClone(r.degreeMilestones);
  hr.remainingUnknowns=['Formal award date and initial LinkedIn job title remain unknown.','The retrospective Staff Engineer label covers an aggregate period; promotion dates are not supplied.','Later employment gaps and full lifetime coverage remain unresolved.'];
  hr.jobs.find(j=>j.employerAsWritten==='LinkedIn').evidenceNote+=' Retrospective title for the whole interval; initial title is unknown.';
 }
}
g.metadata.verifiedGraduateFirstJobs=g.records.filter(r=>r.firstJobReview&&!r.facultyId).length;
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h);
const a=read(new URL('applied.json',dir));a.firstJobsAdded=1;a.remaining='Fontana/Keller professional identity and degree completion; five graduate first jobs; four faculty career follow-ups; exact award dates and credential/title conflicts.';write(new URL('applied.json',dir),a);
