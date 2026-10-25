import fs from 'node:fs';
import crypto from 'node:crypto';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
const base='research-handoff/universities/continuation-141',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const reviews=read('data/university-reviews.json');
for(const id of ['depauw-university','desales-university']){
 const d=reviews.records.find(r=>r.id===id).doctoralReview;
 const p={universityId:id,...structuredClone(d),programmes:[],checkedAt:'2026-10-25',coverageComplete:true};delete p.programmeIds;
 for(const b of p.branches)b.reviewState='checked';
 p.limitations.push('25 October integrator adjudication of actually read 21 October complete current school/degree inventories. Current source-bounded negative scope is complete; an unperformed worldwide or historical census is not a reason to mark these current branches incomplete. No new source read or source-date refresh claimed.');
 write(`${base}/${id}.current-scope.json`,p);
}
const observations=[
 {universityId:'koc-university',checkedAt:'2026-10-25',status:'blocked-source-followup',url:'https://gsb.ku.edu.tr/programs/full-time-programs/phd-in-business/',outcome:'blocked',note:'Official source opened through web tool returned HTTP403. No content read or bypass; previous title/host question stays pending.'},
 {universityId:'hamad-bin-khalifa-university',checkedAt:'2026-10-25',status:'blocked-source-followup',urls:['https://www.hbku.edu.qa/en/cse/phd-logistics-supply-chain-management','https://www.hbku.edu.qa/en/cse/divisions'],outcome:'blocked',note:'Both official pages returned HTTP403 through web tool. No content read or bypass; host wording question stays pending.'},
 {universityId:'ewha-womans-university',checkedAt:'2026-10-25',status:'partial-title-followup',urls:['https://biz.ewha.ac.kr/bizeng/biz/curriculum-business-science.do','https://biz.ewha.ac.kr/bizeng/biz/management-science.do'],outcome:'read',note:'Full current returned English pages read. MA/PhD curriculum heading is Management Decision Science; general BA/MA/PhD navigation concentration page says Management Science and describes a major. Course titles cannot establish exact doctoral specialization; degree-level specificity remains unresolved. Crawl labels two weeks and two days retained.'},
 {universityId:'tel-aviv-university',checkedAt:'2026-10-25',status:'partial-title-followup',urls:['https://en-coller.tau.ac.il/the-programs/degree/doctoral','https://en-coller.tau.ac.il/faculty-research','https://coller.tau.ac.il/sites/nihul.tau.ac.il/files/media_server/Recanati/management/phd/Application-phd.pdf'],outcome:'read',note:'Full programme page and three-page blank official application read. Applicant must specify specialization, but form contains a free field without named choices. Faculty page lists OR expertise and Operational Strategy; neither settles formal doctoral specialization. No individual applications or people collected.'}
];
write(`${base}/root-title-followup-observations.json`,{checkedAt:'2026-10-25',accessMethod:'web.open/click actual official HTML and PDF text',observations});
const data=read('data/doctoral-programs.json'),p=data.records.find(p=>p.id==='erasmus-university-rotterdam--management-economics-bplis');
const sources=[
 {url:'https://www.rsm.nl/faculty-research/phd-in-management/full-time-phd-programme/',note:'Actual full-time PhD page names BPLIS among five specializations, describes operations and innovation management within it, and explicitly lists current PhD candidates by department, including Technology and Operations Management. Original research dissertation and defence explicit.'},
 {url:'https://www.rsm.nl/faculty-research/departments/technology-and-operations-management/',note:'Actual formal TOM department page identifies research and teaching in business information, innovation and supply-chain management, and current PhD provision. Department identity and scope read; publication list not used for individual career research.'},
 {url:'https://www.rsm.nl/faculty-research/departments/technology-and-operations-management/faculty/?cHash=6e8c2657da99049de5af9b46df4d3bf0&tx_erimmisaffiliates%5Bfilters%5D%5BfacultyPosition%5D=phd_candidate',note:'Followed programme page department PhD-candidate link; actual result heading and PhD Candidate filter confirm doctoral candidates in TOM. No roster copied or individual degrees verified.'}
];
const audit={programmeId:p.id,assessedAt:'2026-10-25',priorTitleScopeReview:p.titleScopeReview,decision:'retain',reason:'Fresh actual doctoral programme page directly connects its doctoral candidates to the qualifying Technology and Operations Management department. BPLIS includes programme-named operations and innovation management. Central ERIM administration is compatible with the directly evidenced academic department; no separate award invented.',sources};
if(process.argv.includes('--apply')){
 for(const s of sources){const id='source-'+crypto.createHash('sha256').update(s.url+'|2026-10-25').digest('hex').slice(0,14);if(!p.sources.some(x=>x.id===id))p.sources.push({id,url:s.url,title:s.note,notes:s.note,lastCheckedAt:'2026-10-25',sourceType:'official-primary',access:'opened-and-read'});}
 p.priorTitleScopeReviews=[...(p.priorTitleScopeReviews||[]),p.titleScopeReview];delete p.titleScopeReview;
 p.lastCheckedAt='2026-10-25';p.checkedAt='2026-10-25';
 p.limitations.push('25 October direct programme-to-TOM doctoral host relationship verified. ERIM remains central programme administration; BPLIS is one specialization, not a separate award per departmental research theme.');
 validatePrograms(data);write('data/doctoral-programs.json',data);write(`${base}/erasmus-title-resolution.json`,audit);
}
