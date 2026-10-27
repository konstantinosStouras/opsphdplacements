import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root='research-handoff/parallel-stages-2026-10-26/review-2026-10-27e';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const histories=read('data/employment-histories.json');
const graduates=read('data/graduate-lists.json');
const before=new Map(histories.records.map(r=>[r.id,structuredClone(r)]));
assert.ok(!fs.existsSync(root+'/integrator/mit-stage2-applied.json'),'One-shot integration already applied');
for(const p of read(root+'/stage2/recommended-patches.json').patches){
  const i=histories.records.findIndex(r=>r.id===p.id);
  assert.equal(hash(histories.records[i]),p.historyBeforeSha256);
  assert.deepEqual(histories.records[i].jobs,p.historyReplacement.jobs);
  histories.records[i]=p.historyReplacement;
}
for(const f of read(root+'/integrator/mit-followup.json').records){
  const h=histories.records.find(r=>r.id===f.id);
  if(f.expectedExistingJobs)assert.equal(h.jobs.length,f.expectedExistingJobs);
  (h.followupReviews??=[]).push({checkedAt:'2026-10-27',sourceUrl:f.sourceUrl,outcome:f.outcome,evidenceNote:f.evidenceNote});
  if(f.profileHistoryComplete)(h.linkedInCaptures??=[]).push({profileUrl:h.profileUrl,checkedAt:'2026-10-27',experienceAccess:'read-all-visible',profileHistoryComplete:true,coverageNote:f.evidenceNote});
  h.checkedAt='2026-10-27';
}
const id='grad:massachusetts-institute-of-technology:chen-wen-sabrina-zhai:2024';
const h=histories.records.find(r=>r.id===id),g=graduates.records.find(r=>r.id===id);
assert.equal(g.firstJobReview,undefined);
write(root+'/integrator/sabrina.prior-graduate.json',g);
const source='https://bpb-us-e1.wpmucdn.com/sites.mit.edu/dist/9/1246/files/2025/01/vita_dsl.pdf';
const completion={sourceUrl:source,checkedAt:'2026-10-27',documentDate:'2025-01-29',sourceSection:'PhD Students, entry 55, printed page 37',asWritten:'Graduated August 2024',period:{asWritten:'August 2024',year:2024,month:8,precision:'month'},evidenceNote:'Supervisor David Simchi-Levi explicitly names Sabrina Chen Wen Zhai and reports August 2024 graduation, with Citadel affiliation. This is retained as advisor-reported completion, separately from the official September 2024 recipient annotation. Exact award day remains unknown.'};
const conclusion={status:'verified',definition:'Earliest documented new appointment after doctorate completion',employer:'Citadel',title:'Quantitative Researcher',appointmentType:'professional-employee',sector:'industry',start:{asWritten:'September 2024',year:2024,month:9,precision:'month'},checkedAt:'2026-10-27',reason:'The supervisor’s official CV reports August 2024 graduation. The individually reread full Experience chronology records the MIT research assistantship ending August 2024 and a new full-time Citadel quantitative-research appointment starting September 2024. The earlier Citadel internship ended August 2023. Together these sources establish the earliest documented new post-completion job.',degreeBoundary:'Advisor-reported August 2024 completion is kept separately from MIT’s official September 2024 degree-recipient annotation. No exact defence, appointment or award day is assigned.',limitations:['Source-bounded earliest documented appointment; an unlisted role cannot be ruled out.','The formal degree month remains September 2024; the advisor’s August wording does not overwrite the recipient record.','All career histories remain partial; exact award and appointment days are unknown.'],sources:[{url:source,checkedAt:'2026-10-27',access:'official-PDF-opened-and-student-entry-read',evidenceNote:completion.evidenceNote},{url:'https://www.linkedin.com/in/sabrina-zhai/details/experience/',checkedAt:'2026-10-27',access:'entire-loaded-Experience-read-in-Chrome',evidenceNote:'All twelve roles read, including grouped Waterloo entries through January 2017. Full-time Citadel Quantitative Researcher starts September 2024; MIT research assistant ends August 2024; Citadel 2023 internship ended separately.'},{url:g.degreeReview.sourceUrl,checkedAt:g.degreeReview.checkedAt,access:'previously-reviewed-official-recipient-evidence-retained',evidenceNote:g.degreeReview.evidenceNote}]};
h.firstJobAssessmentHistory=[...(h.firstJobAssessmentHistory||[]),{assessment:h.firstJobAssessment,supersededAt:'2026-10-27',reason:'New individually read advisor completion month resolves the former same-month boundary limitation without changing formal award evidence.'}];
h.firstJobAssessment=conclusion;g.firstJobReview=structuredClone(conclusion);
h.completionEvidence=[...(h.completionEvidence||[]),completion];
g.completionEvidence=[...(g.completionEvidence||[]),structuredClone(completion)];
h.remainingUnknowns=['Exact formal award day, defence day and job start day.','Any omitted employment outside the accessed sources; real-world career remains partial.'];
h.coverageNote+=' Supervisor-reported August 2024 completion and September 2024 Citadel start support the reviewed first-job conclusion; official September award annotation is preserved separately.';
h.sources.push({url:source,checkedAt:'2026-10-27',access:'opened-and-read',locator:completion.sourceSection,evidenceNote:completion.evidenceNote});
graduates.metadata.verifiedGraduateFirstJobs=graduates.records.filter(r=>r.firstJobReview?.status==='verified'&&!r.facultyId).length;
const changed=histories.records.filter(r=>JSON.stringify(before.get(r.id))!==JSON.stringify(r));
for(const r of changed)write(root+'/integrator/'+r.id.replaceAll(':','_')+'.prior.json',before.get(r.id));
write('data/employment-histories.json',histories);write('data/graduate-lists.json',graduates);
write(root+'/integrator/mit-stage2-applied.json',{changedIds:changed.map(r=>r.id),graduateConclusion:id,graduateFirstJobs:graduates.metadata.verifiedGraduateFirstJobs,unknownFormalAwardDatesPreserved:true});
