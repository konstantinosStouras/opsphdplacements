import fs from 'node:fs';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
const audit=JSON.parse(fs.readFileSync('research-handoff/universities/continuation-139/shard-b/british-title-helper-routes-audit.json','utf8'));
const data=JSON.parse(fs.readFileSync('data/doctoral-programs.json','utf8'));
const x=audit.recommendations.find(x=>x.recommendation==='exclude'),p=data.records.find(p=>p.id===x.programId);
p.titleScopeReview={decision:'excluded',assessedAt:'2026-10-25',reason:x.rationale,sourceIds:p.sources.map(s=>s.id)};
validatePrograms(data);
fs.writeFileSync('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');
for(const file of ['README.md','TODO.md','research-handoff/priorities/README.md','research-handoff/universities/continuation-135/README.md','research-handoff/universities/continuation-135/prepare-release.mjs']){
 let s=fs.readFileSync(file,'utf8').replaceAll('272 title-qualified','271 title-qualified');
 s=s.replace('Four previously evidenced routes enter title-filtered counts through this spelling correction: Cardiff, NDSU, Lancaster STOR-i and UCL.','Three previously evidenced routes enter title-filtered counts through this spelling correction: Cardiff, NDSU and Lancaster STOR-i. The separately audited UCL Statistical Science supervision-topic route is explicitly excluded; its other qualifying Management doctorate remains.');
 fs.writeFileSync(file,s);
}
for(const file of ['RESEARCH-DESIGN.md','WORKFLOW.md'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('`nContinuation135:','\nContinuation135:'));
fs.appendFileSync('research-handoff/universities/continuation-135/release-files.txt','research-handoff/universities/continuation-135/apply-helper-audit.mjs\nresearch-handoff/universities/continuation-139/shard-b/british-title-helper-routes-audit.json\n');
