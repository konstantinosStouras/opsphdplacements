import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-310',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const m=read(dir+'/integration-manifest.json'),phase=process.argv[2],apply=process.argv.includes('--apply');
for(const f of m.frozenInputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex'),f.sha256,'Frozen input changed: '+f.path);
const run=(script,files,flags=[])=>execFileSync(process.execPath,[script,...files,...flags],{stdio:'inherit'});
if(phase==='sources'){for(const f of m.sources)run('scripts/merge-university-source-additions.mjs',[f],apply?[]:['--dry-run']);}
else if(phase==='units'){
 const source=read('data/universities.json');
 const units=m.unitInputs.map(p=>{const r=read(p),o=source.records.find(o=>o.id===r.id);assert(o,'Missing source '+r.id);
 if(r.id==='lomonosov-moscow-state-university')r.limitations[0]='Initial degree-page review did not establish the Operations Research doctoral host link. The later dated doctoral observation adds the official faculty postgraduate-student bridge; its evidence-age limitation remains explicit. No individual degree is verified.';
 if(r.id==='nantes-universite')r.organisationAliases=r.organisationAliases.map(name=>({name,sourceUrl:r.universitySourceUrl,checkedAt:r.checkedAt,evidence:'Official organisation page identifies Nantes Université as the 2022 successor of Université de Nantes. Historical source label retained as a lineage alias; distinct component schools are not automatically merged.'}));
 if(!r.decisions.length)r.decisions=o.departments.map(d=>{assert(d.sourceAssertion?.layer==='reported-phd-institution');return {sourceDepartmentId:d.id,disposition:'not-a-unit',unitIds:[],reason:'Reported doctorate-institution discovery label only; no department assertion or individual degree verification.'};});return r;});
 fs.writeFileSync(dir+'/unit-integration.json',JSON.stringify(units,null,2)+'\n');run('scripts/merge-university-reviews.mjs',[dir+'/unit-integration.json'],apply?[]:['--dry-run']);
}else if(phase==='programmes')run('scripts/merge-doctoral-proposals.mjs',m.programmes,apply?['--apply']:[]);
else if(phase==='scopes')run('scripts/merge-doctoral-proposals.mjs',m.scopes,['--scope-only',...(apply?['--apply']:[])]);
else throw Error('Unknown phase');
