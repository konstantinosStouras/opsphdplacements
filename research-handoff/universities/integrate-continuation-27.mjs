// Dated reviewed integration recipe. Not a refresh command.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
process.chdir(path.resolve(import.meta.dirname,'../..'));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const manifest=read('research-handoff/universities/release-2026-10-22-continuation-27.json');
const apply=process.argv.includes('--apply');
const cache='research/stage1-continuation-27';fs.mkdirSync(cache,{recursive:true});
const run=(script,args)=>console.log(execFileSync(process.execPath,[script,...args],{encoding:'utf8',maxBuffer:30000000}));
for(const p of manifest.proposals)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.file,'utf8').replaceAll('\r\n','\n')).digest('hex'),p.sha256,'Frozen proposal changed');
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
if(units.length)run('scripts/merge-university-reviews.mjs',[...units,'--dry-run']);
if(!apply)process.exit(0);
if(units.length)run('scripts/merge-university-reviews.mjs',units);
// Existing alias programme references are scope-only: never replace previous fact dates.
const existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const factFiles=[],scopeFiles=[];
for(const input of manifest.proposals.filter(p=>p.kind==='doctoral')){
 const p=read(input.file),old=p.programmes.filter(r=>existing.has(r.existingProgramId||r.id)),fresh=p.programmes.filter(r=>!existing.has(r.existingProgramId||r.id));
 for(const part of old.length?[{mode:'scope',programmes:old},...(fresh.length?[{mode:'facts',programmes:fresh}]:[])]:[{mode:'facts',programmes:fresh}]){
  const file=path.join(cache,p.universityId+'-'+part.mode+'.json');fs.writeFileSync(file,JSON.stringify({...p,programmes:part.programmes},null,2)+'\n');
  (part.mode==='scope'?scopeFiles:factFiles).push(file);
 }
}
for(const [files,flags] of [[scopeFiles,['--scope-only']],[factFiles,[]]])if(files.length){
 run('scripts/merge-doctoral-proposals.mjs',[...files,...flags]);
 run('scripts/merge-doctoral-proposals.mjs',[...files,...flags,'--apply']);
}
const baseline=JSON.parse(execFileSync('git',['show',manifest.baseline+':data/doctoral-programs.json'],{encoding:'utf8',maxBuffer:30000000}));
const current=read('data/doctoral-programs.json');
for(const p of baseline.records)assert.deepEqual(current.records.find(r=>r.id===p.id),p,'Prior programme changed: '+p.id);
console.log('All '+baseline.records.length+' prior programme records preserved exactly.');
