import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fold} from '../assets/model.js';
import {universityRows} from '../assets/university-model.js';
import {organisationRows} from '../assets/organisation-model.js';

const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'research-handoff/priorities');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const save=(name,data)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n');
fs.mkdirSync(dir,{recursive:true});
// Refresh explicitly from the owner's adjacent source checkout. Later runs use the
// portable compact catalogue, never assume the adjacent repository exists.
if(process.argv.includes('--refresh-source-catalogue')){
 const sources=[];const observations=[];
 for(const [name,file,url] of [
  ['oa-directory','directory.json','https://www.operationsacademia.org/data/directory.json'],
  ['oa-universities','universities.json','https://www.operationsacademia.org/data/universities.json'],
  ['oa-jobs','jobs.json','https://www.operationsacademia.org/data/jobs.json'],
  ['oa-past-postings','past-postings.json','https://www.operationsacademia.org/data/past-postings.json']]){
  const absolute=path.join(root,'../OperationsAcademia.github.io/data',file),bytes=fs.readFileSync(absolute),records=JSON.parse(bytes);
  sources.push({id:name,url,observedLocalFileAt:'2026-10-21',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),records:records.length,limitation:'Local source-checkout snapshot; not a fresh live-page or community-overlay export.'});
  for(const r of records)if(r.institution||r.name)observations.push({source:name,sourceRecordId:r.id,name:r.institution||r.name,school:r.school||null,department:r.department||r.unit||null,countryAsListed:r.country||null,sourceUrl:r.adUrl||r.postedAtUrl||r.departmentUrl||r.deptUrl||r.facultyUrl||url});
 }
 const schools=read('research-handoff/priorities/omlist-schools-2026-10-21.json');
 sources.push({id:'omlist-schools',url:schools.sourceUrl,observedAt:schools.observedAt,records:schools.records.length,limitation:'All displayed OM List school rows read; directory assertions, not official unit verification.'});
 for(const r of schools.records)observations.push({source:'omlist-schools',sourceRecordId:r.sourceId,name:r.name,department:r.departmentAsListed,countryAsListed:r.countryAsListed,sourceUrl:r.sourceUrl});
 save('source-catalogue-2026-10-21.json',{asOf:'2026-10-21',state:'discovery-only',sources,observations,limitation:'Source reconciliation and live-overlay coverage are incomplete. No observation verifies a university name or operations unit.'});
}
const catalogueFiles=['source-catalogue-2026-10-21.json','source-catalogue-live-2026-10-21.json'].filter(file=>fs.existsSync(path.join(dir,file)));
const catalogue={observations:catalogueFiles.flatMap(file=>read('research-handoff/priorities/'+file).observations)};
const universities=read('data/universities.json'),reviews=read('data/university-reviews.json');
const grouped=universityRows(universities.records,reviews.records),byName=new Map();
for(const r of grouped)for(const name of [r.name,...r.originals.flatMap(o=>[o.name,...(o.spellings||[])])]){
 const k=fold(name);byName.set(k,[...new Set([...(byName.get(k)||[]),r.id])]);
}
// Reuse already accepted entity/review aliases as discovery links, never as
// verification of an unreviewed department. Preserve all imported IDs.
const joined=organisationRows(read('data/entities.json'),universities,reviews,read('data/doctoral-programs.json'),read('data/faculty.json'),read('data/faculty-roster-people.json'),read('data/employment-histories.json'),read('data/linkedin-histories.json'));
const acceptedNames=new Map();
for(const r of joined){const ids=r.entities.flatMap(e=>(e.directory?.universities||[]).map(u=>u.id));if(!ids.length)continue;for(const name of r.names){const k=fold(name);acceptedNames.set(k,[...(acceptedNames.get(k)||[]),{id:r.id,sourceIds:[...new Set(ids)]}]);}}
const exclusions=new Map();for(const r of reviews.records)if(r.directoryExclusion){const u=universities.records.find(u=>u.id===r.id);for(const name of [u?.name,...(u?.spellings||[])])if(name)exclusions.set(fold(name),{id:r.id,evidence:r.directoryExclusion});}
const candidates=new Map(),matched=[],excluded=[];
// Individually reviewed source-record decisions are exact, scoped discovery links.
// They never introduce fuzzy/global aliases or verify the source's unit assertion.
const reconciliationFile='research-handoff/priorities/source-name-reconciliations-2026-10-22.json';
const reconciliations=fs.existsSync(path.join(root,reconciliationFile))?read(reconciliationFile).records:[];
const reconciledKeys=new Set();
for(const r of reconciliations){
 const review=reviews.records.find(u=>u.id===r.universityId);
 assert(review?.canonicalName&&r.evidence&&r.sourceRecordIds?.length,'Invalid source identity reconciliation');
 assert(review.sources.some(s=>s.url===r.sourceUrl&&s.checkedAt===r.checkedAt&&s.outcome==='read'),'Reconciliation needs integrated opened official evidence');
 for(const sourceRecordId of r.sourceRecordIds){
  const key=JSON.stringify([r.nameAsListed,sourceRecordId]);assert(!reconciledKeys.has(key),'Conflicting source identity decisions');reconciledKeys.add(key);
  assert(catalogue.observations.some(o=>o.name===r.nameAsListed&&o.sourceRecordId===sourceRecordId&&(o.countryAsListed||null)===r.countryAsListed),'Unknown or mismatched source identity assertion');
 }
}
for(const o of catalogue.observations){
 const resolution=reconciliations.find(r=>r.nameAsListed===o.name&&r.sourceRecordIds.includes(o.sourceRecordId)&&(o.countryAsListed||null)===r.countryAsListed);
 if(resolution){
  const targets=joined.filter(r=>r.reviews.some(u=>u.originals.some(original=>original.id===resolution.universityId)));
  assert(targets.length===1,'Reconciled source identity must resolve to one joined organisation');
  matched.push({...o,matchedOrganisationId:targets[0].id,matchedImportedUniversityIds:[resolution.universityId],match:'individually reviewed source-record identity; unit assertion still requires reconciliation',identityEvidence:{sourceUrl:resolution.sourceUrl,checkedAt:resolution.checkedAt,evidence:resolution.evidence}});continue;
 }
 if(exclusions.has(fold(o.name))){excluded.push({...o,disposition:'previously reviewed non-university exclusion',...exclusions.get(fold(o.name))});continue;}
 const accepted=[...new Map((acceptedNames.get(fold(o.name))||[]).map(x=>[x.id,x])).values()];
 if(accepted.length===1){matched.push({...o,matchedOrganisationId:accepted[0].id,matchedImportedUniversityIds:accepted[0].sourceIds,match:'accepted entity/review alias; discovery linkage, not new unit verification'});continue;}
 const ids=byName.get(fold(o.name))||[];
 if(ids.length===1){matched.push({...o,matchedGroupId:ids[0],match:'exact normalized source/accepted-review name; discovery match only'});continue;}
 const key=fold(o.name);let c=candidates.get(key);
 if(!c){c={id:'discovery:'+crypto.createHash('sha256').update(key).digest('hex').slice(0,16),nameAsListed:o.name,candidateExistingIds:ids,status:ids.length?'ambiguous-source-match':'unreconciled-source-name',observations:[]};candidates.set(key,c);}
 c.observations.push(o);
}
const sourceChecks=new Map();
for(const m of matched){const id=m.matchedOrganisationId||m.matchedGroupId;const check=sourceChecks.get(id)||{id,officialUnitComparison:'pending-source-reconciliation',sourceAssertions:[]};check.sourceAssertions.push({source:m.source,sourceRecordId:m.sourceRecordId,schoolAsListed:m.school||null,departmentAsListed:m.department||null});sourceChecks.set(id,check);}
save('stage-1-university-queue.json',{
 asOf:reviews.records.flatMap(r=>[r.checkedAt,r.doctoralReview?.checkedAt]).filter(Boolean).sort().at(-1),phase:'active-source-reconciliation',publishedSourceRecords:universities.records.length,publishedReviewCounts:reviews.metadata,
 completionGate:'First verify PhD institutions reported by OM List faculty, then expand to other university/job-source candidates. Verify current relevant doctoral programmes across business and engineering, official university/unit identities and aliases. Unit reviews alone do not establish doctoral eligibility or Stage 1 completion.',
 doctoralPriorityQueue:'stage-1-doctoral-priority-queue.json',
 sourceCoverageGate:'Public compiled Operations Academia university/current-and-archived job files, public directory/archive corrections and all 202 OM List school rows frozen. Institutional identities and every additional unit assertion still require adjudication; candidate labels are not additional verified universities. No private/held submissions were accessed.',
 sourceCatalogues:catalogueFiles,matchedInstitutionSourceChecks:[...sourceChecks.values()],matchedObservations:matched.length,excludedObservations:excluded.length,exclusions:excluded,
 existingFollowUps:universities.records.filter(u=>!reviews.records.some(r=>r.id===u.id&&r.status==='reviewed')).map(u=>({id:u.id,name:u.name,status:reviews.records.find(r=>r.id===u.id)?.status||'pending'})),
 candidates:[...candidates.values()].sort((a,b)=>a.nameAsListed.localeCompare(b.nameAsListed))
});
const people=read('data/faculty.json').records,placements=read('data/placements.json').records;
const jobs=new Map(placements.map(p=>[p.facultyId,p]));
const histories=[...read('data/employment-histories.json').records,...read('data/linkedin-histories.json').records];
const historyById=new Map();for(const h of histories)for(const id of [h.id,...(h.recordIds||[])])historyById.set(id,h);
const records=people.map(p=>{const j=jobs.get(p.id),h=historyById.get(p.id);return {id:p.id,name:p.name,sourceProfileUrl:p.sourceProfileUrl,sourceSchoolUrl:p.currentInstitutionSourceUrl,importedPhdYear:p.phdYear,firstJobStatus:j?'verified-first-placement':'unresolved-or-degree-unconfirmed',phdYearVerification:j?.phdYearVerificationStatus||'not-established-by-this-queue',historyStatus:h?.reviewStatus|| (h?'source-observation-only':'pending'),historySource:h?.profileUrl||null,historyRoleCount:h?.jobs?.length||0};}).sort((a,b)=>a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id));
save('stage-2-omlist-queue.json',{asOf:'2026-10-21',phase:'waiting-for-stage-1',population:'Only the 2,149 OM List profiles; faculty-page-only people retain their existing records but are not the priority-2 queue.',total:records.length,verifiedFirstJobs:records.filter(r=>r.firstJobStatus==='verified-first-placement').length,withHistoryReviewRecord:records.filter(r=>r.historyStatus!=='pending').length,withSourcedRoleObservation:records.filter(r=>r.historyRoleCount>0).length,nextStep:'After Stage 1: open each OM List profile and its available CV/official/LinkedIn links; identity-match and record separate degree/first-job/full-history conclusions.',completeHistories:records.filter(r=>r.historyStatus==='completed').length,completionGate:'Every OM List person has identity-matched, individually sourced PhD-year/degree status, first-job conclusion and all accessible linked employment entries recorded. Partial/blocked histories stay unfinished; no downloaded page or current role establishes a first job.',records});
console.log(JSON.stringify({existingUniversityFollowUps:universities.records.length-reviews.metadata.reviewed,sourceObservations:catalogue.observations.length,unreconciledSourceNames:candidates.size,omListPeople:records.length,verifiedOmListFirstJobs:records.filter(r=>r.firstJobStatus==='verified-first-placement').length}));
