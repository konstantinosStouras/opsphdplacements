import fs from 'node:fs';
const src='research-handoff/universities/continuation-8/shard-a/iowa-state-university.doctoral.json';
const out='research-handoff/universities/continuation-143/shard-a/iowa-state-university.doctoral.json';
const d=JSON.parse(fs.readFileSync(src,'utf8'));
d.checkedAt='2026-10-25';
d.programmes=d.programmes.filter(p=>p.id==='iowa-state-university--industrial-engineering-phd');
const b=d.branches.find(x=>x.branch==='engineering');
b.conclusion+=' Full current Graduate College programme pages opened 25 October for Computer Science, Electrical, Mechanical, and Materials Science and Engineering: each has PhD award plus published named specializations; none names Operations, Management Science or Industrial Engineering. Healthcare Analytics and Operations is explicitly only an online masters. Other engineering/mathematical doctoral specialties remain to be inventoried, so coverage remains partial.';
const notes=[
['computer_science','Exact Computer Science PhD and six formal specialization names read; none Operations/MS/IE.'],
['electrical_engineering','Exact Electrical Engineering PhD and eight transcript-listed formal specialization names read; none Operations/MS/IE.'],
['mechanical_engineering','Exact Mechanical Engineering PhD and formal Predictive Plant Phenomics specialty plus five areas of emphasis read; none Operations/MS/IE.'],
['materials_science_and_engineering','Exact Materials Science and Engineering PhD and six formal specialization names read; none Operations/MS/IE.'],
['healthcare_analytics_and_operations','Name matches Operations but degree offered is only online Master of Healthcare Analytics and Operations, no PhD.']
];
for(const [slug,note] of notes){const url=`https://www.grad-college.iastate.edu/programs/${slug}`;b.sourceUrls.push(url);d.sources.push({url,checkedAt:'2026-10-25',outcome:'read',note});}
d.limitations.unshift('Current formal-title review progressed through five complete Graduate College programme pages; remaining technical/mathematical specialty inventories are not yet complete. Supply Chain Management Business PhD is a related formal specialization but not a qualifying Ops/MS/IE title.');
fs.writeFileSync(out,JSON.stringify(d,null,2)+'\n');
