// Dated reviewed integration recipe. Not a refresh command.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
process.chdir(path.resolve(import.meta.dirname,'../..'));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const manifest=read('research-handoff/universities/release-2026-10-22-continuation-21.json');
const apply=process.argv.includes('--apply');
const cache='research/stage1-continuation-21';fs.mkdirSync(cache,{recursive:true});
const run=(script,args)=>console.log(execFileSync(process.execPath,[script,...args],{encoding:'utf8',maxBuffer:30000000}));
for(const p of manifest.proposals)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.file,'utf8').replaceAll('\r\n','\n')).digest('hex'),p.sha256,'Frozen proposal changed');
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
if(units.length)run('scripts/merge-university-reviews.mjs',[...units,'--dry-run']);
if(!apply)process.exit(0);
if(units.length)run('scripts/merge-university-reviews.mjs',units);
// This frozen batch has no existing programme updates; the Vienna alias uses canonical wu-vienna IDs.
// Merge its doctoral observations together to avoid repeated replacement under Windows sync locks.
const doctoral=manifest.proposals.filter(p=>p.kind==='doctoral').map(p=>p.file);
run('scripts/merge-doctoral-proposals.mjs',doctoral);
run('scripts/merge-doctoral-proposals.mjs',[...doctoral,'--apply']);
const baseline=JSON.parse(execFileSync('git',['show',manifest.baseline+':data/doctoral-programs.json'],{encoding:'utf8',maxBuffer:30000000}));
const current=read('data/doctoral-programs.json');
for(const p of baseline.records)assert.deepEqual(current.records.find(r=>r.id===p.id),p,'Prior programme changed: '+p.id);
console.log('All '+baseline.records.length+' prior programme records preserved exactly.');
