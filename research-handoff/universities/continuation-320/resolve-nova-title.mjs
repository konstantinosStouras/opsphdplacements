import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='research-handoff/universities/continuation-320',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const prior=read(dir+'/nova.prior-programme-snapshot.json');
const input=read('research-handoff/universities/continuation-258/shard-b/nova-current-mathematics-operations-research.json').programmes[0];
const data=read('data/doctoral-programs.json'),record=data.records.find(p=>p.id===prior.id);
assert.equal(prior.programName,'PhD in Mathematics');
assert.equal(prior.status,'unknown');
assert.equal(record.programName,prior.programName,'Apply only once after the normal programme merger');
assert.equal(record.status,'active');
assert.equal(input.existingProgramId,record.id);
const source=record.sources.find(s=>s.url===input.sourceUrl&&s.lastCheckedAt===input.checkedAt);
assert(source,'The current Portuguese source must already have been integrated');
record.priorReviewNotes=[...(record.priorReviewNotes||[]),{checkedAt:prior.lastCheckedAt,evidenceNote:prior.evidenceNote,limitations:prior.limitations,programName:prior.programName,status:prior.status,reason:'Current official Mathematics and Applications page retains DGES base registration R/A-Cr 188/2015, now AL02; no exact title-change date inferred.'}];
for(const [field,value]of Object.entries({programName:input.programName,eligibilityScope:input.evidence})){
 const old=record.facts.find(f=>f.field===field);
 if(old&&!record.priorFactChecks.some(f=>JSON.stringify(f)===JSON.stringify(old)))record.priorFactChecks.push(old);
 record[field]=value;
 record.facts=record.facts.filter(f=>f.field!==field);
 record.facts.push({field,value,lastCheckedAt:input.checkedAt,sourceIds:[source.id],evidenceNote:input.evidence});
}
record.scopeRationale=input.evidence;record.evidenceNote=input.evidence;record.limitations=input.limitations;
for(const field of ['establishedYear','admissionsEndedAt','lastDegreeAwardedAt','closureDate','renamedTo','history','degree'])assert.deepEqual(record[field],prior[field]);
for(const fact of prior.facts)assert([...record.facts,...record.priorFactChecks].some(f=>JSON.stringify(f)===JSON.stringify(fact)),'Lost prior fact '+fact.field);
fs.writeFileSync('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(dir+'/nova-title-resolution-audit.json',JSON.stringify({programmeId:record.id,prior,reviewedCurrent:record,method:'One stable programme; reviewed current title/status, all earlier facts and dates retained; exact rename date unknown.'},null,2)+'\n');
console.log('Resolved one current programme title; prior facts retained.');
