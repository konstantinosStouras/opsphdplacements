import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='research-handoff/parallel-stages-2026-10-26/review-stage2-next-six-2026-10-28',lane='research-handoff/parallel-stages-2026-10-26/stage-2';
const ids=['23b71cb5794fc02b','a826ecacba048158','b356d209206abbc2','c40124a189f7ac98','7e4e2494267f00af','d367d41d6d8f349c'].map(x=>'omlist-'+x);
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(dir+'/inputs',{recursive:true});
const data=read('data/employment-histories.json'),before=structuredClone(data),audit=[];
for(const [n,id] of ids.entries()){
 const r=data.records.find(x=>x.id===id);assert.equal(r.checkedAt,'2026-10-20','Refuse replay/newer data');
 const h=read(`${lane}/histories/${id}.linkedin.json`),p=read(`${lane}/reviews/${id}.json`),d=read(`${lane}/degrees/${id}.json`);
 write(`${dir}/inputs/${id}.history.json`,h);write(`${dir}/inputs/${id}.review.json`,p);write(`${dir}/inputs/${id}.degree.json`,d);
 const old=structuredClone(r.jobs);
 const refine=(oi,hi)=>{r.jobs[oi]={...h.jobs[hi],priorSourceObservations:[old[oi]],additionalSourceUrls:[old[oi].sourceUrl]};};
 const observe=(oi,hi,note)=>{r.jobs[oi].additionalSourceObservations=[...(r.jobs[oi].additionalSourceObservations||[]),h.jobs[hi]];r.jobs[oi].evidenceNote+=' '+note;};
 r.previousCoverageNotes=[...(r.previousCoverageNotes||[]),{checkedAt:r.checkedAt,coverageNote:r.coverageNote,remainingUnknowns:r.remainingUnknowns}];
 r.checkedAt='2026-10-28';r.reviewStatus='partial';r.careerComplete=false;
 r.coverageNote=h.coverageNote+' Integrator reviewed the saved individual Chrome capture and reopened institutional biographies; not a new integrator LinkedIn read. Career remains partial.';
 r.remainingUnknowns=p.remainingUnknowns;r.accessLimitations=p.accessLimitations;
 r.profileUrl=h.profileUrl;r.linkedinSourceCapture={profileUrl:h.profileUrl,checkedAt:h.checkedAt,experienceAccess:h.experienceAccess,profileHistoryComplete:h.profileHistoryComplete,coverageNote:h.coverageNote,jobs:h.jobs,otherEmploymentMentions:h.otherEmploymentMentions};
 r.otherEmploymentMentions=[...(r.otherEmploymentMentions||[]),...(h.otherEmploymentMentions||[])];r.degreeSourceObservation=d;
 if(n===0){
  refine(16,0);refine(17,1);r.otherEmploymentMentions.push(h.jobs[2]);
  r.jobs[0].isCurrent=false;observe(0,2,'Duke service ends July 2026 on LinkedIn; the umbrella Professor entry does not establish full-professor rank from 2007 or named-chair start.');
 }else if(n===1){
  refine(0,1);refine(9,0);refine(3,3);refine(4,5);refine(5,7);refine(6,8);refine(7,9);
  observe(2,2,'LinkedIn ends this role June 2018; prior CV ends it 2019. Conflict unresolved.');r.otherEmploymentMentions.push(h.jobs[4],h.jobs[6]);
  r.jobs[9].evidenceNote+=' LinkedIn July 2021 associate start overlaps its assistant role through July 2023. MIT May 2023 award biography still calls him assistant professor; promotion date remains unresolved.';
  r.otherEmploymentMentions.push({sourceUrl:'https://mitsloan.mit.edu/faculty/directory/alexandre-jacquillat',checkedAt:'2026-10-28',evidenceNote:'Dated May 12, 2023 award biography calls Jacquillat Assistant Professor; November 17, 2023 news calls him Associate Professor. These observations conflict with LinkedIn July 2021 associate start, without proving the exact promotion date.'});
 }else if(n===2){
  refine(0,1);refine(1,5);refine(5,4);refine(6,2);r.jobs.push({...h.jobs[0],evidenceNote:h.jobs[0].evidenceNote+' Official KEDGE biography still says Assistant Professor; current rank conflict retained.'},h.jobs[3],...h.jobs.slice(6));
 }else if(n===3){refine(0,0);
 }else if(n===4){
  refine(11,1);r.jobs.push(h.jobs[0]);observe(0,2,'LinkedIn June 2017 start conflicts with CV August 2017; LinkedIn ends Indiana June 2023.');r.jobs[0].isCurrent=false;r.jobs[0].end=h.jobs[2].end;
  observe(2,3,'LinkedIn May 2017 end conflicts with CV July 2017.');r.otherEmploymentMentions.push(h.jobs[4]);
 }else if(n===5){
  refine(0,0);refine(1,2);refine(3,3);refine(6,4);r.jobs.push(h.jobs[1]);r.jobs[1].evidenceNote+=' Earlier CV and official biography describe NIST/Johns Hopkins jointly; not two separate postdocs.';
 }
 audit.push({id,name:r.name,oldRoles:old.length,newRoles:r.jobs.length,netRoles:r.jobs.length-old.length,firstJobChanged:false});
}
for(let i=0;i<data.records.length;i++)if(!ids.includes(data.records[i].id))assert.deepEqual(data.records[i],before.records[i]);
write(dir+'/prior-records.json',before.records.filter(r=>ids.includes(r.id)));write(dir+'/audit.json',{records:audit,unrelatedHistoriesUnchanged:true});write('data/employment-histories.json',data);
