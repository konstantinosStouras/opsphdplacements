import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-171', read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const m=read(dir+'/integration-manifest.json'),phase=process.argv[2],apply=process.argv.includes('--apply');
for(const f of m.frozenInputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex'),f.sha256,'Frozen proposal changed: '+f.path);
const run=(script,files,flags=[])=>execFileSync(process.execPath,[script,...files,...flags],{stdio:'inherit'});
if(phase==='sources'){for(const f of m.sources)run('scripts/merge-university-source-additions.mjs',[f],apply?[]:['--dry-run']);}
else if(phase==='units'){
 const original=read('data/universities.json'),current=read('data/university-reviews.json');
 const units=m.unitInputs.map(p=>{const r=read(p),o=original.records.find(o=>o.id===r.id);assert(o,'Missing source '+r.id);
  if(r.id==='southeast-university')for(const u of r.units)u.fields=u.fields.filter(f=>f!=='management-science');
  if(!r.decisions.length)r.decisions=o.departments.map(d=>{assert(d.sourceAssertion?.layer==='reported-phd-institution','Unexpected unit assertion '+d.id);return {sourceDepartmentId:d.id,disposition:'not-a-unit',unitIds:[],reason:'Reported doctorate institution discovery assertion only; no department is asserted and no individual degree is verified.'};});
  return r;});
 const alias=read('research-handoff/universities/continuation-154/shard-a/aalto-university.historical-organisation-alias.json');
 const a=structuredClone(current.records.find(r=>r.id===alias.universityId));assert(a);delete a.doctoralReview;
 a.organisationAliases=[...(a.organisationAliases||[]),...alias.proposedOrganisationAliases];
 const evidence=read('research-handoff/universities/continuation-152/shard-a/helsinki-school-of-economics-and-business-administration.identity-confirmed.json');
 for(const s of evidence.sources)if(!a.sources.some(x=>x.url===s.url&&x.checkedAt===s.checkedAt))a.sources.push(s);
 units.push(a);fs.writeFileSync(dir+'/unit-integration.json',JSON.stringify(units,null,2)+'\n');
 run('scripts/merge-university-reviews.mjs',[dir+'/unit-integration.json'],apply?[]:['--dry-run']);
}else if(phase==='programmes')run('scripts/merge-doctoral-proposals.mjs',m.programmes,apply?['--apply']:[]);
else if(phase==='scopes')run('scripts/merge-doctoral-proposals.mjs',m.scopes,['--scope-only',...(apply?['--apply']:[])]);
else throw Error('Unknown integration phase');
