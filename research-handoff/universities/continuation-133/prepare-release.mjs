import fs from 'node:fs';
import path from 'node:path';
const base='research-handoff/universities/continuation-133';
const files=['README.md','TODO.md','RESEARCH-DESIGN.md','WORKFLOW.md','RESEARCH-STATUS.md','index.html','assets/program-model.js','data/university-reviews.json','data/doctoral-programs.json','data/entities.json','data/record-dates.json','scripts/doctoral-proposals.test.js','scripts/validate-programs.mjs','scripts/merge-university-reviews.mjs','scripts/report-stage1-remaining.mjs','research-handoff/priorities/README.md','research-handoff/priorities/STAGE-1-REMAINING-2026-10-23.md','research-handoff/priorities/stage-1-doctoral-priority-queue.json','research-handoff/priorities/stage-1-university-queue.json'];
function collect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())collect(p);else if(/\.(json|md|mjs|txt)$/.test(p)&&!p.includes('university-of-windsor')&&!p.includes('universite-mohammed-vi'))files.push(p);}}
for(const n of [129,130,131,132,133])collect(`research-handoff/universities/continuation-${n}`);
for(const x of ['shard-a/ball-state-university.doctoral.json','shard-a/florida-polytechnic-university.doctoral.json','shard-a/kean-university.doctoral.json','shard-b/texas-a-m-university-corpus-christi-unit.json','shard-b/texas-a-m-university-corpus-christi-doctoral.json'])files.push(`research-handoff/universities/continuation-134/${x}`);
files.push(`${base}/release-files.txt`);
fs.writeFileSync(`${base}/release-files.txt`,[...new Set(files)].sort().join('\n')+'\n');
console.log('Prepared explicit release paths:',new Set(files).size);
