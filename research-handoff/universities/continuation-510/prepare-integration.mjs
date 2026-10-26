import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='research-handoff/universities/',dir=root+'continuation-510',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),reviews=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r]));
const union=(a,b)=>[...new Map([...a,...b].map(s=>[JSON.stringify(s),s])).values()],list=(n,suffix,shard)=>fs.readdirSync(root+'continuation-'+n+'/shard-'+shard).filter(f=>f.endsWith(suffix)).map(f=>root+'continuation-'+n+'/shard-'+shard+'/'+f);
const originalProgrammes=list(422,'.doctoral.json','a'),scopes=[];
for(const path of originalProgrammes){const p=read(path);p.sources=union(reviews.get(p.universityId)?.doctoralReview?.sources||[],p.sources);const out=dir+'/'+p.universityId+'-integration.json';scopes.push(out);write(out,p);}
const originals=[...[421,423,424,425].flatMap(n=>list(n,'.unit.json','a')),...list(335,'.unit.json','b'),root+'continuation-345/shard-c/washington-lee.superseded-limitation-correction.json'];
const unitInputs=originals.map(path=>{const p=read(path);p.sources=union(reviews.get(p.id)?.sources||[],p.sources);const out=dir+'/'+p.id+'-unit-integration.json';write(out,p);return out;});
const assertionInputs=[...[342,343,344].flatMap(n=>list(n,'source-assertions.json','c')),...list(335,'assertion-proposals.json','b')];
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes:[],scopes,assertionInputs,originalProgrammes,originalUnits:originals};
m.frozenInputs=[...unitInputs,...scopes,...assertionInputs,...originalProgrammes,...originals].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
for(const f of ['apply-phase.mjs','apply-assertions.mjs'])fs.writeFileSync(dir+'/'+f,fs.readFileSync(root+'continuation-500/'+f,'utf8').replaceAll('continuation-500','continuation-510'));
console.log({units:unitInputs.length,scopes:scopes.length,assertions:assertionInputs.reduce((n,p)=>n+read(p).records.length,0)});
