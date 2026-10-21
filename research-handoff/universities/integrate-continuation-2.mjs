// Dated, reviewed construction step. Preview first; --apply integrates this cut.
// Inputs and hashes are frozen in release-2026-10-21-continuation-2.json.
// Do not use this historical script to refresh newer observations.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../..');
process.chdir(root);
const manifest=JSON.parse(fs.readFileSync('research-handoff/universities/release-2026-10-21-continuation-2.json'));
const apply=process.argv.includes('--apply');
const run=(script,args)=>console.log(execFileSync(process.execPath,[script,...args],{encoding:'utf8'}));
for(const p of manifest.proposals)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p.file)).digest('hex'),p.sha256,'Frozen proposal changed: '+p.file);
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
run('scripts/merge-university-reviews.mjs',[...units,...(apply?[]:['--dry-run'])]);
// Dry previews need the new unit IDs as well. Integrate units before previewing
// doctoral records; the release remains withheld until every check succeeds.
if(!apply){console.log('Unit preview passed. --apply performs doctoral previews and integration sequentially.');process.exit(0);}
const initial=new Map(JSON.parse(fs.readFileSync('data/doctoral-programs.json')).records.map(p=>[p.id,p]));
const cache='research/stage1-continuation-2';fs.mkdirSync(cache,{recursive:true});
for(const input of manifest.proposals.filter(p=>p.kind==='doctoral')){
 const proposal=JSON.parse(fs.readFileSync(input.file));
 const old=[],fresh=[];
 for(const p of proposal.programmes){
  if(p.id==='lancaster-university--stor-i-doctoral-training')fresh.push({...p,existingProgramId:p.id});
  else if(initial.has(p.existingProgramId||p.id))old.push(p);
  else fresh.push(p);
 }
 const parts=old.length?[{mode:'scope',programmes:old},...(fresh.length?[{mode:'facts',programmes:fresh}]:[])]:[{mode:'facts',programmes:fresh}];
 for(const part of parts){
  const file=path.join(cache,proposal.universityId+'-'+part.mode+'.json');
  fs.writeFileSync(file,JSON.stringify({...proposal,programmes:part.programmes},null,2)+'\n');
  const flags=part.mode==='scope'?['--scope-only']:[];
  run('scripts/merge-doctoral-proposals.mjs',[file,...flags]);
  run('scripts/merge-doctoral-proposals.mjs',[file,...flags,'--apply']);
 }
}
