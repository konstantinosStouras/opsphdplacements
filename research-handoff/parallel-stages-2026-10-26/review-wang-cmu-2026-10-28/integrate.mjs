import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir = 'research-handoff/parallel-stages-2026-10-26/review-wang-cmu-2026-10-28';
const path = 'data/employment-histories.json';
const data = JSON.parse(fs.readFileSync(path));
const id = 'grad:massachusetts-institute-of-technology:hai-wang:2015';
const record = data.records.find(r => r.id === id);
assert(record && record.jobs.length === 2, 'Refuse replay or changed reviewed record');
fs.writeFileSync(`${dir}/prior-record.json`, JSON.stringify(record, null, 2) + '\n');
const before = structuredClone(data);
record.jobs.push({
  employerAsWritten: 'Carnegie Mellon University',
  titleAsWritten: 'Visiting Assistant Professor, Heinz College',
  employmentTypeAsWritten: null,
  locationAsWritten: null,
  start: {asWritten: 'Not reported', year: null, month: null, precision: 'unknown'},
  end: {asWritten: 'Not reported', year: null, month: null, precision: 'unknown'},
  isCurrent: null,
  sourceUrl: 'https://www.cmu.edu/news/stories/archives/2020/april/dashboard-will-help-inform-state-decision-makers.html',
  additionalSourceUrls: ['https://m3s.mit.edu/our-team/hai-wang'],
  checkedAt: '2026-10-28',
  sourceType: 'primary-source',
  sourceSection: 'Other contributing members',
  evidenceNote: 'CMU announcement dated 22 April 2020 names Hai Wang as visiting assistant professor at Heinz College, contributing to the Pennsylvania pandemic dashboard. MIT M3S independently connects the SMU professor and MIT Operations Research doctorate to the Heinz visiting affiliation. This establishes a role observed on the announcement date, not appointment start or end; continuity through the later undated biography is unknown.'
});
record.remainingUnknowns.push('CMU visiting assistant professorship observed on 22 April 2020; appointment start/end and continuity with the later MIT M3S visiting-faculty biography remain unknown. This does not resolve the 2015 first-job sequence.');
for (let i=0;i<data.records.length;i++) if (data.records[i].id !== id) assert.deepEqual(data.records[i], before.records[i]);
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(`${dir}/audit.json`, JSON.stringify({id, changedHistories:1, addedRoles:1, firstJobChanges:0, unrelatedRecordsUnchanged:true, sourcesOpened:'2026-10-28', limitations:record.remainingUnknowns},null,2)+'\n');
