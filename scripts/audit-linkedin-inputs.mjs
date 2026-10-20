import fs from 'node:fs';

// Local metadata audit only. Candidates are not factual corrections or completed reviews.
const read = name => JSON.parse(fs.readFileSync(`data/${name}.json`, 'utf8')).records;
const normalize = value => (value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const people = [...read('faculty'), ...read('faculty-roster-people')];
const graduates = read('graduate-lists');
const groups = rows => {
  const map = new Map();
  for (const row of rows) {
    const key = `${normalize(row.name)}|${normalize(row.currentInstitution || row.institution)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.values()].filter(rows => rows.length > 1).map(rows => rows.map(row => ({ id: row.id, name: row.name, institution: row.currentInstitution || row.institution, listedYear: row.listedYear ?? null })));
};
const ledger = new Map(read('research-status').map(row => [row.facultyId || row.id, row]));
const out = 'research-handoff/linkedin';
fs.mkdirSync(out, { recursive: true });
const audit = {
  checkedAt: new Date().toISOString().slice(0, 10),
  scope: 'Metadata screening, not a person-by-person source review. Repeated graduate years may be legitimate.',
  people: people.length,
  universities: read('universities').length,
  malformedNames: [...people, ...read('universities'), ...graduates].filter(row => !row.name?.trim() || /[<>\uFFFD]|https?:/.test(row.name)).map(row => ({ id: row.id, name: row.name })),
  peopleIdentityCandidates: groups(people),
  graduateIdentityCandidates: groups(graduates),
};
fs.writeFileSync(`${out}/identity-audit.json`, JSON.stringify(audit, null, 2) + '\n');
const queue = people.map(row => ({ id: row.id, name: row.name, currentInstitution: row.currentInstitution, phdInstitution: row.phdInstitution, phdYear: row.phdYear, sourceProfileUrl: row.sourceProfileUrl, researchStatus: ledger.get(row.id)?.status || null, state: 'unchecked' }));
// The queue is a snapshot, not mutable progress. Reviews go in separate files.
fs.writeFileSync(`${out}/queue.json`, JSON.stringify({ scope: 'All current people records; graduate-list-only people follow identity reconciliation.', records: queue }, null, 2) + '\n');
console.log(JSON.stringify({ people: people.length, malformedNames: audit.malformedNames.length, peopleIdentityCandidates: audit.peopleIdentityCandidates.length, graduateIdentityCandidates: audit.graduateIdentityCandidates.length }));
