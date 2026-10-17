// Cross-check every PhD institution's map location against an independent geocoder (OpenStreetMap
// Nominatim), so wrong Wikidata matches and missing coordinates can be reviewed. Writes a report to
// research/location-check.json (ignored); corrections go into data/location-review.json after review.
// Nominatim's usage policy allows one request per second with an identifying User-Agent; results are cached
// in research/nominatim-cache.json. Usage: node scripts/check-institution-locations.mjs [--threshold KM]
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)';
const cachePath = path.join(root, 'research/nominatim-cache.json'), outPath = path.join(root, 'research/location-check.json');
const i = process.argv.indexOf('--threshold'), THRESHOLD = i > 0 ? +process.argv[i + 1] : 25;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const save = () => { fs.mkdirSync(path.dirname(cachePath), { recursive: true }); fs.writeFileSync(cachePath, JSON.stringify(cache)); };
const loc = JSON.parse(fs.readFileSync(path.join(root, 'data/institution-locations.json'), 'utf8')).records;

async function search(q) {
  if (cache[q]) return cache[q];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q, format: 'jsonv2', limit: '5', addressdetails: '1', 'accept-language': 'en' }), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (res.ok) { const hits = (await res.json()).map(h => ({ name: h.name, display: h.display_name, lat: +h.lat, lon: +h.lon, category: h.category, type: h.type, country: h.address?.country || null, importance: h.importance })); cache[q] = hits; save(); await sleep(1100); return hits; }
    } catch { /* retry */ }
    await sleep(3000 * (attempt + 1));
  }
  return null;
}
const km = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dn = r(b.lon - a.lon); return 2 * R * Math.asin(Math.sqrt(Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2)); };
const EDU = new Set(['university', 'college', 'school', 'research_institute', 'kindergarten']);
// Strip suffixes the directory adds ("..., France", "(LSE)") that confuse a place search.
const clean = name => name.replace(/,\s*(France|Germany|Italy|Spain|Canada|USA|United States|UK|India|China|Turkey|Iran|Brazil|Mexico|Japan|Korea)$/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim();

const report = [];
for (const r of loc) {
  const queries = [...new Set([clean(r.institution), r.label && clean(r.label)].filter(Boolean))];
  let hits = [];
  for (const q of queries) { const h = await search(q); if (h) hits.push(...h.map(x => ({ ...x, query: q }))); }
  const edu = hits.filter(h => EDU.has(h.type) || h.category === 'amenity' && /universit|college|school|institut/i.test(h.name || ''));
  const best = (edu.length ? edu : hits).sort((a, b) => (b.importance || 0) - (a.importance || 0))[0] || null;
  const has = Number.isFinite(r.lat) && Number.isFinite(r.lon);
  const nearest = has && edu.length ? edu.reduce((m, h) => (km(r, h) < km(r, m) ? h : m)) : null;
  const flags = [];
  if (!r.qid) flags.push('unmapped');
  else if (!has) flags.push('no-coordinates');
  if (!best) flags.push('no-geocoder-hit');
  if (has && edu.length && km(r, nearest) > THRESHOLD) flags.push(`far-from-geocoder:${Math.round(km(r, nearest))}km`);
  if (has && best && r.country && best.country && !best.country.toLowerCase().includes(r.country.toLowerCase().split(' ')[0]) && !r.country.toLowerCase().includes((best.country || '').toLowerCase().split(' ')[0])) flags.push('country-differs');
  report.push({ institution: r.institution, people: r.people, qid: r.qid || null, label: r.label || null, description: r.description || null, lat: has ? r.lat : null, lon: has ? r.lon : null, country: r.country || null,
    geocoder: best && { name: best.name, display: best.display, lat: best.lat, lon: best.lon, type: best.type, country: best.country, query: best.query },
    nearestEducationHitKm: nearest ? Math.round(km(r, nearest)) : null, flags });
}
fs.writeFileSync(outPath, JSON.stringify({ checkedAt: new Date().toISOString().slice(0, 10), thresholdKm: THRESHOLD, records: report }, null, 1));
const flagged = report.filter(x => x.flags.length);
console.log(`checked ${report.length} institutions; ${flagged.length} flagged (${report.filter(x => x.flags.some(f => f.startsWith('far'))).length} far from the geocoder, ${report.filter(x => x.flags.includes('no-coordinates')).length} without coordinates, ${report.filter(x => x.flags.includes('unmapped')).length} unmapped, ${report.filter(x => x.flags.includes('no-geocoder-hit')).length} without a geocoder hit)`);
