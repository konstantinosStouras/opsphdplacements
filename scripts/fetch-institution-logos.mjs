// Logos for the coverage map: one 192 px PNG per mapped institution in assets/logos/<qid>.png, laid out by
// scripts/logo-layout.py so the logo fills the circle. Two steps:
//
//   node scripts/fetch-institution-logos.mjs --collect [--refresh]
//     downloads every candidate for every mapped institution into research/logo-candidates/<qid>/
//     (ignored), with a manifest of where each came from. Candidates: the icons the institution's official
//     website (Wikidata P856) declares and its /apple-touch-icon.png, the logo files Wikidata records for the institution on Wikimedia Commons (icon P2910, small
//     logo P8972, seal P158, coat of arms P94, logo P154; photographs skipped), the lead image of the English
//     Wikipedia article, seal, logo, emblem and coat-of-arms files on Commons whose file name contains the
//     institution's name, and DuckDuckGo's and Google's copies of the site icon. SVG files are drawn at
//     512 px by the pre-installed Chromium. Without --refresh, institutions already collected are skipped.
//
//   node scripts/fetch-institution-logos.mjs --choose [--out DIR]
//     lays out every candidate and keeps, per institution, the one that best fills the circle while staying
//     sharp, preferring the institution's own files to the favicon services. Writes the logo fields of
//     data/institution-locations.json (not with --out, which stages the logos in DIR for review) and records
//     each choice in research/logo-choices.json.
//
// --only Q1,Q2 limits either step to those items.
// Reviewed exceptions are in data/logo-review.json: `pick` names (part of) the candidate URL to use, `skip`
// lists (parts of) candidate URLs that are wrong or unreadable, `url` adds a candidate, `reject` leaves the
// institution without a logo. Logos identify institutions on the map only; trademarks belong to their owners.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const locPath = path.join(root, 'data/institution-locations.json');
const reviewPath = path.join(root, 'data/logo-review.json');
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const has = name => process.argv.includes(name);
const defaultDir = path.join(root, 'assets/logos');
const outDir = arg('--out') ? path.resolve(arg('--out')) : defaultDir, staging = outDir !== defaultDir;
const metaPath = path.join(root, 'research/logo-cache.json');
const candRoot = path.join(root, 'research/logo-candidates');
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements)';
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SIZE = 192;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const readJson = (p, d) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d;
const meta = readJson(metaPath, {});
const review = readJson(reviewPath, { records: {} }).records || {};
const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
const only = arg('--only')?.split(',');
const qids = [...new Set(data.records.filter(r => r.qid).map(r => r.qid))].filter(q => !only || only.includes(q));
const saveMeta = () => { fs.mkdirSync(path.dirname(metaPath), { recursive: true }); fs.writeFileSync(metaPath, JSON.stringify(meta)); };

// Wikimedia asks for one request at a time with an identifying User-Agent; every Wikimedia request goes
// through this queue, at most one per second.
let wmLast = 0;
async function wm(url, init = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = wmLast + 1000 - Date.now(); if (wait > 0) await sleep(wait);
    wmLast = Date.now();
    try {
      const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init.headers || {}) }, signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) { await sleep(5000 * (attempt + 1)); continue; }
      return res;
    } catch { await sleep(3000 * (attempt + 1)); }
  }
  return null;
}
const claim = (e, p) => e?.claims?.[p]?.[0]?.mainsnak?.datavalue?.value || null;
async function wikidataMeta() {
  const need = qids.filter(q => meta[q]?.commonsVersion !== 4);
  for (let i = 0; i < need.length; i += 50) {
    const batch = need.slice(i, i + 50);
    const res = await wm('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: batch.join('|'), props: 'claims|sitelinks', sitefilter: 'enwiki', format: 'json' }));
    const ents = res && res.ok ? (await res.json()).entities || {} : {};
    for (const q of batch) {
      const e = ents[q]; if (!e) continue;
      const commons = [];
      for (const p of ['P2910', 'P8972', 'P158', 'P94', 'P154']) for (const c of e.claims?.[p] || []) { const f = c.mainsnak?.datavalue?.value; if (f && !/\.jpe?g$/i.test(f)) commons.push({ prop: p, file: f }); }
      meta[q] = { ...(meta[q] || {}), website: claim(e, 'P856') || meta[q]?.website || null, commons, enwiki: e.sitelinks?.enwiki?.title || null, commonsVersion: 4 };
    }
    saveMeta();
  }
}

async function download(url, ua) {
  const init = { headers: { 'User-Agent': ua, Accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5' }, redirect: 'follow' };
  try {
    const res = /wikimedia\.org|wikipedia\.org/.test(url) ? await wm(url, init) : await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
    if (!res || !res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (/text\/html/i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 150) return null;
    const svg = /svg/i.test(type) || /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg/i.test(buf.subarray(0, 600).toString('utf8'));
    return { buf, ext: svg ? 'svg' : 'img' };
  } catch { return null; }
}
// Icons the homepage declares. (Images in the page markup are not used: on review they were as often social-media
// icons, ranking badges, anniversary or alliance marks and photos as the institution's logo.)
async function homepage(website) {
  try {
    const res = await fetch(website, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 600000), base = res.url, out = [];
    const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')) || []).slice(2).find(v => v !== undefined);
    const abs = href => { try { return new URL(href.replace(/&amp;/g, '&'), base).href; } catch { return null; } };
    for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
      const rel = (attr(tag, 'rel') || '').toLowerCase(), url = abs(attr(tag, 'href') || '');
      if (!url || !/icon/.test(rel) || /mask-icon/.test(rel)) continue;
      out.push({ url, kind: /apple-touch/.test(rel) ? 'site-apple' : 'site-icon' });
    }
    out.push({ url: new URL('/apple-touch-icon.png', base).href, kind: 'site-apple' });
    return out;
  } catch { return []; }
}
const commonsUrl = file => `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(file.replace(/ /g, '_'))}&width=512`;
// Seal, logo, emblem and coat-of-arms files on Commons whose name contains the institution's full name (as the
// data writes it, as Wikidata labels it or as its English Wikipedia article is titled), so that "Michigan State
// University seal.svg" is found for Michigan State and never for the University of Michigan.
const fold = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const MARK = /\b(logo|seal|emblem|coat of arms|arms|crest|wordmark|insignia|siegel|wappen|escudo|sello|stemma|sigillum|brasao|blason|embleme|logotipo|logotype)\b/;
async function commonsSearch(q) {
  const names = [...new Set([...data.records.filter(r => r.qid === q).flatMap(r => [r.institution, r.label]), meta[q]?.enwiki].map(fold).filter(n => n && n.split(' ').length >= 2))];
  const found = [];
  for (const name of names.slice(0, 2)) {
    const res = await wm('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', list: 'search', srnamespace: '6', srsearch: `${name} logo OR seal OR emblem OR coat of arms`, srlimit: '20', format: 'json' }));
    let hits = []; try { hits = (await res.json()).query?.search || []; } catch { /* none */ }
    for (const h of hits) {
      const file = h.title.replace(/^File:/, ''), f = fold(file.replace(/\.[a-z]+$/i, ''));
      if (/\.(svg|png)$/i.test(file) && f.includes(name) && MARK.test(f) && !/\b(old|former|historic|historical|19\d\d|18\d\d)\b/.test(f) && !found.includes(file)) found.push(file);
    }
  }
  return found.slice(0, 6).map(commonsUrl);
}
const PROP = { P2910: 'commons-icon', P8972: 'commons-small-logo', P158: 'commons-seal', P94: 'commons-arms', P154: 'commons-logo' };

async function collectOne(q) {
  const dir = path.join(candRoot, q), manPath = path.join(dir, 'manifest.json');
  if (!has('--refresh') && fs.existsSync(manPath)) return;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const m = meta[q] || {}, fix = review[q] || {}, list = [];
  if (fix.url) list.push({ url: fix.url, kind: 'review' });
  if (m.website) {
    list.push(...await homepage(m.website));
    const domain = new URL(m.website).hostname.replace(/^www\./, '');
    list.push({ url: `https://icons.duckduckgo.com/ip3/${domain}.ico`, kind: 'ddg' }, { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`, kind: 'google' });
  }
  for (const c of m.commons || []) list.push({ url: commonsUrl(c.file), kind: PROP[c.prop], file: c.file });
  if (m.enwiki) {
    if (m.pageImage === undefined) {
      const res = await wm('https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', prop: 'pageimages', piprop: 'name', titles: m.enwiki, redirects: '1', format: 'json' }));
      try { m.pageImage = Object.values((await res.json()).query?.pages || {})[0]?.pageimage || null; } catch { m.pageImage = null; }
      meta[q] = m;
    }
    if (m.pageImage && /\.(svg|png)$/i.test(m.pageImage) && !(m.commons || []).some(c => c.file.replace(/ /g, '_') === m.pageImage)) list.push({ url: `https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(m.pageImage)}&width=512`, kind: 'wikipedia-image' });
  }
  for (const url of await commonsSearch(q)) list.push({ url, kind: 'commons-search' });
  const seen = new Set(), manifest = [];
  for (const c of list) {
    if (seen.has(c.url)) continue; seen.add(c.url);
    const got = await download(c.url, /wikimedia|wikipedia/.test(c.url) ? UA : BROWSER_UA);
    const entry = { ...c, k: manifest.length, file: null };
    if (got) { entry.file = `${entry.k}.${got.ext}`; fs.writeFileSync(path.join(dir, entry.file), got.buf); }
    manifest.push(entry);
  }
  fs.writeFileSync(manPath, JSON.stringify(manifest, null, 1));
}
// Draw every collected SVG at 512 px (longest side) on a transparent background with the pre-installed Chromium.
async function renderSvgs() {
  const jobs = [];
  for (const q of qids) for (const e of readJson(path.join(candRoot, q, 'manifest.json'), [])) if (e.file?.endsWith('.svg') && !fs.existsSync(path.join(candRoot, q, e.k + '.png'))) jobs.push(path.join(candRoot, q, e.file));
  if (!jobs.length) return;
  const req = createRequire('/usr/lib/node_modules/');
  const pw = req('playwright');
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }).catch(() => pw.chromium.launch());
  const page = await browser.newPage();
  for (const f of jobs) {
    try {
      const uri = 'data:image/svg+xml;base64,' + fs.readFileSync(f).toString('base64');
      await page.setContent(`<html><body style="margin:0;background:transparent"><img id="i" src="${uri}"></body></html>`);
      const box = await page.evaluate(() => new Promise(done => { const i = document.getElementById('i'); const go = () => { const w = i.naturalWidth || 300, h = i.naturalHeight || 150, s = 512 / Math.max(w, h); i.style.width = w * s + 'px'; i.style.height = h * s + 'px'; done({ w: w * s, h: h * s }); }; i.complete ? go() : (i.onload = go, i.onerror = () => done(null)); }));
      if (box) await (await page.$('#i')).screenshot({ path: f.replace(/\.svg$/, '.png'), omitBackground: true });
    } catch { /* unreadable SVG */ }
  }
  await browser.close();
}

const KIND_RANK = { review: 1.2, 'site-apple': 1, 'site-icon': 1, 'site-logo': 1, 'commons-icon': 1, 'commons-small-logo': 1, 'commons-seal': 1, 'commons-arms': 1, 'commons-logo': 1, 'commons-search': 0.9, 'wikipedia-image': 0.8, ddg: 0.4, google: 0.4 };
function choose() {
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = path.join(candRoot, '.layout.png'), choices = {};
  let n = 0;
  for (const q of qids) {
    const fix = review[q] || {}, target = path.join(outDir, q + '.png');
    if (fix.reject) { fs.rmSync(target, { force: true }); choices[q] = { reason: 'rejected in review' }; continue; }
    const man = readJson(path.join(candRoot, q, 'manifest.json'), []);
    let best = null; const tried = [];
    for (const e of man) {
      if (!e.file || (fix.skip || []).some(part => e.url.includes(part))) continue;
      const file = path.join(candRoot, q, e.file.endsWith('.svg') ? e.k + '.png' : e.file);
      if (!fs.existsSync(file)) continue;
      let r;
      try { r = JSON.parse(execFileSync('python3', ['-I', path.join(root, 'scripts/logo-layout.py'), file, tmp, String(SIZE)], { stdio: ['ignore', 'pipe', 'pipe'] }).toString()); }
      catch (err) { tried.push({ k: e.k, kind: e.kind, failed: String(err.stderr || '').trim().split('\n').pop() }); continue; }
      // Fill counts most, then sharpness (the logo's own pixels; 150 or more is sharp at the largest map size),
      // then the source: the institution's own files before the favicon services.
      // A whole-square picture is accepted only from the site's own icons (elsewhere it was a photograph).
      if (r.mode === 'cover' && !/^(site-apple|site-icon|ddg|google|review)$/.test(e.kind)) { tried.push({ k: e.k, kind: e.kind, failed: 'picture, not a logo' }); continue; }
      if (e.kind === 'site-logo' && !(fix.pick && e.url.includes(fix.pick))) continue;
      const score = 3 * Math.min(r.fill / 0.85, 1) + 2 * Math.min(r.native / 150, 1) - (r.native < 96 ? 1.5 : 0) - (r.mode === 'cover' ? 0.5 : 0) + (KIND_RANK[e.kind] ?? 0.5) + (fix.pick && e.url.includes(fix.pick) ? 100 : 0);
      tried.push({ k: e.k, kind: e.kind, ...r, score: +score.toFixed(2) });
      if (!best || score > best.score) { best = { score, e, r }; fs.copyFileSync(tmp, target + '.tmp'); }
    }
    if (best) { fs.renameSync(target + '.tmp', target); n++; choices[q] = { url: best.e.url, kind: best.e.kind, ...best.r, tried }; }
    else { fs.rmSync(target, { force: true }); choices[q] = { reason: 'no usable candidate', tried }; }
  }
  fs.rmSync(tmp, { force: true });
  fs.writeFileSync(path.join(root, 'research/logo-choices.json'), JSON.stringify(choices, null, 1));
  console.log(`chose ${n} logos for ${qids.length} mapped institutions in ${outDir}`);
  if (staging) return;
  for (const r of data.records) r.logo = r.qid && fs.existsSync(path.join(outDir, r.qid + '.png')) ? `assets/logos/${r.qid}.png` : null;
  data.metadata.logos = { note: 'Logos from each institution\'s official website (Wikidata P856) or the logo, seal and coat-of-arms files Wikidata records for it, for identification only.', count: n };
  fs.writeFileSync(locPath, JSON.stringify(data, null, 1) + '\n');
}

if (has('--collect')) {
  await wikidataMeta();
  let done = 0; const queue = [...qids];
  await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) { const q = queue.shift(); await collectOne(q); if (++done % 25 === 0) { saveMeta(); console.log(`  ${done} of ${qids.length} collected`); } } }));
  saveMeta();
  await renderSvgs();
  console.log(`collected candidates for ${qids.length} institutions in ${candRoot}`);
}
// --extra adds the Commons search candidates to institutions already collected, without downloading the rest again.
if (has('--extra')) {
  let added = 0;
  for (const q of qids) {
    const dir = path.join(candRoot, q), manPath = path.join(dir, 'manifest.json'), man = readJson(manPath, null);
    if (!man || man.some(e => e.kind === 'commons-search' || e.searched)) continue;
    for (const url of await commonsSearch(q)) {
      if (man.some(e => e.url === url)) continue;
      const got = await download(url, UA), entry = { url, kind: 'commons-search', k: man.length, file: null };
      if (got) { entry.file = `${entry.k}.${got.ext}`; fs.writeFileSync(path.join(dir, entry.file), got.buf); added++; }
      man.push(entry);
    }
    man.push({ url: 'commons-search', kind: 'marker', k: man.length, file: null, searched: true });
    fs.writeFileSync(manPath, JSON.stringify(man, null, 1));
  }
  console.log(`added ${added} Commons search files`);
}
if (has('--choose')) choose();
if (!has('--collect') && !has('--choose') && !has('--extra')) console.log('Give --collect, --extra, --choose or a combination.');
