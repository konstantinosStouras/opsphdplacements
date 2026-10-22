// Dated, explicitly reviewed campus addition. Not a generic duplicate-name override.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {writeComplete} from '../../scripts/write-complete.mjs';
process.chdir(path.resolve(import.meta.dirname, '../..'));
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const cataloguePath = 'research-handoff/universities/continuation-15/shard-c/new-haven-connecticut.official-source-catalogue.json';
const selectionPath = 'research-handoff/universities/add-new-haven-connecticut-2026-10-22.mjs';
const catalogue = read(cataloguePath);
const review = read('research-handoff/universities/continuation-15/shard-c/university-of-new-haven-connecticut.unit.json');
const data = read('data/universities.json');
const original = structuredClone(data.records);
const prior = data.records.find(r => r.id === 'university-of-new-haven');
assert.equal(prior?.country, 'Saudi Arabia');
assert.equal(prior.departments[0].school, 'College of Business and Digital Innovation');
assert.equal(catalogue.observations.length, 1);
const source = catalogue.observations[0];
assert.equal(source.name, 'University of New Haven');
assert.equal(source.countryAsListed, 'United States');
assert.equal(catalogue.distinctCampusException.existingId, prior.id);
assert.equal(catalogue.distinctCampusException.newId, review.id);
assert.equal(review.id, 'university-of-new-haven-connecticut');
for (const url of catalogue.distinctCampusException.locationSources) {
  assert(review.sources.some(s => s.url === url && s.outcome === 'read' && s.checkedAt === '2026-10-22'), 'Missing read location evidence');
}
const existing = data.records.find(r => r.id === review.id);
if (existing) {
  assert.equal(existing.sourceAddition?.selection, selectionPath);
  console.log('Reviewed Connecticut discovery already added; no change.');
  process.exit(0);
}
const departmentId = review.id + '--official-campus-connecticut-main-campus-doctoral-programme';
assert(review.decisions.some(d => d.sourceDepartmentId === departmentId));
const department = {id: departmentId, school: source.school, department: source.department, type: null,
  country: source.countryAsListed, facultyUrl: null, departmentUrl: null, address: null,
  sources: [source.source], postings: null, lastPosted: null, lat: null, lng: null, characteristics: null,
  sourceAssertion: {source: source.source, sourceRecordId: source.sourceRecordId, layer: source.layer,
    sourceUrl: source.sourceUrl, hidden: false}};
data.records.push({id: review.id, name: source.name, country: source.countryAsListed,
  departmentCount: 1, departments: [department], coords: null, directorySources: [source.source],
  wikidata: null, peopleDatabase: null,
  sources: [{url: source.sourceUrl, title: 'Official campus discovery; doctoral and unit evidence reviewed separately', retrievedAt: catalogue.asOf}],
  sourceAddition: {selection: selectionPath, sourceCatalogue: cataloguePath, retrievedAt: catalogue.asOf,
    reason: catalogue.distinctCampusException.reason}});
for (const r of original) assert.deepEqual(data.records.find(x => x.id === r.id), r);
data.metadata.universityCount = data.records.length;
data.metadata.departmentCount = data.records.reduce((n,r) => n + r.departments.length, 0);
data.metadata.rowCount = data.metadata.departmentCount;
data.metadata.countries = new Set(data.records.flatMap(r => Array.isArray(r.country) ? r.country : r.country ? [r.country] : [])).size;
data.metadata.sourceAdditions = data.records.filter(r => r.sourceAddition).length;
data.metadata.sourceAdditionNote = 'Additional discovery assertions from frozen OM List, Operations Academia and individually read official institutional sources. Original imported records remain intact. Official names, eligibility and alias decisions require the separate review overlay.';
if (process.argv.includes('--apply')) writeComplete('data/universities.json', JSON.stringify(data, null, 1) + '\n');
console.log({apply: process.argv.includes('--apply'), added: review.id, total: data.records.length, unchangedPriorRecords: original.length});
