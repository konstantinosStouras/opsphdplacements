import test from 'node:test';
import assert from 'node:assert/strict';
import {historyIndex,jobText,careerSummary,validateCareerHistories} from '../assets/career-history.js';
import {filterRecords,normalize,csv} from '../assets/model.js';

test('dated observations do not imply appointment start or continuous tenure',()=>{
  assert.equal(jobText({observedPeriod:{asWritten:'March 2008'},employerAsWritten:'University',titleAsWritten:'Visitor'}),'Observed March 2008 (appointment boundaries unknown): University — Visitor');
  assert.match(jobText({start:{asWritten:'2001'},end:{asWritten:'2003'}}),/^2001 – 2003:/);
});

test('employer and role filters remain independent and intersect',()=>{
  const rows=[
    {name:'One',employer:'INSEAD',position:'Assistant Professor'},
    {name:'Two',employer:'INSEAD',position:'Postdoctoral Fellow'},
    {name:'Three',employer:'Other University',position:'Assistant Professor'}
  ].map(r=>normalize({...r,verificationStatus:'verified-first-placement'}));
  assert.equal(filterRecords(rows,{cols:{institution:'INSEAD'}}).length,2);
  assert.equal(filterRecords(rows,{cols:{position:'Assistant Professor'}}).length,2);
  assert.deepEqual(filterRecords(rows,{cols:{institution:'INSEAD',position:'Assistant Professor'}}).map(r=>r.name),['One']);
});
test('history matching uses reviewed IDs and rejects conflicting histories',()=>{
  const h={id:'a',recordIds:['b'],name:'Same Name'};
  assert.equal(historyIndex([h]).get('b'),h);
  assert.equal(historyIndex([h]).get('Same Name'),undefined);
  assert.throws(()=>historyIndex([h,{id:'b'}]));
});
test('sector summary uses the check date, distinguishes transitions and never fills gaps',()=>{
  assert.equal(careerSummary(), 'Not yet researched');
  assert.equal(careerSummary({reviewStatus:'blocked',jobs:[]}), 'Source unavailable; employment history not verified');
  assert.match(careerSummary({jobs:[{isCurrent:true}]}),/Insufficient/);
  const h={postPhdPeriods:[{startYear:2010,endYear:2016,sector:'academia'},{startYear:2016,sector:'industry',currentThroughCheck:true,checkedAt:'2026-10-20'}]};
  assert.equal(careerSummary(h),'Approximately 6 years in academia till 2016 (2010–2016); Approximately 10 years in industry till 2026-10-20 (2016–2026)');
});
test('validation rejects overlapping primary intervals and unsupported degree boundaries',()=>{
  const p={startYear:2010,endYear:2016,sector:'academia',checkedAt:'2026-10-20',evidenceNote:'Explicit chronology',sourceUrls:['https://example.org/cv']};
  const h={id:'a',name:'A',identityBasis:'Degree and chronology matched',checkedAt:'2026-10-20',jobs:[],coverageNote:'Sample',verifiedPhdYear:2010,degreeSourceUrl:'https://example.org/degree',postPhdPeriods:[p]};
  assert.doesNotThrow(()=>validateCareerHistories({records:[h]},new Set(['a'])));
  assert.throws(()=>validateCareerHistories({records:[{...h,postPhdPeriods:[p,{...p,startYear:2015}]}]},new Set(['a'])));
  assert.throws(()=>validateCareerHistories({records:[{...h,verifiedPhdYear:2011}]},new Set(['a'])));
});
test('history search and CSV preserve evidence fields safely',()=>{
  const r={name:'A',employmentHistory:'Prior employer — Analyst',historyCheckedAt:'2026-10-20',postPhdEmploymentHistory:'=unsafe'};
  assert.equal(filterRecords([r],{cols:{history:'analyst'}}).length,1);
  assert.equal(filterRecords([r],{query:'prior employer'}).length,1);
  assert.match(csv([r]),/"'=unsafe"/);
  assert.match(csv([r]),/historyCheckedAt/);
});
