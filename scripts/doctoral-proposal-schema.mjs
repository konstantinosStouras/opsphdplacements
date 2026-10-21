import assert from 'node:assert/strict';
import {isSourceUrl} from '../assets/model.js';
export {isPhdDegree} from '../assets/program-model.js';
const text=v=>typeof v==='string'&&v.trim().length>0;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function validateDoctoralProposal(p,universities,reviews){
 const originals=new Map(universities.map(u=>[u.id,u]));
 assert(originals.has(p.universityId),'Unknown doctoral university ID: '+p.universityId);
 assert(date(p.checkedAt),'Doctoral proposal requires actual check date');
 assert(['verified','partial','no-qualifying-programme-verified'].includes(p.status),'Invalid doctoral review status');
 assert(Array.isArray(p.programmes)&&Array.isArray(p.sources)&&p.sources.length&&Array.isArray(p.branches)&&Array.isArray(p.limitations),'Doctoral review needs programmes, branch checks, sources and limitations');
 const supported=(url,at)=>p.sources.some(s=>s.url===url&&s.checkedAt===at&&s.outcome==='read');
 for(const s of p.sources)assert(isSourceUrl(s.url)&&date(s.checkedAt)&&['read','blocked'].includes(s.outcome)&&text(s.note),'Invalid doctoral source');
 for(const b of p.branches)assert(['business','engineering','mathematics','other'].includes(b.branch)&&text(b.conclusion)&&Array.isArray(b.sourceUrls)&&b.sourceUrls.every(url=>p.sources.some(s=>s.url===url)),'Invalid doctoral branch check');
 assert(p.limitations.every(text),'Invalid doctoral limitation');
 if(p.coverageComplete!==undefined)assert(typeof p.coverageComplete==='boolean','Doctoral coverage flag must be boolean');
 if(p.coverageComplete)assert(['business','engineering'].every(branch=>p.branches.some(b=>b.branch===branch&&['checked','not-present'].includes(b.reviewState))),'Complete doctoral coverage needs explicit business and engineering branch conclusions');
 if(p.status==='verified')assert(p.programmes.length,'Verified doctoral provision needs a programme');
 if(p.status==='no-qualifying-programme-verified')assert(!p.programmes.length,'Negative doctoral observation cannot contain verified programmes');
 const ids=new Set();
 for(const q of p.programmes){
  assert(text(q.id)&&!ids.has(q.id),'Missing or duplicate doctoral programme ID');ids.add(q.id);
  assert(text(q.programName)&&text(q.degree)&&Array.isArray(q.fields)&&q.fields.length&&q.fields.every(text),'Missing doctoral programme/degree/field evidence');
  assert(['active','closed','renamed','transitioned','unknown','admissions-suspended','admissions-ended'].includes(q.status),'Invalid doctoral programme status');
  assert(date(q.checkedAt)&&supported(q.sourceUrl,q.checkedAt)&&text(q.evidence),'Programme needs individually read dated source');
  if(q.researchDoctorateEvidence){const e=q.researchDoctorateEvidence;assert(supported(e.sourceUrl,e.checkedAt)&&text(e.evidence),'Research-doctorate eligibility needs read qualification evidence');assert(!/\bdba\b|doctor of business administration/i.test(q.degree),'DBA scope requires a separate explicit decision');}
  if(q.programmeType){assert(['primary','specialization','dual-title','research-training'].includes(q.programmeType),'Invalid doctoral route type');if(['dual-title','research-training'].includes(q.programmeType))assert(text(q.overlapNote),'Overlapping doctoral route needs explicit no-double-counting explanation');}
  if(q.primaryProgrammeIds!==undefined)assert(Array.isArray(q.primaryProgrammeIds)&&q.primaryProgrammeIds.every(text)&&new Set(q.primaryProgrammeIds).size===q.primaryProgrammeIds.length&&!q.primaryProgrammeIds.includes(q.id),'Invalid primary doctoral route links');
  for(const k of ['school','department','specialization'])assert(q[k]===null||text(q[k]),'Programme host/specialization must be explicit text or null');
  assert(Array.isArray(q.unitIds)&&new Set(q.unitIds).size===q.unitIds.length,'Programme unit IDs must be unique');
  const byId=new Map(reviews.map(r=>[r.id,r]));
  const canonical=id=>{const seen=new Set();while(byId.get(id)?.duplicateOf&&!seen.has(id)){seen.add(id);id=byId.get(id).duplicateOf;}return id;};
  const known=new Set(reviews.filter(r=>canonical(r.id)===canonical(p.universityId)).flatMap(r=>r.units.map(u=>u.id)));
  assert(q.unitIds.every(id=>known.has(id)),'Programme points to an unintegrated/unknown reviewed unit');
  assert(Array.isArray(q.limitations)&&q.limitations.every(text),'Programme limitations required');
 }
 return p;
}
