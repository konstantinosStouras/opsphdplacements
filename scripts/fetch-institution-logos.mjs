// Download a small identifying icon (96px PNG) for each mapped institution into assets/logos/<qid>.png.
// Official websites come from Wikidata (P856) in batches. Icon sources, best first: the icons the
// homepage itself declares (apple-touch-icon, then sized icons, then the plain favicon), the site's
// /apple-touch-icon.png, DuckDuckGo's and Google's favicon services, and finally the logo files that
// Wikidata records for the institution (icon P2910, small logo P8972, logo P154; read from Wikimedia
// Commons as PNG thumbnails). Icons identify institutions on the map only; trademarks belong to their
// owners. Reviewed exceptions are in data/logo-review.json (`reject` drops a wrong icon, `url` names
// the file to use). Missing icons are fine: the map falls back to initials.
// Usage: node scripts/fetch-institution-logos.mjs [--refresh] [--missing] [--out DIR --cache FILE]
//   (after scripts/geocode-institutions.mjs; --refresh re-fetches every icon, --missing retries the
//   institutions without one; with neither, only institutions never tried are fetched. --out writes the
//   icons to a staging folder for review instead of assets/logos, and then leaves the locations file alone.)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const locPath = path.join(root, 'data/institution-locations.json');
const reviewPath = path.join(root, 'data/logo-review.json');
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const defaultDir = path.join(root, 'assets/logos');
const outDir = arg('--out') ? path.resolve(arg('--out')) : defaultDir, staging = outDir !== defaultDir;
const cachePath = arg('--cache') ? path.resolve(arg('--cache')) : path.join(root, 'research/logo-cache.json');
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)';
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SIZE = 96, MIN = 32;
const refresh = process.argv.includes('--refresh'), retryMissing = process.argv.includes('--missing');
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(cachePath), { recursive: true });
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const review = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf8')).records || {} : {};
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
const claim = (e, p) => e?.claims?.[p]?.[0]?.mainsnak?.datavalue?.value || null;

const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
const mapped = data.records.filter(r => r.qid);
// Website and Wikidata logo files, fetched once per item (and again for items cached before the logo fields existed).
const need = mapped.filter(r => !cache[r.qid] || cache[r.qid].commons === undefined);
for (let i = 0; i < need.length; i += 50) {
  const batch = need.slice(i, i + 50);
  const ents = await wikidata(batch.map(r => r.qid));
  for (const r of batch) {
    const e = ents[r.qid];
    cache[r.qid] = { ...(cache[r.qid] || {}), website: claim(e, 'P856') || cache[r.qid]?.website || null, commons: ['P2910', 'P8972', 'P154'].map(p => claim(e, p)).filter(Boolean) };
  }
  save();
  await sleep(1500);
}

async function download(url, ua = BROWSER_UA) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (/text\/html|svg/i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 200 ? buf : null;
  } catch { return null; }
}
// Icons the homepage declares, largest first: apple-touch-icon, then icons with sizes, then the plain favicon.
async function declaredIcons(website) {
  try {
    const res = await fetch(website, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 400000), base = res.url, out = [];
    for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
      const attr = name => (tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')) || []).slice(2).find(v => v !== undefined);
      const rel = (attr('rel') || '').toLowerCase(), href = attr('href');
      if (!href || !/icon/.test(rel) || /mask-icon/.test(rel) || /\.svg(\?|$)/i.test(href)) continue;
      const size = Math.max(0, ...((attr('sizes') || '').match(/\d+/g) || []).map(Number));
      let url; try { url = new URL(href.replace(/&amp;/g, '&'), base).href; } catch { continue; }
      out.push({ url, rank: /apple-touch/.test(rel) ? 2000 + (size || 180) : size ? 1000 + size : 500 });
    }
    out.push({ url: new URL('/apple-touch-icon.png', base).href, rank: 400 });
    return out.sort((a, b) => b.rank - a.rank).map(o => o.url);
  } catch { return []; }
}
const commonsUrl = file => `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(file.replace(/ /g, '_'))}&width=192`;

// Largest frame of an .ico, cropped to its visible content, scaled to fit 96px on a transparent canvas.
// Rejects images under 32px (blurry once enlarged), nearly empty ones and ones too light to see on white.
function convert(src, target) {
  execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1])
if getattr(im, 'ico', None):
    sizes = sorted(im.ico.sizes(), key=lambda s: s[0]*s[1])
    im = im.ico.getimage(sizes[-1])
im = im.convert('RGBA')
if im.width < ${MIN} or im.height < ${MIN}: raise SystemExit('too small')
box = im.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
if not box: raise SystemExit('empty')
im = im.crop(box)
if im.width < ${MIN * 0.75} and im.height < ${MIN * 0.75}: raise SystemExit('too small after crop')
colours = im.convert('RGB').getcolors(1 << 16)
if colours is not None and len(colours) < 2: raise SystemExit('blank')
# The map draws icons on a white disc: an icon with almost no pixels darker than pale grey would vanish.
px = list(zip(im.convert('L').getdata(), im.getchannel('A').getdata()))
solid = [l for l, a in px if a > 128]
if not solid or sum(1 for l in solid if l < 200) < 0.03 * len(solid): raise SystemExit('too light for a white disc')
scale = ${SIZE} / max(im.width, im.height)
im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
canvas = Image.new('RGBA', (${SIZE}, ${SIZE}), (0, 0, 0, 0))
canvas.paste(im, ((${SIZE} - im.width) // 2, (${SIZE} - im.height) // 2), im)
canvas.quantize(colors=128, method=Image.Quantize.FASTOCTREE).save(sys.argv[2], optimize=True)
`, src, target], { stdio: ['ignore', 'ignore', 'ignore'] });
}

let fetched = 0, tried = 0;
for (const r of mapped) {
  const entry = cache[r.qid], target = path.join(outDir, r.qid + '.png'), fix = review[r.qid];
  if (fix?.reject) { if (fs.existsSync(target)) fs.rmSync(target); entry.icon = null; entry.iconSource = 'rejected in review'; continue; }
  const missing = !fs.existsSync(target);
  if (!(refresh || (fix?.url && entry.iconSource !== fix.url) || (missing && (retryMissing || entry.icon === undefined)))) continue;
  tried++;
  const candidates = [];
  if (fix?.url) candidates.push({ url: fix.url, ua: fix.url.includes('wikimedia.org') ? UA : BROWSER_UA });
  if (entry.website) {
    entry.domain = new URL(entry.website).hostname.replace(/^www\./, '');
    for (const url of await declaredIcons(entry.website)) candidates.push({ url });
    candidates.push({ url: `https://icons.duckduckgo.com/ip3/${entry.domain}.ico` }, { url: `https://www.google.com/s2/favicons?domain=${entry.domain}&sz=128` });
  }
  for (const file of entry.commons || []) candidates.push({ url: commonsUrl(file), ua: UA });
  const tmp = path.join(outDir, r.qid + '.raw'), out = path.join(outDir, r.qid + '.new.png');
  let source = null;
  for (const c of candidates) {
    const raw = await download(c.url, c.ua);
    if (!raw) continue;
    fs.writeFileSync(tmp, raw);
    try { convert(tmp, out); source = c.url; break; } catch { /* try the next source */ }
  }
  fs.rmSync(tmp, { force: true });
  if (source) { fs.renameSync(out, target); entry.icon = r.qid + '.png'; entry.iconSource = source; fetched++; }
  else { fs.rmSync(out, { force: true }); if (missing) { entry.icon = null; entry.iconSource = null; } }
  save();
  if (tried % 20 === 0) console.log(`  ${tried} tried, ${fetched} fetched`);
  await sleep(200);
}
const have = mapped.filter(r => fs.existsSync(path.join(outDir, r.qid + '.png')));
if (staging) { console.log(`staged: ${have.length} of ${mapped.length} mapped institutions in ${outDir} (${fetched} fetched this run)`); process.exit(0); }
for (const r of data.records) r.logo = r.qid && fs.existsSync(path.join(outDir, r.qid + '.png')) ? `assets/logos/${r.qid}.png` : null;
data.metadata.logos = { note: 'Icons declared by each institution\'s official website (Wikidata P856), or the logo files Wikidata records for it, for identification only.', count: have.length };
fs.writeFileSync(locPath, JSON.stringify(data, null, 1) + '\n');
console.log(`logos: ${have.length} of ${mapped.length} mapped institutions (${fetched} fetched this run)`);
