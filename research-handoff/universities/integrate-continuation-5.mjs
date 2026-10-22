// Dated integration recipe, not a refresh command. Only reviewed frozen proposals.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
process.chdir(path.resolve(import.meta.dirname,'../..'));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const manifest=read('research-handoff/universities/release-2026-10-22-continuation-5.json');
const apply=process.argv.includes('--apply');
const cache='research/stage1-continuation-5';fs.mkdirSync(cache,{recursive:true});
const run=args=>console.log(execFileSync(process.execPath,['scripts/merge-doctoral-proposals.mjs',...args],{encoding:'utf8'}));
for(const input of manifest.proposals)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(input.file,'utf8').replaceAll('\r\n','\n')).digest('hex'),input.sha256,'Frozen proposal changed');
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
if(units.length){
 console.log(execFileSync(process.execPath,['scripts/merge-university-reviews.mjs',...units,'--dry-run'],{encoding:'utf8'}));
 if(apply)console.log(execFileSync(process.execPath,['scripts/merge-university-reviews.mjs',...units],{encoding:'utf8'}));
 else process.exit(0); // Doctoral unit links can be checked only after reviewed units are integrated.
}
for(const input of manifest.proposals.filter(p=>p.kind==='doctoral')){
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(input.file,'utf8').replaceAll('\r\n','\n')).digest('hex'),input.sha256,'Frozen proposal changed');
 let p=read(input.file);
 if(p.universityId==='maastricht-university'){
  const prior=read('data/university-reviews.json').records.find(r=>r.id===p.universityId).doctoralReview;
  const preserved=read('research-handoff/universities/phd-proposals/shard-b/maastricht-university.json');
  p={...p,status:prior.status,programmes:preserved.programmes,branches:[...prior.branches.filter(b=>!p.branches.some(n=>n.branch===b.branch)),...p.branches],sources:[...prior.sources,...p.sources],limitations:[...prior.limitations,...p.limitations.filter(s=>!/^Additive|^Prior proposal/.test(s))]};
 }
 const existing=new Map(read('data/doctoral-programs.json').records.map(r=>[r.id,r]));
 const old=p.programmes.filter(r=>existing.has(r.existingProgramId||r.id));
 const fresh=p.programmes.filter(r=>!existing.has(r.existingProgramId||r.id));
 const parts=old.length?[{mode:'scope',programmes:old},...(fresh.length?[{mode:'facts',programmes:fresh}]:[])]:[{mode:'facts',programmes:fresh}];
 for(const part of parts){
  const file=path.join(cache,p.universityId+'-'+part.mode+'.json');
  fs.writeFileSync(file,JSON.stringify({...p,programmes:part.programmes},null,2)+'\n');
  const flags=part.mode==='scope'?['--scope-only']:[];
  run([file,...flags]);if(apply)run([file,...flags,'--apply']);
 }
}
