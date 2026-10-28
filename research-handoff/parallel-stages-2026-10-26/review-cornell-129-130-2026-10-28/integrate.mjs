import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=new URL('.',import.meta.url),file='data/employment-histories.json';
const d=JSON.parse(fs.readFileSync(file));
const names=['robert-bland-promotion-retirement','robin-roundy-retirement-bound'];
for(const [i,name] of names.entries()){
 const p=JSON.parse(fs.readFileSync(`research-handoff/parallel-stages-2026-10-26/stage-3/corrections/${name}-followup-2026-10-28.json`));
 const r=d.records.find(x=>x.id===p.id),prior=structuredClone(r);
 assert.equal(r.checkedAt,'2026-10-27');
 fs.writeFileSync(new URL(`${name}-proposal.json`,dir),JSON.stringify(p,null,2)+'\n');
 fs.writeFileSync(new URL(`${name}-prior.json`,dir),JSON.stringify(prior,null,2)+'\n');
 const source=p.sources.find(s=>s.checkedAt==='2026-10-28');
 r.sources.push(source);
 const note=i===0?'Cornell’s tribute description dates promotion to Professor to 1987, conflicting with the 1988 date in its 1996 announcement. Both observations are retained. It prospectively announces retirement on July 1, 2019; this does not establish the actual retirement or emeritus transition date. The video and transcript were not reviewed.':'BYU’s Winter 2021 faculty retirement list includes Robin O. Roundy, mathematics, among those retired by September 2020. This establishes an upper bound only; it does not date the precise retirement or emeritus transition.';
 r.otherEmploymentMentions.push({sourceUrl:source.url,checkedAt:'2026-10-28',evidenceNote:note});
 r.previousCoverageNotes=[...(r.previousCoverageNotes||[]),{checkedAt:prior.checkedAt,coverageNote:prior.coverageNote,remainingUnknowns:prior.remainingUnknowns}];
 r.coverageNote=prior.coverageNote+' '+note;
 if(i===0){r.remainingUnknowns[1]='Full-professor promotion dates conflict: 1987 in the tribute description versus 1988 in the 1996 announcement. The planned July 1, 2019 retirement does not establish the actual professor endpoint or emeritus start.';for(const j of r.jobs.filter(j=>['Professor ORIE','Associate Professor ORIE, with tenure'].includes(j.titleAsWritten)))j.evidenceNote+=' The later tribute gives 1987 as the full-professor promotion year; this conflicts with the retained 1988 announcement date.';}
 else r.remainingUnknowns[2]='The BYU chair welcome is dated June 11, 2012, while the Cornell biography says July 2012. Chair end and both emeritus transitions remain unknown. BYU retirement is now documented by September 2020, an upper bound rather than an exact endpoint.';
 r.checkedAt='2026-10-28';r.careerComplete=false;r.profileHistoryComplete=false;
 r.integrationReview={checkedAt:'2026-10-28',basis:'Root independently opened the official textual source. Bounded source observation added; no new job, exact retirement endpoint or first-job verdict. Earlier evidence and source dates retained.'};
 assert.equal(r.jobs.length,prior.jobs.length);assert.deepEqual(r.firstJobAssessment,prior.firstJobAssessment);
}
fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
