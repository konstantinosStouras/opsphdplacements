import fs from 'node:fs';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const h=read('data/employment-histories.json'),old=read('research/review-2026-10-27g-before/research-status.json').records,p=read(`${b}/reviewed-ledger-proposals.json`);
const reasons={
 'peter-frazier':'The doctorate and Cornell assistant-professor start are both reported in June 2009; exact degree/start ordering remains unresolved. The fuller history refines industry and faculty ranks while preserving the Uber aggregate-title and Viaworks founder/employee conflicts.',
 'peter-jackson':'The authored CV reports a June 1978 Stanford PhD, while the official Cornell biography and LinkedIn education report 1980. Cornell starts in August 1980 on LinkedIn versus September in the CV. Until degree and start ordering are reconciled, the first new post-doctorate job remains unresolved. Retirement and later SUTD appointments are separately documented.',
 'raaz-dwivedi':'The previous joint Harvard/MIT postdoc-first assessment relied on year-only chronology. The fuller individual history dates the joint FODSI start to August 2021, while Berkeley education ends in August 2021; the August 11 dissertation report date is not formal conferral. Degree completion relative to the new appointment remains unresolved. Earlier industry roles and later Cornell/Traversal roles are retained without inventing degree-day ordering.'
};
for(const [slug,reason] of Object.entries(reasons)){
 const id='roster:cornell-university:'+slug,history=h.records.find(r=>r.id===id),previous=old.find(r=>r.facultyId===id);
 const sources=(history.sources||[]).filter(s=>s.url&&!/(unavailable|discovery|not-read|no-identity)/.test(s.outcome||'')).map(s=>({...s,title:s.title||`${history.name}: career evidence`}));
 const r={facultyId:id,name:previous.name,status:'unresolved',checkedAt:'2026-10-27',reason,sources};
 if(previous.phdYearVerified)r.phdYearVerified=previous.phdYearVerified;if(previous.phdInstitutionVerified)r.phdInstitutionVerified=previous.phdInstitutionVerified;
 p.records=p.records.filter(x=>x.facultyId!==id);p.records.push(r);history.firstJobAssessment={status:'unresolved',reason,reviewedAt:'2026-10-27'};
}
write(`${b}/reviewed-ledger-proposals.json`,p);write('data/employment-histories.json',h);
const withdrawn=read(`${b}/withdrawn-first-job-prior.json`);withdrawn.push(old.find(r=>r.facultyId==='roster:cornell-university:raaz-dwivedi'));write(`${b}/withdrawn-first-job-prior.json`,withdrawn);
