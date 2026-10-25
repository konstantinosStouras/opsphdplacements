import fs from 'node:fs';
const base='research-handoff/universities/continuation-128';
const files=new Set(['README.md','TODO.md','RESEARCH-DESIGN.md','WORKFLOW.md','RESEARCH-STATUS.md','index.html','assets/program-model.js','scripts/validate-programs.mjs','scripts/doctoral-proposals.test.js','data/doctoral-programs.json','data/universities.json','data/university-reviews.json','data/entities.json','data/record-dates.json','research-handoff/priorities/README.md','research-handoff/priorities/STAGE-1-REMAINING-2026-10-23.md','research-handoff/priorities/stage-1-doctoral-priority-queue.json','research-handoff/priorities/stage-1-university-queue.json']);
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else if(/\.(?:md|mjs|json)$/.test(p))files.add(p);}}
walk(base);
function visit(v){if(typeof v==='string'&&v.startsWith('research-handoff/')&&/\.(?:json|md|mjs)$/.test(v)&&fs.existsSync(v))files.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);}
for(const file of [...files])if(file.endsWith('.json'))visit(JSON.parse(fs.readFileSync(file,'utf8')));
for(const file of ['research-handoff/universities/continuation-45/shard-b/qatar-university-doctoral.json','research-handoff/universities/continuation-41/shard-a/indian-institute-of-technology-iit-bombay.doctoral.json','research-handoff/universities/continuation-44/shard-a/indiana-university-northwest.unit.json'])files.add(file);
const output=`${base}/integrator/release-files.txt`;files.add(output);
fs.writeFileSync(output,[...files].sort().join('\n')+'\n');console.log({reviewedReleaseFiles:files.size});
