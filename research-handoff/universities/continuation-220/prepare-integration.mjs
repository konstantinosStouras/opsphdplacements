// Prepare once against reviewed live3b213a1, before source additions.
import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='research-handoff/universities/continuation-220',root='research-handoff/universities/',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const groups={174:['kansas-state-university','bi-norwegian-business-school','california-institute-of-technology','indian-statistical-institute'],175:['new-mexico-state-university','louisiana-state-university','kth-royal-institute-of-technology','norwegian-university-of-science-and-technology','loughborough-university','heriot-watt-university']};
const bases=Object.entries(groups).flatMap(([n,names])=>names.map(name=>root+`continuation-${n}/shard-a/`+name));
const sources=bases.map(b=>b+'.source-addition.json'),unitInputs=bases.map(b=>b+'.unit.json');
const programmes=bases.map(b=>b.endsWith('/loughborough-university')?dir+'/loughborough-university.doctoral.json':b+'.doctoral.json').concat(root+'continuation-170/shard-c/university-of-british-columbia.mining-phd.json');
const scopes=[dir+'/kansas-state.scope.json',dir+'/indian-statistical-institute.scope.json',root+'continuation-172/shard-c/university-of-british-columbia.doctoral-scope-composite.json',root+'continuation-174/shard-c/university-of-bristol.doctoral-scope-composite.json'];
const m={baseCommit:'3b213a1b4aa9784f89beb40ccc8bf7640886c1f1',sources,unitInputs,programmes,scopes};m.frozenInputs=[...new Set([...sources,...sources.map(p=>read(p).sourceCatalogue),...unitInputs,...programmes,...scopes])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
fs.writeFileSync(dir+'/apply-phase.mjs',fs.readFileSync(root+'continuation-190/apply-phase.mjs','utf8').replaceAll('continuation-190','continuation-220'));
fs.writeFileSync(dir+'/audit-cut.mjs',fs.readFileSync(root+'continuation-190/audit-cut.mjs','utf8').replaceAll('a567ed4:','3b213a1:').replaceAll('continuation-190','continuation-220'));
console.log({sourceAdditions:sources.length,unitReviews:unitInputs.length,doctoralProposals:programmes.length,scopeFollowups:scopes.length});
