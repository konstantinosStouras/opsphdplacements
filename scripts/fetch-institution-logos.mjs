// Download a small identifying icon (48px, 64-colour PNG) for each mapped institution into assets/logos/<qid>.png.
// Official websites come from Wikidata (P856) in batches; icons come from the sites' own favicons via
// DuckDuckGo's icon service, with Google's favicon service as a fallback. Icons identify institutions on
// the map only; trademarks belong to their owners. Missing icons are fine: the map falls back to initials.
// Usage: node scripts/fetch-institution-logos.mjs   (after scripts/geocode-institutions.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const locPath = path.join(root, 'data/institution-locations.json');
const cachePath = path.join(root, 'research/logo-cache.json');
const outDir = path.join(root, 'assets/logos');
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(cachePath), { recursive: true });
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const save = () => fs.writeFileSync(cachePath, JSON.stringify(cache));

async function wikidata(ids) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims', format: 'json' }), { headers: { 'User-Agent': UA } });
    const text = await res.text();
    if (res.ok && text.startsWith('{')) return JSON.parse(text).entities || {};
    await sleep(4000 * (attempt + 1));
  }
  throw new Error('Wikidata kept refusing');
}

const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
const mapped = data.records.filter(r => r.qid);
const need = mapped.filter(r => !cache[r.qid]);
for (let i = 0; i < need.length; i += 50) {
  const batch = need.slice(i, i + 50);
  const ents = await wikidata(batch.map(r => r.qid));
  for (const r of batch) cache[r.qid] = { website: ents[r.qid]?.claims?.P856?.[0]?.mainsnak?.datavalue?.value || null };
  save();
  await sleep(1500);
}

async function download(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 200 ? buf : null;
  } catch { return null; }
}

let fetched = 0;
for (const r of mapped) {
  const entry = cache[r.qid], target = path.join(outDir, r.qid + '.png');
  if (!entry.website || entry.icon !== undefined || fs.existsSync(target)) continue;
  const domain = new URL(entry.website).hostname.replace(/^www\./, '');
  const raw = await download(`https://icons.duckduckgo.com/ip3/${domain}.ico`) || await download(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
  entry.domain = domain;
  if (!raw) { entry.icon = null; save(); continue; }
  const tmp = path.join(outDir, r.qid + '.raw');
  fs.writeFileSync(tmp, raw);
  try {
    // Take the largest frame of an .ico, fit it in 64px on a transparent canvas, and drop tiny placeholders.
    execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1])
if getattr(im, 'ico', None):
    sizes = sorted(im.ico.sizes(), key=lambda s: s[0]*s[1])
    im = im.ico.getimage(sizes[-1])
im = im.convert('RGBA')
if im.width < 24 or im.height < 24: raise SystemExit('too small')
im.thumbnail((48, 48), Image.LANCZOS)
canvas = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
canvas.paste(im, ((48 - im.width) // 2, (48 - im.height) // 2))
canvas.quantize(colors=64, method=Image.Quantize.FASTOCTREE).save(sys.argv[2], optimize=True)
`, tmp, target]);
    entry.icon = r.qid + '.png'; fetched++;
  } catch (e) { entry.icon = null; }
  fs.rmSync(tmp, { force: true });
  save();
  await sleep(300);
}
const have = mapped.filter(r => fs.existsSync(path.join(outDir, r.qid + '.png')));
for (const r of data.records) r.logo = r.qid && fs.existsSync(path.join(outDir, r.qid + '.png')) ? `assets/logos/${r.qid}.png` : null;
data.metadata.logos = { note: 'Site icons downloaded from each institution\'s official website (Wikidata P856) for identification only.', count: have.length };
fs.writeFileSync(locPath, JSON.stringify(data, null, 1) + '\n');
console.log(`logos: ${have.length} of ${mapped.length} mapped institutions (${fetched} new)`);
