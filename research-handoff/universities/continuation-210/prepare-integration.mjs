// Reviewed additive cut from aa854da; prepare once before applying.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='research-handoff/universities/continuation-210',prefix='research-handoff/universities/',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p=(n,f)=>prefix+`continuation-${n}/`+f,write=(path,v)=>fs.writeFileSync(path,JSON.stringify(v,null,2)+'\n');
const unitInputs=['aston-university','boise-state-university','columbia-university','ajman-university'].map(n=>p(172,'shard-a/'+n+'.unit.json')).concat(p(173,'shard-a/columbia-business-school.unit.json'));
const programmeInputs=[p(171,'shard-a/university-of-delhi.doctoral.json'),p(164,'shard-c/university-of-california-davis.transportation-operations-phd.json'),p(167,'shard-c/universite-catholique-de-louvain.operations-doctoral-proposal.json'),p(200,'shard-b/nycu-current-composite-scope.json')];
const existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const programmes=programmeInputs.map((file,i)=>{const d=read(file);d.programmes=d.programmes.filter(r=>!existing.has(r.existingProgramId||r.id));assert.equal(d.programmes.length,1,file);const out=dir+`/additive-${i+1}.json`;write(out,d);return out;});
const scopes=[...programmeInputs,p(169,'shard-a/university-of-groningen.doctoral.json'),p(169,'shard-a/university-of-edinburgh.doctoral.json'),p(163,'shard-c/university-of-alberta.doctoral-partial-composite.json'),p(166,'shard-c/vanderbilt-university.doctoral-scope-composite.json'),p(168,'shard-c/tbs-education.doctoral-scope-composite.json')];
const tumInput=p(193,'shard-b/tum-current-title-scope.json');
for(const id of ['technical-university-of-munich','technical-university-of-munich-tum','tum-school-of-management']){const d=read(tumInput);d.universityId=id;const out=dir+'/'+id+'.scope.json';write(out,d);scopes.push(out);}
const m={baseCommit:'aa854dac28e13b45fdc318fd1fc6015fe761c8b1',unitInputs,programmeInputs,programmes,scopes,titleInputs:[tumInput,p(192,'shard-b/tum-credential-title-adjudication.json')]};
m.frozenInputs=[...new Set([...unitInputs,...programmeInputs,...programmes,...scopes,...m.titleInputs])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
write(dir+'/unit-integration.json',unitInputs.map(read));console.log({units:unitInputs.length,newRoutes:programmes.length,scopeObservations:scopes.length});
