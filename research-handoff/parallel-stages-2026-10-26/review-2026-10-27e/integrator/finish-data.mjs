import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const root='research-handoff/parallel-stages-2026-10-26/review-2026-10-27e',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const h=read('data/employment-histories.json'),p=read('research-handoff/parallel-stages-2026-10-26/stage-4/nicholas-johnson.fellowship-observation-2026-10-27.json'),r=h.records.find(r=>r.id===p.personId);
if(!r.otherEmploymentMentions.some(x=>x.observationId===p.additionalSupportingObservation.observationId))r.otherEmploymentMentions.push({...p.additionalSupportingObservation,employerAsWritten:'Prometheus X',sourceUrl:p.source.url,checkedAt:p.checkedAt,sourceType:'official-profile',evidenceNote:p.additionalSupportingObservation.evidenceNote+' Identity matched by MIT OR 2024 doctorate and Princeton background. Supporting fellowship observation only; employment not established.'});
write('data/employment-histories.json',h);write(root+'/mit/nicholas-fellowship.input.json',p);
const old=JSON.parse(execFileSync('git',['show','HEAD:data/record-dates.json'],{maxBuffer:50000000})),ledger=read('data/record-dates.json');
for(const id of ['first-omlist-0870c39d7d2a38fb','first-omlist-cd6f4cd9d6b37f28'])ledger.files['placements.json'][id]=old.files['placements.json'][id];
fs.writeFileSync('data/record-dates.json',JSON.stringify(ledger).replace(/\],"/g,'],\n"')+'\n');
