import fs from 'node:fs';
const src='research-handoff/universities/continuation-143/shard-a/iowa-state-university.doctoral.json';
const dir='research-handoff/universities/continuation-144/shard-a';
fs.mkdirSync(dir,{recursive:true});
const d=JSON.parse(fs.readFileSync(src,'utf8'));
d.checkedAt='2026-10-25';
d.coverageComplete=true;
const b=d.branches.find(x=>x.branch==='engineering');
b.reviewState='checked';
b.conclusion='The complete current Graduate College programme index and eight College of Engineering department programmes were read, including named formal doctoral specialties where published. Exact eligible Industrial Engineering PhD remains. Aerospace research area Complex Systems and Optimization, Civil Transportation and Construction Engineering and Management specialties, and others do not name Operations, Management Science or Industrial Engineering. Mathematics, Applied Mathematics and Statistics PhD descriptions carry no matching formal specialty or host title. Industrial and Agricultural Technology PhD is hosted by Agricultural and Biosystems Engineering and has no qualifying formal title. Engineering Management and Systems Engineering are only masters/certificate programmes. Business and Technology PhD lists six formal specializations, including Supply Chain Management but no Operations, Management Science or Industrial Engineering. Healthcare Analytics and Operations is only a masters. No other current named doctoral route was identified within these opened inventories.';
const observations=[
['https://www.grad-college.iastate.edu/programs','Opened entire current Graduate College alphabetical programme index; followed all plausible business, engineering, mathematical and named Operations candidates.'],
['https://www.grad-college.iastate.edu/programs/aerospace_engineering','Exact Aerospace PhD; Complex Systems and Optimization is a research area, not qualifying formal specialization.'],
['https://www.grad-college.iastate.edu/programs/agricultural_and_biosystems_engineering','Exact Agricultural and Biosystems Engineering PhD; only named doctorate specialization is Predictive Plant Phenomics.'],
['https://www.grad-college.iastate.edu/programs/chemical_engineering','Exact Chemical Engineering PhD and four formal specialty names, none qualifying.'],
['https://www.grad-college.iastate.edu/programs/civil_engineering','Exact Civil Engineering PhD and seven named specialties including Transportation and Construction Engineering and Management, none qualifying by required title.'],
['https://www.grad-college.iastate.edu/programs/mathematics','Exact Mathematics PhD and Department of Mathematics; no qualifying named field.'],
['https://www.grad-college.iastate.edu/programs/applied_mathematics','Exact Applied Mathematics PhD; no qualifying named field.'],
['https://www.grad-college.iastate.edu/programs/statistics','Exact Statistics PhD and host Department of Statistics; no qualifying named field.'],
['https://www.grad-college.iastate.edu/programs/industrial_and_agricultural_technology','Exact Industrial and Agricultural Technology PhD hosted in Agricultural and Biosystems Engineering; Industrial Technology is not Industrial Engineering.'],
['https://www.grad-college.iastate.edu/programs/engineering_management','Engineering Management has only MEng awards, not a PhD.'],
['https://www.grad-college.iastate.edu/programs/systems_engineering','Systems Engineering has only MEng and certificate awards, not a PhD.'],
['https://www.grad-college.iastate.edu/programs/business_and_technology','Business and Technology PhD has six formal specialties including Supply Chain Management, none with required title wording.'],
['https://www.grad-college.iastate.edu/programs/supply_chain_management','Standalone Supply Chain Management programme has MS and certificate only; its Business PhD specialty is separately recorded as nonqualifying title.'],
['https://www.grad-college.iastate.edu/programs/industrial_engineering','Exact Industrial Engineering PhD and formal Operations Research/Analytics focus verified; one already registered programme, not duplicate.']
];
for(const [url,note] of observations){b.sourceUrls.push(url);d.sources.push({url,checkedAt:'2026-10-25',outcome:'read',note});}
d.limitations=d.limitations.map(s=>s.startsWith('Industrial and Agricultural Technology PhD')?'Historical 22 October topic-scope question: Industrial and Agricultural Technology PhD was not assumed equivalent to Industrial Engineering; 25 October official programme title and Agricultural and Biosystems Engineering host confirm it does not qualify by named title.':s).map(s=>s.startsWith('Other non-IMSE engineering doctoral scopes')?'Historical 22 October topic-scope gap: non-IMSE engineering research fields were incomplete; current official programme/specialization titles are now inventoried from the Graduate College and Engineering pages. Research-topic census remains outside the strict named-title scope.':s);
d.limitations.unshift('CoverageComplete means the current named-title doctoral scope in the opened full Graduate College index and relevant business, engineering and mathematical programme inventories; it is not a census of all related research topics or historical programmes.');
fs.writeFileSync(`${dir}/iowa-state-university.doctoral.json`,JSON.stringify(d,null,2)+'\n');
