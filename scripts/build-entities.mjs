// Merge the two databases into one organisation entity each: data/entities.json.
//
//   database 1  data/universities.json      universities with operations departments (Operations Academia)
//   database 2  data/institutions.json      PhD institutions of the people in the OM List import, with their
//               data/employers.json         verified first jobs, and the employers of those first jobs
//   register    data/doctoral-programs.json doctoral programs with their own evidence
//
// One record per organisation, keyed by its Wikidata item when any source matched one ("wd:Q49108"),
// otherwise by a slug of its name ("name:..."). Every name seen in any source becomes an alias; the
// departments come from database 1, the people figures from database 2, the first-employer figures
// from the placements, and the programs from the register. How each source was attached is recorded
// (exact name, shared Wikidata item, campus qualifier) and a disagreement between a source's own
// Wikidata item and the entity's is listed under review.conflicts instead of being resolved silently.
// Nothing is inferred: an organisation that appears in only one source has the other parts null.
// Usage: node scripts/build-entities.mjs   (after build-institutions.mjs and import-operations-academia.mjs)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const read = f => (fs.existsSync(path.join(root, f)) ? JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')) : null);
const institutions = read('data/institutions.json').records, universities = read('data/universities.json').records, employers = read('data/employers.json').records, programs = read('data/doctoral-programs.json').records;
const campusDecisions = new Map();
for (const d of read('research-handoff/priorities/entity-campus-reconciliations.json')?.records || []) {
  const u = universities.find(u => u.id === d.universityId);
  const r = read('data/university-reviews.json').records.find(r => r.id === d.universityId);
  assert(u && r?.canonicalName === d.canonicalName && u.country === d.country && d.reason, 'Invalid campus entity decision');
  assert(r.sources.some(s => s.url === d.sourceUrl && s.checkedAt === d.checkedAt && s.outcome === 'read'), 'Campus identity requires read official evidence');
  assert(!campusDecisions.has(d.universityId), 'Duplicate campus decision');
  campusDecisions.set(d.universityId, d);
}
const locationFiles = { institution: read('data/institution-locations.json'), university: read('data/university-locations.json'), employer: read('data/employer-locations.json') };
const locByName = {}; for (const [kind, data] of Object.entries(locationFiles)) { locByName[kind] = new Map(); for (const r of data?.records || []) locByName[kind].set(r[kind], r); }
const CATEGORIES = ['tenure-track', 'postdoc', 'teaching-track', 'other-academic', 'industry', 'government', 'nonprofit', 'unknown'];

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Names are compared without accents, punctuation, small words or a trailing all-caps abbreviation such as
// "(NUS)"; a trailing campus or school name such as "(Guangzhou)" or "(Kelley)" is kept, because it marks
// a different organisation.
const norm = s => s.replace(/\s*\([A-Z][A-Z&.\-]{1,9}\)\s*$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[’'`]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(the|of|at|and|in)\b/g, ' ').replace(/\s+/g, ' ').trim();

const entities = [], byQid = new Map(), byAlias = new Map();
const addAlias = (e, name) => { if (!name) return; if (!e.aliases.includes(name)) e.aliases.push(name); if(e.review.campusIdentity)return; const n = norm(name); if (!byAlias.has(n)) byAlias.set(n, e); };
const newEntity = (name, qid) => {
  const e = { id: qid ? `wd:${qid}` : `name:${slug(name)}`, wikidata: qid || null, name, aliases: [], country: null, coords: null, logo: null, roles: [], people: null, directory: null, employer: null, programs: [], sources: [], review: { matches: [], conflicts: [] } };
  entities.push(e); if (qid) byQid.set(qid, e); addAlias(e, name);
  return e;
};
const find = (name, qid) => (qid && byQid.get(qid)) || byAlias.get(norm(name)) || null;
const addRole = (e, role) => { if (!e.roles.includes(role)) e.roles.push(role); };
const place = (e, loc, directoryCoords) => {
  if (!e.country && loc?.country) e.country = loc.country;
  if (!e.coords && loc?.qid && loc.lat != null) e.coords = [loc.lat, loc.lon];
  if (!e.coords && directoryCoords) e.coords = directoryCoords;
  if (!e.logo && loc?.logo) e.logo = loc.logo;
  if (loc?.label) addAlias(e, loc.label);
};
const addSource = (e, url, title) => { if (!e.sources.some(s => s.url === url)) e.sources.push({ url, title }); };
const firstLoc = (kind, names) => names.map(n => locByName[kind].get(n)).find(l => l?.qid) || names.map(n => locByName[kind].get(n)).find(Boolean) || null;
const sumTypes = (a, b) => Object.fromEntries(CATEGORIES.map(c => [c, (a?.[c] || 0) + (b?.[c] || 0)]));
const mergeCounts = (list, key) => { const m = {}; for (const it of list) for (const r of it) m[r[key]] = (m[r[key]] || 0) + r.count; return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, count]) => ({ [key]: k, count })); };
const minOf = (a, b) => (a == null ? b : b == null ? a : Math.min(a, b)), maxOf = (a, b) => (a == null ? b : b == null ? a : Math.max(a, b));

// An entity keyed by a Wikidata item is named by the item's English label, so that every source spelling
// is an alias of one neutral name; without an item, the first source name stands.
// Database 2, PhD institutions: the people figures. Two institution rows share an entity only through a
// shared Wikidata item (their names are already grouped by spelling in institutions.json); then the
// figures are added together and both rows stay listed.
for (const i of institutions) {
  let e = find(i.name, i.wikidata), match = null;
  if (e) match = i.wikidata && e.wikidata === i.wikidata ? 'wikidata' : 'exact'; else e = newEntity((i.wikidata && firstLoc('institution', i.spellings || [i.name])?.label) || i.name, i.wikidata);
  if (match) e.review.matches.push({ source: 'institutions', institution: i.name, match });
  if (i.wikidata && e.wikidata && i.wikidata !== e.wikidata) e.review.conflicts.push({ source: 'institutions', institution: i.name, institutionWikidata: i.wikidata, entityWikidata: e.wikidata });
  addRole(e, 'phd-institution');
  addAlias(e, i.name); for (const s of i.spellings || []) addAlias(e, s);
  const p = (e.people ||= { institutions: [], people: 0, verifiedFirstJobs: 0, unresolved: 0, pending: 0, notYetCompleted: 0, firstYear: null, lastYear: null, firstJobTypes: sumTypes(null, null), topFirstEmployers: [] });
  p.institutions.push({ institutionId: i.id, name: i.name, spellings: i.spellings || [i.name], people: i.people, verifiedFirstJobs: i.verifiedFirstJobs });
  p.people += i.people; p.verifiedFirstJobs += i.verifiedFirstJobs; p.unresolved += i.unresolved; p.pending += i.pending; p.notYetCompleted += i.notYetCompleted;
  p.firstYear = minOf(p.firstYear, i.firstYear); p.lastYear = maxOf(p.lastYear, i.lastYear);
  p.firstJobTypes = sumTypes(p.firstJobTypes, i.firstJobTypes);
  p.topFirstEmployers = mergeCounts([p.topFirstEmployers, i.topFirstEmployers], 'employer').slice(0, 10);
  place(e, firstLoc('institution', i.spellings || [i.name]));
  addSource(e, 'https://omlist.edutool.org/phd/by-year.html', 'OM List, PhD graduates by year (people database)');
  if (i.wikidata) addSource(e, `https://www.wikidata.org/wiki/${i.wikidata}`, 'Wikidata item');
}
// Database 1, directory universities: departments, attached by the import's link or a shared Wikidata item.
for (const u of universities) {
  let e = null, match = null;
  const campus = campusDecisions.get(u.id);
  if (campus) {
    e = {id:'campus:'+u.id,wikidata:null,name:campus.canonicalName,aliases:[],country:campus.country,coords:null,logo:null,roles:[],people:null,directory:null,employer:null,programs:[],sources:[],review:{matches:[],conflicts:[],campusIdentity:campus}};
    entities.push(e);addAlias(e,campus.canonicalName);match='individually reviewed campus identity';
  }
  if (!e && u.peopleDatabase) { e = entities.find(x => x.people?.institutions.some(i => i.institutionId === u.peopleDatabase.institutionId)); match = u.peopleDatabase.match; }
  if (!e && u.wikidata && byQid.has(u.wikidata)) { e = byQid.get(u.wikidata); match = 'wikidata'; }
  if (!e) { e = find(u.name, null); if (e) match = 'exact'; }
  if (!e) e = newEntity((u.wikidata && firstLoc('university', u.spellings || [u.name])?.label) || u.name, u.wikidata); else if (match) e.review.matches.push({ source: 'directory', university: u.name, match });
  if (u.wikidata && e.wikidata && u.wikidata !== e.wikidata) e.review.conflicts.push({ source: 'directory', university: u.name, universityWikidata: u.wikidata, entityWikidata: e.wikidata });
  addRole(e, 'directory-university');
  addAlias(e, u.name); for (const s of u.spellings || []) addAlias(e, s);
  e.directory ||= { universities: [], departments: [] };
  e.directory.universities.push({ id: u.id, name: u.name, spellings: u.spellings || [u.name], country: u.country, departmentCount: u.departmentCount, match: match || 'new' });
  for (const d of u.departments) e.directory.departments.push({ id: d.id, university: u.name, school: d.school, department: d.department, type: d.type, facultyUrl: d.facultyUrl, departmentUrl: d.departmentUrl });
  if (!e.country && u.country && !Array.isArray(u.country)) e.country = u.country;
  if(!campus)place(e, firstLoc('university', u.spellings || [u.name]), u.coords);
  addSource(e, 'https://www.operationsacademia.org/universities', 'Operations Academia universities directory (universities database)');
  for (const s of u.sources) if (s.title.startsWith('Faculty page')) addSource(e, s.url, 'Faculty page listed in the directory');
}
// Database 2, first employers: organisations that hired people straight after the PhD. Several employer
// rows can land on one entity (a university and a named school of it that share a Wikidata item); the
// figures are added together and every row stays listed.
for (const em of employers) {
  let e = find(em.name, em.wikidata), match = e ? (em.wikidata && e.wikidata === em.wikidata ? 'wikidata' : 'exact') : null;
  if (!e) e = newEntity((em.wikidata && firstLoc('employer', em.spellings || [em.name])?.label) || em.name, em.wikidata); else e.review.matches.push({ source: 'employers', employer: em.name, match });
  if (em.wikidata && e.wikidata && em.wikidata !== e.wikidata) e.review.conflicts.push({ source: 'employers', employer: em.name, employerWikidata: em.wikidata, entityWikidata: e.wikidata });
  addRole(e, 'first-employer');
  addAlias(e, em.name); for (const s of em.spellings || []) addAlias(e, s);
  const j = (e.employer ||= { employers: [], verifiedFirstJobs: 0, firstCohort: null, lastCohort: null, firstJobTypes: sumTypes(null, null), sourceInstitutions: [], positions: [] });
  j.employers.push({ employerId: em.id, name: em.name, spellings: em.spellings || [em.name], verifiedFirstJobs: em.verifiedFirstJobs });
  j.verifiedFirstJobs += em.verifiedFirstJobs; j.firstCohort = minOf(j.firstCohort, em.firstCohort); j.lastCohort = maxOf(j.lastCohort, em.lastCohort);
  j.firstJobTypes = sumTypes(j.firstJobTypes, em.firstJobTypes);
  j.sourceInstitutions = mergeCounts([j.sourceInstitutions, em.sourceInstitutions], 'institution').slice(0, 5);
  j.positions = mergeCounts([j.positions, em.positions], 'position').slice(0, 5);
  place(e, firstLoc('employer', em.spellings || [em.name]));
  addSource(e, 'data/placements.json', 'Verified first-job records (people database)');
}
// The program register: doctoral programs, attached by university name.
for (const p of programs) {
  let e = (p.universityId&&entities.find(e=>e.directory?.universities.some(u=>u.id===p.universityId)))||find(p.university, null);
  if (!e) e = newEntity(p.university, null); else e.review.matches.push({ source: 'programs', program: p.id, match: 'exact' });
  addRole(e, 'program-register');
  e.programs.push({ id: p.id, programName: p.programName, specialization:p.specialization||null, universityId:p.universityId||null, school: p.school || null, degree: p.degree || null, field: p.field || null, status: p.status, statusAsOf: p.statusAsOf || null });
  addSource(e, 'data/doctoral-programs.json', 'Historical doctoral program register');
}

entities.sort((a, b) => (b.people?.people || 0) - (a.people?.people || 0) || (b.directory?.departments.length || 0) - (a.directory?.departments.length || 0) || a.name.localeCompare(b.name));
const generatedAt = new Date().toISOString().slice(0, 10);
const roleCount = role => entities.filter(e => e.roles.includes(role)).length;
const out = {
  version: 1,
  metadata: {
    generatedAt, derivedFrom: ['data/institutions.json', 'data/universities.json', 'data/employers.json', 'data/doctoral-programs.json', 'data/institution-locations.json', 'data/university-locations.json', 'data/employer-locations.json'],
    definition: 'One record per organisation that appears in either database or the program register: the universities with operations departments (Operations Academia directory), the PhD institutions and first employers of the people in the OM List import, and the registered doctoral programs. Keyed by Wikidata item when known, otherwise by name. Parts that a source does not supply are null; nothing is inferred across sources. Where two source rows land on one entity, both rows stay listed under it and their figures are added.',
    counts: { entities: entities.length, withWikidata: entities.filter(e => e.wikidata).length, phdInstitutions: roleCount('phd-institution'), directoryUniversities: roleCount('directory-university'), firstEmployers: roleCount('first-employer'), withPrograms: roleCount('program-register'), inBothDatabases: entities.filter(e => e.people && e.directory).length, directoryOnly: entities.filter(e => e.directory && !e.people && !e.employer).length, peopleOnly: entities.filter(e => e.people && !e.directory).length, conflicts: entities.filter(e => e.review.conflicts.length).length }
  },
  records: entities
};
fs.writeFileSync(path.join(root, 'data/entities.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`entities: ${out.metadata.counts.entities} (${out.metadata.counts.withWikidata} with a Wikidata item); in both databases: ${out.metadata.counts.inBothDatabases}; directory only: ${out.metadata.counts.directoryOnly}; people only: ${out.metadata.counts.peopleOnly}; first employers: ${out.metadata.counts.firstEmployers}; conflicts to review: ${out.metadata.counts.conflicts}`);
