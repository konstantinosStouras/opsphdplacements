import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='research-handoff/universities/',dir=root+'continuation-490',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),reviews=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r]));
const union=(a,b)=>[...new Map([...a,...b].map(s=>[JSON.stringify(s),s])).values()],list=(n,suffix,shard)=>fs.readdirSync(root+'continuation-'+n+'/shard-'+shard).filter(f=>f.endsWith(suffix)).map(f=>root+'continuation-'+n+'/shard-'+shard+'/'+f);
const originalProgrammes=list(410,'.doctoral.json','a'),scopes=[];
for(const path of originalProgrammes){const p=read(path);p.sources=union(reviews.get(p.universityId)?.doctoralReview?.sources||[],p.sources);const out=dir+'/'+p.universityId+'-integration.json';scopes.push(out);write(out,p);}
const originals=[...[404,405,406,411].flatMap(n=>list(n,'.unit.json','a')),...list(329,'.unit.json','b'),root+'continuation-326/shard-c/uiuc.business-administration-parent-decision-correction.json',root+'continuation-327/shard-c/umsl.department-source-enrichment.json'];
const unitInputs=originals.map(path=>{const p=read(path);p.sources=union(reviews.get(p.id)?.sources||[],p.sources);const out=dir+'/'+p.id+'-unit-integration.json';write(out,p);return out;});
const assertionInputs=[...[325,327,328,329].flatMap(n=>list(n,'source-assertions.json','c')),root+'continuation-330/shard-c/tennessee-knoxville.multiline-source-assertion.json',...list(329,'assertion-proposals.json','b'),...list(331,'assertion-proposals.json','b')];
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes:[],scopes,assertionInputs,originalProgrammes,originalUnits:originals};
m.frozenInputs=[...unitInputs,...scopes,...assertionInputs,...originalProgrammes,...originals].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
for(const f of ['apply-phase.mjs','apply-assertions.mjs'])fs.writeFileSync(dir+'/'+f,fs.readFileSync(root+'continuation-480/'+f,'utf8').replaceAll('continuation-480','continuation-490'));
console.log({units:unitInputs.length,scopes:scopes.length,assertions:assertionInputs.reduce((n,p)=>n+read(p).records.length,0)});
