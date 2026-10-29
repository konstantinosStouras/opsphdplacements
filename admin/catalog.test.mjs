import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectSources, buildCatalog} from './catalog.mjs';
test('source index rejects executable URLs and preserves separate fact observations/dates', () => {
  const sources = collectSources({checkedAt:'2026-10-20',sourceUrl:'https://example.org/p',jobs:[{checkedAt:'2026-10-21',sourceUrl:'https://example.org/p'},{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:pass@example.org'}]});
  assert.equal(sources.length,1); assert.deepEqual(sources[0].observations.map(o=>o.checkedAt),['2026-10-20','2026-10-21']);
});
test('joins evidence by stable IDs without borrowing a namesake profile', () => {
  const records = value => ({records:value});
  const data = {faculty:records([{id:'a',name:'Same Name'},{id:'b',name:'Same Name'}]),'linkedin-histories':records([{id:'history',recordIds:['a'],profileUrl:'https://www.linkedin.com/in/person',checkedAt:'2026-10-20'}])};
  const catalog = buildCatalog(data);
  assert.equal(catalog.tables.people[0].sources[0].label,'LinkedIn');
  assert.equal(catalog.tables.people[1].sources.length,0);
});
test('Google Scholar and additional source URL arrays are retained without fabricating profiles', () => {
  const sources = collectSources({additionalSourceUrls:['https://scholar.google.com/citations?user=abc','https://orcid.org/0000-0000']});
  assert.deepEqual(sources.map(source=>source.label),['Google Scholar','ORCID']);
  assert.deepEqual(collectSources({name:'No profile'}),[]);
});
