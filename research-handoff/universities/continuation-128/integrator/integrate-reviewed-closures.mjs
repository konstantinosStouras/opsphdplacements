import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base='research-handoff/universities/continuation-128';
const md=fs.readFileSync(`${base}/shard-a/NEGATIVE-DOCTORAL-INTEGRATION-READY.md`,'utf8');
const a=[...md.matchAll(/\.\.\/\.\.\/(continuation-[^)]*\.doctoral\.json)/g)].map(m=>'research-handoff/universities/'+m[1]);
const b=JSON.parse(fs.readFileSync(`${base}/shard-b/reviewed-ready-observations-2026-10-25.json`,'utf8')).entries;
for(const e of b) if(crypto.createHash('sha256').update(fs.readFileSync(e.doctoralProposalPath)).digest('hex')!==e.sha256) throw new Error('Reviewed file changed: '+e.doctoralProposalPath);
const files=[...new Set([...a,...b.map(e=>e.doctoralProposalPath)])];
if(files.length!==41) throw new Error('Expected 30 shard-A closures, Indiana Northwest, and 10 shard-B observations');
for(const file of files){const p=JSON.parse(fs.readFileSync(file,'utf8'));if(p.programmes.length||!p.coverageComplete||p.status!=='no-qualifying-programme-verified')throw new Error('Unexpected nonnegative proposal: '+file);}
const records=files.map(file=>({file,universityId:JSON.parse(fs.readFileSync(file,'utf8')).universityId,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
fs.writeFileSync(`${base}/integrator/reviewed-closure-manifest.json`,JSON.stringify({integrationReviewDate:'2026-10-25',sourceCheckDatesPreserved:true,scope:'Current source-bounded doctoral inventory decisions; no worldwide or historical absence claimed.',records},null,2)+'\n');
const result=spawnSync(process.execPath,['scripts/merge-doctoral-proposals.mjs',...files,...(process.argv.includes('--apply')?['--apply']:[])],{stdio:'inherit'});
process.exitCode=result.status;
