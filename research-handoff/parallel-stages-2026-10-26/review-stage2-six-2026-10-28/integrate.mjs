import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-stage2-six-2026-10-28', lane='research-handoff/parallel-stages-2026-10-26/stage-2';
const ids=['omlist-520e08e78e51c33d','omlist-6eff84506952fc4d','omlist-9cb7b2a4d2d65b89','omlist-a9b2727acc723dea','omlist-eeae7d84b1f44b5f','omlist-f9ce7142e1fb3ac8'];
const read=p=>JSON.parse(fs.readFileSync(p)), write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(`${dir}/inputs`,{recursive:true});
const input=(kind,id,suffix='')=>{const p=`${lane}/${kind}/${id}${suffix}.json`;if(!fs.existsSync(p))return null;const v=read(p);write(`${dir}/inputs/${kind}-${id}${suffix}.json`,v);return v;};
const data=read('data/employment-histories.json'),before=structuredClone(data),audits=[];
const unknown=()=>({asWritten:null,year:null,month:null,precision:'unknown'});
for(const id of ids){
 const r=data.records.find(x=>x.id===id);assert(r?.checkedAt==='2026-10-20','Refuse replay or newer record');
 const p=input('reviews',id),d=input('degrees',id);const n=r.jobs.length;
 r.previousCoverageNotes=[...(r.previousCoverageNotes||[]),{checkedAt:r.checkedAt,coverageNote:r.coverageNote}];
 r.checkedAt=p.checkedAt;r.reviewStatus='partial';r.careerComplete=false;
 r.remainingUnknowns=[...new Set([...(r.remainingUnknowns||[]),...p.remainingUnknowns])];
 r.accessLimitations=[...(r.accessLimitations||[]),...p.accessLimitations.map(x=>typeof x==='string'?x:`${x.type}: ${x.url}. Source unavailable; no bypass.`)];
 r.otherEmploymentMentions ||= [];
 let mentions=p.historyObservation?.otherEmploymentMentions||[];
 if(id===ids[0]){
  const h=input('histories',id,'.orcid');const prior=structuredClone(r.jobs[0]);
  r.jobs[0]={...h.jobs[2],isCurrent:null,priorSourceObservations:[prior],additionalSourceObservations:h.jobs.slice(0,2),evidenceNote:'ORCID contains three overlapping professor-title assertions beginning August 2019. Consolidated as one affiliation, with title discrepancy retained; source-dated present does not establish current status.'};
  r.jobs.push({...h.jobs[3],evidenceNote:'Institutional ORCID assertion reports visiting fellow from 1 January 2017 to 31 July 2019. January 1 may be a year placeholder; exact first day is not independently established.'});
  r.orcidSourceCapture=h;
  mentions=h.otherEmploymentMentions;
  r.coverageNote=h.coverageNote+' Overlapping professor assertions consolidated; first job remains unresolved.';
 }else if(id===ids[3]){
  const h=input('histories',id,'.linkedin');r.profileUrl=h.profileUrl;
  r.linkedinSourceCapture={profileUrl:h.profileUrl,checkedAt:h.checkedAt,experienceAccess:h.experienceAccess,profileHistoryComplete:h.profileHistoryComplete,coverageNote:h.coverageNote,jobs:h.jobs,otherEmploymentMentions:h.otherEmploymentMentions};
  r.jobs[0].additionalSourceObservations=[...(r.jobs[0].additionalSourceObservations||[]),h.jobs[0]];
  // Group repeated service labels while retaining every original dated assertion.
  const groups=new Map();for(const m of h.otherEmploymentMentions){const key=m.titleAsWritten; if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}
  mentions=[...groups.values()].map(g=>({...g[0],evidenceNote:[...new Set(g.map(x=>x.evidenceNote)),'Source date labels: '+g.map(x=>x.datesAsWritten||'undated').join('; ')].join(' '),sourceObservations:g}));
  r.coverageNote='One accessible LinkedIn Experience entry corroborates the existing CMU role. Official service, advisory and fellowship observations are separate from employment; repeated labels are grouped with their original source dates.';
 }else if(id===ids[4]){
  const h=input('histories',id,'.official');r.officialSourceCapture=h;mentions=h.otherEmploymentMentions;
  // Existing chronology is more detailed; do not replace it by the grouped rank row.
  for(const [i,j] of [[0,0],[1,1],[2,2],[3,3],[10,5]])r.jobs[i].additionalSourceObservations=[...(r.jobs[i].additionalSourceObservations||[]),h.jobs[j]];
  mentions=[...mentions,{...h.jobs[4],evidenceNote:h.jobs[4].evidenceNote+' The 2011 aggregate end conflicts with biography professor-through-2012; existing individual ranks remain unchanged.'}];
  r.coverageNote='Official expanded Academic CV rechecked; existing twelve role entries retained without duplication. Aggregate Heriot-Watt end-year discrepancy remains explicit.';
 }else{
  r.coverageNote=p.historyObservation.coverageNote+' Existing chronology and source dates preserved.';
  if(p.historyObservation.orcidAffiliation)mentions=[...mentions,p.historyObservation.orcidAffiliation];
  if(id===ids[5]){
   r.jobs.push({...mentions[0],start:unknown(),end:unknown(),isCurrent:true});
   r.jobs.push({...mentions[1],start:{asWritten:'2011',year:2011,month:null,precision:'year'},end:unknown(),isCurrent:null});
   mentions=mentions.slice(2);
  }
 }
 r.otherEmploymentMentions.push(...mentions);
 if(d){r.degreeSourceObservation=d;r.degreeReview={status:'reported-doctorate',period:{asWritten:String(d.year),year:d.year,month:null,precision:'year'},field:d.field,checkedAt:d.checkedAt,sourceUrl:d.sources[0].url,evidenceNote:d.evidenceNote,limitations:d.remainingUnknowns};}
 audits.push({id,name:r.name,priorRoles:n,roles:r.jobs.length,netRoles:r.jobs.length-n,firstJobChanged:false});
}
for(let i=0;i<data.records.length;i++)if(!ids.includes(data.records[i].id))assert.deepEqual(data.records[i],before.records[i]);
write(`${dir}/prior-records.json`,before.records.filter(r=>ids.includes(r.id)));
write(`${dir}/audit.json`,{records:audits,unrelatedHistoriesUnchanged:true});
write('data/employment-histories.json',data);
