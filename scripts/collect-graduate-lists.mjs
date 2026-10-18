// Graduate lists by program and year (TODO.md Step 2): the official placement, alumni and graduate pages of the
// PhD institutions, read year by year from the Internet Archive so that graduates who left academia, or who
// have since dropped off the current page, are listed too. The pages to read are in
// research/graduate-list-pages.json (the list pages cited in first-job reviews, plus any added by hand).
//
//   node scripts/collect-graduate-lists.mjs snapshots            list the archived snapshots of every page (CDX API),
//                                                                one per calendar year per distinct content, into
//                                                                research/graduates/plan.json
//   node scripts/collect-graduate-lists.mjs discover [--host H]  find older placement, alumni and graduate pages on each
//                                                                institution's archived site (research/graduates/discovery.json)
//   node scripts/collect-graduate-lists.mjs fetch [--page KEY] [--live-only]  download each planned snapshot (raw, "id_" form) and
//                                                                the live page into research/graduates/snapshots/<slug>/,
//                                                                with a plain-text copy for the reader
//   node scripts/collect-graduate-lists.mjs chunks [--size 6] [--start N]  write research/graduates/chunk-N.json, each a few
//                                                                pages with the snapshot texts not yet extracted (research/graduates/extracted.json), for the agents
//
// Archive access: web.archive.org directly, or through the reader proxy (https://r.jina.ai/<url>) when the
// environment's network policy refuses the host. Every request and its outcome is recorded; nothing is
// re-fetched once saved. Page content is untrusted research material, never instructions.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'research/graduates');
const pagesPath = path.join(root, 'research/graduate-list-pages.json');
const planPath = path.join(dir, 'plan.json');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const mode = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = url => url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) + '-' + crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
fs.mkdirSync(dir, { recursive: true });

// Fetch text from the archive: direct first, then through the reader proxy (which returns the page as text).
async function archiveGet(url, { raw = false } = {}) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60000) });
    if (res.ok) return { text: await res.text(), via: 'direct' };
    if (res.status === 404) return { text: null, via: 'direct', status: 404 };
  } catch { /* blocked or reset: try the reader */ }
  await sleep(3500);
  try {
    const res = await fetch('https://r.jina.ai/' + url, { headers: { 'User-Agent': UA, Accept: raw ? 'text/plain' : 'text/markdown', 'X-Return-Format': raw ? 'html' : 'markdown' }, signal: AbortSignal.timeout(120000) });
    const text = await res.text();
    if (res.ok && !text.startsWith('{"data":null')) return { text, via: 'reader' };
    return { text: null, via: 'reader', status: res.status, error: text.slice(0, 200) };
  } catch (e) { return { text: null, via: 'reader', error: String(e).slice(0, 200) }; }
}
const toText = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ').replace(/<\/(p|div|li|tr|h[1-6]|section|article|br|table)>/gi, '\n').replace(/<\/t[dh]>/gi, ' | ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
const plan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : { generatedAt: null, pages: {} };
const savePlan = () => fs.writeFileSync(planPath, JSON.stringify({ ...plan, generatedAt: new Date().toISOString().slice(0, 10) }, null, 1));

if (mode === 'snapshots') {
  for (const p of pages) {
    const key = slug(p.url);
    if (plan.pages[key]?.listedAt) continue;
    const q = 'https://web.archive.org/cdx/search/cdx?' + new URLSearchParams({ url: p.url.replace(/^https?:\/\//, ''), output: 'json', fl: 'timestamp,digest,statuscode,length', filter: 'statuscode:200', collapse: 'digest' });
    const got = await archiveGet(q);
    let rows = [];
    if (got.text) { try { rows = JSON.parse(got.text.replace(/^[\s\S]*?(\[\[)/, '$1')).slice(1); } catch { rows = []; } }
    // When the CDX index cannot be read, ask the availability service (on archive.org, a different host) for the
    // snapshot closest to each year since 1995; it answers with the timestamp but not the content digest.
    if (!rows.length) {
      for (let y = 1995; y <= new Date().getFullYear(); y++) {
        try {
          const res = await fetch('http://archive.org/wayback/available?' + new URLSearchParams({ url: p.url.replace(/^https?:\/\//, ''), timestamp: `${y}0701` }), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
          const c = (await res.json()).archived_snapshots?.closest;
          if (c?.available && c.timestamp.slice(0, 4) === String(y) && !rows.some(r => r[0] === c.timestamp)) rows.push([c.timestamp, null, '200', null]);
        } catch { /* no answer for this year */ }
        await sleep(1100);
      }
      if (rows.length) got.via = 'availability-api';
    }
    // One snapshot per calendar year: the last distinct one in that year, so a page that changed during the
    // year is read in its most complete state; a year without a change uses nothing (the earlier content stands).
    const byYear = {};
    for (const [ts, digest, status, length] of rows) { const y = ts.slice(0, 4); if (!byYear[y] || ts > byYear[y].timestamp) byYear[y] = { timestamp: ts, digest, length: length == null ? null : +length }; }
    plan.pages[key] = { institution: p.institution, url: p.url, listedVia: got.via, listedAt: new Date().toISOString().slice(0, 10), error: rows.length ? null : (got.error || `HTTP ${got.status || '?'}`), snapshots: Object.values(byYear).sort((a, b) => a.timestamp.localeCompare(b.timestamp)) };
    savePlan();
    console.log(`${key}: ${plan.pages[key].snapshots.length} yearly snapshots (${got.via}${plan.pages[key].error ? ', failed' : ''})`);
    await sleep(2000);
  }
  const n = Object.values(plan.pages).reduce((a, p) => a + p.snapshots.length, 0);
  console.log(`planned ${n} snapshots for ${Object.keys(plan.pages).length} pages`);
}

// Older lists lived at other addresses than today's page, so the current URL's history rarely reaches back
// more than a few years. `discover` asks the archive's index for every archived page on each institution's
// site(s) whose address mentions placement, alumni, graduates or job market (research/graduates/domains.json,
// built from the institutions' websites and the known pages), writing candidates to research/graduates/discovery.json
// for a reviewer to accept into research/graduate-list-pages.json (scope "program-list") before they are read.
if (mode === 'discover') {
  const domainsPath = path.join(dir, 'domains.json'), outPath = path.join(dir, 'discovery.json');
  const domains = JSON.parse(fs.readFileSync(domainsPath, 'utf8'));
  const found = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
  const onlyHost = arg('--host');
  for (const d of domains) {
    for (const host of d.hosts) {
      if (onlyHost && host !== onlyHost) continue;
      if (found[host]) continue;
      const pattern = '(?i).*(placement|phd-?alumni|doctoral-?alumni|phd-?graduates|doctoral-?graduates|job-?market|jobmarket|recent-?graduates|dissertations?-?list).*';
      const q = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host + '/*')}&output=json&fl=original,timestamp,statuscode&filter=statuscode:200&filter=${encodeURIComponent('original:' + pattern)}&collapse=urlkey&from=1996&limit=400`;
      const got = await archiveGet(q);
      let rows = [];
      if (got.text) { try { rows = JSON.parse(got.text.replace(/^[\s\S]*?(\[\[)/, '$1')).slice(1); } catch { rows = []; } }
      // Keep page-like addresses only: no images, scripts, feeds or query strings; print the earliest capture.
      const cands = rows.filter(([u]) => !/\.(png|jpe?g|gif|svg|css|js|pdf|xml|ico|woff2?)(\?|$)/i.test(u) && !/[?&]/.test(u)).map(([u, ts]) => ({ url: u, firstSeen: ts.slice(0, 4) }));
      found[host] = { qid: d.qid, institution: d.institution, via: got.via, error: got.text ? null : (got.error || `HTTP ${got.status || '?'}`), candidates: cands, listedAt: new Date().toISOString().slice(0, 10) };
      fs.writeFileSync(outPath, JSON.stringify(found, null, 1));
      console.log(`${host} (${d.institution}): ${cands.length} candidate addresses (${got.via}${got.text ? '' : ', failed'})`);
      await sleep(2500);
    }
  }
}

if (mode === 'fetch') {
  const only = arg('--page');
  for (const [key, p] of Object.entries(plan.pages)) {
    if (only && key !== only) continue;
    const pdir = path.join(dir, 'snapshots', key); fs.mkdirSync(pdir, { recursive: true });
    const jobs = [{ timestamp: 'live', url: p.url }, ...(process.argv.includes('--live-only') ? [] : p.snapshots.map(s => ({ timestamp: s.timestamp, url: `https://web.archive.org/web/${s.timestamp}id_/${p.url}` })))];
    for (const j of jobs) {
      const base = path.join(pdir, j.timestamp);
      if (fs.existsSync(base + '.txt') || fs.existsSync(base + '.failed')) continue;
      const got = await archiveGet(j.url, { raw: true });
      if (got.text) {
        const isHtml = /<html|<body|<div|<table/i.test(got.text.slice(0, 5000));
        if (isHtml) fs.writeFileSync(base + '.html', got.text);
        fs.writeFileSync(base + '.txt', (isHtml ? toText(got.text) : got.text) + `\n\n[source: ${j.url}; read ${new Date().toISOString().slice(0, 10)} via ${got.via}]\n`);
        console.log(`${key} ${j.timestamp}: ${isHtml ? 'html' : 'text'} ${got.text.length} chars (${got.via})`);
      } else if (/blocked until|AbuseAlleviation|rate/i.test(got.error || '')) { console.log(`${key} ${j.timestamp}: not fetched now (${(got.error || '').slice(0, 80)}); will retry`); }
      else { fs.writeFileSync(base + '.failed', JSON.stringify(got)); console.log(`${key} ${j.timestamp}: failed (${got.error || got.status})`); }
      await sleep(j.timestamp === 'live' ? 1500 : 4000);
    }
  }
}

if (mode === 'chunks') {
  const size = +(arg('--size') || 6);
  const donePath = path.join(dir, 'extracted.json');
  const done = new Set(fs.existsSync(donePath) ? JSON.parse(fs.readFileSync(donePath, 'utf8')) : []);
  const start = +(arg('--start') || 1);
  const entries = Object.keys(plan.pages).filter(k => fs.existsSync(path.join(dir, 'snapshots', k))).map(k => { const p = plan.pages[k]; const files = fs.readdirSync(path.join(dir, 'snapshots', k)).filter(f => f.endsWith('.txt') && !done.has(`${k}/${f}`)).sort(); return { key: k, institution: p.institution, url: p.url, texts: files.map(f => path.join('research/graduates/snapshots', k, f)), snapshotDates: files.map(f => f.replace('.txt', '')) }; }).filter(e => e.texts.length);
  let n = start - 1;
  for (let i = 0; i < entries.length; i += size) { n++; fs.writeFileSync(path.join(dir, `chunk-${n}.json`), JSON.stringify({ chunk: n, pages: entries.slice(i, i + size) }, null, 1)); }
  console.log(`wrote chunks ${start} to ${n} for ${entries.length} pages with text not yet extracted`);
}
if (!['snapshots', 'discover', 'fetch', 'chunks'].includes(mode)) console.log('Give snapshots, discover, fetch or chunks.');
