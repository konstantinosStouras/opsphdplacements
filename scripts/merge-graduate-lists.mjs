// Merge the graduate-list proposals (research/graduates/proposal-N.json, written by the extraction agents from
// program pages and their archived snapshots) into data/graduate-lists.json: one record per person, institution
// and listed year, with every snapshot that listed the person kept as a sighting, and a link to the people
// database where the name and the PhD institution match. A listing establishes only that the page showed the
// name under that year on that date (RESEARCH-DESIGN.md); it is not a verified degree or first job.
// Usage: node scripts/merge-graduate-lists.mjs research/graduates/proposal-1.json [...]   (no file: rebuild from
// the proposals already recorded in research/graduates/extracted.json is not possible; the public file is the record)
import fs from 'node:fs';
import path from 'node:path';
import { readGraduatePages, resolveGraduateChunk } from './graduate-inputs.mjs';
import { isSourceUrl } from '../assets/model.js';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
for (const arg of args) if (arg.startsWith('--') && !['--refield', '--dry-run'].includes(arg)) throw Error(`Unknown option ${arg}`);
const files = args.filter(a => !a.startsWith('--'));
if (!files.length && !args.includes('--refield')) { console.log('Give proposal files to merge (or --refield to recompute fields). Add --dry-run to validate without writing.'); process.exit(0); }
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
// Words match in any case; short codes (OR, OM, SCM, ...) only as whole upper-case words, so "or" in "doctoral"
// or "om" in "Economics" does not count. "Industrial" counts only as industrial engineering, not "Industrial
// Relations" or a school called "Industrial and Business Studies" or "Industrial Administration".
const OPS_WORDS = /operation|supply|logistic|industrial (and |& )?(enterprise )?(systems )?eng|industriale|systems eng|management science|decision sci|analytics|production|transport/i;
const OPS_CODES = /\b(OR|OM|POM|QMOM|ISOM|ITOM|IEOR|ISyE|ISE|SCM|OTIM|OIDM|OBA|TOM|DRO|OPIM|OSM)\b/;
const OTHER_WORDS = /account|financ|marketing|organi[sz]ational behavio|strateg|economics|entrepreneur|real estate|insurance|human resource|sociolog|psycholog|\blaw\b|statistic|mathematic|computer science|political/i;
const OTHER_CODES = /\b(OB|OBHR|FIN|MKTG|STRAT)\b/;
const isOps = t => OPS_WORDS.test(t) || OPS_CODES.test(t);
const isOther = t => OTHER_WORDS.test(t) || OTHER_CODES.test(t);
const fieldOf = (program, pageUrl) => { const t = program || ''; if (isOps(t)) return 'operations'; if (isOther(t)) return 'other-field'; if (isOps(pageUrl)) return 'operations'; if (isOther(pageUrl)) return 'other-field'; return 'unstated'; };

const people = [...read('data/faculty.json').records, ...(fs.existsSync(path.join(root, 'data/faculty-roster-people.json')) ? read('data/faculty-roster-people.json').records : [])];
const placements = new Map(read('data/placements.json').records.map(r => [r.facultyId, r]));
// People by folded name; the PhD institution is the verified one where a review corrected the import.
const byName = new Map();
for (const p of people) { const k = fold(p.name); if (!byName.has(k)) byName.set(k, []); byName.get(k).push({ id: p.id, name: p.name, institution: placements.get(p.id)?.phdInstitution || p.phdInstitution, phdYear: placements.get(p.id)?.phdYear ?? p.phdYear }); }

// Pages reviewed as not a graduate list (a single profile, a search page, a department outside operations) are
// skipped; research/graduate-list-pages.json carries the scope and the reason.
const catalogue = files.length ? readGraduatePages(root) : [];
const pageScope = new Map(catalogue.map(p => [p.url, p.scope || 'program-list']));
// Where a copy came from: the live page, an Internet Archive snapshot, or a Common Crawl capture (whose source URL
// is the public index lookup naming the WARC record, since the capture itself is not served to a browser).
const archiveOf = url => /web\.archive\.org\//.test(url) ? 'internet-archive' : /index\.commoncrawl\.org\//.test(url) ? 'commoncrawl' : 'live';
const existing = fs.existsSync(outPath) ? read('data/graduate-lists.json') : { version: 1, metadata: {}, records: [] };
const records = new Map(existing.records.map(r => [r.id, r]));
for (const r of records.values()) for (const s of r.sightings) s.archive ??= archiveOf(s.sourceUrl);
const done = new Set(fs.existsSync(donePath) ? read('research/graduates/extracted.json') : []);
let added = 0, sightings = 0;
for (const file of files) {
  const prop = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
  if (!Array.isArray(prop.records)) throw Error(`No records in ${file}`);
  const chunk = resolveGraduateChunk(root, prop, catalogue);
  const pageByKey = new Map(chunk.pages.map(p => [p.key, p]));
  // A page cited for one person but belonging to no program in the data (institution "(unknown)" in the chunk) is
  // held out: its names are not operations graduates until a reviewer assigns the page to a program in scope.
  let heldOut = 0;
  for (const r of prop.records) {
    if (r.institution === '(unknown)') { heldOut++; continue; }
    const pg = pageByKey.get(r.pageKey); if (pg && pageScope.get(pg.url) === 'not-a-list') { heldOut++; continue; }
    // A page that mixes master's graduates into its list: rows whose degree the page gives as a master's are left out.
    if (/^(MRes|M\.?Sc\.?|MBA|M\.?A\.?|Master)/i.test(r.degree || '')) { heldOut++; continue; }
    // A surname alone (a page that prints "examples of completed dissertations" by surname) cannot be matched or shown as a person.
    if (!/\s/.test(String(r.name).trim())) { heldOut++; continue; }
    for (const k of ['institution', 'pageKey', 'sourceUrl', 'sourceDate', 'name']) if (!r[k] || typeof r[k] !== 'string') throw Error(`Missing ${k} in ${file}: ${JSON.stringify(r).slice(0, 120)}`);
    if (!isSourceUrl(r.sourceUrl)) throw Error(`Bad URL in ${file}: ${r.sourceUrl}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.sourceDate)) throw Error(`Bad date in ${file}: ${r.sourceDate}`);
    if (r.listedYear != null && !(Number.isInteger(r.listedYear) && r.listedYear > 1900 && r.listedYear < 2100)) throw Error(`Bad year in ${file}: ${r.name} ${r.listedYear}`);
    if (!YEAR_MEANINGS.has(r.yearMeaning || 'unstated')) throw Error(`Bad yearMeaning in ${file}: ${r.yearMeaning}`);
    const page = pageByKey.get(r.pageKey); if (!page) throw Error(`Unknown page ${r.pageKey} in ${file}`);
    if (page.institution !== r.institution) throw Error(`Institution mismatch in ${file}: ${r.institution} vs ${page.institution}`);
    const id = `grad:${canon(r.institution).replace(/ /g, '-')}:${fold(r.name).replace(/ /g, '-')}:${r.listedYear ?? 'unknown'}`;
    // Where the copy came from: the live page, an Internet Archive snapshot, or a Common Crawl capture (whose
    // source URL is the public index lookup naming the WARC record; the page itself is not served by a browser).
    const sighting = { sourceUrl: r.sourceUrl, sourceDate: r.sourceDate, archive: archiveOf(r.sourceUrl), pageUrl: page.url, name: r.name, yearMeaning: r.yearMeaning || 'unstated', program: r.program || null, destination: r.destination || null, position: r.position || null, degree: r.degree || null, note: r.note || null, extractedAt: prop.extractedAt };
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
    rec.sightings.sort((a, b) => (a.sourceDate || a.checkedAt || '').localeCompare(b.sourceDate || b.checkedAt || ''));
    // Operations wins over unstated across a person's sightings; a stated other field wins over unstated too.
    const fields = rec.sightings.map(s => fieldOf(s.program, s.pageUrl));
    rec.field = fields.includes('operations') ? 'operations' : fields.includes('other-field') ? 'other-field' : 'unstated';
  }
  if (heldOut) console.log(`${file}: ${heldOut} records held out (page reviewed as not a graduate list of a program in scope)`);
  for (const p of chunk.pages) for (const t of p.texts) done.add(`${p.key}/${path.basename(t)}`);
  for (const u of prop.unreadable || []) done.add(`${u.pageKey}/${u.sourceDate}`);
}
// The field is derived from the sightings alone, so it is recomputed for every record on each merge (a change
// to the rule above then reaches records no new proposal touches).
for (const rec of records.values()) {
  const fields = rec.sightings.map(s => fieldOf(s.program, s.pageUrl));
  rec.field = fields.includes('operations') ? 'operations' : fields.includes('other-field') ? 'other-field' : 'unstated';
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
    note: 'Names listed by the programs\' own placement, alumni and graduate pages, read live and from archived copies (Internet Archive snapshots and Common Crawl captures). A listing shows only that the page named the person under that year on that date: it is not a verified degree or first job. Rosters are partial; no program-year is claimed complete.',
    records: all.length, sightings: all.reduce((n, r) => n + r.sightings.length, 0), linkedToPeople: all.filter(r => r.facultyId).length, institutions: new Set(all.map(r => r.institution)).size,
    byArchive: { live: all.reduce((n, r) => n + r.sightings.filter(s => (s.archive || 'live') === 'live').length, 0), 'internet-archive': all.reduce((n, r) => n + r.sightings.filter(s => s.archive === 'internet-archive').length, 0), commoncrawl: all.reduce((n, r) => n + r.sightings.filter(s => s.archive === 'commoncrawl').length, 0) },
    byField: { operations: all.filter(r => r.field === 'operations').length, 'other-field': all.filter(r => r.field === 'other-field').length, unstated: all.filter(r => r.field === 'unstated').length },
    coverage: Object.values(coverage).map(c => ({ ...c, pages: [...c.pages], rosterStatus: 'partial' })),
  },
  records: all,
};
if (!dryRun) {
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
  if (files.length) {
    fs.mkdirSync(path.dirname(donePath), { recursive: true });
    fs.writeFileSync(donePath, JSON.stringify([...done].sort(), null, 0));
  }
}
if (dryRun) console.log('Dry run: no public data or local extraction state written.');
console.log(`graduate lists: ${all.length} person-years (${added} new, ${sightings} new sightings; ${out.metadata.byField.operations} operations, ${out.metadata.byField['other-field']} other fields, ${out.metadata.byField.unstated} unstated), ${out.metadata.linkedToPeople} linked to people, ${out.metadata.institutions} institutions`);
