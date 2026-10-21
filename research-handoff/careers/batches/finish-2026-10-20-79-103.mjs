// Record actual source-check outcomes; publication alone never increments attempts.
import fs from 'node:fs';
const base='research-handoff/careers';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const assignment=read(`${base}/batches/2026-10-20-79-103-assignment.json`);
const daily=read(`${base}/daily/2026-10-20.json`);
for(const p of assignment.records) {
  const review=read(`${base}/reviews/${p.id.replaceAll(':','_')}.json`);
  if(daily.people.some(r=>r.personId===p.id||r.recordIds?.includes(p.id))) continue;
  daily.people.push({personId:p.id,recordIds:[p.id],name:p.name,checkedDate:'2026-10-20',attemptedAt:null,
    sourceUrls:review.sourceUrls,sourceCaptureOutcome:'partial',
    note:'Coordinated batch 79–103. Individual CV/official-page checks on 20 October 2026; exact per-page access times not recorded. Partial history, not a complete career or first-job verification.'});
}
daily.uniqueProfilesAttempted=daily.people.length;
daily.remainingToTarget=Math.max(0,daily.targetUniqueProfiles-daily.uniqueProfilesAttempted);
daily.latestManualBatch={orders:'79–103',checkedDate:'2026-10-20',uniquePeopleAttempted:25,partial:25,
  note:'124 role observations and 27 other mentions; four bounded summaries. No LinkedIn Experience review. Prior scheduled-run metadata retained.'};
write(`${base}/daily/2026-10-20.json`,daily);
assignment.status='integrated-partial';
assignment.note='All 25 source checks integrated as partial histories; original pending assignment snapshot retained below. Publication details are in the companion report.';
write(`${base}/batches/2026-10-20-79-103-assignment.json`,assignment);
console.log(`Daily unique attempts: ${daily.uniqueProfilesAttempted}; remaining to target: ${daily.remainingToTarget}.`);
