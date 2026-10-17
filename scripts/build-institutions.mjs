// Publish two derived databases from the public JSON: data/institutions.json (one row per PhD-granting
// institution in the directory) and data/employers.json (one row per verified first employer). Both are
// regenerated, never edited by hand; every number is recomputed from faculty.json, placements.json,
// research-status.json and the location files. Usage: node scripts/build-institutions.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const faculty = read('data/faculty.json'), placements = read('data/placements.json'), status = read('data/research-status.json');
const rosterPeople = fs.existsSync(path.join(root, 'data/faculty-roster-people.json')) ? read('data/faculty-roster-people.json').records : [];
const locations = fs.existsSync(path.join(root, 'data/institution-locations.json')) ? read('data/institution-locations.json').records : [];
const employerLocations = fs.existsSync(path.join(root, 'data/employer-locations.json')) ? read('data/employer-locations.json').records : [];
const locByName = new Map(locations.map(r => [r.institution, r])), empLocByName = new Map(employerLocations.map(r => [r.employer, r]));
const statusById = new Map(status.records.map(r => [r.facultyId, r.status])), placementById = new Map(placements.records.map(p => [p.facultyId, p]));
const slug = name => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const CATEGORIES = ['tenure-track', 'postdoc', 'other-academic', 'industry', 'government', 'nonprofit', 'unknown'];
const generatedAt = new Date().toISOString().slice(0, 10);

// Names that differ only in accents, punctuation, spacing or case ("Koç University" and "Koc University",
// "University of California, Berkeley" and "University of California Berkeley") are one organisation: they
// share a slug, which is the record id. The most used spelling is the record name; the others are kept in
// "spellings" so the records they came from can still be found. The source files keep their own spellings.
const spellingGroups = names => {
  const groups = {};
  for (const n of names) { const s = slug(n); (groups[s] ||= {})[n] = (groups[s][n] || 0) + 1; }
  const canon = {}, variants = {};
  for (const [s, counts] of Object.entries(groups)) { variants[s] = Object.keys(counts).sort((a, b) => a.localeCompare(b)); canon[s] = [...variants[s]].sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))[0]; }
  return { canon: name => canon[slug(name)], variants: name => (variants[slug(name)].length > 1 ? variants[slug(name)] : undefined) };
};
const firstLocation = (names, byName) => names.map(n => byName.get(n)).find(l => l?.qid) || names.map(n => byName.get(n)).find(Boolean) || null;

// People with the verified PhD institution and year where a review corrected the import.
const people = [...faculty.records, ...rosterPeople].map(f => { const p = placementById.get(f.id); return { ...f, phdInstitution: p?.phdInstitution || f.phdInstitution, phdYear: p?.phdYear ?? f.phdYear, status: statusById.get(f.id) || 'pending', placement: p || null }; });
const institutionNames = spellingGroups(people.map(p => p.phdInstitution).filter(Boolean)), employerNames = spellingGroups(people.filter(p => p.placement).map(p => p.placement.employer));

const institutions = {};
for (const p of people) {
  if (!p.phdInstitution) continue;
  const name = institutionNames.canon(p.phdInstitution);
  const r = (institutions[name] ||= { name, people: 0, omList: 0, facultyPage: 0, verified: 0, unresolved: 0, pending: 0, notYetCompleted: 0, years: [], categories: Object.fromEntries(CATEGORIES.map(c => [c, 0])), employers: {} });
  r.people++; if (p.source === 'faculty-page') r.facultyPage++; else r.omList++;
  if (p.placement) { const em = employerNames.canon(p.placement.employer); r.verified++; r.categories[p.placement.category]++; r.employers[em] = (r.employers[em] || 0) + 1; }
  else if (p.status === 'unresolved') r.unresolved++; else if (p.status === 'not-yet-completed-phd') r.notYetCompleted++; else r.pending++;
  if (p.phdYear) r.years.push(p.phdYear);
}
const institutionRecords = Object.values(institutions).sort((a, b) => b.people - a.people || a.name.localeCompare(b.name)).map(r => {
  const spellings = institutionNames.variants(r.name), loc = firstLocation(spellings || [r.name], locByName), years = [...new Set(r.years)].sort((a, b) => a - b);
  return {
    id: slug(r.name), name: r.name, spellings, country: loc?.country || null, wikidata: loc?.qid || null, coords: loc?.qid ? [loc.lat, loc.lon] : null, logo: loc?.logo || null,
    people: r.people, peopleBySource: { omList: r.omList, facultyPage: r.facultyPage }, verifiedFirstJobs: r.verified, unresolved: r.unresolved, pending: r.pending, notYetCompleted: r.notYetCompleted,
    firstYear: years[0] ?? null, lastYear: years[years.length - 1] ?? null, cohorts: years.length,
    firstJobTypes: r.categories,
    topFirstEmployers: Object.entries(r.employers).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([employer, count]) => ({ employer, count })),
    sources: [...(r.omList ? [{ url: 'https://omlist.edutool.org/phd/by-year.html', title: 'OM List, PhD graduates by year (directory listing of people, not a graduate roster)' }] : []), ...(r.facultyPage ? [{ url: 'data/faculty-roster-people.json', title: 'Operations faculty found on the faculty pages linked from the universities database, each with the page that states the doctorate' }] : []), ...(loc?.qid ? [{ url: `https://www.wikidata.org/wiki/${loc.qid}`, title: 'Wikidata item used for the location and country' }] : [])]
  };
});

const employers = {};
for (const p of people) {
  if (!p.placement) continue;
  const name = employerNames.canon(p.placement.employer);
  const e = (employers[name] ||= { name, hires: 0, years: [], startYears: [], categories: Object.fromEntries(CATEGORIES.map(c => [c, 0])), sources: {}, positions: {} });
  e.hires++; e.categories[p.placement.category]++;
  if (p.phdYear) e.years.push(p.phdYear); if (p.placement.placementYear) e.startYears.push(p.placement.placementYear);
  if (p.phdInstitution) { const inst = institutionNames.canon(p.phdInstitution); e.sources[inst] = (e.sources[inst] || 0) + 1; }
  const pos = p.placement.position || null; if (pos) e.positions[pos] = (e.positions[pos] || 0) + 1;
}
const employerRecords = Object.values(employers).sort((a, b) => b.hires - a.hires || a.name.localeCompare(b.name)).map(e => {
  const spellings = employerNames.variants(e.name), loc = firstLocation(spellings || [e.name], empLocByName), years = [...new Set(e.years)].sort((a, b) => a - b), starts = [...new Set(e.startYears)].sort((a, b) => a - b);
  return {
    id: slug(e.name), name: e.name, spellings, country: loc?.country || null, wikidata: loc?.qid || null, coords: loc?.qid ? [loc.lat, loc.lon] : null,
    verifiedFirstJobs: e.hires, firstCohort: years[0] ?? null, lastCohort: years[years.length - 1] ?? null, firstStartYear: starts[0] ?? null, lastStartYear: starts[starts.length - 1] ?? null,
    firstJobTypes: e.categories,
    sourceInstitutions: Object.entries(e.sources).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([institution, count]) => ({ institution, count })),
    positions: Object.entries(e.positions).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([position, count]) => ({ position, count })),
    sources: [{ url: 'data/placements.json', title: 'Verified first-job records, each with its own evidence links' }, ...(loc?.qid ? [{ url: `https://www.wikidata.org/wiki/${loc.qid}`, title: 'Wikidata item used for the location and country' }] : [])]
  };
});

const write = (file, records, definition) => fs.writeFileSync(path.join(root, file), JSON.stringify({ version: 1, metadata: { generatedAt, derivedFrom: ['data/faculty.json', 'data/faculty-roster-people.json', 'data/placements.json', 'data/research-status.json', 'data/institution-locations.json', 'data/employer-locations.json'], definition, recordCount: records.length }, records }, null, 1) + '\n');
write('data/institutions.json', institutionRecords, 'One row per PhD-granting institution named in the people database (the OM List import and the operations faculty found on the faculty pages linked from the universities database). "people" counts people in the database with that doctorate (peopleBySource splits them by source), not the program\'s graduates. First-job figures count verified first jobs only; unresolved and pending people are listed separately and never inferred. Names that differ only in accents, punctuation, spacing or case are one row; "spellings" lists the variants as written in the source files.');
write('data/employers.json', employerRecords, 'One row per employer of a verified first job after the PhD among directory members. Counts are verified first jobs only, not the employer\'s total hiring. Names that differ only in accents, punctuation, spacing or case are one row; "spellings" lists the variants as written in the placement records.');
console.log(`institutions: ${institutionRecords.length} (${institutionRecords.filter(r => r.coords).length} with a location), employers: ${employerRecords.length} (${employerRecords.filter(r => r.coords).length} with a location)`);
