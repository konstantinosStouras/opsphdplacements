import fs from 'node:fs';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const h=read('data/employment-histories.json'),ledger=read('data/research-status.json'),proposals=read(`${b}/reviewed-ledger-proposals.json`);
for(const slug of ['omar-el-housni','paul-golz']){
 const id='roster:cornell-university:'+slug,old=ledger.records.find(r=>r.facultyId===id),history=h.records.find(r=>r.id===id);
 const sources=(history.sources||[]).filter(s=>s.url&&!/(unavailable|discovery|not-read|no-identity)/.test(s.outcome||'')).map(s=>({...s,title:s.title||`${old.name}: career evidence`}));
 let r={facultyId:id,name:old.name,status:'unresolved',checkedAt:'2026-10-27',reason:history.firstJobAssessment.reason,sources};
 if(slug==='paul-golz'){
  const evidenceUrl='https://csd.cs.cmu.edu/academics/doctoral/degrees-conferred/paul-golz';
  const reason='CMU’s individual degrees-conferred record explicitly states graduation in August 2022. The identity-matched individual LinkedIn history, read in full, dates Harvard Postdoctoral Researcher from September 2022 to July 2023; the authored CV corroborates the appointment. Harvard is the earliest documented new post-degree role. Earlier company teaching and internships precede this degree; exact conferral day and complete lifetime employment remain unknown.';
  r={...r,status:'verified',employer:'Harvard University',position:'Postdoctoral Researcher',placementYear:2022,category:'postdoc',phdYearVerified:2022,phdInstitutionVerified:'Carnegie Mellon University',evidenceUrl,evidenceNote:reason,reason};
  if(!r.sources.some(s=>s.url===evidenceUrl))r.sources.push({url:evidenceUrl,title:'CMU individual degree record: Paul Gölz',checkedAt:'2026-10-27',notes:'Computer Science PhD; graduated August 2022; advisor and thesis match.'});
  history.firstJobAssessment={status:'verified-earliest-documented-new-post-degree-job',employer:r.employer,placementYear:2022,reason,reviewedAt:'2026-10-27'};
 }
 proposals.records=proposals.records.filter(x=>x.facultyId!==id);proposals.records.push(r);
}
write(`${b}/reviewed-ledger-proposals.json`,proposals);write('data/employment-histories.json',h);
