import fs from 'node:fs';
import path from 'node:path';
const out=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:C:)/,'C:'));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g';
const backup='research/review-2026-10-27g-before';fs.mkdirSync(backup,{recursive:true});
for(const f of fs.readdirSync('data').filter(f=>f.endsWith('.json')))if(!fs.existsSync(`${backup}/${f}`))fs.copyFileSync(`data/${f}`,`${backup}/${f}`);
const ledger=read('data/research-status.json').records;
const specs=[
['bruce-turnbull','Stanford University','Assistant Professor (visiting faculty), Statistics and Community and Preventive Medicine',1971,'other-academic',1971,'Cornell University','https://www.duffield.cornell.edu/people/bruce-william-turnbull/','Cornell explicitly places Stanford after the doctorate. The authored CV lists Stanford as the earliest appointment, September 1971–September 1972. LinkedIn reports an August start; the year agrees, and the month conflict remains explicit. Tenure-track status is not established.'],
['david-alan-goldberg','Georgia Institute of Technology','Assistant Professor, Industrial and Systems Engineering',2011,'tenure-track',2011,'Massachusetts Institute of Technology','https://people.orie.cornell.edu/dag369/ftp/David_Goldberg_CV_2_12_2020.pdf','The authored CV lists an earned MIT PhD in May 2011 and the earliest subsequent employment as Georgia Tech assistant professor from August 2011. Earlier listed industry roles precede the degree. This establishes the earliest documented new post-degree job, not an exhaustive account of every possible intervening activity.'],
['david-williamson','Cornell University','NSF Postdoctoral Fellow',1994,'postdoc',1993,'Massachusetts Institute of Technology','https://www.davidpwilliamson.net/work/files/cv.pdf','The authored CV gives the MIT PhD in September 1993, Cornell postdoctoral employment in 1994 and IBM from January 1995. The Cornell postdoc is the earliest documented new post-degree appointment. The separate 1993–1994 NSF funding interval is not used to invent an employment start month.'],
['gennady-samorodnitsky','University of North Carolina at Chapel Hill','Post-Doctoral Fellow, Center for Stochastic Processes',1986,'postdoc',1986,'Technion - Israel Institute of Technology','https://stat.cornell.edu/people/gennady-samorodnitsky','Cornell explicitly states that after completing his doctorate he went first to UNC and then Boston. The authored CV dates the UNC postdoctoral fellowship July 1986–August 1987 and the DSc in Statistics to 1986. The exact degree month is unknown; the explicit relative sequence supports the first documented post-degree appointment.'],
['jamol-j-pender','Columbia University','Post-Doctoral Fellow, Industrial Engineering and Operations Research',2013,'postdoc',2013,'Princeton University','https://orfe.princeton.edu/graduate/job-placement','Princeton explicitly identifies Columbia IEOR Post-Doctoral Fellow as Pender’s first position in its 2013 graduate table. Name, advisor and thesis match the individual CV. The CV dates the role August 2013–June 2015; Columbia uses Visiting Research Scholar for the same appointment. Exact degree and start days remain unknown.']
];
const rows=specs.map(([slug,employer,position,placementYear,category,phdYearVerified,phdInstitutionVerified,evidenceUrl,evidenceNote])=>{
 const id=`roster:cornell-university:${slug}`,prior=ledger.find(r=>r.facultyId===id);
 const proposal=read(`research-handoff/parallel-stages-2026-10-26/stage-3/corrections/${slug}-2026-10-27.json`);
 const sources=proposal.sources.filter(s=>!/(unavailable|discovery|no-identity)/.test(s.outcome||'')).map(s=>({url:s.url,title:`${prior.name}: career evidence`,checkedAt:s.checkedAt,notes:s.note||s.outcome}));
 return {facultyId:id,name:prior.name,status:'verified',checkedAt:'2026-10-27',employer,position,placementYear,category,phdYearVerified,phdInstitutionVerified,evidenceUrl,evidenceNote,reason:evidenceNote,sources};
});
const top=structuredClone(ledger.find(r=>r.facultyId==='roster:cornell-university:huseyin-topaloglu'));
delete top.addedAt;delete top.updatedAt;top.checkedAt='2026-10-27';
top.reason+=' A contemporaneous November 2002 Lehigh biography explicitly places an additional year as Princeton research fellow after the PhD and before Cornell. Exact degree/start months remain unknown.';
top.evidenceNote+=' The contemporaneous Lehigh biography corroborates that relative sequence.';
top.sources.push({url:'https://coral.ise.lehigh.edu/wp-content/uploads/coralseminar/ipsem/abstracts.html',title:'Lehigh CORAL seminar, 14 November 2002: Huseyin Topaloglu',checkedAt:'2026-10-27',notes:'PhD in 2001, another year as Princeton research fellow, then Cornell in 2002; explicit relative sequence.'});rows.push(top);
fs.writeFileSync(`${base}/first-job-proposals.json`,JSON.stringify({records:rows},null,2)+'\n');
fs.writeFileSync(`${base}/first-job-prior.json`,JSON.stringify(ledger.filter(r=>rows.some(x=>x.facultyId===r.facultyId)),null,2)+'\n');
console.log('Prepared five new first-job findings and one corroborated existing finding; public data unchanged.');
