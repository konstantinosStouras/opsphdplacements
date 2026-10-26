import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='research-handoff/universities/',dir=root+'continuation-470',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const reviews=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r])),existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const union=(a,b)=>[...new Map([...a,...b].map(s=>[JSON.stringify(s),s])).values()];
const originalProgrammes=[];for(let n=391;n<=395;n++){const d=root+'continuation-'+n+'/shard-a';for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.doctoral.json')))originalProgrammes.push(d+'/'+f);}
const scopes=[],programmes=[];
for(const path of originalProgrammes){const p=read(path);p.sources=union(reviews.get(p.universityId)?.doctoralReview?.sources||[],p.sources);const newer=p.programmes.filter(r=>!existing.has(r.id));
 if(p.universityId==='louisiana-state-university')p.programmes[0].degree=read('data/doctoral-programs.json').records.find(r=>r.id===p.programmes[0].id).degree; // Scope-only: preserve published literal credential, not proposal punctuation.
 const out=dir+'/'+p.universityId+'-integration.json';if(newer.length){if(newer.length!==1)throw Error('Unexpected new programme count');p.programmes=newer;programmes.push(out);}else scopes.push(out);write(out,p);
}
const unitInputs=[root+'continuation-314/shard-c/penn.opim-oid-historical-name-source-enrichment.json',root+'continuation-315/shard-c/navarra.iese-field-name-source-enrichment.json',root+'continuation-316/shard-c/uic.ids-supply-chain-host-source-enrichment.json'];
const assertionInputs=[root+'continuation-314/shard-c/penn.opim-exact-source-assertions.json',root+'continuation-315/shard-c/navarra.iese-exact-source-assertions.json',root+'continuation-316/shard-c/uic.ids-supply-chain-exact-source-assertions.json'];
for(let n=314;n<=319;n++){const d=root+'continuation-'+n+'/shard-b';for(const f of fs.readdirSync(d).filter(f=>f.endsWith('assertion-proposals.json')))assertionInputs.push(d+'/'+f);}
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes,scopes,assertionInputs,originalProgrammes};
m.frozenInputs=[...unitInputs,...programmes,...scopes,...assertionInputs,...originalProgrammes].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
for(const f of ['apply-phase.mjs','apply-assertions.mjs'])fs.writeFileSync(dir+'/'+f,fs.readFileSync(root+'continuation-450/'+f,'utf8').replaceAll('continuation-450','continuation-470'));
console.log({units:unitInputs.length,newProgrammes:programmes.length,scopes:scopes.length,assertions:assertionInputs.reduce((n,p)=>n+read(p).records.length,0)});
