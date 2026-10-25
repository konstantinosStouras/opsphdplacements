import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='research-handoff/universities',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const run=(script,files,flags=[])=>execFileSync(process.execPath,[`scripts/${script}`,...files,...flags],{stdio:'inherit'});
const p=read(`${base}/continuation-136/shard-a/politecnico-di-milano.unit.json`);
p.decisions=read('data/universities.json').records.find(u=>u.id===p.id).departments.map(d=>({sourceDepartmentId:d.id,disposition:'not-a-unit',unitIds:[],reason:'Frozen faculty record names a doctorate institution, not a department. Actual DIG department is independently verified; individual doctorate claim remains discovery only.'}));
p.limitations=p.limitations.filter(s=>!s.includes('source-frame row decisions'));
const unit=`${base}/continuation-135/politecnico-di-milano.unit.integrator.json`;fs.writeFileSync(unit,JSON.stringify(p,null,2)+'\n');
const units=[unit,`${base}/continuation-135/shard-b/delft-unit.json`];
const doctoral=[`${base}/continuation-136/shard-a/politecnico-di-milano.doctoral.json`,`${base}/continuation-135/shard-b/delft-doctoral.json`];
const scopes=[`${base}/continuation-134/shard-c/ut-san-antonio.doctoral-scope-composite.json`];
run('merge-university-reviews.mjs',units,['--dry-run']);
if(process.argv.includes('--apply')){
 run('merge-university-reviews.mjs',units);
 run('merge-doctoral-proposals.mjs',doctoral);
 run('merge-doctoral-proposals.mjs',doctoral,['--apply']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only','--apply']);
 fs.writeFileSync(`${base}/continuation-135/second-cut-manifest.json`,JSON.stringify({integratedAt:'2026-10-25',units,doctoral,scopes},null,2)+'\n');
}
