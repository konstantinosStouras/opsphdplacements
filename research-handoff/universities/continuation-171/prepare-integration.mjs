// Dated reviewed cut. Run once before applying; never refresh against newer work.
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='research-handoff/universities/', dir=root+'continuation-171';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const path=(n,f)=>root+`continuation-${n}/`+f;
const sources=[path(151,'shard-a/source-addition.json'),path(152,'shard-a/source-addition.json'),path(152,'shard-a/ohio-university.source-addition.json'),path(152,'shard-a/mohammed-v-university-in-rabat.source-addition.json'),path(153,'shard-a/ludwig-maximilians-universitat-munchen.source-addition.json'),...['polytechnique-montreal','sorbonne-university','southeast-university','toulouse-school-of-economics','universita-della-svizzera-italiana'].map(id=>path(154,`shard-a/${id}.source-addition.json`)),dir+'/lse.source-addition.json'];
const units=[];
for(const n of [151,152,153,154])for(const f of fs.readdirSync(path(n,'shard-a')).filter(f=>f.endsWith('.unit.json')))units.push(path(n,'shard-a/'+f));
units.push(dir+'/lse.unit.json',path(147,'shard-a/beihang-university.unit.json'));
for(const [n,pattern] of [[161,/unit-rename/],[162,/unit-rename/],[165,/identity/],[167,/unit.json$/],[168,/inventory.json$/],[169,/operations-research-department/]])for(const f of fs.readdirSync(path(n,'shard-b')).filter(f=>pattern.test(f)))units.push(path(n,'shard-b/'+f));
const programmes=[];
for(const n of [151,152,153,154])for(const f of fs.readdirSync(path(n,'shard-a')).filter(f=>f.endsWith('.doctoral.json'))){if(f==='kent-state-university.doctoral.json'||f==='management-development-institute-gurgaon.doctoral.json')continue;programmes.push(path(n,'shard-a/'+f));}
programmes.push(path(155,'shard-a/kent-state-university.doctoral-complete-corrected.json'),path(153,'shard-a/management-development-institute-gurgaon.doctoral-corrected.json'),dir+'/lse.doctoral.json',path(151,'shard-c/tsinghua-university.management-science-phd.json'),path(169,'shard-b/hebrew-business-department-doctoral.json'),path(151,'shard-c/ustc.mathematics-status-only-safe.json'));
const scopes=[path(156,'shard-b/the-college-of-new-jersey-doctoral-scope.json'),path(156,'shard-b/skoltech-doctoral-scope.json'),path(160,'shard-b/sogang-doctoral-scope.json'),path(148,'shard-c/university-of-science-and-technology-of-china.doctoral-scope-composite.json'),path(150,'shard-c/university-of-british-columbia.doctoral-partial-composite.json'),path(151,'shard-c/university-of-tennessee-knoxville.doctoral-scope-composite.json'),path(151,'shard-c/university-of-tennessee-at-knoxville.doctoral-scope-composite.json')];
const manifests={baseCommit:'629565f91a2d4fbcab568e92bd1bfd6029f9a16f',sources,unitInputs:units,programmes,scopes};
const catalogueFiles=sources.map(p=>read(p).sourceCatalogue);
manifests.frozenInputs=[...new Set([...sources,...catalogueFiles,...units,...programmes,...scopes])].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
fs.writeFileSync(dir+'/integration-manifest.json',JSON.stringify(manifests,null,2)+'\n');
console.log({sourceSelections:sources.length,unitProposals:units.length,doctoralProposals:programmes.length,scopeProposals:scopes.length});
