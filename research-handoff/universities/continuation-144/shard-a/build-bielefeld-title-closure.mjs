import fs from 'node:fs';
const src='research-handoff/universities/continuation-17/shard-a/bielefeld-university.doctoral.json';
const dir='research-handoff/universities/continuation-144/shard-a';
fs.mkdirSync(dir,{recursive:true});
const d=JSON.parse(fs.readFileSync(src,'utf8'));
d.checkedAt='2026-10-25';
d.status='no-qualifying-programme-verified';
d.coverageComplete=true;
d.programmes=[];
const business=d.branches.find(x=>x.branch==='business');
business.reviewState='checked';
business.conclusion='Current BiGSEM doctoral programme is Economics and Management with four named profiles Economics, Finance, Management and Data Science; none names Operations, Management Science or Industrial Engineering. Full Faculty of Business Administration and Economics research/teaching-unit inventory read 25 October: Decision and Operation Technologies, Decision Analytics and Controlling und Produktionswirtschaft are research/teaching areas, not formal qualifying doctoral profiles or departments; singular Operation does not satisfy the explicit Operations title rule. An exact doctoral award for BiGSEM remains unverified but cannot produce a qualifying named route from this inventory.';
business.sourceUrls.push('https://www.uni-bielefeld.de/fakultaeten/wirtschaftswissenschaften/fakultaet/lehr-und-forschungsbereich/');
const technical=d.branches.find(x=>x.branch==='engineering');
technical.reviewState='checked';
technical.conclusion='Current Faculty of Technology doctoral overview explicitly awards Dr. rer. nat. or Dr.-Ing. and names only two structured doctoral programmes, Intelligent Systems and Bioinformatics; neither title qualifies. Its full research-group overview lists Intelligent Systems, Bioinformatics and Biotechnology. Faculty of Mathematics current doctoral overview explicitly awards Dr. math. in Mathematics or Dr. phil. in didactics; neither programme or faculty title qualifies. No title-matching Operations, Management Science or Industrial Engineering doctorate or host identified in these official branch inventories.';
technical.sourceUrls.push('https://www.uni-bielefeld.de/fakultaeten/technische-fakultaet/studium/promotion/','https://www.uni-bielefeld.de/fakultaeten/technische-fakultaet/forschung/ag-ueberblick/','https://www.uni-bielefeld.de/fakultaeten/mathematik/forschung/promotion/');
const observations=[
['https://www.uni-bielefeld.de/fakultaeten/wirtschaftswissenschaften/einrichtungen/bigsem/','Opened full current BiGSEM programme/profile list; Economics and Management with Economics, Finance, Management, Data Science.'],
['https://www.uni-bielefeld.de/fakultaeten/wirtschaftswissenschaften/fakultaet/lehr-und-forschungsbereich/','Opened full current business/economics research-and-teaching-unit inventory; Decision and Operation Technologies is an area, singular Operation, with no named qualifying doctoral profile.'],
['https://www.uni-bielefeld.de/fakultaeten/technische-fakultaet/studium/promotion/','Opened full current Faculty of Technology doctorate page: Dr. rer. nat./Dr.-Ing. awards and only Intelligent Systems/Bioinformatics structured doctoral programme titles.'],
['https://www.uni-bielefeld.de/fakultaeten/technische-fakultaet/forschung/ag-ueberblick/','Opened full Technology research-group inventory: Intelligent Systems, Bioinformatics, Biotechnology, no qualifying unit title.'],
['https://www.uni-bielefeld.de/fakultaeten/mathematik/forschung/promotion/','Opened full Mathematics doctoral overview: Mathematics Dr. math. and didactics Dr. phil., no named qualifying route.'],
['https://www.uni-bielefeld.de/fakultaeten/mathematik/studium/promotion/','Attempted inferred Mathematics path returned 404; followed actual Faculty Mathematics navigation to /forschung/promotion/ and read it.']
];
for(const [url,note] of observations)d.sources.push({url,checkedAt:'2026-10-25',outcome:note.includes('returned 404')?'blocked':'read',note});
d.limitations=['Current official named-title doctoral scope is complete across the opened BiGSEM, Faculty of Technology and Faculty of Mathematics inventories. The prior exact BiGSEM award and broad Management research-topic mapping remain unresolved historical/topic questions; no qualifying title is inferred.'];
fs.writeFileSync(`${dir}/bielefeld-university.doctoral.json`,JSON.stringify(d,null,2)+'\n');
