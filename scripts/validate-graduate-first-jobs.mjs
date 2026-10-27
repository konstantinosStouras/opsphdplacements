import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
export function validateGraduateFirstJobs(graduates, historyData) {
const histories = new Map(historyData.records.map(r => [r.id,r]));
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const reviewed = graduates.records.filter(r => r.firstJobReview);
for (const r of reviewed) {
  const v = r.firstJobReview;
  assert.equal(v.status, 'verified', r.id);
  assert.ok(r.degreeReview && v.reason && v.degreeBoundary && v.limitations?.length, `${r.id}: degree and boundary evidence required`);
  assert.ok(v.employer && v.appointmentType && date(v.checkedAt), `${r.id}: missing conclusion`);
  if (v.start.precision === 'unknown') {
    assert.equal(v.start.year, null, `${r.id}: unknown date cannot invent year`);
    assert.equal(v.start.month, null, `${r.id}: unknown date cannot invent month`);
    assert.equal(v.start.asWritten, null, `${r.id}: unknown date cannot invent display date`);
    assert.ok(v.sequenceEvidence?.kind === 'explicit-next-position' && v.sources.some(s => s.url === v.sequenceEvidence.sourceUrl), `${r.id}: undated first employer requires explicit sequence evidence`);
  } else {
    assert.ok(Number.isInteger(v.start.year) && v.start.month >= 1 && v.start.month <= 12 && v.start.asWritten, `${r.id}: invalid start`);
    assert.equal(v.start.precision, 'month', `${r.id}: unsupported precision`);
  }
  assert.ok(v.title || (v.title === null && v.appointmentType === 'unknown'), `${r.id}: unknown title must remain explicit`);
  assert.equal(v.start.day, undefined, `${r.id}: month evidence cannot supply an exact day`);
  assert.ok(v.sources?.length >= 2, `${r.id}: source chronology required`);
  for (const s of v.sources) assert.ok(/^https:\/\//.test(s.url) && date(s.checkedAt) && s.evidenceNote, `${r.id}: invalid source`);
  assert.deepEqual(histories.get(r.id)?.firstJobAssessment, v, `${r.id}: conflicting history conclusion`);
}
assert.equal(graduates.metadata.verifiedGraduateFirstJobs || 0, reviewed.filter(r => !r.facultyId).length);
return reviewed.length;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(`Graduate first-job reviews: ${validateGraduateFirstJobs(read('graduate-lists'),read('employment-histories'))}, separately counted and evidenced.`);
