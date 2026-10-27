// Review-only writer: no public data mutation.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{fileURLToPath}from'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),lane='research-handoff/parallel-stages-2026-10-26/stage-2';
const read=p=>JSON.parse(fs.readFileSync(p)),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),write=(n,x)=>fs.writeFileSync(path.join(out,n),JSON.stringify(x,null,2)+'\n');
const ids=['omlist-933cb29513838bab','omlist-0658d6453712c3d4','omlist-7936b09813764929','omlist-be6408f99285b14b','omlist-0a592c501ad7896b'];
const publicRecords=read('data/employment-histories.json').records,linked=read('data/linkedin-histories.json').records;
const facultyRaw=read('data/faculty.json'),faculty=Array.isArray(facultyRaw)?facultyRaw:facultyRaw.records||facultyRaw.faculty;
const audit=[];const frozen=[];
for(const id of ids){
 const review=read(`${lane}/reviews/${id}.json`),hp=fs.readdirSync(`${lane}/histories`).filter(f=>f.startsWith(id));if(hp.length!==1)throw Error('Expected single source');
 const p=read(`${lane}/histories/${hp[0]}`),old=publicRecords.find(r=>r.id===id||r.recordIds?.includes(id));
 if(linked.some(r=>r.id===id||r.recordIds?.includes(id)))throw Error('Unexpected existing LinkedIn store');
 if(!faculty.some(r=>r.id===id&&r.name===review.name))throw Error('Identity mismatch');
 const paths=[`reviews/${id}.json`,`histories/${hp[0]}`];if(fs.existsSync(`${lane}/degrees/${id}.json`))paths.push(`degrees/${id}.json`);
 for(const f of paths){const b=fs.readFileSync(`${lane}/${f}`);const n=f.replaceAll('/','__');fs.writeFileSync(path.join(out,'inputs',n),b);frozen.push({sourcePath:f,snapshot:n,sha256:sha(b)});}
 write(`${id}.prior.json`,old||null);
 const r={...(old?structuredClone(old):{id,name:review.name,recordIds:[id]}),checkedAt:p.checkedAt,reviewer:'Codex; Stage 2 source capture reviewed by integrator',identityBasis:p.identityBasis,coverageNote:p.coverageNote,reviewStatus:'partial',careerComplete:false,jobs:[],otherEmploymentMentions:[...(old?.otherEmploymentMentions||[]),...(p.otherEmploymentMentions||[])],remainingUnknowns:[...new Set([...(p.remainingUnknowns||[]),...(review.remainingUnknowns||[])])],accessLimitations:[...new Set([...(p.accessLimitations||[]),...(review.accessLimitations||[])])],sources:review.sources,firstJobAssessment:old?.firstJobAssessment||review.firstJobAssessment,previousCoverageNotes:[...(old?.previousCoverageNotes||[]),...(old?[{checkedAt:old.checkedAt,coverageNote:old.coverageNote,remainingUnknowns:old.remainingUnknowns,accessLimitations:old.accessLimitations}]:[])]};
 delete r.integrationStatus;delete r.publicationReviewDate;
 const captureJobs=structuredClone(p.jobs);
 if(p.profileUrl?.includes('linkedin.com')){
  if(p.experienceAccess!=='read-all-visible'||p.profileHistoryComplete!==true||!p.coverageNote.match(/all|six|three/i))throw Error('Incomplete LinkedIn claim');
  for(const j of captureJobs){j.employmentTypeAsWritten??=null;j.locationAsWritten??=null;j.employerGroup??=null;}
  r.linkedinSourceCapture={profileUrl:p.profileUrl,checkedAt:p.checkedAt,experienceAccess:p.experienceAccess,profileHistoryComplete:true,coverageNote:p.coverageNote,jobs:captureJobs};
 }else r.orcidSourceCapture={profileUrl:p.profileUrl,checkedAt:p.checkedAt,coverageNote:p.coverageNote,jobs:captureJobs};
 for(const raw of captureJobs){const j=structuredClone(raw);if(j.titleAsWritten?.startsWith('Doctoral Student')){j.evidenceNote='Profile activity retained separately; does not establish employment or overwrite the prior CV teaching-assistant role. '+j.evidenceNote;r.otherEmploymentMentions.push(j);continue;}
  if(j.sourceType==='orcid'&&j.isCurrent===true){j.isCurrent=null;j.evidenceNote+=' Structured current flag withheld: 2020 assertion age does not establish current 2026 employment.';}
  r.jobs.push(j);
 }
 for(const j of old?.jobs||[]){
  // Old current-role assertions are preserved as evidence, not duplicate jobs.
  const sameCurrent=['omlist-933cb29513838bab','omlist-be6408f99285b14b','omlist-0a592c501ad7896b'].includes(id);
  const buffalo=id==='omlist-7936b09813764929'&&j.employerAsWritten.includes('Buffalo');
  if(sameCurrent||buffalo)r.otherEmploymentMentions.push({...j,evidenceNote:'Earlier source observation of the same role, retained with its original date; not an additional job. '+j.evidenceNote});else r.jobs.push(j);
 }
 if(fs.existsSync(`${lane}/degrees/${id}.json`))r.degreeFacts=[...(old?.degreeFacts||[]),read(`${lane}/degrees/${id}.json`)];
 write(`${id}.reviewed.json`,r);
 audit.push({id,name:r.name,action:old?'replace-existing-history':'add-new-history',priorSha256:old?sha(JSON.stringify(old)):null,priorRoles:old?.jobs.length||0,sourceRoleEntries:p.jobs.length,reviewedRoles:r.jobs.length,reviewedFile:`${id}.reviewed.json`,captureCompleteClaim:p.profileHistoryComplete??null,careerComplete:false,placementChange:false});
}
fs.copyFileSync(`${lane}/publication-handoff-2026-10-26.json`,path.join(out,'inputs/publication-handoff.json'));
write('audit.json',{checkedAt:'2026-10-27',cut:'Stage2 through Adriana Rossiter Hofer; Oke excluded because already integrated',records:audit,frozenInputs:frozen,limitations:['No LinkedIn pages reopened by local reviewer; complete-section claims grounded in saved reader observations.','Profile complete means accessible section only; all real careers partial.','No new placement, degree correction, or continuous tenure conclusion.']});console.log(audit.map(x=>({name:x.name,roles:x.reviewedRoles,action:x.action})));
