// Integrator-only: reviewed proposals join the existing programme register.
// The default previews changes. --apply writes; no downloaded source is a review.
import fs from 'node:fs';
import {writeComplete} from './write-complete.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fold} from '../assets/model.js';
import {validatePrograms} from './validate-programs.mjs';
import {validateDoctoralProposal,isPhdDegree} from './doctoral-proposal-schema.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.resolve(root,file),'utf8'));
const args=process.argv.slice(2),files=args.filter(s=>!s.startsWith('--'));
assert(files.length,'Pass individually reviewed doctoral proposal files; use --apply after preview.');
const universities=read('data/universities.json'),reviews=read('data/university-reviews.json'),programs=read('data/doctoral-programs.json');
const reviewById=new Map(reviews.records.map(r=>[r.id,r])),byId=new Map(programs.records.map(p=>[p.id,p]));
const originalProgrammes=JSON.stringify(programs.records);
const changedUniversities=new Set(),newIds=[],updatedIds=new Set();
function canonical(id){const seen=new Set();while(reviewById.get(id)?.duplicateOf){assert(!seen.has(id),'University alias cycle');seen.add(id);id=reviewById.get(id).duplicateOf;}return id;}
function identity(p){return [fold(p.university),fold(p.programName),fold(p.specialization||''),fold(p.degree)].join('|');}
for(const file of files){
 const proposal=validateDoctoralProposal(read(file),universities.records,reviews.records),id=canonical(proposal.universityId),review=reviewById.get(id);
 assert(review?.canonicalName,'Official university identity must be integrated first: '+id);
 const programmeIds=[];
 for(const p of proposal.programmes){
  if(args.includes('--scope-only')){
   const existing=byId.get(p.existingProgramId||p.id);assert(existing&&existing.universityId===id,'Scope-only review needs an existing route at the same university: '+p.id);
   for(const field of ['programName','degree','specialization','school','department'])if(p[field]!==null)assert.deepEqual(existing[field],p[field],'Scope-only review cannot change programme facts: '+p.id+'/'+field);
   programmeIds.push(existing.id);continue;
  }
  const sourceMap=new Map();
  for(const s of [...proposal.sources.filter(s=>s.outcome==='read'),...review.sources.filter(s=>s.outcome==='read'&&s.url===review.universitySourceUrl&&s.checkedAt===review.checkedAt)]){
   const key=s.url+'|'+s.checkedAt;if(!sourceMap.has(key))sourceMap.set(key,{id:'source-'+crypto.createHash('sha256').update(key).digest('hex').slice(0,14),url:s.url,title:s.note,notes:s.note,lastCheckedAt:s.checkedAt,sourceType:'official-primary',access:'opened-and-read'});
  }
  const sourceFor=(url,at)=>sourceMap.get(url+'|'+at).id;
  const fields={university:review.canonicalName,programName:p.programName,degree:p.degree,fields:p.fields,status:p.status,school:p.school,department:p.department,specialization:p.specialization,eligibilityScope:p.evidence};
  const programmeSourceIds=[...new Set(proposal.sources.filter(s=>s.outcome==='read').map(s=>sourceFor(s.url,s.checkedAt)))];
  const facts=Object.entries(fields).map(([field,value])=>({field,value,lastCheckedAt:field==='university'?review.checkedAt:p.checkedAt,sourceIds:value===null?[]:field==='university'?[sourceFor(review.universitySourceUrl,review.checkedAt)]:programmeSourceIds,evidenceNote:value===null?'Not established by the reviewed sources.':field==='university'?'Official university identity from the separately dated university review.':p.evidence}));
  if(p.researchDoctorateEvidence){const e=p.researchDoctorateEvidence;facts.find(f=>f.field==='degree').sourceIds=[...new Set([...facts.find(f=>f.field==='degree').sourceIds,sourceFor(e.sourceUrl,e.checkedAt)])];}
  let record={id:p.existingProgramId||p.id,universityId:id,...fields,field:p.fields.join('; '),unitIds:p.unitIds,statusAsOf:p.checkedAt,checkedAt:p.checkedAt,lastCheckedAt:p.checkedAt,establishedYear:null,admissionsEndedAt:null,lastDegreeAwardedAt:null,closureDate:null,renamedTo:null,history:[],scopeRationale:p.evidence,evidenceNote:p.evidence,phdEligibility:isPhdDegree(p.degree)?'verified':p.researchDoctorateEvidence?'verified-research-doctorate':'credential-unresolved',...(p.researchDoctorateEvidence?{researchDoctorateEvidence:p.researchDoctorateEvidence}:{}),limitations:p.limitations,sources:[...sourceMap.values()],facts};
  for(const field of ['establishedYear','admissionsEndedAt','lastDegreeAwardedAt','closureDate'])facts.push({field,value:null,lastCheckedAt:p.checkedAt,sourceIds:[],evidenceNote:'Not established in this current-provision review; no historical date inferred.'});
  for(const field of ['programmeType','primaryProgrammeIds','overlapNote'])if(p[field]!==undefined){record[field]=p[field];facts.push({field,value:p[field],lastCheckedAt:p.checkedAt,sourceIds:programmeSourceIds,evidenceNote:p.overlapNote||p.evidence});}
  const existing=byId.get(record.id);
  if(p.existingProgramId){
   assert(existing,'Explicit existing programme ID not found: '+p.existingProgramId);
   assert(fold(existing.university)===fold(review.canonicalName),'Existing programme belongs to another university');
   assert(isPhdDegree(existing.degree)===isPhdDegree(p.degree),'Do not convert an existing degree credential during programme enrichment');
   // Retain formal programme identity, earlier fact checks and every historical
   // decision. Add the explicitly reviewed current host/track and status evidence.
   record={...existing,universityId:id,unitIds:[...new Set([...(existing.unitIds||[]),...p.unitIds])],lastCheckedAt:p.checkedAt,checkedAt:p.checkedAt,status:p.status,statusAsOf:p.checkedAt,phdEligibility:record.phdEligibility,limitations:[...new Set([...(existing.limitations||[]),...p.limitations])],sources:[...new Map([...existing.sources,...record.sources].map(s=>[s.id,s])).values()],facts:[...existing.facts]};
   record.priorFactChecks=[...(existing.priorFactChecks||[])];
   const updates={status:p.status,school:p.school,department:p.department,specialization:p.specialization};
   for(const [field,value]of Object.entries(updates))if(value!==null){
    const fresh=facts.find(f=>f.field===field),old=record.facts.find(f=>f.field===field);
    if(old&&JSON.stringify(old)!==JSON.stringify(fresh)&&!record.priorFactChecks.some(f=>JSON.stringify(f)===JSON.stringify(old)))record.priorFactChecks.push(old);
    record[field]=value;record.facts=record.facts.filter(f=>f.field!==field);record.facts.push(fresh);
   }
   byId.set(record.id,record);updatedIds.add(record.id);
  }else if(existing){
   const unstamped=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['addedAt','updatedAt'].includes(k)));
   assert(JSON.stringify(unstamped(existing))===JSON.stringify(record),'Existing programme differs; resolve the update explicitly rather than overwrite history: '+record.id);
  }else{
   assert(![...byId.values()].some(other=>identity(other)===identity(record)),'Programme identity already registered under another ID: '+record.id);
   byId.set(record.id,record);newIds.push(record.id);
  }
  programmeIds.push(record.id);
 }
 const observation={status:proposal.status,checkedAt:proposal.checkedAt,programmeIds:[...new Set(programmeIds)].sort(),branches:proposal.branches,sources:proposal.sources,limitations:proposal.limitations,coverageComplete:proposal.coverageComplete===true};
 if(observation.coverageComplete)assert(['business','engineering'].every(branch=>proposal.branches.some(b=>b.branch===branch&&['checked','not-present'].includes(b.reviewState))),'Complete doctoral coverage needs explicit business and engineering inventory conclusions');
 for(const target of new Set([id,proposal.universityId])){
  const universityReview=reviewById.get(target);assert(universityReview,'Integrate unit observation before doctoral review: '+target);
  const prior=universityReview.doctoralReview;
  if(prior){assert(prior.checkedAt<=observation.checkedAt,'Refusing older doctoral observation');observation.programmeIds=[...new Set([...prior.programmeIds,...observation.programmeIds])].sort();}
  universityReview.doctoralReview=structuredClone(observation);changedUniversities.add(target);
 }
}
programs.records=[...byId.values()];programs.metadata.recordCount=programs.records.length;programs.metadata.coverage='partial';programs.metadata.scope='Official-source doctoral programme register; Stage 1 doctoral eligibility and branch reconciliation remain incomplete.';
validatePrograms(programs);
if(args.includes('--apply')){
 writeComplete(path.join(root,'data/doctoral-programs.json'),JSON.stringify(programs,null,2)+'\n');
 writeComplete(path.join(root,'data/university-reviews.json'),JSON.stringify(reviews,null,2)+'\n');
}
console.log({apply:args.includes('--apply'),addedProgrammeIds:newIds,updatedProgrammeIds:[...updatedIds],doctoralUniversityObservations:changedUniversities.size,historicalProgrammeDetailsPreserved:programs.records.slice(0,JSON.parse(originalProgrammes).length).every((r,i)=>['establishedYear','admissionsEndedAt','lastDegreeAwardedAt','closureDate','renamedTo','history'].every(field=>JSON.stringify(r[field])===JSON.stringify(JSON.parse(originalProgrammes)[i][field])))});
