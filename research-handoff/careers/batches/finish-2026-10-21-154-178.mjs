// Run only after integration ownership is released. Preserve other workflows' attempts.
import fs from 'node:fs';
const base='research-handoff/careers';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const assignment=read(`${base}/batches/2026-10-21-154-178-assignment.json`);
const path=`${base}/daily/2026-10-21.json`;
const daily=fs.existsSync(path)?read(path):{date:'2026-10-21',targetUniqueProfiles:100,people:[]};
for(const p of assignment.records) {
 const review=read(`${base}/reviews/${p.id.replaceAll(':','_')}.json`);
 if(daily.people.some(r=>r.personId===p.id||r.recordIds?.includes(p.id)))continue;
 daily.people.push({personId:p.id,recordIds:[p.id],name:p.name,checkedDate:'2026-10-21',attemptedAt:null,sourceUrls:review.sourceUrls,sourceCaptureOutcome:'partial',note:'Coordinated batch 154–178. Individually opened CV/official/personal academic sources; exact access times not recorded. Partial history, not complete career or first-job verification.'});
}
daily.uniqueProfilesAttempted=daily.people.length;
daily.remainingToTarget=Math.max(0,daily.targetUniqueProfiles-daily.uniqueProfilesAttempted);
daily.latestManualBatch={orders:'154–178',checkedDate:'2026-10-21',uniquePeopleAttempted:25,partial:25,note:'103 role observations, 20 other mentions and two bounded summaries. No LinkedIn Experience review.'};
write(path,daily);
assignment.status='integrated-partial';
assignment.note='All 25 individually checked and integrated as partial histories; original assignment rows preserved. See companion report for publication and unresolved limitations.';
write(`${base}/batches/2026-10-21-154-178-assignment.json`,assignment);
console.log(`Daily unique attempts ${daily.uniqueProfilesAttempted}.`);
