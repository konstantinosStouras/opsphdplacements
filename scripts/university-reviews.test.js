import test from 'node:test';
import assert from 'node:assert/strict';
import { universityRows, universityUnitTypeLabel } from '../assets/university-model.js';
import { validateUniversityReviews } from './university-review-schema.mjs';

const original = [
  { id: 'z', name: 'Z University', departments: [{ id: 'z-om', department: 'OM' }] },
  { id: 'a', name: 'A University', departments: [{ id: 'a-is', department: 'IS' }] },
  { id: 'z-school', name: 'Z University Business School', departments: [{ id: 'zs-om', department: 'Operations' }] }
];
const review = () => ({
  id: 'z', status: 'reviewed', canonicalName: 'Z University',
  universitySourceUrl: 'https://example.edu/operations', checkedAt: '2026-10-20', reviewer: 'Codex in Chrome',
  units: [{ id: 'z--operations', name: 'Operations', school: null, type: 'department', fields: ['operations-management'],
    sourceUrl: 'https://example.edu/operations', checkedAt: '2026-10-20', evidence: 'Official department identifies operations management research.' }],
  decisions: [{ sourceDepartmentId: 'z-om', disposition: 'replaced', unitIds: ['z--operations'], reason: 'Official full name.' }],
  sources: [{ url: 'https://example.edu/operations', checkedAt: '2026-10-20', outcome: 'read', note: 'Department and university identified.' }],
  limitations: [], duplicateOf: null
});
test('historical units remain labelled and distinct from same-named later units', () => {
  const r = review();
  r.units.push({...structuredClone(r.units[0]), id:'z--historic-operations', temporalStatus:'historical', evidence:'Official archive identifies this historical department; successor and closure date unknown.'});
  assert.doesNotThrow(() => validateUniversityReviews([r], original));
  const row = universityRows(original, [r]).find(x=>x.id==='z');
  assert.equal(row.units.length, 2);
  assert.deepEqual(row.units.map(universityUnitTypeLabel), ['department','Historical department']);
  r.units[1].temporalStatus='probably-current';
  assert.throws(() => validateUniversityReviews([r], original), /temporal status/);
});
test('unreviewed names remain separate and have no verified units or fabricated dates', () => {
  const rows = universityRows(original);
  assert.deepEqual(rows.map(r => r.id), ['a', 'z', 'z-school']);
  assert(rows.every(r => r.reviewStatus === 'pending' && r.units.length === 0 && r.nameCheckedAt === null));
  assert.equal(rows[1].originals[0].departments[0].department, 'OM');
});
test('reviewed aliases merge only with a reviewed target; evidence and original IDs survive', () => {
  const r = review();
  const alias = { ...structuredClone(r), id: 'z-school', duplicateOf: 'z',
    decisions: [{ sourceDepartmentId: 'zs-om', disposition: 'duplicate', unitIds: ['z--operations'], reason: 'School of same university.' }] };
  assert.equal(universityRows(original, [alias]).length, 3);
  const rows = universityRows(original, [r, alias]);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].units.length, 1);
  assert.deepEqual(rows[1].originals.map(o => o.id), ['z', 'z-school']);
  assert.equal(rows[1].reviewStatus, 'reviewed');
});
test('validation rejects unvisited evidence, unsupported fields and omitted imported labels', () => {
  assert.doesNotThrow(() => validateUniversityReviews([review()], original));
 const faculty = review(); faculty.units[0].type = 'faculty';
 assert.doesNotThrow(() => validateUniversityReviews([faculty], original));
 assert.equal(universityRows(original, [faculty]).find(r => r.id === 'z').units[0].type, 'faculty');
 const managementScience = review(); managementScience.units[0].fields = ['management-science'];
 assert.doesNotThrow(() => validateUniversityReviews([managementScience], original));
  for (const mutate of [
    r => r.sources[0].outcome = 'blocked',
    r => r.units[0].fields = ['information-systems'],
    r => r.units[0].name = 'LSOM',
    r => r.decisions = [],
    r => r.units[0].sourceUrl = 'javascript:alert(1)',
    r => r.checkedAt = '2026-02-30'
  ]) {
    const r = review(); mutate(r);
    assert.throws(() => validateUniversityReviews([r], original));
  }
});
test('partial evidence cannot become a completed review through display grouping', () => {
  const r = review(); r.status = 'partial'; r.limitations = ['Engineering school remains to check.'];
  const row = universityRows(original, [r]).find(r => r.id === 'z');
  assert.equal(row.reviewStatus, 'partial');
  assert.equal(row.units.length, 1);
  assert.equal(row.nameCheckedAt, '2026-10-20');
});
test('evidenced non-university exclusion hides only directory presentation and preserves imports', () => {
  const r = review();
  r.canonicalName = 'Example Company';
  r.units = [];
  r.decisions = [{ sourceDepartmentId: 'z-om', disposition: 'out-of-scope', unitIds: [], reason: 'Corporate research field, not a university department.' }];
  r.directoryExclusion = { reason: 'Official source identifies a company, not a university.', sourceUrl: r.universitySourceUrl, checkedAt: r.checkedAt };
  assert.doesNotThrow(() => validateUniversityReviews([r], original));
  assert.deepEqual(universityRows(original, [r]).map(x => x.id), ['a', 'z-school']);
  assert.equal(original.length, 3);
  for (const mutate of [
    x => x.directoryExclusion.sourceUrl = 'https://unread.example/',
    x => { x.status = 'partial'; x.limitations = ['Uncertain identity']; },
    x => x.units = review().units
  ]) {
    const invalid = structuredClone(r); mutate(invalid);
    assert.throws(() => validateUniversityReviews([invalid], original));
  }
});

test('organisation aliases require independently dated opened relationship evidence', () => {
 const r=review();r.organisationAliases=[{name:'Z University, Business School',sourceUrl:r.universitySourceUrl,checkedAt:r.checkedAt,evidence:'Official source identifies school within university.'}];
 assert.doesNotThrow(()=>validateUniversityReviews([r],original));
 r.organisationAliases[0].checkedAt='2026-10-21';assert.throws(()=>validateUniversityReviews([r],original));
});
