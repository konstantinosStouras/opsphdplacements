#!/usr/bin/env node
// Rewrites the roster review position in TODO.md, PAUSED-HANDOFF.md and
// DATA-PROVENANCE.md from the published data/faculty-rosters.json and the
// chunk files under the ignored research/rosters/ (when present), so the
// guides stay current after every merged chunk. It changes only the position
// sentences; everything else in the guides is left as written.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const readJson = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const fmt = n => Number(n || 0).toLocaleString('en-US');

const roster = readJson('data/faculty-rosters.json');
const counts = roster.metadata.counts;
const out = counts.reviewOutcomes || {};
const reviewed = new Set(roster.records.filter(r => r.review).map(r => r.id));
const updated = roster.metadata.reviewsUpdatedAt || new Date().toISOString();
const when = new Date(updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Chunk state from the working files, when they exist on this machine.
const dir = path.join(root, 'research', 'rosters');
const merged = [], inFlight = [], queued = [];
const inFlightUniversities = new Set();
let left = 0;
if (fs.existsSync(dir)) {
  for (const f of fs.readdirSync(dir)) {
    const m = /^chunk-(\d+)\.json$/.exec(f);
    if (!m) continue;
    const n = Number(m[1]);
    const people = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).people || [];
    const open = people.filter(p => !reviewed.has(p.id));
    if (open.length === 0) merged.push(n);
    else if (fs.existsSync(path.join(dir, `proposal-${n}.json`))) {
      inFlight.push(n);
      for (const p of people) inFlightUniversities.add(p.university);
    } else {
      queued.push(n);
      left += open.length;
    }
  }
}
const ranges = nums => {
  const s = [...nums].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < s.length; i++) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    parts.push(j > i + 1 ? `${s[i]} to ${s[j]}` : j === i + 1 ? `${s[i]} and ${s[j]}` : String(s[i]));
    i = j;
  }
  return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts.at(-1) : parts[0] || 'none';
};

const confirmed = fmt(out['confirmed-faculty']);
const noise = fmt(out['extraction-noise']);
const notListed = fmt(out['not-listed']);
const unresolved = fmt(out.unresolved);
const same = fmt(out['same-as-om-list']);

function rewrite(file, pattern, replacement, label) {
  const p = path.join(root, file);
  const before = fs.readFileSync(p, 'utf8');
  if (!pattern.test(before)) throw new Error(`${file}: the ${label} sentence was not found; update it by hand`);
  const after = before.replace(pattern, replacement);
  if (after !== before) fs.writeFileSync(p, after);
  return after !== before;
}

// TODO.md: the count sentence in the roster task.
const todoSentence = `by the end of ${when}, ${fmt(counts.reviewed)} people in ${merged.length || '?'} chunks were reviewed: ${confirmed} confirmed faculty (many in other fields, from whole-college pages), ${noise} extraction noise, ${notListed} staff, students, postdocs or former members, ${unresolved} unresolved, ${same} the same as an OM List profile.`;
const todoChanged = rewrite('TODO.md', /by the end of \d+ \w+ \d{4}, [\d,]+ people in [\d?]+ chunks were reviewed: [^\n]*?the same as an OM List profile\./, todoSentence, 'roster count');

// PAUSED-HANDOFF.md: the position sentence of the roster review loop.
const flight = inFlight.length
  ? `chunks ${ranges(inFlight)} (${[...inFlightUniversities].sort().join(', ')} pages) in review by ${inFlight.length} agent${inFlight.length === 1 ? '' : 's'}, with ${fmt(left)} people left in the queue after them`
  : fs.existsSync(dir)
    ? `no chunk in review, with ${fmt(left)} people left in the queue`
    : 'the working chunk files are not on this machine, so regenerate the queue before continuing';
const position = `Position when this entry was last updated: chunks ${ranges(merged)} merged and published (${fmt(counts.reviewed)} of ${fmt(counts.people)} people reviewed: ${confirmed} confirmed faculty, ${notListed} not faculty, students, postdocs, former members or staff, ${noise} extraction noise, ${same} the same as an OM List profile, ${unresolved} unresolved); ${flight}.`;
const handoffChanged = rewrite('PAUSED-HANDOFF.md', /Position when this entry was last updated: [\s\S]*?\.(?= From chunk 43 on the queue)/, position, 'position');

// DATA-PROVENANCE.md: one sentence at the end of the roster paragraph.
const provenance = `Reviews merged so far (as of ${when}): ${fmt(counts.reviewed)} of the ${fmt(counts.people)} listed people, of whom ${confirmed} are confirmed faculty (most outside operations, because many linked pages are whole-college directories), ${notListed} are staff, students, postdocs or former members, ${noise} are extraction noise, ${same} are the same person as an OM List profile and ${unresolved} are unresolved.`;
const provPath = path.join(root, 'DATA-PROVENANCE.md');
let prov = fs.readFileSync(provPath, 'utf8');
const provBefore = prov;
if (/Reviews merged so far \(as of [^)]*\): [^\n]*?unresolved\./.test(prov)) {
  prov = prov.replace(/Reviews merged so far \(as of [^)]*\): [^\n]*?unresolved\./, provenance);
} else {
  const anchor = /(`data\/faculty-rosters\.json` is produced by [^\n]*?)(\n)/;
  if (!anchor.test(prov)) throw new Error('DATA-PROVENANCE.md: the faculty rosters paragraph was not found');
  prov = prov.replace(anchor, `$1 ${provenance}$2`);
}
if (prov !== provBefore) fs.writeFileSync(provPath, prov);

console.log(`roster notes: ${fmt(counts.reviewed)} of ${fmt(counts.people)} reviewed; merged chunks ${ranges(merged)}; in review ${inFlight.length ? ranges(inFlight) : 'none'}; ${fmt(left)} people queued` +
  ` (${[todoChanged && 'TODO.md', handoffChanged && 'PAUSED-HANDOFF.md', prov !== provBefore && 'DATA-PROVENANCE.md'].filter(Boolean).join(', ') || 'no guide changed'})`);
