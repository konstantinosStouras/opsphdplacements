#!/usr/bin/env node
// Writes chunk files for first-job research from the research ledger: the people whose ledger entry is
// still pending, from one people source, in a researchable order (a stated doctorate with a year first,
// then a doctorate without a year, then no doctorate). Each chunk is a JSON file with up to 40 people
// and the instructions a reviewer needs; the reviewer writes research/placements-roster/proposal-N.json
// in the results format accepted by scripts/merge-placement-research.mjs.
//   node scripts/write-placement-chunks.mjs [--source faculty-page|omlist] [--size 40] [--start N]
//                                           [--skip research/placements-roster/chunk-A.json ...]
// Chunk files numbered from --start are rewritten; lower numbers are left alone. People in the --skip
// files (chunks still in review) and people with a merged review are left out.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const source = opt('--source', 'faculty-page'), size = Number(opt('--size', 40)), start = Number(opt('--start', 1));
const dir = path.join(root, 'research', source === 'faculty-page' ? 'placements-roster' : 'placements-omlist');
fs.mkdirSync(dir, { recursive: true });
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const ledger = read('data/research-status.json').records;
const people = [...read('data/faculty.json').records, ...(fs.existsSync(path.join(root, 'data/faculty-roster-people.json')) ? read('data/faculty-roster-people.json').records : [])];
const skip = new Set(args.flatMap((a, i) => (a === '--skip' ? JSON.parse(fs.readFileSync(path.resolve(root, args[i + 1]), 'utf8')).people.map(p => p.facultyId) : [])));
const pending = new Set(ledger.filter(r => r.status === 'pending' && (r.source || 'omlist') === source).map(r => r.facultyId));
const todo = people.filter(p => pending.has(p.id) && !skip.has(p.id));
const rank = p => (p.phdInstitution && p.phdYear ? 0 : p.phdInstitution ? 1 : 2);
todo.sort((a, b) => rank(a) - rank(b) || (a.currentInstitution || '').localeCompare(b.currentInstitution || '') || a.name.localeCompare(b.name));

for (const f of fs.readdirSync(dir)) { const m = /^chunk-(\d+)\.json$/.exec(f); if (m && Number(m[1]) >= start) fs.unlinkSync(path.join(dir, f)); }
const instructions = [
  'Research the first post-PhD employment of each person, under CONTRIBUTING.md and RESEARCH-DESIGN.md.',
  'A current affiliation is not evidence of a first job; the degree must be complete; a postdoc, visiting or industry job before the first academic post is the first job.',
  'Write research/' + path.basename(dir) + '/proposal-N.json as a JSON array in the results format: facultyId and name copied exactly, status verified | unresolved | not-yet-completed-phd, checkedAt, reason, sources [{url, title, notes}], and for verified also employer, position, placementYear, category, evidenceUrl (in sources), evidenceNote, phdYearVerified, phdInstitutionVerified, with phdYearResolution / phdInstitutionResolution only when correcting the stated value.',
  'phdInstitution and phdYear in this file are what the person\'s own university page states (phdInstitutionSourceUrl); they are not verified degrees. Leave people you did not reach out of the file.'
];
let n = start - 1, written = 0;
for (let i = 0; i < todo.length; i += size) {
  n++;
  const rows = todo.slice(i, i + size).map(p => ({
    facultyId: p.id, name: p.name, source: p.source || 'omlist', title: p.title, area: p.sourceDisciplineLabel || p.discipline, currentInstitution: p.currentInstitution,
    phdInstitution: p.phdInstitution, phdYear: p.phdYear, phdInstitutionSourceUrl: p.phdInstitutionSourceUrl || null, profileUrl: p.sourceProfileUrl, facultyPageUrl: p.sourceUrl
  }));
  fs.writeFileSync(path.join(dir, `chunk-${n}.json`), JSON.stringify({ chunk: n, source, instructions, people: rows }, null, 2) + '\n');
  written += rows.length;
  if (n < start + 3 || i + size >= todo.length) console.log(`chunk-${n} ${rows.length} people | ${[...new Set(rows.map(r => r.currentInstitution))].slice(0, 4).join(' / ')}${new Set(rows.map(r => r.currentInstitution)).size > 4 ? ' ...' : ''}`);
}
console.log(`wrote ${n - start + 1} chunk files for ${written} pending ${source} people in ${dir}`);
