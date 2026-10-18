// Merge the graduate-list proposals (research/graduates/proposal-N.json, written by the extraction agents from
// program pages and their archived snapshots) into data/graduate-lists.json: one record per person, institution
// and listed year, with every snapshot that listed the person kept as a sighting, and a link to the people
// database where the name and the PhD institution match. A listing establishes only that the page showed the
// name under that year on that date (RESEARCH-DESIGN.md); it is not a verified degree or first job.
// Usage: node scripts/merge-graduate-lists.mjs research/graduates/proposal-1.json [...]   (no file: rebuild from
// the proposals already recorded in research/graduates/extracted.json is not possible; the public file is the record)
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const outPath = path.join(root, 'data/graduate-lists.json');
const donePath = path.join(root, 'research/graduates/extracted.json');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const aliasOf = fs.existsSync(path.join(root, 'data/institution-aliases.json')) ? read('data/institution-aliases.json').aliases : {};
const canon = name => fold(aliasOf[name]?.canonical || name);
const YEAR_MEANINGS = new Set(['graduation', 'placement', 'job-market', 'class-of', 'unstated']);
// Many pages list every area of a business school. The area the page states for a person (or, failing that, the
// page itself) decides whether the listing is an operations one: operations, supply chain, logistics, industrial
// and systems engineering, operations research, management science, decision sciences and analytics count;
// a page or area naming another field does not; the rest is "unstated".
const OPS = /operation|supply|logistic|industrial|systems eng|management science|decision sci|analytics|production|transport|OR|OM|ISOM|ITOM|IEOR|ISyE|ISE|SCM|OTIM|OIDM|OBA|TOM/i;
const OTHER = /account|financ|marketing|organi[sz]ational behavio|OB|strateg|economics|entrepreneur|real estate|insurance|human resource|sociolog|psycholog|law|statistic|mathematic|computer science|political/i;
const fieldOf = (program, pageUrl) => { const t = program || ''; if (OPS.test(t)) return 'operations'; if (OTHER.test(t)) return 'other-field'; if (OPS.test(pageUrl)) return 'operations'; if (OTHER.test(pageUrl)) return 'other-field'; return 'unstated'; };

const people = [...read('data/faculty.json').records, ...(fs.existsSync(path.join(root, 'data/faculty-roster-people.json')) ? read('data/faculty-roster-people.json').records : [])];
const placements = new Map(read('data/placements.json').records.map(r => [r.facultyId, r]));
// People by folded name; the PhD institution is the verified one where a review corrected the import.
const byName = new Map();
for (const p of people) { const k = fold(p.name); if (!byName.has(k)) byName.set(k, []); byName.get(k).push({ id: p.id, name: p.name, institution: placements.get(p.id)?.phdInstitution || p.phdInstitution, phdYear: placements.get(p.id)?.phdYear ?? p.phdYear }); }

const existing = fs.existsSync(outPath) ? read('data/graduate-lists.json') : { version: 1, metadata: {}, records: [] };
const records = new Map(existing.records.map(r => [r.id, r]));
const done = new Set(fs.existsSync(donePath) ? read('research/graduates/extracted.json') : []);
const files = process.argv.slice(2);
if (!files.length) { console.log('Give proposal files to merge.'); process.exit(0); }
let added = 0, sightings = 0;
for (const file of files) {
  const prop = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
  if (!Array.isArray(prop.records)) throw Error(`No records in ${file}`);
  const chunk = read(`research/graduates/chunk-${prop.chunk}.json`);
  const pageByKey = new Map(chunk.pages.map(p => [p.key, p]));
  // A page cited for one person but belonging to no program in the data (institution "(unknown)" in the chunk) is
  // held out: its names are not operations graduates until a reviewer assigns the page to a program in scope.
  let heldOut = 0;
  for (const r of prop.records) {
    if (r.institution === '(unknown)') { heldOut++; continue; }
    for (const k of ['institution', 'pageKey', 'sourceUrl', 'sourceDate', 'name']) if (!r[k] || typeof r[k] !== 'string') throw Error(`Missing ${k} in ${file}: ${JSON.stringify(r).slice(0, 120)}`);
    if (!/^https?:\/\//.test(r.sourceUrl)) throw Error(`Bad URL in ${file}: ${r.sourceUrl}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.sourceDate)) throw Error(`Bad date in ${file}: ${r.sourceDate}`);
    if (r.listedYear != null && !(Number.isInteger(r.listedYear) && r.listedYear > 1900 && r.listedYear < 2100)) throw Error(`Bad year in ${file}: ${r.name} ${r.listedYear}`);
    if (!YEAR_MEANINGS.has(r.yearMeaning || 'unstated')) throw Error(`Bad yearMeaning in ${file}: ${r.yearMeaning}`);
    const page = pageByKey.get(r.pageKey); if (!page) throw Error(`Unknown page ${r.pageKey} in ${file}`);
    if (page.institution !== r.institution) throw Error(`Institution mismatch in ${file}: ${r.institution} vs ${page.institution}`);
    const id = `grad:${canon(r.institution).replace(/ /g, '-')}:${fold(r.name).replace(/ /g, '-')}:${r.listedYear ?? 'unknown'}`;
    const sighting = { sourceUrl: r.sourceUrl, sourceDate: r.sourceDate, pageUrl: page.url, name: r.name, yearMeaning: r.yearMeaning || 'unstated', program: r.program || null, destination: r.destination || null, position: r.position || null, degree: r.degree || null, note: r.note || null, extractedAt: prop.extractedAt };
    let rec = records.get(id);
    if (!rec) {
      // Link to the people database only when the name and the PhD institution both match; a name match at
      // another institution is kept as a lead, never as a link.
      const cands = byName.get(fold(r.name)) || [];
      const same = cands.filter(c => c.institution && canon(c.institution) === canon(r.institution));
      rec = { id, institution: r.institution, name: r.name, listedYear: r.listedYear ?? null, field: null, sightings: [], facultyId: same.length === 1 ? same[0].id : null, match: same.length === 1 ? 'name-and-institution' : same.length > 1 ? 'several-people-same-name' : cands.length ? 'name-at-another-institution' : null, matchLeads: same.length === 1 ? [] : cands.map(c => `${c.id} (${c.institution || 'no institution'}${c.phdYear ? ', ' + c.phdYear : ''})`) };
      records.set(id, rec); added++;
    }
    if (!rec.sightings.some(s => s.sourceUrl === sighting.sourceUrl && s.name === sighting.name)) { rec.sightings.push(sighting); sightings++; }
    rec.sightings.sort((a, b) => a.sourceDate.localeCompare(b.sourceDate));
    // Operations wins over unstated across a person's sightings; a stated other field wins over unstated too.
    const fields = rec.sightings.map(s => fieldOf(s.program, s.pageUrl));
    rec.field = fields.includes('operations') ? 'operations' : fields.includes('other-field') ? 'other-field' : 'unstated';
  }
  if (heldOut) console.log(`${file}: ${heldOut} records held out (page not assigned to a program in scope)`);
  for (const p of chunk.pages) for (const t of p.texts) done.add(`${p.key}/${path.basename(t)}`);
  for (const u of prop.unreadable || []) done.add(`${u.pageKey}/${u.sourceDate}`);
}
const all = [...records.values()].sort((a, b) => a.institution.localeCompare(b.institution) || (a.listedYear ?? 9999) - (b.listedYear ?? 9999) || a.name.localeCompare(b.name));
// Coverage per institution and listed year: names listed, with the years and pages behind them. Never "complete":
// a page lists whom the program chose to list on that date.
const coverage = {};
for (const r of all) { if (r.field === 'other-field') continue; const k = `${r.institution}|${r.listedYear ?? 'unknown'}`; coverage[k] ??= { institution: r.institution, listedYear: r.listedYear, names: 0, linked: 0, pages: new Set() }; coverage[k].names++; if (r.facultyId) coverage[k].linked++; for (const s of r.sightings) coverage[k].pages.add(s.pageUrl); }
const out = {
  version: 1,
  metadata: {
    updatedAt: new Date().toISOString().slice(0, 10),
    note: 'Names listed by the programs\' own placement, alumni and graduate pages, read live and from archived snapshots (Internet Archive). A listing shows only that the page named the person under that year on that date: it is not a verified degree or first job. Rosters are partial; no program-year is claimed complete.',
    records: all.length, sightings: all.reduce((n, r) => n + r.sightings.length, 0), linkedToPeople: all.filter(r => r.facultyId).length, institutions: new Set(all.map(r => r.institution)).size,
    byField: { operations: all.filter(r => r.field === 'operations').length, 'other-field': all.filter(r => r.field === 'other-field').length, unstated: all.filter(r => r.field === 'unstated').length },
    coverage: Object.values(coverage).map(c => ({ ...c, pages: [...c.pages], rosterStatus: 'partial' })),
  },
  records: all,
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
fs.mkdirSync(path.dirname(donePath), { recursive: true });
fs.writeFileSync(donePath, JSON.stringify([...done].sort(), null, 0));
console.log(`graduate lists: ${all.length} person-years (${added} new, ${sightings} new sightings; ${out.metadata.byField.operations} operations, ${out.metadata.byField['other-field']} other fields, ${out.metadata.byField.unstated} unstated), ${out.metadata.linkedToPeople} linked to people, ${out.metadata.institutions} institutions`);
