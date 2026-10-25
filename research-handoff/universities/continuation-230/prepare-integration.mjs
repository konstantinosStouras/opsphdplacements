import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-230',root='research-handoff/universities/',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const groups={176:['harbin-institute-of-technology','huazhong-university-of-science-and-technology','jilin-university','kobe-university','kyushu-university','shanghai-university'],177:['konan-university','liverpool-john-moores-university','lut-university','moscow-institute-of-physics-and-technology','nanjing-university','osnabruck-university']};
const bases=Object.entries(groups).flatMap(([n,names])=>names.map(name=>root+`continuation-${n}/shard-a/`+name));
const sources=bases.map(b=>b+'.source-addition.json').concat(root+'continuation-207/shard-b/dalian-source-addition.json');
const unitInputs=bases.map(b=>b+'.unit.json').concat(root+'continuation-208/shard-b/dalian-unit-latest.json',root+'continuation-209/shard-b/st-johns-current-title-unit.json');
const programmes=bases.map(b=>(b.endsWith('/jilin-university')?b.replace('continuation-176','continuation-177'):b)+'.doctoral.json').concat(root+'continuation-208/shard-b/dalian-doctoral-latest.json');
const scopes=[root+'continuation-181/shard-c/universite-catholique-de-louvain.doctoral-scope-composite.json',root+'continuation-184/shard-c/university-of-new-south-wales.doctoral-scope-composite.json'];
const titleInput=root+'continuation-183/shard-c/unsw.three-title-adjudications.json';
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,unitInputs,programmes,scopes,titleInput};
m.frozenInputs=[...new Set([...sources,...sources.map(p=>read(p).sourceCatalogue),...unitInputs,...programmes,...scopes,titleInput])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
fs.writeFileSync(dir+'/integration-manifest.json',JSON.stringify(m,null,2)+'\n');
fs.writeFileSync(dir+'/apply-phase.mjs',fs.readFileSync(root+'continuation-220/apply-phase.mjs','utf8').replaceAll('continuation-220','continuation-230'));
console.log({sources:sources.length,units:unitInputs.length,programmes:programmes.length,scopes:scopes.length});
for(const p of programmes){const x=read(p);console.log(JSON.stringify({id:x.universityId,complete:x.coverageComplete,programmes:x.programmes.map(p=>({id:p.id,name:p.programName,degree:p.degree,specialization:p.specialization,researchEvidence:p.researchDoctorateEvidence,source:p.sourceUrl,evidence:p.evidence}))}));}
