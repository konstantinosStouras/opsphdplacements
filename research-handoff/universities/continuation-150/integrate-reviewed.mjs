import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='research-handoff/universities/',out=base+'continuation-150';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const b=read(base+'continuation-144/shard-a/bielefeld-university.doctoral.json');
b.branches.find(x=>x.branch==='business').conclusion=read(base+'continuation-145/shard-a/bielefeld-title-clarification.json').clarification;
write(out+'/bielefeld.doctoral.integrator.json',b);
const nova=read(base+'continuation-147/shard-b/nova-mathematics-or-doctoral-followup.json');
nova.programmes=nova.programmes.filter(p=>p.id==='nova-university-lisbon--mathematics-phd-operations-research');
nova.limitations=nova.limitations.filter(s=>!s.startsWith('Coverage incomplete for additional'));
nova.limitations.push('Only the newly observed historical/unknown-current-status Mathematics OR specialization is integrated here. Existing Management and Industrial Engineering programme facts are preserved exactly by excluding them from this fact-addition proposal. Current Mathematics and Applications detail failed again for the integrator on 25 October; its formal OR continuation remains unverified.');
write(out+'/nova.new-unknown-route.json',nova);
const scopes=[
 'continuation-145/shard-a/iowa-state-university.doctoral.json',
 'continuation-150/bielefeld.doctoral.integrator.json',
 'continuation-144/shard-a/american-university-of-beirut.doctoral.json',
 'continuation-144/shard-a/american-university-of-beirut-school-of-business.doctoral.json',
 'continuation-139/shard-c/university-of-oklahoma.doctoral-scope-composite.json',
 'continuation-148/shard-b/memorial-doctoral-scope.json',
 'continuation-149/shard-b/sungkyunkwan-doctoral-scope.json',
 'continuation-143/shard-a/florida-state-university.doctoral.json'
].map(p=>base+p);
const run=(files,flags)=>execFileSync(process.execPath,['scripts/merge-doctoral-proposals.mjs',...files,...flags],{stdio:'inherit'});
run(scopes,['--scope-only']);run([out+'/nova.new-unknown-route.json'],[]);
if(process.argv.includes('--apply')){run(scopes,['--scope-only','--apply']);run([out+'/nova.new-unknown-route.json'],['--apply']);write(out+'/integration-manifest.json',{integratedAt:'2026-10-25',scopes,newProgrammeProposal:out+'/nova.new-unknown-route.json',newProgrammeStatus:'unknown; withheld from current qualifying counts'});}
