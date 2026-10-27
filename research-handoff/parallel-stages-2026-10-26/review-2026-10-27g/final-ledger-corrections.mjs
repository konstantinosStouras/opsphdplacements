import fs from 'node:fs';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const old=read('research/review-2026-10-27g-before/research-status.json').records,h=read('data/employment-histories.json'),proposals=read(`${b}/reviewed-ledger-proposals.json`);
const reasons={
 'roster:cornell-university:nikhil-garg':'The older Berkeley-first assessment omitted industry work. The complete CV and individually read LinkedIn show PredictWise Principal Data Scientist in May–November 2020, followed by both Berkeley postdoctoral and PredictWise advisory starts in November 2020. June dissertation submission is not formal conferral; exact completion and concurrent-job ordering remain unresolved. Berkeley is a documented postdoctoral appointment, not an established unique first new post-degree employer.',
 'roster:cornell-university:kyra-gan':'Harvard Statistics is the earliest documented postdoctoral appointment, dated 2022–2023. A professional biography reports the doctorate in May 2022, but the Harvard start month and an explicit degree-before-appointment sequence remain unestablished. The older assessment used same-year chronology alone. Retain the supported appointments and degree evidence, but mark the first new post-degree job unresolved pending that boundary.'
};
for(const [id,reason] of Object.entries(reasons)){
 const previous=old.find(r=>r.facultyId===id),history=h.records.find(r=>r.id===id);
 const sources=[...(history.sources||[]).filter(s=>s.url&&!/(unavailable|discovery|not-read|no-identity)/.test(s.outcome||'')).map(s=>({...s,title:s.title||`${history.name}: career evidence`})),...previous.sources];
 const r={facultyId:id,name:previous.name,status:'unresolved',checkedAt:'2026-10-27',phdYearVerified:previous.phdYearVerified,phdInstitutionVerified:previous.phdInstitutionVerified,reason,sources};
 proposals.records=proposals.records.filter(r=>r.facultyId!==id);proposals.records.push(r);
 history.firstJobAssessment={status:'unresolved',reason,reviewedAt:'2026-10-27'};
}
write(`${b}/withdrawn-first-job-prior.json`,old.filter(r=>reasons[r.facultyId]));write(`${b}/reviewed-ledger-proposals.json`,proposals);write('data/employment-histories.json',h);
