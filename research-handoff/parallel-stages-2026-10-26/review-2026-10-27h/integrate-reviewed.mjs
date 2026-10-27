import fs from 'node:fs';import crypto from 'node:crypto';import {validateCareerHistories} from '../../../assets/career-history.js';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27h',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n'),hash=d=>crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex');
const data=read('data/employment-histories.json'),prior=new Map(data.records.map(r=>[r.id,r]));
const repl=['a','b','c'].flatMap(s=>read(`${b}/shard-${s}/replacements.json`));
if(repl.length!==19||new Set(repl.map(r=>r.id)).size!==19)throw Error('Expected19uniqueacceptedhistories');
for(const r of repl){if(hash(prior.get(r.id))!==r.priorSha256)throw Error('Prior changed '+r.id);delete r.replacement.addedAt;delete r.replacement.updatedAt;r.replacement.reviewStatus='partial';r.replacement.careerComplete=false;}
const ledger=read('data/research-status.json').records,jobs=read(`${b}/first-job-proposals.json`).records,byJob=new Map(jobs.map(r=>[r.facultyId,r]));
for(const r of repl){const h=r.replacement,old=ledger.find(x=>x.facultyId===r.id),verified=byJob.get(r.id);if(verified){h.firstJobAssessment={status:'verified-earliest-documented-new-post-degree-job',employer:verified.employer,placementYear:verified.placementYear,reason:verified.reason,evidenceUrls:verified.sources.map(s=>s.url),reviewedAt:'2026-10-27'};continue;}if(old.status==='verified')continue;
const reason=h.firstJobAssessment?.reason||h.firstJobAssessment?.note||h.remainingUnknowns?.join(' ')||'The career sources were reviewed, but the first new appointment after completed doctoral study remains unresolved.';
const sources=[...new Map((h.sources||[]).filter(s=>s.url&&!/unavailable|discovery|no-matched|no-identity|404|403|502|interrupted|header-only|search-no|timeout/.test(s.outcome||'')).map(s=>[s.url,{url:s.url,title:s.title||`${h.name}: career evidence`,checkedAt:s.checkedAt}])).values()];
if(!sources.length)throw Error('No substantive source '+h.id);
jobs.push({facultyId:h.id,name:old.name,status:'unresolved',checkedAt:'2026-10-27',reason,sources});}
const by=new Map(repl.map(r=>[r.id,r.replacement]));data.records=data.records.map(r=>by.get(r.id)||r);const known=new Set(['faculty','faculty-roster-people','graduate-lists'].flatMap(n=>read(`data/${n}.json`).records.map(r=>r.id)));validateCareerHistories(data,known);
write(`${b}/reviewed-ledger-proposals.json`,{records:jobs});write(`${b}/public-history-changes.json`,repl.map(r=>({id:r.id,name:r.replacement.name,priorSha256:r.priorSha256,reviewedSha256:hash(r.replacement),priorRoles:prior.get(r.id).jobs.length,roles:r.replacement.jobs.length})));
write('data/employment-histories.json',data);console.log(JSON.stringify({historyUpdates:repl.length,priorRoles:repl.reduce((n,r)=>n+prior.get(r.id).jobs.length,0),roles:repl.reduce((n,r)=>n+r.replacement.jobs.length,0),ledgerUpdates:jobs.length}));
