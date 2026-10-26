import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
const dir='research-handoff/universities/continuation-560',read=p=>JSON.parse(fs.readFileSync(p)),m=read(dir+'/integration-manifest.json');
for(const f of m.frozenInputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex'),f.sha256);
const input=read(m.offering),data=read('data/doctoral-programs.json'),p=data.records.find(p=>p.id===input.programmeId),prior=read(dir+'/prior-tsinghua-audit.json').programme;
assert.deepEqual(p,prior,'Programme changed since frozen review');
const sourceIds=[];for(const s of input.sources){const id='source-'+crypto.createHash('sha256').update(s.url+'|'+s.checkedAt).digest('hex').slice(0,14);sourceIds.push(id);if(!p.sources.some(x=>x.id===id))p.sources.push({id,url:s.url,title:s.note,notes:s.note,lastCheckedAt:s.checkedAt,sourceType:'official-primary',access:'opened-and-read'});}
p.overlapNote=input.overlapNote;p.facts.push({field:'overlapNote',value:input.overlapNote,lastCheckedAt:input.checkedAt,sourceIds,evidenceNote:input.reason});p.lastCheckedAt=input.checkedAt;p.checkedAt=input.checkedAt;
validatePrograms(data);if(process.argv.includes('--apply'))fs.writeFileSync('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');console.log({apply:process.argv.includes('--apply'),existingProgrammeEnriched:p.id,extraProgrammes:0,newSources:sourceIds.length,priorFactsPreserved:true});
