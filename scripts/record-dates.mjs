// Record dates: when each record in each database was first added and when it last changed.
//
//   node scripts/record-dates.mjs --backfill   rebuild data/record-dates.json from the Git history of each file
//   node scripts/record-dates.mjs              stamp the current files (run after every rebuild or merge)
//   node scripts/record-dates.mjs --check      fail if a record has no stamp or its stamp disagrees with the ledger
//
// addedAt is the time the record first appeared in the published file; updatedAt is the last time its content
// changed. Both are UTC date-times. Past records take the committer time of the commit that first contained
// them and of the last commit that changed them; new and changed records take the time this script runs, which
// is the time of the integration. For people, updatedAt also moves when the person's first-job record
// (placements.json) or research disposition (research-status.json) changes. The ledger keeps a hash of each
// record's content (without the two stamps), so rebuilding a file without changing a record leaves its dates alone.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const FILES = {
  'faculty.json': 'id',
  'faculty-roster-people.json': 'id',
  'faculty-rosters.json': 'id',
  'placements.json': 'id',
  'research-status.json': 'facultyId',
  'universities.json': 'id',
  'institutions.json': 'id',
  'entities.json': 'id',
  'employers.json': 'id',
  'doctoral-programs.json': 'id',
  'graduate-lists.json': 'id',
  'university-locations.json': 'university',
  'institution-locations.json': 'institution',
  'employer-locations.json': 'employer',
};
// People files whose updatedAt also follows their first-job record and research disposition.
const PEOPLE = ['faculty.json', 'faculty-roster-people.json'];
const LEDGER = 'data/record-dates.json';
const STAMPS = ['addedAt', 'updatedAt'];

const canon = v => Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object'
  ? `{${Object.keys(v).filter(k => !STAMPS.includes(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',')}}`
  : JSON.stringify(v);
const hash = r => crypto.createHash('sha1').update(canon(r)).digest('hex').slice(0, 16);
const utc = t => new Date(t).toISOString().replace(/\.\d{3}Z$/, 'Z');
const recordsOf = d => Array.isArray(d) ? d : Array.isArray(d?.records) ? d.records : [];
const keyOf = (r, k) => r && r[k] != null ? String(r[k]) : null;

function readLedger() {
  if (!fs.existsSync(LEDGER)) return { version: 1, note: '', files: {} };
  return JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
}
function writeLedger(l) {
  l.note = 'Per-record dates for every database: addedAt (first published) and updatedAt (last content change), UTC. Past dates come from the Git history of each data file (committer time); later ones from the integration that changed the record. Each entry is [addedAt, updatedAt, content hash without the stamps]; removed records keep their dates with removedAt. Rebuilt by scripts/record-dates.mjs.';
  fs.writeFileSync(LEDGER, JSON.stringify(l, null, 0).replace(/\],"/g, '],\n"') + '\n');
}

function backfill() {
  const ledger = { version: 1, note: '', files: {} };
  for (const [file, key] of Object.entries(FILES)) {
    const commits = execFileSync('git', ['log', '--reverse', '--format=%H %cI', '--', `data/${file}`], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const entries = {};
    for (const line of commits) {
      const [sha, when] = line.split(' ');
      let data;
      try { data = JSON.parse(execFileSync('git', ['show', `${sha}:data/${file}`], { encoding: 'utf8', maxBuffer: 1 << 30 })); } catch { continue; }
      const t = utc(when), seen = new Set();
      for (const r of recordsOf(data)) {
        const k = keyOf(r, key); if (!k || seen.has(k)) continue; seen.add(k);
        const h = hash(r), e = entries[k];
        if (!e) entries[k] = [t, t, h];
        else { if (e[3]) e.length = 3; if (e[2] !== h) { e[1] = t; e[2] = h; } }
      }
      for (const [k, e] of Object.entries(entries)) if (!seen.has(k) && !e[3]) e[3] = t; // removedAt
    }
    ledger.files[file] = entries;
    console.log(`${file}: ${commits.length} commits, ${Object.keys(entries).length} records`);
  }
  writeLedger(ledger);
}

function stamp(checkOnly) {
  const ledger = readLedger(), now = utc(Date.now());
  const data = {}, problems = [];
  for (const [file, key] of Object.entries(FILES)) {
    const path = `data/${file}`; if (!fs.existsSync(path)) continue;
    data[file] = JSON.parse(fs.readFileSync(path, 'utf8'));
    const entries = ledger.files[file] ||= {}, seen = new Set();
    for (const r of recordsOf(data[file])) {
      const k = keyOf(r, key); if (!k) continue; seen.add(k);
      const h = hash(r); let e = entries[k];
      if (!e) { if (checkOnly) { problems.push(`${file} ${k}: not in the ledger`); continue; } e = entries[k] = [now, now, h]; }
      else if (e[3]) { if (checkOnly) { problems.push(`${file} ${k}: marked removed but present`); continue; } e.length = 3; e[1] = now; e[2] = h; }
      else if (e[2] !== h) { if (checkOnly) { problems.push(`${file} ${k}: content changed since the last stamp`); continue; } e[1] = now; e[2] = h; }
    }
    if (!checkOnly) for (const [k, e] of Object.entries(entries)) if (!seen.has(k) && !e[3]) e[3] = now;
  }
  // People: updatedAt is the latest of the person's own record, first-job record and research disposition.
  const latest = (file, k) => ledger.files[file]?.[k]?.[1] || '';
  const byPerson = {};
  for (const p of recordsOf(data['placements.json'])) if (p.facultyId) byPerson[p.facultyId] = [byPerson[p.facultyId], latest('placements.json', p.id)].filter(Boolean).sort().pop();
  const apply = (file, r, k) => {
    const e = ledger.files[file]?.[k]; if (!e) return;
    let up = e[1];
    if (PEOPLE.includes(file)) up = [up, byPerson[k] || '', latest('research-status.json', k)].sort().pop();
    if (checkOnly) { if (r.addedAt !== e[0] || r.updatedAt !== up) problems.push(`${file} ${k}: stamps missing or out of date`); return; }
    r.addedAt = e[0]; r.updatedAt = up;
  };
  for (const [file, key] of Object.entries(FILES)) {
    if (!data[file]) continue;
    for (const r of recordsOf(data[file])) { const k = keyOf(r, key); if (k) apply(file, r, k); }
  }
  if (checkOnly) {
    if (problems.length) { console.error(`Record dates: ${problems.length} problems, first: ${problems.slice(0, 5).join('; ')}. Run node scripts/record-dates.mjs.`); process.exit(1); }
    console.log('Record dates: every record carries addedAt and updatedAt matching data/record-dates.json.');
    return;
  }
  for (const [file] of Object.entries(FILES)) {
    if (!data[file]) continue;
    const text = fs.readFileSync(`data/${file}`, 'utf8');
    const indent = /^\{\n( +)"/.exec(text)?.[1]?.length ?? (text.startsWith('{\n') ? 2 : 0);
    const out = JSON.stringify(data[file], null, indent || undefined) + (text.endsWith('\n') ? '\n' : '');
    if (out !== text) fs.writeFileSync(`data/${file}`, out);
  }
  writeLedger(ledger);
  const n = Object.values(ledger.files).reduce((a, f) => a + Object.keys(f).length, 0);
  console.log(`Record dates: ${n} records stamped across ${Object.keys(data).length} databases.`);
}

if (process.argv.includes('--backfill')) { backfill(); stamp(false); }
else stamp(process.argv.includes('--check'));
