import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='research-handoff/universities',out=`${base}/continuation-141`,read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const run=(script,files,flags=[])=>execFileSync(process.execPath,[`scripts/${script}`,...files,...flags],{stdio:'inherit'});
const additions=[`${base}/continuation-136/shard-b/twente-source-addition.json`,`${base}/continuation-136/shard-b/dauphine-source-addition.json`,`${base}/continuation-136/shard-c/bonn-source-addition.json`,`${base}/continuation-136/shard-c/nottingham-source-addition.json`,`${base}/continuation-138/shard-a/source-addition.json`,`${base}/continuation-139/shard-a/source-addition.json`];
if(process.argv.includes('--sources'))for(const file of additions)run('merge-university-source-additions.mjs',[file]);
const universities=read('data/universities.json');
const units=[`${base}/continuation-140/shard-b/twente-unit-final.json`,`${base}/continuation-136/shard-b/dauphine-unit.json`,`${base}/continuation-136/shard-c/university-of-bonn.unit-complete-followup.json`,`${base}/continuation-136/shard-c/university-of-nottingham.unit.json`];
const doctoral=[`${base}/continuation-140/shard-b/twente-doctoral-final.json`,`${base}/continuation-136/shard-c/university-of-bonn.doctoral-complete-followup.json`,`${base}/continuation-136/shard-c/university-of-nottingham.doctoral.json`];
const a138=['abdelmalek-essaadi-university','aix-marseille-universite','aston-university','athens-university-of-economics-and-business'];
const a139=['beihang-university','beijing-jiaotong-university','brunel-university','chinese-academy-of-sciences'];
for(const [n,ids] of [[138,a138],[139,a139]])for(const id of ids){
 const p=read(`${base}/continuation-${n}/shard-a/${id}.unit.json`);
 p.decisions=universities.records.find(u=>u.id===id).departments.map(d=>({sourceDepartmentId:d.id,disposition:'not-a-unit',unitIds:[],reason:'Frozen reported doctorate institution, not a department. Official unit and degree identity reviewed separately; no individual degree claim verified.'}));
 p.limitations=p.limitations.filter(s=>!s.includes('source-frame'));
 const file=`${out}/${id}.unit.integrator.json`;write(file,p);units.push(file);
 if(id==='athens-university-of-economics-and-business')continue;
 const doc=`${base}/continuation-${n}/shard-a/${id}.doctoral.json`;
 doctoral.push(doc);
}
const d=read(`${base}/continuation-136/shard-b/dauphine-doctoral.json`);
d.programmes[0].specialization='Recherche Opérationnelle (Operations Research)';
d.programmes[0].evidence+=' Parenthetical Operations Research is an English translation of the exact source field Recherche Opérationnelle, not additional official title wording.';
const dfile=`${out}/dauphine.doctoral.integrator.json`;write(dfile,d);doctoral.push(dfile);
const ath=read(`${base}/continuation-140/shard-a/athens-university-of-economics-and-business.doctoral.json`);
ath.programmes=[];ath.status='partial';ath.limitations.push('Integrator holds route until explicit PhD credential or exact named research-doctorate award is established. A DOCTORAL menu option is a level, not a PhD award title. Official doctorate and named Management Science department remain supported.');
const afile=`${out}/athens.credential-hold.json`;write(afile,ath);doctoral.push(afile);
const scopes=[`${base}/continuation-140/shard-b/southampton-doctoral-scope.json`,...['indian-institute-of-technology-delhi','politecnico-di-milano'].map(id=>`${base}/continuation-140/shard-a/${id}.doctoral.json`),`${base}/continuation-138/shard-a/university-of-reading.doctoral-followup.json`];
run('merge-university-reviews.mjs',units,['--dry-run']);
if(process.argv.includes('--apply')){
 run('merge-university-reviews.mjs',units);
 run('merge-doctoral-proposals.mjs',doctoral);
 run('merge-doctoral-proposals.mjs',doctoral,['--apply']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only','--apply']);
 write(`${out}/integration-manifest.json`,{integratedAt:'2026-10-25',additions,units,doctoral,scopes,held:'Athens doctorate level established, explicit qualifying credential awaited; no PhD inferred from menu.'});
}
