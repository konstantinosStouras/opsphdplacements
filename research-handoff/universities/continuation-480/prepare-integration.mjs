import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='research-handoff/universities/',dir=root+'continuation-480',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const reviews=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r])),existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const union=(a,b)=>[...new Map([...a,...b].map(s=>[JSON.stringify(s),s])).values()];
const list=(n,suffix,shard)=>fs.readdirSync(root+'continuation-'+n+'/shard-'+shard).filter(f=>f.endsWith(suffix)).map(f=>root+'continuation-'+n+'/shard-'+shard+'/'+f);
const originalProgrammes=[...Array.from({length:4},(_,i)=>list(396+i,'.doctoral.json','a')).flat(),...list(324,'.doctoral.json','b')];
const scopes=[],programmes=[];
for(const path of originalProgrammes){const p=read(path);p.sources=union(reviews.get(p.universityId)?.doctoralReview?.sources||[],p.sources);const newer=p.programmes.filter(r=>!existing.has(r.id));const out=dir+'/'+p.universityId+'-integration.json';if(newer.length){if(newer.length!==1)throw Error('Unexpected new programme count');p.programmes=newer;programmes.push(out);}else scopes.push(out);write(out,p);}
const originals=[...list(320,'.unit.json','b'),...list(322,'.unit.json','b'),...Array.from({length:4},(_,i)=>list(400+i,'.unit.json','a')).flat()];
const unitInputs=originals.map(path=>{const p=read(path),old=reviews.get(p.id);p.sources=union(old?.sources||[],p.sources);const out=dir+'/'+p.id+'-unit-integration.json';write(out,p);return out;});
const assertionInputs=[...Array.from({length:8},(_,i)=>list(318+i,'source-assertions.json','c')).flat(),...list(320,'assertion-proposals.json','b'),...list(321,'assertion-proposals.json','b'),...list(322,'assertion-proposals.json','b'),...list(325,'assertion-proposals.json','b')];
// UIUC generic parent assertions wait for the superseding unit-decision correction.
const selectedAssertions=assertionInputs.filter(p=>!p.includes('continuation-325/shard-c/'));
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes,scopes,assertionInputs:selectedAssertions,originalProgrammes,originalUnits:originals};
m.frozenInputs=[...unitInputs,...programmes,...scopes,...selectedAssertions,...originalProgrammes,...originals].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
for(const f of ['apply-phase.mjs','apply-assertions.mjs'])fs.writeFileSync(dir+'/'+f,fs.readFileSync(root+'continuation-470/'+f,'utf8').replaceAll('continuation-470','continuation-480'));
console.log({units:unitInputs.length,newProgrammes:programmes.length,scopes:scopes.length,assertions:selectedAssertions.reduce((n,p)=>n+read(p).records.length,0)});
