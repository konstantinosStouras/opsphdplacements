import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkedDate, historyStatus, roleDates, isLinkedInProfileUrl, validateHistories} from '../assets/linkedin-histories.js';

const record = {id:'pilot',name:'Example Person',recordIds:['graduate-1'],profileUrl:'https://www.linkedin.com/in/example-person/',checkedAt:'2026-10-20',updatedAt:'2026-10-20T12:00:00Z',profileHistoryComplete:false,jobs:[{employerAsWritten:'Example University',titleAsWritten:'Professor',start:{asWritten:'2004'},end:null,isCurrent:true,sourceUrl:'https://www.linkedin.com/in/example-person/',checkedAt:'2026-10-20'}]};
test('partial histories and all-accessible completion remain distinct', () => {
  assert.match(historyStatus(record), /Partial review/);
  assert.equal(historyStatus({...record,profileHistoryComplete:true}), 'All accessible profile entries checked');
  assert.match(historyStatus({...record,profileHistoryComplete:'true'}), /Partial review/);
});
test('unknown dates stay unknown and year-only dates retain precision', () => {
  assert.equal(roleDates({}), 'Start date unknown – End date unknown');
  assert.equal(roleDates(record.jobs[0]), '2004 – Present (as reported)');
  assert.equal(checkedDate('2026-02-30'), 'Unknown');
  assert.equal(checkedDate('yesterday'), 'Unknown');
  assert.equal(checkedDate('2026-10-20T12:00:00Z'), '2026-10-20 12:00:00 UTC');
});
test('profile links reject executable URLs, credentials, lookalikes and non-profile paths', () => {
  assert.equal(isLinkedInProfileUrl(record.profileUrl), true);
  for (const url of ['javascript:alert(1)','https://linkedin.com.evil.example/in/person','https://person:secret@linkedin.com/in/person','http://linkedin.com/in/person','https://linkedin.com/company/example','https://evil-linkedin.com/in/person']) assert.equal(isLinkedInProfileUrl(url),false);
});
test('dataset accepts graduate-only identities and rejects duplicate IDs and unsafe role sources', () => {
  assert.doesNotThrow(()=>validateHistories({version:1,records:[record]}));
  assert.throws(()=>validateHistories({version:1,records:[record,record]}));
  assert.throws(()=>validateHistories({version:1,records:[{...record,jobs:[{...record.jobs[0],sourceUrl:'javascript:alert(1)'}]}]}));
  assert.throws(()=>validateHistories({version:1,records:[{...record,checkedAt:'2026-02-30'}]}));
});
