// Add a country (Wikidata P17, English label) to every matched record in data/institution-locations.json
// and data/employer-locations.json. Batched: 50 items per request, then one request for country labels.
// Usage: node scripts/wikidata-countries.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cachePath = path.join(root, 'research/country-cache.json');
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : { items: {}, labels: {} };
const save = () => fs.writeFileSync(cachePath, JSON.stringify(cache));

async function entities(ids, props) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: ids.join('|'), props, languages: 'en', format: 'json' }), { headers: { 'User-Agent': UA } });
    const text = await res.text();
    if (res.ok && text.startsWith('{')) return JSON.parse(text).entities || {};
    await sleep(4000 * (attempt + 1));
  }
  throw new Error('Wikidata kept refusing');
}

const files = ['data/institution-locations.json', 'data/employer-locations.json', 'data/university-locations.json'].map(f => path.join(root, f)).filter(f => fs.existsSync(f));
const datasets = files.map(f => [f, JSON.parse(fs.readFileSync(f, 'utf8'))]);
const qids = [...new Set(datasets.flatMap(([, d]) => d.records.filter(r => r.qid).map(r => r.qid)))].filter(q => !cache.items[q]);
for (let i = 0; i < qids.length; i += 50) {
  const batch = qids.slice(i, i + 50), ents = await entities(batch, 'claims');
  for (const q of batch) cache.items[q] = { country: ents[q]?.claims?.P17?.[0]?.mainsnak?.datavalue?.value?.id || null };
  save(); await sleep(1500);
}
const countryIds = [...new Set(Object.values(cache.items).map(i => i.country).filter(Boolean))].filter(c => !cache.labels[c]);
for (let i = 0; i < countryIds.length; i += 50) {
  const batch = countryIds.slice(i, i + 50), ents = await entities(batch, 'labels');
  for (const c of batch) cache.labels[c] = ents[c]?.labels?.en?.value || null;
  save(); await sleep(1500);
}
for (const [file, data] of datasets) {
  for (const r of data.records) { const c = r.qid ? cache.items[r.qid]?.country : null; r.country = c ? cache.labels[c] || null : null; r.countryQid = c || null; }
  data.metadata.country = 'Country of the matched Wikidata item (P17), English label.';
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
  console.log(path.basename(file), 'countries set for', data.records.filter(r => r.country).length, 'of', data.records.length);
}
