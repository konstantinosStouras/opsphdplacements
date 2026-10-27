import fs from 'node:fs';import crypto from 'node:crypto';
const b='research-handoff/parallel-stages-2026-10-26/review-2026-10-27h',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const clean=o=>Array.isArray(o)?o.map(clean):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).filter(([k])=>!['addedAt','updatedAt'].includes(k)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,clean(v)])):o;
const changes={};
for(const f of fs.readdirSync('research/review-2026-10-27h-before').filter(f=>f.endsWith('.json')&&f!=='record-dates.json')){
 const prev=read('research/review-2026-10-27h-before/'+f),now=read('data/'+f);
 if(!Array.isArray(prev.records)||!Array.isArray(now.records))continue;
 const key=r=>r.id||r.facultyId||r.university||r.institution||r.employer;
 const before=new Map(prev.records.map(r=>[key(r),r])),after=new Map(now.records.map(r=>[key(r),r]));
 changes[f]={added:[],removed:[],changed:[]};
 for(const [id,r] of after)if(!before.has(id))changes[f].added.push(id);else if(JSON.stringify(clean(r))!==JSON.stringify(clean(before.get(id))))changes[f].changed.push(id);
 for(const id of before.keys())if(!after.has(id))changes[f].removed.push(id);
}
for(const f of ['faculty.json','faculty-roster-people.json','faculty-rosters.json','universities.json','university-reviews.json','doctoral-programs.json','graduate-lists.json','linkedin-histories.json'])if(Object.values(changes[f]||{}).some(a=>a.length))throw Error('Unexpected change '+f);
if(changes['employment-histories.json'].changed.length!==19||changes['employment-histories.json'].added.length||changes['employment-histories.json'].removed.length)throw Error('History cut mismatch');
if(changes['placements.json'].added.length!==4||changes['placements.json'].removed.length!==0)throw Error('Placement cut mismatch');
const reviewed=read(`${b}/public-history-changes.json`),now=read('data/employment-histories.json').records;
for(const r of reviewed)r.finalPublicSha256=crypto.createHash('sha256').update(JSON.stringify(now.find(h=>h.id===r.id))).digest('hex');
fs.writeFileSync(`${b}/public-history-changes.json`,JSON.stringify(reviewed,null,2)+'\n');
fs.writeFileSync(`${b}/public-preservation-audit.json`,JSON.stringify({checkedAt:'2026-10-27',changes,importedFactsPreserved:true,historyCount:19,newFirstJobs:4,withdrawnFirstJobs:0},null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(changes).filter(([,v])=>Object.values(v).some(x=>x.length)).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([x,a])=>[x,a.length]))]))));
