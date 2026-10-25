import fs from 'node:fs';
const src='research-handoff/universities/continuation-144/shard-a/iowa-state-university.doctoral.json';
const out='research-handoff/universities/continuation-145/shard-a/iowa-state-university.doctoral.json';
const d=JSON.parse(fs.readFileSync(src,'utf8'));
d.limitations=d.limitations.map(s=>s.startsWith('Current formal-title review progressed through five complete Graduate College programme pages')?'The 143 partial review recorded five completed programme pages and remaining technical/mathematical inventories; the 144 follow-up opened the full Graduate College index, eight engineering department programmes, mathematics/applied mathematics/statistics, and related named programmes, resolving the current formal-title inventory. The Supply Chain Management Business PhD remains a related nonqualifying formal title.':s);
fs.writeFileSync(out,JSON.stringify(d,null,2)+'\n');
