// Dated reviewed integration recipe. Not a refresh command.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
process.chdir(path.resolve(import.meta.dirname,'../..'));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const manifest=read('research-handoff/universities/release-2026-10-22-continuation-15.json');
const apply=process.argv.includes('--apply');
const cache='research/stage1-continuation-15';fs.mkdirSync(cache,{recursive:true});
const run=(script,args)=>console.log(execFileSync(process.execPath,[script,...args],{encoding:'utf8',maxBuffer:30000000}));
for(const p of manifest.proposals)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.file,'utf8').replaceAll('\r\n','\n')).digest('hex'),p.sha256,'Frozen proposal changed');
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
if(units.length)run('scripts/merge-university-reviews.mjs',[...units,'--dry-run']);
if(!apply)process.exit(0);
if(units.length)run('scripts/merge-university-reviews.mjs',units);
for(const input of manifest.proposals.filter(p=>p.kind==='doctoral')){
 const p=read(input.file);
 const existing=new Map(read('data/doctoral-programs.json').records.map(r=>[r.id,r]));
 const old=p.programmes.filter(r=>existing.has(r.existingProgramId||r.id));
 const fresh=p.programmes.filter(r=>!existing.has(r.existingProgramId||r.id));
 const parts=old.length?[{mode:'scope',programmes:old},...(fresh.length?[{mode:'facts',programmes:fresh}]:[])]:[{mode:'facts',programmes:fresh}];
 for(const part of parts){
  const file=path.join(cache,p.universityId+'-'+part.mode+'.json');fs.writeFileSync(file,JSON.stringify({...p,programmes:part.programmes},null,2)+'\n');
  const flags=part.mode==='scope'?['--scope-only']:[];
  run('scripts/merge-doctoral-proposals.mjs',[file,...flags]);
  run('scripts/merge-doctoral-proposals.mjs',[file,...flags,'--apply']);
 }
}
const baseline=JSON.parse(execFileSync('git',['show',manifest.baseline+':data/doctoral-programs.json'],{encoding:'utf8',maxBuffer:30000000}));
const current=read('data/doctoral-programs.json');
for(const p of baseline.records)assert.deepEqual(current.records.find(r=>r.id===p.id),p,'Prior programme changed: '+p.id);
console.log('All '+baseline.records.length+' prior programme records preserved exactly.');
