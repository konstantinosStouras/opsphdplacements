import fs from 'node:fs';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27g',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const ids=new Set(read(`${b}/reviewed-ledger-proposals.json`).records.map(r=>r.facultyId));
const old=read('research/review-2026-10-27g-before/placements.json'),d=read('data/placements.json'),by=new Map(old.records.map(r=>[r.id,r]));
d.records=d.records.map(r=>ids.has(r.facultyId)?r:by.get(r.id));if(d.records.some(r=>!r))throw Error('Unexpected placement');write('data/placements.json',d);
const stamps=read('data/record-dates.json'),prior=read('research/review-2026-10-27g-before/record-dates.json');
// Restore stamps for wholly unaffected original people/placements to remove transient merger churn.
for(const file of ['faculty.json','faculty-roster-people.json','placements.json','research-status.json'])for(const [id,value] of Object.entries(prior.files[file]||{})){
 const personId=file==='placements.json'?id.replace(/^first-/,''):id;
 if(!ids.has(personId))stamps.files[file][id]=value;
}
write('data/record-dates.json',stamps);
