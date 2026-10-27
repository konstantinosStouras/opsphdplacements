import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateGraduateFirstJobs} from './validate-graduate-first-jobs.mjs';
function fixture() {
  const v={status:'verified',employer:'Example employer',title:null,appointmentType:'unknown',start:{year:null,month:null,asWritten:null,precision:'unknown'},checkedAt:'2026-10-27',reason:'Supervisor explicitly reports next position.',degreeBoundary:'Award month unknown.',limitations:['Career partial.'],sequenceEvidence:{kind:'explicit-next-position',sourceUrl:'https://example.edu/advisor'},sources:[{url:'https://example.edu/advisor',checkedAt:'2026-10-27',evidenceNote:'Next position'},{url:'https://example.edu/degree',checkedAt:'2026-10-26',evidenceNote:'Degree recipient'}]};
  return [{metadata:{verifiedGraduateFirstJobs:1},records:[{id:'graduate',degreeReview:{status:'official-recipient-match'},firstJobReview:v}]},{records:[{id:'graduate',firstJobAssessment:v}]}];
}
test('explicit next-employer evidence does not require an invented title or start year',()=>{
  const [g,h]=fixture(); assert.equal(validateGraduateFirstJobs(g,h),1);
  g.records[0].firstJobReview.start.year=2024;
  assert.throws(()=>validateGraduateFirstJobs(g,h),/unknown date cannot invent year/);
});
test('current affiliation alone cannot verify an undated first employer',()=>{
  const [g,h]=fixture();delete g.records[0].firstJobReview.sequenceEvidence;
  assert.throws(()=>validateGraduateFirstJobs(g,h),/explicit sequence evidence/);
});
