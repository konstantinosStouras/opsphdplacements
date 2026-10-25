import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-240',root='research-handoff/universities/',read=p=>JSON.parse(fs.readFileSync(p));
const specs=[['catholic-university-of-eichstatt-ingolstadt',178,178,178],['kiel-university',178,178,178],['indian-institute-of-management-kozhikode',182,178,184],['universite-grenoble-alpes',179,181,184],['friedrich-schiller-university-jena',180,180,180],['university-of-geneva',182,182,182],['istanbul-technical-university',183,183,183]];
const path=(n,name,suffix)=>root+`continuation-${n}/shard-a/${name}.${suffix}.json`;
const sources=specs.map(([id,n])=>path(n,id,'source-addition')),unitInputs=specs.map(([id,,n])=>path(n,id,'unit')).concat(['213/sufe-historical-unit-overlay','214/tilburg-historical-compound-unit','215/stevens-historical-parent-unit','216/saint-marys-historical-unit-overlay','217/skoltech-source-unit-scope','218/sgi-source-unit-scope'].map(s=>{const[n,f]=s.split('/');return root+`continuation-${n}/shard-b/${f}.json`;})),programmes=specs.map(([id,,,n])=>path(n,id,'doctoral'));
const scopes=[root+'continuation-187/shard-c/university-of-maryland.doctoral-scope-composite.json',root+'continuation-189/shard-c/university-of-alberta.doctoral-partial-composite.json'],titleInput=root+'continuation-186/shard-c/maryland.scm-title-adjudication.json';
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,unitInputs,programmes,scopes,titleInput};
m.frozenInputs=[...new Set([...sources,...sources.map(p=>read(p).sourceCatalogue),...unitInputs,...programmes,...scopes,titleInput])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
fs.writeFileSync(dir+'/integration-manifest.json',JSON.stringify(m,null,2)+'\n');
fs.writeFileSync(dir+'/apply-phase.mjs',fs.readFileSync(root+'continuation-230/apply-phase.mjs','utf8').replaceAll('continuation-230','continuation-240'));
fs.writeFileSync(dir+'/adjudicate-maryland.mjs',fs.readFileSync(root+'continuation-230/adjudicate-unsw.mjs','utf8').replaceAll('continuation-230','continuation-240').replace('input=read(m.titleInput)','input=[read(m.titleInput)]'));
console.log({sources:sources.length,unitReviews:unitInputs.length,doctoralProposals:programmes.length,scopeFollowups:scopes.length});
for(const f of programmes){const p=read(f);console.log({id:p.universityId,complete:p.coverageComplete,programmes:p.programmes.map(x=>x.id)});}
