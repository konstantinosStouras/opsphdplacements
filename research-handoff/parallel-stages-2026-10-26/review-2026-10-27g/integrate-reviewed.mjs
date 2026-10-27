import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateCareerHistories} from '../../../assets/career-history.js';
const base='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const hash=d=>crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex');
const histories=read('data/employment-histories.json');
const prior=new Map(histories.records.map(r=>[r.id,r]));
const replacements=[];
for(const shard of ['shard-a','shard-b','shard-d','shard-e']){
 if(!fs.existsSync(`${base}/${shard}/audit.json`))continue;
 for(const a of read(`${base}/${shard}/audit.json`).records){
  const file=a.reviewedFile||a.output;
  if(!file||a.acceptedIdentity===false||a.disposition?.startsWith('held'))continue;
  replacements.push({id:a.id,priorSha256:a.priorSha256,replacement:read(`${base}/${shard}/${file}`)});
 }
}
replacements.push(...read(`${base}/shard-c/replacements.json`));
const ids=new Set();
for(const r of replacements){
 if(ids.has(r.id))throw Error('Duplicate replacement '+r.id);ids.add(r.id);
 if(hash(prior.get(r.id))!==r.priorSha256)throw Error('Public record changed since review '+r.id);
 for(const j of r.replacement.jobs)for(const k of ['start','end']){const d=j[k];if(d?.precision==='present')d.precision='unknown';if(d?.year!=null&&d?.month!=null)d.precision='month';}
 r.replacement.reviewStatus='partial';r.replacement.careerComplete=false;
 delete r.replacement.addedAt;delete r.replacement.updatedAt;
}
const jobs=read(`${base}/first-job-proposals.json`).records;
const ledger=read('data/research-status.json');
for(const r of replacements){
 const h=r.replacement,old=ledger.records.find(x=>x.facultyId===r.id),verified=jobs.find(x=>x.facultyId===r.id);
 if(verified){h.firstJobAssessment={status:'verified-earliest-documented-new-post-degree-job',employer:verified.employer,placementYear:verified.placementYear,reason:verified.reason,evidenceUrls:verified.sources.map(s=>s.url),reviewedAt:'2026-10-27'};continue;}
 if(!old||old.status==='verified')continue;
 const assessment=h.firstJobAssessment||{};
 const reason=assessment.reason||assessment.note||h.remainingUnknowns?.join(' ')||'Chronology reviewed, but the earliest new post-doctorate appointment remains unresolved.';
 const sources=(h.sources||[]).filter(s=>s.url&&!/(unavailable|discovery|not-read|no-identity)/.test(s.outcome||'')).map(s=>({...s,title:s.title||`${h.name}: individual career source`}));
 if(!sources.length)for(const j of h.jobs)if(!sources.some(s=>s.url===j.sourceUrl))sources.push({url:j.sourceUrl,title:`${h.name}: individual career source`,checkedAt:j.checkedAt});
 if(!sources.length)throw Error('No research source '+r.id);
 jobs.push({facultyId:r.id,name:old.name,status:'unresolved',checkedAt:'2026-10-27',reason,sources});
}
const by=new Map(replacements.map(r=>[r.id,r.replacement]));
histories.records=histories.records.map(r=>by.get(r.id)||r);
const known=new Set(['faculty','faculty-roster-people','graduate-lists'].flatMap(n=>read(`data/${n}.json`).records.map(r=>r.id)));
validateCareerHistories(histories,known);
write(`${base}/reviewed-ledger-proposals.json`,{records:jobs});
write(`${base}/public-history-changes.json`,replacements.map(r=>({id:r.id,name:r.replacement.name,priorSha256:r.priorSha256,reviewedSha256:hash(r.replacement),priorRoles:prior.get(r.id).jobs.length,roles:r.replacement.jobs.length})));
write('data/employment-histories.json',histories);
console.log(JSON.stringify({historyUpdates:replacements.length,priorRoles:replacements.reduce((s,r)=>s+prior.get(r.id).jobs.length,0),reviewedRoles:replacements.reduce((s,r)=>s+r.replacement.jobs.length,0),ledgerReviews:jobs.length}));
