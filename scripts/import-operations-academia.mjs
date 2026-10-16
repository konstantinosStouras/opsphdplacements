// Import the Operations Academia universities directory (the user's own site) as the first database:
// universities, schools and departments that do Operations. Output: data/universities.json, one row per
// university with its departments, plus a link to the second database (people by PhD institution, from
// the OM List import) wherever the names can be matched. Matches are labelled by how they were made so
// a reviewer can check them; unmatched universities stay unlinked, never guessed.
//
// Source: https://www.operationsacademia.org/data/directory.json (the committed flat table behind the
// universities page). Community corrections made on the site are overlaid from Firestore at read time
// and are NOT in that file; a snapshot of the file is kept under research/ for provenance.
// Usage: node scripts/import-operations-academia.mjs [--input saved-directory.json]
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const SOURCE = 'https://www.operationsacademia.org/data/directory.json';
const args = process.argv.slice(2), inputFlag = args.indexOf('--input');
const retrievedAt = new Date().toISOString().slice(0, 10);

let rows;
if (inputFlag >= 0) rows = JSON.parse(fs.readFileSync(path.resolve(args[inputFlag + 1]), 'utf8'));
else {
  const res = await fetch(SOURCE, { headers: { 'User-Agent': 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)' } });
  if (!res.ok) throw new Error(`Could not fetch ${SOURCE}: ${res.status}`);
  const text = await res.text(); rows = JSON.parse(text);
  fs.mkdirSync(path.join(root, 'research'), { recursive: true });
  fs.writeFileSync(path.join(root, `research/operations-academia-directory-${retrievedAt}.json`), text);
}
if (!Array.isArray(rows)) throw new Error('Expected an array of directory rows');

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[’'`]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(the|of|at|and|in)\b/g, ' ').replace(/\s+/g, ' ').trim();

// Group department rows by university.
const universities = new Map();
for (const r of rows) {
  if (!r.institution) continue;
  const u = universities.get(r.institution) || { name: r.institution, country: null, countries: new Set(), departments: [], lat: null, lng: null, sources: new Set(), facultyUrls: new Set() };
  if (r.country) u.countries.add(r.country);
  u.departments.push({ id: r.id, school: r.school || null, department: r.department || null, type: r.type || null, country: r.country || null, facultyUrl: r.facultyUrl || null, departmentUrl: r.deptUrl || null, address: r.address || null, sources: r.sources || [], postings: r.n ?? null, lastPosted: r.lastPosted || null, lat: r.lat ?? null, lng: r.lng ?? null, characteristics: r.characteristics || null });
  if (u.lat == null && r.lat != null && r.lng != null) { u.lat = r.lat; u.lng = r.lng; }
  for (const s of r.sources || []) u.sources.add(s);
  if (r.facultyUrl) u.facultyUrls.add(r.facultyUrl);
  universities.set(r.institution, u);
}

// Link to the people database (second database) by PhD institution name.
const institutions = JSON.parse(fs.readFileSync(path.join(root, 'data/institutions.json'), 'utf8')).records;
const byNorm = new Map(institutions.map(i => [norm(i.name), i]));
const byQid = new Map(institutions.filter(i => i.wikidata).map(i => [i.wikidata, i]));
// Optional Wikidata matches for the directory names (node scripts/geocode-institutions.mjs universities).
const qidCachePath = path.join(root, 'research/geocode-universities-cache.json');
const qidCache = fs.existsSync(qidCachePath) ? JSON.parse(fs.readFileSync(qidCachePath, 'utf8')) : {};
const stripAbbrev = name => name.replace(/\s*\([A-Z][A-Za-z&.\- ]{1,12}\)\s*$/, '').trim();  // "National University of Singapore (NUS)"
const linkFor = name => {
  const plain = stripAbbrev(name), n = norm(plain);
  if (byNorm.has(n)) return { institution: byNorm.get(n), match: 'exact' };
  // Wikidata item shared by both databases (the directory name was matched to an item separately).
  const qid = qidCache[name]?.qid || qidCache[plain]?.qid;
  if (qid && byQid.has(qid)) return { institution: byQid.get(qid), match: 'wikidata' };
  // "University of Michigan" (directory) ~ "University of Michigan at Ann Arbor" (people): the people-database
  // name is the directory name plus a campus qualifier. The other direction is not accepted, because a directory
  // name with a qualifier (NYU Shanghai, CUHK Shenzhen) is usually a different institution.
  const candidates = institutions.filter(i => { const full = stripAbbrev(i.name); if (!full.toLowerCase().startsWith(plain.toLowerCase())) return false; const rest = full.slice(plain.length); return /^(,\s|\s+at\s|\s*[-–]\s*)/.test(rest); });
  if (candidates.length === 1) return { institution: candidates[0], match: 'campus-qualifier' };
  return null;
};

const records = [...universities.values()].sort((a, b) => b.departments.length - a.departments.length || a.name.localeCompare(b.name)).map(u => {
  const countries = [...u.countries], link = linkFor(u.name);
  return {
    id: slug(u.name), name: u.name, country: countries.length === 1 ? countries[0] : countries.length ? countries : null,
    departmentCount: u.departments.length, departments: u.departments,
    coords: u.lat != null ? [u.lat, u.lng] : null,
    directorySources: [...u.sources].sort(),
    wikidata: qidCache[u.name]?.qid || qidCache[stripAbbrev(u.name)]?.qid || link?.institution.wikidata || null,
    peopleDatabase: link ? { phdInstitution: link.institution.name, institutionId: link.institution.id, match: link.match, people: link.institution.people, verifiedFirstJobs: link.institution.verifiedFirstJobs } : null,
    sources: [{ url: SOURCE, title: 'Operations Academia universities directory (flat table behind the universities page)', retrievedAt }, ...[...u.facultyUrls].slice(0, 3).map(url => ({ url, title: 'Faculty page listed in the directory' }))]
  };
});
const linked = records.filter(r => r.peopleDatabase), exact = linked.filter(r => r.peopleDatabase.match === 'exact'), viaQid = linked.filter(r => r.peopleDatabase.match === 'wikidata');
const peopleNamesLinked = new Set(linked.map(r => r.peopleDatabase.phdInstitution));
const out = {
  version: 1,
  metadata: {
    source: SOURCE, retrievedAt, rowCount: rows.length, universityCount: records.length, departmentCount: rows.filter(r => r.institution).length,
    countries: [...new Set(records.flatMap(r => (Array.isArray(r.country) ? r.country : r.country ? [r.country] : [])))].length,
    definition: 'Universities, schools and departments that do Operations, as listed in the Operations Academia directory. Listing in the directory does not establish that a university awards a doctorate in the field; doctoral provision is recorded separately in data/doctoral-programs.json.',
    note: 'The directory file is the committed source of truth of the Operations Academia site; corrections made by signed-in users are overlaid there at read time and are not included here. Links to the people database: "exact" is the same name after normalising spelling, "wikidata" is the same Wikidata item matched independently for both names, "campus-qualifier" is a people-database name equal to the directory name plus a campus qualifier (at Ann Arbor, College Park). Unmatched universities are not linked.',
    linkedToPeopleDatabase: { universities: linked.length, exact: exact.length, wikidata: viaQid.length, campusQualifier: linked.length - exact.length - viaQid.length, peopleDatabaseInstitutionsCovered: peopleNamesLinked.size, peopleDatabaseInstitutionsTotal: institutions.length }
  },
  records
};
fs.writeFileSync(path.join(root, 'data/universities.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`universities: ${records.length} (${out.metadata.departmentCount} department rows, ${out.metadata.countries} countries); linked to the people database: ${linked.length} (${exact.length} exact, ${viaQid.length} wikidata, ${linked.length - exact.length - viaQid.length} campus qualifier); people-database institutions covered: ${peopleNamesLinked.size} of ${institutions.length}`);
