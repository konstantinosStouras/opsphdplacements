// Collect candidate faculty rosters from the faculty pages linked in the universities database
// (data/universities.json, the Operations Academia directory), match each person listed there to the
// OM List import (data/faculty.json), and publish data/faculty-rosters.json.
//
// A person found on OM List inherits that profile (PhD institution and year as the source reports them,
// research status, verified first job). Everyone else is "unverified": the page lists the name under the
// title shown, and nothing else is known until a reviewer opens the person's own page. Extraction is
// heuristic (a name-like line next to a title line, or a name that links to a profile page), so a
// candidate row is a lead for a reviewer, never a fact; pages that block automated fetches or render
// their directory with scripts yield nothing and are listed as such.
//
// Usage: node scripts/collect-faculty-rosters.mjs fetch [--refresh] [--render]  download the pages into research/rosters/ (ignored)
//        node scripts/collect-faculty-rosters.mjs build                          extract, match and write data/faculty-rosters.json
//        node scripts/collect-faculty-rosters.mjs chunks [--size 40] [--start N] [--skip chunk.json]
//                                                       write research/rosters/chunk-N.json for reviewers (from number N on,
//                                                       leaving earlier files alone; --skip leaves out the people of a chunk
//                                                       a reviewer is still working on)
// --render re-fetches with a headless browser the pages that failed or listed nobody (needs playwright).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2), command = args[0] || 'build', flag = f => args.includes(f), opt = (f, d) => (args.indexOf(f) >= 0 ? args[args.indexOf(f) + 1] : d);
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const dir = path.join(root, 'research/rosters'), pagesDir = path.join(dir, 'pages'), logPath = path.join(dir, 'fetch-log.json');
fs.mkdirSync(pagesDir, { recursive: true });
const UA = 'opsphdplacements-research/1.0 (https://github.com/konstantinosStouras/opsphdplacements; faculty roster collection)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const slug = s => fold(s).replace(/ /g, '-');
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);

// The faculty pages: one entry per distinct URL, with every department row that cites it.
const universities = read('data/universities.json').records;
const pages = new Map();
for (const u of universities) for (const d of u.departments) {
  if (!d.facultyUrl || !/^https?:\/\//i.test(d.facultyUrl)) continue;
  const p = pages.get(d.facultyUrl) || { url: d.facultyUrl, departments: [] };
  p.departments.push({ id: d.id, university: u.name, universityId: u.id, school: d.school, department: d.department, type: d.type, country: d.country || (Array.isArray(u.country) ? null : u.country) });
  pages.set(d.facultyUrl, p);
}
const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : {};
const saveLog = () => fs.writeFileSync(logPath, JSON.stringify(log, null, 1));
const pageFile = url => path.join(pagesDir, hash(url) + '.html');

async function fetchOne(url) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'Accept-Language': 'en' }, redirect: 'follow', signal: ctrl.signal });
    const type = res.headers.get('content-type') || '';
    const text = /html|xml|text/i.test(type) || !type ? await res.text() : '';
    return { status: res.status, finalUrl: res.url, contentType: type, bytes: text.length, text: text.slice(0, 3_000_000) };
  } catch (e) { return { status: 0, error: String(e?.cause?.code || e?.name || e).slice(0, 80) }; }
  finally { clearTimeout(timer); }
}

async function fetchAll() {
  const todo = [...pages.keys()].filter(url => flag('--refresh') || !log[url]);
  console.log(`faculty pages: ${pages.size} (${todo.length} to fetch)`);
  let done = 0;
  const worker = async () => {
    while (todo.length) {
      const url = todo.shift(), r = await fetchOne(url);
      if (r.text) fs.writeFileSync(pageFile(url), r.text);
      log[url] = { status: r.status, finalUrl: r.finalUrl || null, contentType: r.contentType || null, bytes: r.bytes || 0, error: r.error || null, retrievedAt: today(), rendered: false };
      done++; if (done % 10 === 0) { saveLog(); console.log(`fetched ${done}, ok so far ${Object.values(log).filter(l => l.status === 200).length}`); }
      await sleep(400);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  saveLog();
  console.log(`status counts: ${JSON.stringify(Object.values(log).reduce((c, l) => { c[l.status] = (c[l.status] || 0) + 1; return c; }, {}))}`);
}

// Second pass with a real browser for pages that refused the plain fetch or render their list with scripts.
async function renderFailed() {
  let pw; for (const from of [import.meta.url, '/usr/lib/node_modules/']) { try { pw = createRequire(from)('playwright'); break; } catch { /* next */ } }
  if (!pw) throw new Error('playwright is not installed; run the fetch without --render');
  const exe = process.env.PLAYWRIGHT_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {}).catch(() => pw.chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const todo = [...pages.keys()].filter(url => { const l = log[url]; return l && !l.rendered && (l.status !== 200 || candidatesOf(url).length === 0); });
  console.log(`rendering ${todo.length} pages with a browser`);
  for (const url of todo) {
    const pg = await ctx.newPage();
    try {
      const res = await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await pg.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await pg.waitForTimeout(1500);
      const html = await pg.content();
      fs.writeFileSync(pageFile(url), html);
      log[url] = { ...log[url], status: res?.status() ?? 0, finalUrl: pg.url(), contentType: 'text/html (rendered)', bytes: html.length, error: null, retrievedAt: today(), rendered: true };
    } catch (e) { log[url] = { ...log[url], rendered: true, renderError: String(e?.message || e).slice(0, 80), retrievedAt: today() }; }
    await pg.close(); saveLog(); await sleep(500);
  }
  await browser.close();
}

// ----------------------------------------------------------------------------------------------
// Extraction: the page as text lines (block boundaries and links split lines), then name-like lines.
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', atilde: 'ã', aring: 'å', iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï', oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oslash: 'ø', uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', ntilde: 'ñ', ccedil: 'ç', szlig: 'ß', Eacute: 'É', Oslash: 'Ø', Aring: 'Å', Ouml: 'Ö', Uuml: 'Ü', Auml: 'Ä', rsquo: '’', lsquo: '‘', ndash: '–', mdash: '—', hellip: '…' };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) => c[0] === '#' ? String.fromCodePoint(parseInt(c[1] === 'x' || c[1] === 'X' ? c.slice(2) : c.slice(1), c[1] === 'x' || c[1] === 'X' ? 16 : 10)) || m : ENT[c] ?? m);
const BLOCK = new Set(['p', 'div', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'td', 'th', 'dd', 'dt', 'dl', 'section', 'article', 'header', 'footer', 'nav', 'table', 'ul', 'ol', 'hr', 'blockquote', 'figcaption', 'figure', 'address', 'main', 'aside', 'form', 'fieldset', 'legend', 'label', 'option', 'summary', 'details', 'a', 'button', 'strong', 'b', 'em', 'i', 'small', 'img']);
function htmlToLines(html, baseUrl) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, '');
  const lines = []; let cur = '', href = null, heading = false;
  const push = () => { const t = cur.replace(/\s+/g, ' ').trim(); if (t) lines.push({ text: t, href, heading }); cur = ''; };
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>|([^<]+)/g; let m;
  while ((m = re.exec(html))) {
    if (m[3] !== undefined) { cur += decode(m[3]); continue; }
    const tag = m[1].toLowerCase(), closing = m[0][1] === '/';
    if (!BLOCK.has(tag)) continue;
    push();
    if (tag === 'a') { if (!closing) { const h = /href\s*=\s*["']?([^"'\s>]+)/i.exec(m[2]); try { href = h ? new URL(decode(h[1]), baseUrl).href : null; } catch { href = null; } } else href = null; }
    if (/^h[1-6]$/.test(tag)) heading = !closing;
  }
  push();
  return lines;
}
const STOP = /\b(university|universit[aey]|colleges?|schools?|departments?|dept|faculty|research|cent(?:er|re)s?|institutes?|program(?:me)?s?|offices?|contact|home|about|news|events?|admissions?|search|menu|log ?in|operations|management|supply|chain|analytics|sciences?|engineering|business|economics|marketing|finance|accounting|information|systems?|technology|professors?|lecturers?|director|emerit[ua]s?|adjunct|visiting|senior|clinical|staff|students?|alumni|alumnae|apply|request|view|email|phone|room|building|campus|area|group|team|people|directory|list|page|site|map|privacy|policy|policies|copyright|skip|content|navigation|footer|header|toggle|download|print|share|follow|facebook|twitter|linkedin|publications?|teaching|courses?|undergraduate|graduate|doctoral|executive|online|overview|strategy|strategic|innovation|leadership|global|international|sustainability|digital|decisions?|quantitative|statistics|optimi[sz]ation|logistics|manufacturing|quality|project|healthcare|entrepreneurship|organi[sz]ational?|behaviou?r|resources|hospitality|tourism|medicine|nursing|library|journal|conference|seminar|workshop|lectures?|awards?|scholarships?|fellowship|distinguished|chaired|endowed|careers?|jobs?|internships?|placement|positions?|openings?|vacanc(?:y|ies)|calendar|semester|quarter|welcome|learn|discover|explore|visit|parents|donors|partners|employers|full|part|time|profile|biography|bio|cv|curriculum|vitae|load|loading|show|hide|filters?|clear|sort|results?|found|select|click|here|read|more|all|next|previous|back|top|close|open|accept|cookies?|settings?|academic|academics|administrative|administration|units?|partnerships?|advancement|development|estate|force|rotc|corporate|meet|advising|advisors?|initiatives?|labs?|laborator(?:y|ies)|giving|support|services?|solutions?|facilities|housing|dining|parking|athletics|recreation|wellness|safety|security|emergency|accessibility|diversity|inclusion|equity|compliance|governance|trustees|council|committee|senate|association|society|foundation|endowment|campaign|gifts?|donate|newsletter|magazine|blog|podcast|videos?|photos?|gallery|archives?|annual|reports?|mission|vision|values|history|rankings?|accreditation|facts|figures|outcomes|impact|stories|spotlight|featured|highlights?|latest|upcoming|recent|popular|related|quick|links|tools|forms|documents|procedures|guidelines|handbook|catalog(?:ue)?|syllab(?:us|i)|schedules?|registration|register|enrol(?:l)?(?:ment)?|tuition|fees|financial|aid|loans|funding|costs?|payments?|billing|professorships?|us|our|the|and|of|for|in|on|at|by|to|with|from)\b/i;
// What the title says the person is; only faculty and untitled names go to reviewers first.
const ROLE = [['faculty', /\b(professor|professors|lecturer|instructor|chair|dean|reader|emerit|adjunct|docent|privatdozent|professeur|catedr|profesor|professore|ricercat|hoogleraar|universitair|dozent|maître|maitre|faculty)\b/i], ['postdoc', /post-?doc/i], ['student', /\b(ph\.?d\.?\s*(student|candidate)|doctoral\s*(student|candidate)|graduate student|students?)\b/i], ['staff', /\b(administrative|administrator|coordinator|secretary|assistant to|manager|specialist|analyst|technician|receptionist|adviser|advisor|advising|recruiter|librarian|accountant|officer|clerk|engineer|developer|designer|webmaster)\b/i]];
const roleOf = title => (title ? ROLE.find(([, re]) => re.test(title))?.[0] || 'unknown' : 'untitled');
const PARTICLES = new Set(['de', 'van', 'der', 'den', 'von', 'da', 'di', 'la', 'le', 'del', 'della', 'dos', 'das', 'du', 'bin', 'al', 'el', 'y', 'ter', 'ten', 'af', 'av', 'zu', 'e', 'i', 'van\'t', 'd\'', 'o\'']);
const TITLE = /\b(professor|professors|lecturer|instructor|fellow|chair|dean|director|reader|teaching|emerit|adjunct|visiting|clinical|associate|assistant|senior|scientist|researcher|faculty|tutor|docent|privatdozent|professeur|catedr|profesor|professore|ricercat|hoogleraar|universitair|dozent|wissenschaftl|maître|maitre)\b/i;
const PROFILE_HREF = /\/(people|faculty|directory|profiles?|staff|persons?|members|team|bios?|our-people|experts|researchers|personen|personal|profesorado|docenti|professeurs|enseignants|mitarbeiter|personnel|academics|contacts?)\b/i;
const cleanName = s => s.replace(/^(dr|prof|professor|mr|mrs|ms|dr\.|prof\.)\.?\s+/i, '').replace(/\s*[,(]\s*(ph\.?\s?d\.?|d\.?phil|dba|mba|cpa|m\.?sc\.?|frs|obe|cbe|fba|jr\.?|sr\.?|iii|ii)\.?\)?\s*$/i, '').replace(/\s+/g, ' ').trim();
function looksLikeName(text) {
  const name = cleanName(text);
  if (name.length < 5 || name.length > 60 || /\d|[@:;|/\\&_=+*#%$]|\(|\)/.test(name) || STOP.test(name)) return null;
  const tokens = name.split(' ');
  if (tokens.length < 2 || tokens.length > 5) return null;
  const upper = tokens.filter(t => /^\p{Lu}/u.test(t)), particles = tokens.filter(t => PARTICLES.has(t.toLowerCase()));
  if (upper.length + particles.length !== tokens.length || upper.length < 2) return null;
  if (tokens.every(t => t.length <= 2)) return null;
  if (name === name.toUpperCase() && tokens.length > 3) return null;
  if (!/^\p{Lu}/u.test(tokens[tokens.length - 1]) || tokens[tokens.length - 1].length < 2) return null;
  return name;
}
function candidatesOf(url) {
  const file = pageFile(url);
  if (!fs.existsSync(file)) return [];
  const lines = htmlToLines(fs.readFileSync(file, 'utf8'), log[url]?.finalUrl || url);
  const out = [], seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const name = looksLikeName(lines[i].text); if (!name) continue;
    const titleLine = lines.slice(i + 1, i + 4).find(l => TITLE.test(l.text) && l.text.length <= 120 && !looksLikeName(l.text));
    // A profile link counts when its path carries the surname (people/jane-doe), not for a generic link.
    const href = lines[i].href && !/\.(pdf|jpe?g|png|gif)(\?|$)/i.test(lines[i].href) ? lines[i].href : null;
    const surname = fold(name.split(' ').at(-1)), profile = href && PROFILE_HREF.test(href) && surname.length >= 3 && fold(decodeURIComponent(href)).includes(surname) ? href : null;
    if (!titleLine && !profile) continue;
    const key = fold(name); if (seen.has(key)) continue; seen.add(key);
    out.push({ name, titleAsListed: titleLine ? titleLine.text.slice(0, 120) : null, profileUrl: profile || href, how: titleLine && profile ? 'title-and-profile-link' : titleLine ? 'title-next-to-name' : 'profile-link', listedRole: roleOf(titleLine ? titleLine.text : null) });
  }
  return out;
}

// ----------------------------------------------------------------------------------------------
// Matching to the OM List import: same name (or same first and last name) and, where possible, the same
// university, read through the merged entities so that every spelling of the university counts.
function buildRoster() {
  const faculty = read('data/faculty.json').records, placements = new Map(read('data/placements.json').records.map(p => [p.facultyId, p])), status = new Map(read('data/research-status.json').records.map(r => [r.facultyId, r.status]));
  const entities = fs.existsSync(path.join(root, 'data/entities.json')) ? read('data/entities.json').records : [];
  const aliasesOf = new Map(); for (const e of entities) for (const a of e.aliases) aliasesOf.set(fold(a), { id: e.id, aliases: new Set(e.aliases.map(fold)) });
  const byFull = new Map(), byEnds = new Map();
  const ends = n => { const all = fold(n).split(' ').filter(Boolean), t = all.length > 2 ? all.filter(x => x.length > 1) : all; return t.length >= 2 ? `${t[0]} ${t[t.length - 1]}` : null; };
  for (const f of faculty) { const k = fold(f.name); (byFull.get(k) || byFull.set(k, []).get(k)).push(f); const e = ends(f.name); if (e) (byEnds.get(e) || byEnds.set(e, []).get(e)).push(f); }
  const sameUniversity = (f, universityName) => { const ent = aliasesOf.get(fold(universityName)); const inst = fold(f.currentInstitution); if (!inst) return false; return ent ? ent.aliases.has(inst) : inst === fold(universityName); };
  // One record per person per university; the department rows that cite the page are listed with it.
  const people = new Map(), pageSummaries = [];
  for (const [url, p] of pages) {
    const l = log[url] || { status: null }, cands = l.status === 200 ? candidatesOf(url) : [];
    pageSummaries.push({ url, status: l.status, rendered: !!l.rendered, retrievedAt: l.retrievedAt || null, error: l.error || l.renderError || null, listed: cands.length, departments: p.departments.map(d => d.id) });
    for (const d of p.departments) for (const c of cands) {
      const key = `${d.universityId}|${fold(c.name)}`, dept = { id: d.id, school: d.school, department: d.department, type: d.type };
      if (people.has(key)) { const r = people.get(key); if (!r.departments.some(x => x.id === d.id)) r.departments.push(dept); if (!r.facultyUrls.includes(url)) r.facultyUrls.push(url); continue; }
      const same = byFull.get(fold(c.name)) || [], loose = same.length ? [] : (byEnds.get(ends(c.name)) || []);
      const pool = same.length ? same : loose, atUni = pool.filter(f => sameUniversity(f, d.university));
      let om = null;
      if (atUni.length === 1) om = { f: atUni[0], match: same.length ? 'name-and-institution' : 'first-last-name-and-institution' };
      else if (pool.length === 1) om = { f: pool[0], match: same.length ? 'name-only' : 'first-last-name-only' };
      else if (pool.length > 1) om = { ambiguous: pool.map(f => f.id) };
      const f = om?.f, pl = f ? placements.get(f.id) : null;
      people.set(key, {
        id: `roster:${d.universityId}:${slug(c.name)}`, name: c.name, titleAsListed: c.titleAsListed, listedRole: c.listedRole, extraction: c.how, profileUrl: c.profileUrl,
        university: d.university, universityId: d.universityId, entityId: aliasesOf.get(fold(d.university))?.id || null, country: d.country,
        departments: [dept], facultyUrls: [url], retrievedAt: l.retrievedAt || null,
        omList: f ? { facultyId: f.id, name: f.name, currentInstitution: f.currentInstitution, match: om.match, sourceProfileUrl: f.sourceProfileUrl || null } : om?.ambiguous ? { ambiguous: om.ambiguous, match: 'ambiguous' } : null,
        phdInstitution: pl?.phdInstitution ?? f?.phdInstitution ?? null, phdYear: pl?.phdYear ?? f?.phdYear ?? null,
        researchStatus: f ? status.get(f.id) || 'pending' : null,
        firstJob: pl ? { employer: pl.employer, position: pl.position || null, placementYear: pl.placementYear ?? null, category: pl.category } : null,
        verification: f && om.match.endsWith('institution') ? 'om-list' : f ? 'om-list-name-only' : 'unverified',
        review: null
      });
    }
  }
  const records = [...people.values()].sort((a, b) => a.university.localeCompare(b.university) || a.name.localeCompare(b.name));
  // Keep review outcomes already merged into the published file.
  const previous = fs.existsSync(path.join(root, 'data/faculty-rosters.json')) ? new Map(read('data/faculty-rosters.json').records.filter(r => r.review).map(r => [r.id, r.review])) : new Map();
  for (const r of records) if (previous.has(r.id)) r.review = previous.get(r.id);
  const count = (list, f) => list.filter(f).length;
  const byUniversity = {};
  for (const r of records) { const u = (byUniversity[r.universityId] ||= { university: r.university, listed: 0, omList: 0, unverified: 0, reviewed: 0 }); u.listed++; if (r.verification === 'om-list') u.omList++; else if (r.verification === 'unverified') u.unverified++; if (r.review) u.reviewed++; }
  const universitySummaries = Object.entries(byUniversity).map(([id, u]) => ({ universityId: id, ...u })).sort((a, b) => b.listed - a.listed || a.university.localeCompare(b.university));
  const reviewCounts = {}; for (const r of records) if (r.review) reviewCounts[r.review.status] = (reviewCounts[r.review.status] || 0) + 1;
  const out = {
    version: 1,
    metadata: {
      generatedAt: today(), source: 'Faculty pages linked from the Operations Academia universities directory (data/universities.json)', derivedFrom: ['data/universities.json', 'data/faculty.json', 'data/placements.json', 'data/research-status.json', 'data/entities.json'],
      definition: 'One row per person listed on a faculty page cited by the universities database, per university, with the department rows that cite the page. The page lists the name under the title shown; nothing else is established by the listing. "om-list" rows are the same person as an OM List profile (same name and university) and carry that profile\'s source-reported doctorate, research status and verified first job; "om-list-name-only" rows share a name with one OM List profile at another institution and may be a namesake; "unverified" rows have no doctorate or first job known until a reviewer opens the person\'s own page and records the outcome under review. Extraction is heuristic and listed names can be wrong or incomplete; a page that blocks automated fetches or renders its list with scripts contributes nothing and is reported under pages.',
      pages: { total: pages.size, fetched: count(pageSummaries, s => s.status === 200), failed: count(pageSummaries, s => s.status !== 200), withPeople: count(pageSummaries, s => s.listed > 0), rendered: count(pageSummaries, s => s.rendered) },
      counts: { people: records.length, omList: count(records, r => r.verification === 'om-list'), omListNameOnly: count(records, r => r.verification === 'om-list-name-only'), ambiguous: count(records, r => r.omList?.match === 'ambiguous'), unverified: count(records, r => r.verification === 'unverified'), unverifiedByListedRole: records.filter(r => r.verification === 'unverified').reduce((c, r) => { c[r.listedRole] = (c[r.listedRole] || 0) + 1; return c; }, {}), reviewed: count(records, r => r.review), reviewOutcomes: reviewCounts, universities: universitySummaries.length, omListProfilesSeen: new Set(records.filter(r => r.omList?.facultyId).map(r => r.omList.facultyId)).size }
    },
    pages: pageSummaries, universities: universitySummaries, records
  };
  fs.writeFileSync(path.join(root, 'data/faculty-rosters.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`pages ${out.metadata.pages.fetched} of ${out.metadata.pages.total} fetched, ${out.metadata.pages.withPeople} list people; people ${out.metadata.counts.people} (${out.metadata.counts.omList} on OM List at the same university, ${out.metadata.counts.omListNameOnly} name-only, ${out.metadata.counts.ambiguous} ambiguous, ${out.metadata.counts.unverified} unverified, ${out.metadata.counts.reviewed} reviewed) at ${out.metadata.counts.universities} universities`);
  return out;
}

// Chunk files for reviewers: the unverified people, grouped by university, with what the page showed.
function writeChunks() {
  const roster = read('data/faculty-rosters.json'), size = Number(opt('--size', 40)), start = Number(opt('--start', 1));
  const skip = new Set(args.flatMap((a, i) => (a === '--skip' ? JSON.parse(fs.readFileSync(path.resolve(root, args[i + 1]), 'utf8')).people.map(p => p.id) : [])));
  // Order of review: people whose listed title names an operations field first, then people on department
  // pages (at most 100 listed), then people on whole-college directories, which list every department;
  // within each group faculty by title first, then names without a title. Students and staff wait.
  const listedByUrl = new Map(roster.pages.map(p => [p.url, p.listed]));
  const OPS = /operation|supply|logistic|management science|decision science|analytics|production|industrial engineering|\bom\b|\bscm\b/i;
  const todo = roster.records.filter(r => (r.verification === 'unverified' || r.verification === 'om-list-name-only' || r.omList?.match === 'ambiguous') && !r.review && !skip.has(r.id) && ['faculty', 'untitled', 'unknown'].includes(r.listedRole));
  const group = r => (OPS.test(r.titleAsListed || '') ? 0 : Math.max(...r.facultyUrls.map(u => listedByUrl.get(u) || 0)) <= 100 ? 1 : 2);
  const rank = { faculty: 0, untitled: 1, unknown: 2 };
  todo.sort((a, b) => group(a) - group(b) || rank[a.listedRole] - rank[b.listedRole] || a.university.localeCompare(b.university) || a.name.localeCompare(b.name));
  for (const f of fs.readdirSync(dir)) { const m = /^chunk-(\d+)\.json$/.exec(f); if (m && Number(m[1]) >= start) fs.unlinkSync(path.join(dir, f)); }
  let n = start - 1;
  for (let i = 0; i < todo.length; i += size) {
    n++;
    const people = todo.slice(i, i + size).map(r => ({ id: r.id, name: r.name, titleAsListed: r.titleAsListed, university: r.university, departments: r.departments.map(d => [d.school, d.department].filter(Boolean).join(' · ')), country: r.country, facultyUrl: r.facultyUrls[0], peopleListedOnPage: listedByUrl.get(r.facultyUrls[0]) || null, profileUrl: r.profileUrl, omListNameOnly: r.omList?.facultyId ? { facultyId: r.omList.facultyId, currentInstitution: r.omList.currentInstitution } : null, omListAmbiguous: r.omList?.ambiguous || null }));
    fs.writeFileSync(path.join(dir, `chunk-${n}.json`), JSON.stringify({ chunk: n, instructions: 'For each person: open the person\'s own page (or the faculty page). Record whether the page shows the person as faculty (status confirmed-faculty, with the title and the department or area shown), is not a person or a garbled name (extraction-noise), is gone or is a student or staff member (not-listed), is the same person as the OM List profile named (same-as-om-list), or could not be checked (unresolved, with the reason). The department given here is the directory row that cites the page, not the person\'s own area; a page listing many people is usually a whole-college directory. For confirmed faculty, record the doctorate institution and year only if an opened page states them, with that page\'s URL; otherwise leave them null. Never infer a doctorate or a first job from a title or affiliation.', people }, null, 1) + '\n');
  }
  console.log(`wrote ${n} chunk files for ${todo.length} people in ${dir}`);
}

if (command === 'fetch') { await fetchAll(); if (flag('--render')) await renderFailed(); }
else if (command === 'build') buildRoster();
else if (command === 'chunks') writeChunks();
else throw new Error(`Unknown command ${command}`);
