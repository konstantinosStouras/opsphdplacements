import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
process.chdir(path.resolve(import.meta.dirname,'../..'));
const manifest=JSON.parse(fs.readFileSync('research-handoff/universities/release-2026-10-22-continuation-4.json'));
const apply=process.argv.includes('--apply');
const run=(s,a)=>console.log(execFileSync(process.execPath,[s,...a],{encoding:'utf8'}));
for(const p of manifest.proposals)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.file,'utf8').replaceAll('\r\n','\n')).digest('hex'),p.sha256,'Frozen proposal changed: '+p.file);
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
run('scripts/merge-university-reviews.mjs',[...units,'--dry-run']);
if(!apply)process.exit(0);
run('scripts/merge-university-reviews.mjs',units);
const cache='research/stage1-continuation-4';fs.mkdirSync(cache,{recursive:true});
for(const input of manifest.proposals.filter(p=>p.kind==='doctoral')){
 const p=JSON.parse(fs.readFileSync(input.file));
 const existing=new Map(JSON.parse(fs.readFileSync('data/doctoral-programs.json')).records.map(p=>[p.id,p]));
 const old=p.programmes.filter(q=>existing.has(q.existingProgramId||q.id));
 const fresh=p.programmes.filter(q=>!existing.has(q.existingProgramId||q.id));
 const parts=old.length?[{mode:'scope',programmes:old},...(fresh.length?[{mode:'facts',programmes:fresh}]:[])]:[{mode:'facts',programmes:fresh}];
 for(const part of parts){const file=path.join(cache,p.universityId+'-'+part.mode+'.json');fs.writeFileSync(file,JSON.stringify({...p,programmes:part.programmes},null,2)+'\n');const flags=part.mode==='scope'?['--scope-only']:[];run('scripts/merge-doctoral-proposals.mjs',[file,...flags]);run('scripts/merge-doctoral-proposals.mjs',[file,...flags,'--apply']);}
}
