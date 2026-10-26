import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='research-handoff/universities/',dir=root+'continuation-450',read=p=>JSON.parse(fs.readFileSync(p));
const reviews=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r]));
const existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const originals=[
 '378/shard-a/dongbei-university-of-finance-and-economics.doctoral.json',
 '380/shard-a/ewha-womans-university.doctoral.json',
 '380/shard-a/erasmus-university-rotterdam.doctoral.json',
 '381/shard-a/george-washington-university.doctoral.json',
 '383/shard-a/city-university-of-hong-kong.doctoral.json',
 '384/shard-a/bayes-business-school.doctoral.json'
].map(s=>root+'continuation-'+s);
const scopes=[],programmes=[];
const union=(a,b)=>[...new Map([...a,...b].map(s=>[JSON.stringify(s),s])).values()];
for(const path of originals){
 const p=read(path),old=reviews.get(p.universityId);
 p.sources=union(old?.doctoralReview?.sources||[],p.sources);
 if(p.universityId==='erasmus-university-rotterdam'){
   p.programmes=p.programmes.filter(r=>!existing.has(r.id));
   if(p.programmes.length!==1)throw Error('Expected one new Erasmus field');
   p.limitations.push('Integrator read the current official ESE PhD field inventory on 26 October 2026 and confirmed its explicit Econometrics and Management Science field. Existing BPLIS programme facts are preserved separately.');
   p.sources.push({url:'https://www.eur.nl/en/ese/research/phd/phd-programme',checkedAt:'2026-10-26',outcome:'read',note:'Integrator read the full current ESE PhD inventory: five formal fields, including Econometrics and Management Science. No separately titled award or independent student population inferred.'});
   const out=dir+'/erasmus-programme-integration.json';fs.writeFileSync(out,JSON.stringify(p,null,2)+'\n');programmes.push(out);
 }else{
   if(p.universityId==='city-university-of-hong-kong')p.limitations=p.limitations.map(s=>s.replace('Systems Engineering route retains factual observation but its public title eligibility should be independently adjudicated against the strict 25 October rule.','Systems Engineering is retained as a factual observation and excluded from the public qualifying count by the strict title rule; research topics alone do not qualify it.'));
   const out=dir+'/'+p.universityId+'-scope-integration.json';fs.writeFileSync(out,JSON.stringify(p,null,2)+'\n');scopes.push(out);
   for(const r of reviews.values())if(r.duplicateOf===p.universityId){
     const alias=structuredClone(p);alias.universityId=r.id;alias.sources=union(r.doctoralReview?.sources||[],p.sources);
     const ap=dir+'/'+r.id+'-scope-integration.json';fs.writeFileSync(ap,JSON.stringify(alias,null,2)+'\n');scopes.push(ap);
   }
 }
}
const unitInputs=[root+'continuation-301/shard-c/wvu.current-combined-department-unit.json',root+'continuation-307/shard-c/tennessee-knoxville.parent-school-naming-source.json'];
const assertionInputs=[root+'continuation-302/shard-c/wvu.exact-source-assertion-proposals.json',root+'continuation-303/shard-c/richmond.exact-source-assertion-proposals.json',root+'continuation-304/shard-c/bothell-glasgow.exact-source-assertion-proposals.json',root+'continuation-307/shard-c/tennessee-knoxville.historical-school-prefix-source-assertions.json'];
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes,scopes,assertionInputs,originalProgrammes:originals};
m.frozenInputs=[...unitInputs,...programmes,...scopes,...assertionInputs,...originals].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
fs.writeFileSync(dir+'/integration-manifest.json',JSON.stringify(m,null,2)+'\n');
for(const f of ['apply-phase.mjs','apply-assertions.mjs'])fs.writeFileSync(dir+'/'+f,fs.readFileSync(root+'continuation-440/'+f,'utf8').replaceAll('continuation-440','continuation-450'));
console.log({unitInputs,programmes,scopes,assertionInputs});
