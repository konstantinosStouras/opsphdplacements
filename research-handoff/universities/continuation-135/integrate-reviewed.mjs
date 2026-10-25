import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='research-handoff/universities';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const run=(script,files,flags=[])=>execFileSync(process.execPath,[`scripts/${script}`,...files,...flags],{stdio:'inherit'});
const universities=read('data/universities.json');
const adjusted=[];
for(const id of ['indian-institute-of-technology-delhi','indian-institute-of-management-calcutta']){
 const p=read(`${base}/continuation-135/shard-a/${id}.unit.json`);
 p.decisions=universities.records.find(u=>u.id===id).departments.map(d=>({sourceDepartmentId:d.id,disposition:'not-a-unit',unitIds:[],reason:'Frozen faculty assertion names a doctorate institution, not an administrative department. Individual degree claims remain unverified discovery leads.'}));
 p.limitations=p.limitations.filter(s=>!s.includes('source-frame row disposition'));
 p.limitations.push('Current wider university unit and doctoral scope remains incomplete; source assertions are reconciled without treating reported degrees as verified.');
 const file=`${base}/continuation-135/${id}.unit.integrator.json`;write(file,p);adjusted.push(file);
}
const cal=read(`${base}/continuation-135/shard-a/indian-institute-of-management-calcutta.doctoral.json`);
cal.programmes[0].department=null;
cal.programmes[0].limitations.push('Operations Management is an academic group linked through the reviewed unit ID; it is not relabelled as an administrative department.');
const calFile=`${base}/continuation-135/indian-institute-of-management-calcutta.doctoral.integrator.json`;write(calFile,cal);
const units=[...adjusted,`${base}/continuation-135/shard-b/southampton-unit.json`,...['university-of-windsor','universite-mohammed-vi-polytechnique'].map(id=>`${base}/continuation-133/shard-c/${id}.unit.json`),`${base}/continuation-134/shard-b/the-hebrew-university-of-jerusalem-unit.json`];
const doctoral=[...['university-of-windsor','universite-mohammed-vi-polytechnique'].map(id=>`${base}/continuation-133/shard-c/${id}.doctoral.json`),...['memorial-university-of-newfoundland','the-hebrew-university-of-jerusalem'].map(id=>`${base}/continuation-134/shard-b/${id}-doctoral.json`),...['ajman-university','dakota-state-university'].map(id=>`${base}/continuation-134/shard-a/${id}.doctoral.json`),...['georgia-state-university','abu-dhabi-university','indian-institute-of-technology-delhi'].map(id=>`${base}/continuation-135/shard-a/${id}.doctoral.json`),calFile,`${base}/continuation-135/shard-b/southampton-doctoral.json`];
const scopes=['skema-business-school-doctoral','technical-university-of-munich-doctoral-followup','maastricht-university-doctoral-followup','shanghai-jiao-tong-university-doctoral-followup','peking-university-doctoral-followup'].map(n=>`${base}/continuation-134/shard-b/${n}.json`);
run('merge-university-reviews.mjs',units,['--dry-run']);
if(process.argv.includes('--apply')){
 run('merge-university-reviews.mjs',units);
 run('merge-doctoral-proposals.mjs',doctoral);
 run('merge-doctoral-proposals.mjs',doctoral,['--apply']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only','--apply']);
 write(`${base}/continuation-135/integration-manifest.json`,{integratedAt:'2026-10-25',units,doctoral,scopes,sourceAdditions:[`${base}/continuation-135/shard-a/source-addition.json`,`${base}/continuation-135/shard-b/southampton-source-addition.json`],held:['Frankfurt fresh PDF observation: prior browser access block, not accepted','Bath and UTC title-boundary observations: research-group relation still does not establish exact named doctorate field under strict title rule']});
}
