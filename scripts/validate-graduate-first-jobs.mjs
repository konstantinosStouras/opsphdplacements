import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const graduates = read('graduate-lists');
const histories = new Map(read('employment-histories').records.map(r => [r.id,r]));
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const reviewed = graduates.records.filter(r => r.firstJobReview);
for (const r of reviewed) {
  const v = r.firstJobReview;
  assert.equal(v.status, 'verified', r.id);
  assert.ok(r.degreeReview && v.reason && v.degreeBoundary && v.limitations?.length, `${r.id}: degree and boundary evidence required`);
  assert.ok(v.employer && v.title && v.appointmentType && date(v.checkedAt), `${r.id}: missing conclusion`);
  assert.ok(Number.isInteger(v.start.year) && v.start.month >= 1 && v.start.month <= 12 && v.start.asWritten, `${r.id}: invalid start`);
  assert.equal(v.start.precision, 'month', `${r.id}: review new precision before extending contract`);
  assert.equal(v.start.day, undefined, `${r.id}: month evidence cannot supply an exact day`);
  assert.ok(v.sources?.length >= 2, `${r.id}: source chronology required`);
  for (const s of v.sources) assert.ok(/^https:\/\//.test(s.url) && date(s.checkedAt) && s.evidenceNote, `${r.id}: invalid source`);
  assert.deepEqual(histories.get(r.id)?.firstJobAssessment, v, `${r.id}: conflicting history conclusion`);
}
assert.equal(graduates.metadata.verifiedGraduateFirstJobs || 0, reviewed.filter(r => !r.facultyId).length);
console.log(`Graduate first-job reviews: ${reviewed.length}, separately counted and evidenced.`);
