// Look up approximate locations for the PhD-granting institutions in data/faculty.json and data/faculty-roster-people.json using Wikidata.
// Output: data/institution-locations.json. Every coordinate keeps its Wikidata ID and description so a
// reviewer can check the match. Names that cannot be matched with confidence stay unmapped (null).
// Usage: node scripts/geocode-institutions.mjs            PhD institutions -> data/institution-locations.json
//        node scripts/geocode-institutions.mjs employers  verified first employers -> data/employer-locations.json
// Slow on purpose: Wikidata rate-limits anonymous clients.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const mode = ['employers', 'universities'].includes(process.argv[2]) ? process.argv[2] : 'institutions';
const cachePath = path.join(root, { employers: 'research/geocode-employers-cache.json', universities: 'research/geocode-universities-cache.json', institutions: 'research/geocode-cache.json' }[mode]);
const outPath = path.join(root, { employers: 'data/employer-locations.json', universities: 'data/university-locations.json', institutions: 'data/institution-locations.json' }[mode]);
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)';
const EDU = /universit|college|school|institut|academy|polytechnic|hochschule|faculty|escuela|école|ecole|fundação|fundacao|business|company|corporation|enterprise|bank|laboratory|research|agency|organi[sz]ation|firm|manufacturer|retailer|airline|consult/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const save = () => { fs.mkdirSync(path.dirname(cachePath), { recursive: true }); fs.writeFileSync(cachePath, JSON.stringify(cache)); };
// Reviewed corrections (data/location-review.json): a name whose search result was the wrong item gets the
// right item, or no item when the name alone does not identify one organisation. Applied over the cache.
const reviewPath = path.join(root, 'data/location-review.json');
const review = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf8')).corrections : {};

async function api(params) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = 'https://www.wikidata.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params });
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const text = await res.text();
    if (res.ok && text.startsWith('{')) return JSON.parse(text);
    await sleep(3000 * (attempt + 1));
  }
  throw new Error('Wikidata kept refusing: ' + JSON.stringify(params));
}

const placements = JSON.parse(fs.readFileSync(path.join(root, 'data/placements.json'), 'utf8')).records;
const byId = new Map(placements.map(p => [p.facultyId, p]));
// Institutions use the verified PhD institution where a review corrected the import, matching the site's index.
const rows = mode === 'employers' ? placements : mode === 'universities' ? JSON.parse(fs.readFileSync(path.join(root, 'data/universities.json'), 'utf8')).records : [...JSON.parse(fs.readFileSync(path.join(root, 'data/faculty.json'), 'utf8')).records, ...(fs.existsSync(path.join(root, 'data/faculty-roster-people.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'data/faculty-roster-people.json'), 'utf8')).records : [])].map(f => ({ ...f, phdInstitution: byId.get(f.id)?.phdInstitution || f.phdInstitution }));
const field = { employers: 'employer', universities: 'name', institutions: 'phdInstitution' }[mode];
const counts = new Map();
for (const f of rows) if (f[field]) counts.set(f[field], (counts.get(f[field]) || 0) + 1);
const names = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a));

for (const name of names) {
  if (cache[name]) continue;
  const search = await api({ action: 'wbsearchentities', search: name.replace(/ at (Ann Arbor|Chapel Hill|Fayetteville|Urbana-Champaign)$/i, '').replace(/\s*\([A-Z][A-Za-z&.\- ]{1,12}\)\s*$/, ''), language: 'en', type: 'item', limit: '8' });
  const ids = (search.search || []).filter(s => EDU.test(s.description || '') || EDU.test(s.label || '')).map(s => s.id);
  let pick = null;
  if (ids.length) {
    await sleep(700);
    const ents = await api({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels|descriptions', languages: 'en' });
    for (const id of ids) {
      const e = ents.entities?.[id];
      const c = e?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (c) { pick = { qid: id, label: e.labels?.en?.value, description: e.descriptions?.en?.value, lat: +c.latitude.toFixed(3), lon: +c.longitude.toFixed(3) }; break; }
    }
  }
  cache[name] = pick || { qid: null };
  save();
  await sleep(900);
}
// Fetch the item a correction names, once; a correction to "no item" is applied when the records are written.
for (const name of names) {
  const fix = review[name];
  if (!fix?.qid || cache[name]?.qid === fix.qid) continue;
  const ents = await api({ action: 'wbgetentities', ids: fix.qid, props: 'claims|labels|descriptions', languages: 'en' });
  const e = ents.entities?.[fix.qid], c = e?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  cache[name] = { qid: fix.qid, label: e?.labels?.en?.value, description: e?.descriptions?.en?.value, lat: c ? +c.latitude.toFixed(3) : null, lon: c ? +c.longitude.toFixed(3) : null };
  save();
  await sleep(900);
}

const retrievedAt = new Date().toISOString().slice(0, 10);
const records = names.map(name => {
  const fix = review[name], match = fix && !fix.qid ? { qid: null } : cache[name];
  return { [{ employers: 'employer', universities: 'university', institutions: 'institution' }[mode]]: name, people: counts.get(name), ...match, ...(fix ? { reviewed: true, reviewReason: fix.reason, reviewedAt: fix.reviewedAt } : {}) };
});
fs.writeFileSync(outPath, JSON.stringify({
  version: 1,
  metadata: { source: 'Wikidata item coordinates (P625), matched by name', retrievedAt, note: 'Approximate location for map display only. Matches are name based and unreviewed unless reviewed:true, in which case the match follows the correction recorded in data/location-review.json.', mapped: records.filter(r => r.qid).length, total: records.length, reviewed: records.filter(r => r.reviewed).length },
  records
}, null, 1) + '\n');
console.log(`mapped ${records.filter(r => r.qid).length} of ${records.length} (${records.filter(r => r.reviewed).length} reviewed corrections applied)`);
