import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-stage2-four-2026-10-28';
const lane='research-handoff/parallel-stages-2026-10-26/stage-2';
const ids=['omlist-41e3347f6c53877c','omlist-a2768146530417a3','omlist-308b5c762bfa33c9','omlist-cab050bb80b4a05c'];
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const data=read('data/employment-histories.json');
const before=structuredClone(data);
fs.mkdirSync(`${dir}/inputs`,{recursive:true});
function input(kind,id,suffix='') {const p=`${lane}/${kind}/${id}${suffix}.json`; if(!fs.existsSync(p))return null;const v=read(p);write(`${dir}/inputs/${kind}-${id}.json`,v);return v;}
const audits=[];
for(const id of ids){
 const r=data.records.find(x=>x.id===id);assert(r && !r.linkedinSourceCapture,'Refuse replay or newer capture');
 const review=input('reviews',id), h=input('histories',id,'.linkedin'), degree=input('degrees',id);
 const count=r.jobs.length;
 r.previousCoverageNotes=[...(r.previousCoverageNotes||[]),{checkedAt:r.checkedAt,coverageNote:r.coverageNote}];
 r.checkedAt='2026-10-28';r.reviewStatus='partial';r.careerComplete=false;
 r.remainingUnknowns=[...new Set([...(r.remainingUnknowns||[]),...review.remainingUnknowns])];
 r.accessLimitations=[...new Set([...(r.accessLimitations||[]),...review.accessLimitations])];
 r.otherEmploymentMentions ||= [];
 if(h){
  r.profileUrl=h.profileUrl;
  r.linkedinSourceCapture={profileUrl:h.profileUrl,checkedAt:h.checkedAt,experienceAccess:h.experienceAccess,profileHistoryComplete:h.profileHistoryComplete,coverageNote:h.coverageNote,jobs:h.jobs,otherEmploymentMentions:h.otherEmploymentMentions};
  r.coverageNote='Prior official-source observations retained; individually identity-matched LinkedIn Experience read by Stage 2 contributor and reviewed for integration. The complete accessible section does not establish a complete career.';
  const old=structuredClone(r.jobs);
  if(id===ids[0]){
   // Same Bristol title: refine dates without counting the prior undated observation twice.
   r.jobs[0]={...h.jobs[0],additionalSourceUrls:[old[0].sourceUrl],priorSourceObservations:[old[0]]};
   r.jobs.push(...h.jobs.slice(1));
  } else if(id===ids[2]) {
   // Two already recorded roles: preserve finer CV dates; add the coarser self-report as corroboration.
   for(let i=0;i<2;i++)r.jobs[i]={...r.jobs[i],additionalSourceUrls:[...new Set([...(r.jobs[i].additionalSourceUrls||[]),h.profileUrl])],additionalSourceObservations:[...(r.jobs[i].additionalSourceObservations||[]),h.jobs[i]]};
  } else {
   // Replace three undated summaries with the explicit title/date observations, retaining originals.
   const matches=[[0,1],[4,7],[5,6]];
   for(const [a,b] of matches){r.jobs[a]={...h.jobs[b],additionalSourceUrls:[old[a].sourceUrl],priorSourceObservations:[old[a]]};if(b===1){r.jobs[a].isCurrent=null;r.jobs[a].evidenceNote+=' Official IESE still lists the professor title; departure is not established.';}}
   r.jobs.push(...h.jobs.filter((_,i)=>![1,6,7].includes(i)));
  }
  r.otherEmploymentMentions.push(...h.otherEmploymentMentions);
 } else {
  r.coverageNote=review.historyObservation.coverageNote+' Career remains partial.';
  r.otherEmploymentMentions.push(...review.historyObservation.otherEmploymentMentions);
 }
 if(degree){r.degreeReview={status:'reported-doctorate',period:{asWritten:degree.year?String(degree.year):'Date not reported',year:degree.year,month:null,precision:degree.year?'year':'unknown'},field:degree.field,checkedAt:degree.checkedAt,sourceUrl:degree.sources.find(s=>s.url.includes('iese.edu'))?.url||degree.sources[0].url,evidenceNote:degree.evidenceNote,limitations:degree.remainingUnknowns};r.degreeSourceObservation=degree;}
 audits.push({id,name:r.name,priorRoles:count,roles:r.jobs.length,netRoles:r.jobs.length-count,firstPlacementChanged:false,linkedinEntries:h?.jobs.length||0});
}
for(let i=0;i<data.records.length;i++)if(!ids.includes(data.records[i].id))assert.deepEqual(data.records[i],before.records[i]);
write(`${dir}/prior-records.json`,before.records.filter(r=>ids.includes(r.id)));
write(`${dir}/audit.json`,{records:audits,unrelatedHistoriesUnchanged:true,firstPlacementDatasetsUnchanged:true});
write('data/employment-histories.json',data);
