import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-stage2-seven-2026-10-28',lane='research-handoff/parallel-stages-2026-10-26/stage-2';
const ids=['omlist-3e8c22c5cee4f333','omlist-5dc90ea0338db19c','omlist-8781c6693fe274d8','omlist-d26be7402bf94514','omlist-5fad4802674c26ab','omlist-96098fb07eb8b871','omlist-e7d5d84e25308d1b'];
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(`${dir}/inputs`,{recursive:true});
const input=(kind,id,suffix='')=>{const p=`${lane}/${kind}/${id}${suffix}.json`;if(!fs.existsSync(p))return null;const v=read(p);write(`${dir}/inputs/${kind}-${id}${suffix}.json`,v);return v;};
const data=read('data/employment-histories.json'),before=structuredClone(data),audits=[];
for(const id of ids){
 const r=data.records.find(x=>x.id===id);assert(r?.checkedAt==='2026-10-20','Refuse replay or newer record');
 const p=input('reviews',id),d=input('degrees',id);const old=structuredClone(r.jobs),n=old.length;
 const h=input('histories',id,'.linkedin')||input('histories',id,'.official');
 r.previousCoverageNotes=[...(r.previousCoverageNotes||[]),{checkedAt:r.checkedAt,coverageNote:r.coverageNote}];
 r.checkedAt='2026-10-28';r.reviewStatus='partial';r.careerComplete=false;
 r.remainingUnknowns=[...new Set([...(r.remainingUnknowns||[]),...p.remainingUnknowns])];
 r.accessLimitations=[...(r.accessLimitations||[]),...p.accessLimitations];r.otherEmploymentMentions ||= [];
 if(h){
  r.coverageNote=h.coverageNote+' Prior source observations retained; career remains partial.';
  if(h.profileUrl?.includes('linkedin.com')){r.profileUrl=h.profileUrl;r.linkedinSourceCapture={profileUrl:h.profileUrl,checkedAt:h.checkedAt,experienceAccess:h.experienceAccess,profileHistoryComplete:h.profileHistoryComplete,coverageNote:h.coverageNote,jobs:h.jobs,otherEmploymentMentions:h.otherEmploymentMentions};}else r.officialSourceCapture=h;
  r.otherEmploymentMentions.push(...(h.otherEmploymentMentions||[]));
  const refine=(oi,hi)=>({...h.jobs[hi],priorSourceObservations:[old[oi]],additionalSourceUrls:[old[oi].sourceUrl]});
  if(id===ids[0]){
   r.jobs=[refine(0,0),refine(1,1),refine(2,2)];
   r.jobs[2].evidenceNote+=' Earlier CV labels host Maryland and dates 2018–2022; the identity-matched LinkedIn Minnesota grouping agrees with the already reviewed IMA roster, but the conflicting CV observation remains unresolved.';
   r.otherEmploymentMentions.push({...old[2],evidenceNote:old[2].evidenceNote+' Conflicting earlier wording for the same fellowship, not a second job.'});
  }else if(id===ids[1]){
   r.jobs=[refine(0,0),refine(1,1),refine(2,2),old[3],refine(4,3),refine(5,4),...h.jobs.slice(6,9).map(j=>({...j,priorSourceObservations:[old[6]]})),refine(7,9),old[8],old[9]];
   r.jobs[10].additionalSourceObservations=[h.jobs[10]];
   r.jobs[10].evidenceNote+=' LinkedIn reports 2003–2005, conflicting with CV 2004–2006. Neither interval silently replaces the other.';
   r.otherEmploymentMentions.push(h.jobs[5]);
  }else if(id===ids[2]){
   r.jobs=[refine(0,0),refine(1,3),refine(2,2),refine(3,1),refine(4,5),h.jobs[10]];
   r.otherEmploymentMentions.push(old[3],h.jobs[4],...h.jobs.slice(6,10));
  }else if(id===ids[3]){
   r.jobs=h.jobs.map(j=>({...j,isCurrent:j.isCurrent?null:j.isCurrent}));
   for(const [oi,hi] of [[0,2],[1,9],[2,3],[3,4]])r.jobs[hi].priorSourceObservations=[old[oi]];
   r.jobs[9].start=old[1].start;r.jobs[9].evidenceNote+=' Earlier CV specifies March 2019 start; retained alongside newer Spring 2019 wording.';
  }
 }else{
  r.coverageNote=p.historyObservation.coverageNote+' Career remains partial.';
  r.otherEmploymentMentions.push(...p.historyObservation.otherEmploymentMentions);
  if(id===ids[5]){r.jobs[0].isCurrent=false;r.jobs[0].evidenceNote+=' Official TUM biography now explicitly describes Passau as preceding TUM; end date remains unknown.';r.jobs[0].additionalSourceObservations=[p.historyObservation.otherEmploymentMentions[1]];}
 }
 if(d){r.degreeSourceObservation=d;/* Preserve older degree adjudication where the new source is a corroboration or conflict. */}
 audits.push({id,name:r.name,priorRoles:n,roles:r.jobs.length,netRoles:r.jobs.length-n,firstJobChanged:false});
}
for(let i=0;i<data.records.length;i++)if(!ids.includes(data.records[i].id))assert.deepEqual(data.records[i],before.records[i]);
write(`${dir}/prior-records.json`,before.records.filter(r=>ids.includes(r.id)));write(`${dir}/audit.json`,{records:audits,unrelatedHistoriesUnchanged:true});write('data/employment-histories.json',data);
