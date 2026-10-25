import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='research-handoff/universities',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const run=(script,files,flags=[])=>execFileSync(process.execPath,[`scripts/${script}`,...files,...flags],{stdio:'inherit'});
const universities=read('data/universities.json');
const units=[`${base}/continuation-136/shard-a/technical-university-of-berlin.unit.json`];
for(const id of ['university-of-reading','university-of-st-gallen']){
 const p=read(`${base}/continuation-137/shard-a/${id}.unit.json`);
 p.decisions=universities.records.find(u=>u.id===id).departments.map(d=>({sourceDepartmentId:d.id,disposition:'not-a-unit',unitIds:[],reason:'Reported doctorate university from frozen OM List faculty record, not a department. Current official institutional facts reviewed separately.'}));
 p.limitations=p.limitations.filter(s=>!s.includes('source-frame row'));
 const file=`${base}/continuation-135/${id}.unit.integrator.json`;write(file,p);units.push(file);
}
const reading=read(`${base}/continuation-137/shard-a/university-of-reading.doctoral.json`);
reading.coverageComplete=false;
reading.branches.find(b=>b.branch==='engineering').reviewState='partial';
reading.branches.find(b=>b.branch==='engineering').conclusion+=' Exact named doctoral fields within broad mathematical/computational degrees have not yet been read; the degree-title index alone does not exclude additional eligible specializations.';
reading.limitations.push('Integrator held current engineering scope completion pending exact doctoral fields, consistently with the UTSA named-field review gate. The verified Informatics and Operations PhD is unaffected.');
const readingFile=`${base}/continuation-135/university-of-reading.doctoral.integrator.json`;write(readingFile,reading);
const doctoral=[`${base}/continuation-136/shard-a/technical-university-of-berlin.doctoral.json`,readingFile,`${base}/continuation-137/shard-a/university-of-st-gallen.doctoral.json`];
run('merge-university-reviews.mjs',units,['--dry-run']);
if(process.argv.includes('--apply')){
 run('merge-university-reviews.mjs',units);
 run('merge-doctoral-proposals.mjs',doctoral);
 run('merge-doctoral-proposals.mjs',doctoral,['--apply']);
 write(`${base}/continuation-135/third-cut-manifest.json`,{integratedAt:'2026-10-25',units,doctoral});
}
