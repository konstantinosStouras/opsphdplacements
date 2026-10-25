// Reviewed, frozen continuation after published 753e78c. Do not refresh after applying.
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='research-handoff/universities/',dir=root+'continuation-182';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,r)=>fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');
const path=(n,f)=>root+`continuation-${n}/`+f;
const lse=read(path(171,'lse.doctoral.json'));
const observations=[
 ['https://info.lse.ac.uk/staff/departments-and-institutes','Full current academic department/institute inventory read; no Engineering faculty or school. Mathematics, Statistics, Methodology, Management and Data Science Institute separately checked.'],
 ['https://www.lse.ac.uk/statistics/prospective-students/phd-mphil/doctoral-programme','Actual Statistics doctoral programme and all four named groups read: Data Science, Probability in Finance and Insurance, Social Statistics, Time Series and Statistical Learning. No named Operations field in this inventory.'],
 ['https://www.lse.ac.uk/dsi/study/graduate-programmes','Full Data Science Institute graduate programme list read; OR and Analytics is explicitly MSc. Its sole linked doctorate is Data, Networks and Society; no additional OR PhD inferred from MSc.'],
 ['https://www.lse.ac.uk/study-at-lse/graduate/mphilphd-data-networks-and-society','Actual current doctoral overview and programme scope read: Department Media and Communications, social implications of digitisation/data/networks; no named Operations doctoral area.'],
 ['https://www.lse.ac.uk/methodology/study-in-methodology','Full Methodology degree inventory read: three doctorates in Demography, Social Research Methods, Computational Social Science.'],
 ['https://www.lse.ac.uk/methodology/study-in-methodology/mphilphd-in-computational-social-science','Actual prospective doctoral programme and application scope read: computational methods applied to social-science research, not an Operations doctoral field.']
].map(([url,note])=>({url,checkedAt:'2026-10-25',outcome:'read',note}));
lse.sources.push(...observations);lse.coverageComplete=true;
lse.branches.find(b=>b.branch==='engineering').reviewState='not-present';
lse.branches.find(b=>b.branch==='engineering').conclusion='Full official academic-unit inventory lists no Engineering faculty/school. Current Mathematics, Statistics, Data Science and Methodology doctoral inventories and plausible computational fields checked; the existing Mathematics Operations Research field is the single qualifying route found in this bounded inventory.';
lse.branches.find(b=>b.branch==='engineering').sourceUrls=observations.map(s=>s.url);
lse.limitations=['Current source-bounded academic-unit and plausible doctoral-field inventories reviewed; no historical programme census or individual doctorate verification is claimed.'];
for(const p of lse.programmes)p.existingProgramId=p.id;
write(dir+'/lse.doctoral-scope.json',lse);
const u=read('data/university-reviews.json').records.find(r=>r.id==='london-school-of-economics');
delete u.doctoralReview;u.status='reviewed';u.sources.push(...observations);u.limitations=['Mathematics is the actual PhD host; its generic title does not make it an Operations department. The programme qualifies through its explicit Operations Research doctoral field.'];write(dir+'/lse.unit.json',u);
const maryland=read(path(153,'shard-c/university-of-maryland.amsc-doctoral-application-proposal.json'));
maryland.programmes[0].limitations[0]='The current graduate catalogue names Operations Research within Applied Mathematics; the separately opened PhD requirements establish that same concentration, application-area examination and original dissertation. This is a cross-page doctoral-field linkage, not a separately titled Operations Research degree.';
write(dir+'/maryland.amsc-reviewed.json',maryland);
const sources=[],units=[],programmes=[];
for(const n of [156,157,158])for(const f of fs.readdirSync(path(n,'shard-a')).sort()){
 if(f.startsWith('university-of-zaragoza.'))continue; // revised doctoral-line interpretation is being researched
 if(f.endsWith('.source-addition.json'))sources.push(path(n,'shard-a/'+f));
 if(f.endsWith('.unit.json'))units.push(path(n,'shard-a/'+f));
 if(f.endsWith('.doctoral.json')&&!f.startsWith('university-of-kassel.'))programmes.push(path(n,'shard-a/'+f));
}
sources.push(path(158,'shard-a/university-of-zaragoza.source-addition.json'));
units.push(path(161,'shard-a/university-of-zaragoza.unit.json'));
programmes.push(path(161,'shard-a/university-of-zaragoza.doctoral.json'));
units.push(dir+'/lse.unit.json',path(172,'shard-b/san-jose-state-qualified-identity-closure.json'),path(173,'shard-b/tennessee-wesleyan-title-unit-closure.json'),path(176,'shard-b/texas-state-management-title-adjudication.json'));
programmes.push(path(152,'shard-c/university-of-melbourne.engineering-industrial-phd.json'),path(152,'shard-c/university-of-melbourne.business-administration-management-science-phd.json'),dir+'/maryland.amsc-reviewed.json');
const scopes=[dir+'/lse.doctoral-scope.json',path(183,'shard-b/memphis-current-formal-scope.json'),path(151,'shard-c/tbs-education.doctoral-title-scope.json')];
const m={baseCommit:'753e78cbd0e8083f2b9fb2932587c1c01fc11e92',sources,unitInputs:units,programmes,scopes};
m.frozenInputs=[...new Set([...sources,...sources.map(p=>read(p).sourceCatalogue),...units,...programmes,...scopes])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
write(dir+'/integration-manifest.json',m);console.log({sources:sources.length,units:units.length,programmes:programmes.length,scopes:scopes.length});
