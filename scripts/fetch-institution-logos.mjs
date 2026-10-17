// Download an identifying icon (160 px PNG) for each mapped institution into assets/logos/<qid>.png.
// Official websites come from Wikidata (P856) in batches. Icon sources, best first: the icons the
// homepage itself declares (apple-touch-icon, then sized icons, then the plain favicon), the site's
// /apple-touch-icon.png, DuckDuckGo's and Google's favicon services, and finally the logo files that
// Wikidata records for the institution (icon P2910, small logo P8972, logo P154; read from Wikimedia
// Commons as PNG thumbnails), then the lead image of the English Wikipedia article. Icons identify institutions on the map only; trademarks belong to their
// owners. Reviewed exceptions are in data/logo-review.json (`reject` drops a wrong icon, `url` names
// the file to use, `skip` lists source URLs, or parts of them, that gave a wrong or unreadable icon). Missing icons are fine: the map falls back to initials.
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
const SIZE = 160, MIN = 32, SHARP = 120;
const refresh = process.argv.includes('--refresh'), retryMissing = process.argv.includes('--missing');
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(cachePath), { recursive: true });
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const review = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf8')).records || {} : {};
const save = () => fs.writeFileSync(cachePath, JSON.stringify(cache));

async function wikidata(ids) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|sitelinks', sitefilter: 'enwiki', format: 'json' }), { headers: { 'User-Agent': UA } });
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
const need = mapped.filter(r => !cache[r.qid] || cache[r.qid].commonsVersion !== 3);
for (let i = 0; i < need.length; i += 50) {
  const batch = need.slice(i, i + 50);
  const ents = await wikidata(batch.map(r => r.qid));
  for (const r of batch) {
    const e = ents[r.qid];
    // Icon, small logo, seal and coat of arms before the full logo, which is often a wide wordmark;
    // photographs (.jpg) entered as logos are skipped.
    cache[r.qid] = { ...(cache[r.qid] || {}), website: claim(e, 'P856') || cache[r.qid]?.website || null, commons: ['P2910', 'P8972', 'P158', 'P94', 'P154'].map(p => claim(e, p)).filter(f => f && !/\.jpe?g$/i.test(f)), enwiki: e?.sitelinks?.enwiki?.title || null, commonsVersion: 3 };
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
const commonsUrl = file => `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(file.replace(/ /g, '_'))}&width=256`;

// Layout and checks live in scripts/logo-layout.py (an app icon covers the whole disc; a transparent logo is
// scaled so its farthest pixel sits just inside the circle). It refuses images under 32 px, blank or too
// pale ones and, with strict on, wordmarks more than 2.4 times wider than tall (up to 3 times otherwise,
// used only when nothing squarer exists). It prints the icon's own resolution, so the sharpest source wins.
const convert = (src, target, strict) => +execFileSync('python3', ['-I', path.join(root, 'scripts/logo-layout.py'), src, target, strict ? 'strict' : 'lenient', String(SIZE), String(MIN)], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
// The chosen source file is kept (research/logo-sources/, ignored) so the layout can be redone without downloads.
const rawDir = path.join(path.dirname(cachePath), 'logo-sources');
fs.mkdirSync(rawDir, { recursive: true });
if (process.argv.includes('--relayout')) {
  let n = 0;
  for (const r of mapped) {
    const raw = path.join(rawDir, r.qid + '.bin'), entry = cache[r.qid];
    if (!fs.existsSync(raw) || review[r.qid]?.reject) continue;
    try { convert(raw, path.join(outDir, r.qid + '.png'), !entry?.wideFallback); n++; } catch { /* keep the old file */ }
  }
  console.log(`relaid ${n} icons`);
}

let fetched = 0, tried = 0;
for (const r of mapped) {
  const entry = cache[r.qid], target = path.join(outDir, r.qid + '.png'), fix = review[r.qid];
  if (fix?.reject) { if (fs.existsSync(target)) fs.rmSync(target); entry.icon = null; entry.iconSource = 'rejected in review'; continue; }
  const missing = !fs.existsSync(target);
  const skippedNow = fix?.skip && entry.iconSource && fix.skip.some(part => entry.iconSource.includes(part));
  if (process.argv.includes('--relayout') || !(refresh || skippedNow || (fix?.url && entry.iconSource !== fix.url) || (missing && (retryMissing || entry.icon === undefined)))) continue;
  tried++;
  const candidates = [];
  if (fix?.url) candidates.push({ url: fix.url, ua: fix.url.includes('wikimedia.org') ? UA : BROWSER_UA });
  const skipped = url => (fix?.skip || []).some(part => url.includes(part));
  if (entry.website) {
    entry.domain = new URL(entry.website).hostname.replace(/^www\./, '');
    for (const url of await declaredIcons(entry.website)) candidates.push({ url });
    candidates.push({ url: `https://icons.duckduckgo.com/ip3/${entry.domain}.ico` }, { url: `https://www.google.com/s2/favicons?domain=${entry.domain}&sz=128` });
  }
  for (const file of entry.commons || []) candidates.push({ url: commonsUrl(file), ua: UA });
  // Last: the lead image of the English Wikipedia article, which for a university is usually its seal or
  // logo (a drawing, .svg or .png; photographs are skipped).
  if (entry.enwiki) {
    if (entry.pageImage === undefined) {
      try {
        const res = await fetch('https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', prop: 'pageimages', piprop: 'name', titles: entry.enwiki, redirects: '1', format: 'json' }), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
        const pages = (await res.json()).query?.pages || {};
        entry.pageImage = Object.values(pages)[0]?.pageimage || null;
      } catch { entry.pageImage = null; }
    }
    if (entry.pageImage && /\.(svg|png)$/i.test(entry.pageImage)) candidates.push({ url: `https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(entry.pageImage)}&width=256`, ua: UA });
  }
  const tmp = path.join(outDir, r.qid + '.raw'), out = path.join(outDir, r.qid + '.new.png');
  // Sharpness first: the first square source (in the order above) that is at least 120 px on its own wins;
  // otherwise the sharpest square source; otherwise a moderately wide one.
  let source = null, best = null, fallback = null;
  for (const c of candidates) {
    if (skipped(c.url)) continue;
    const raw = await download(c.url, c.ua);
    if (!raw) continue;
    fs.writeFileSync(tmp, raw);
    try {
      const native = convert(tmp, out, true);
      if (native >= SHARP) { source = c.url; best = null; break; }
      if (!best || native > best.native) best = { raw, url: c.url, native };
      continue;
    } catch { /* not square or unusable */ }
    if (!fallback) { try { const native = convert(tmp, out, false); fallback = { raw, url: c.url, native }; } catch { /* unusable */ } }
  }
  const pick = source ? null : best || fallback;
  if (pick) { fs.writeFileSync(tmp, pick.raw); try { convert(tmp, out, pick === best); source = pick.url; } catch { /* none */ } }
  if (source) { fs.copyFileSync(tmp, path.join(rawDir, r.qid + '.bin')); entry.wideFallback = pick === fallback && !!pick; }
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
