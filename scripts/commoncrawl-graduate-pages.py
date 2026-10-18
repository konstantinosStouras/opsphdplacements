#!/usr/bin/env python3
"""Archived program pages from Common Crawl (data.commoncrawl.org), a second archive next to the Internet
Archive for the graduate lists (TODO.md Step 2, WORKFLOW.md section 2). Common Crawl keeps monthly-ish
crawls of the web since 2013 with a public index; each capture is a WARC record that can be read by a
byte-range request. Nothing here infers anything: a capture is the page as the crawler saw it on that date.

Modes (all state lives under research/graduates/commoncrawl/, which is ignored by git; the reviewed page
list research/graduate-list-pages.json and the snapshots feed the usual chunk -> proposal -> merge flow):

  scan [--per-year N | --all] [--crawl CC-MAIN-YYYY-WW ...]
      For each chosen crawl: stream its cluster.idx, keep the index chunks covering the institutions' hosts
      (research/graduates/domains.json), fetch those chunks and keep the index lines whose address looks like
      a placement, alumni, graduates or job-market page. Writes hits-<crawl>.jsonl and scanned.json.
  candidates
      Group the hits by page address, attach the institution by host, and write candidates.json plus a
      review sheet candidates.md: known pages (already in graduate-list-pages.json) and new addresses for
      a reviewer to accept with scope "program-list" (or refuse) in graduate-list-pages.json.
  peek
      Save the text of the latest capture of each new candidate (commoncrawl/peek/) for the reviewers.
  review-chunks [--size 40] [--start N]
      Batch the peeked candidates (not yet reviewed) into commoncrawl/review-chunk-N.json, numbered from N for review agents, who write
      commoncrawl/review-N.json {"pages": [{url, institution, scope, reason, reviewedAt}]}.
  accept
      Add the reviewed pages to research/graduate-list-pages.json (scope program-list, single-record or not-a-list).
  fetch [--page URL]
      For every page in graduate-list-pages.json with scope "program-list" (or single-record) that has
      captures, read one capture per calendar year (the last one of that year with a distinct content
      digest) and save it as research/graduates/snapshots/<key>/<timestamp>.txt (+ .html) in the layout
      scripts/collect-graduate-lists.mjs uses, registering the page in plan.json, so `chunks` picks it up.

The source URL recorded for a Common Crawl capture is the public index lookup for that address in that
crawl (https://index.commoncrawl.org/<crawl>-index?url=...&output=json), which anyone can open to see the
capture's WARC locator; the text footer also names the WARC file, offset and length. Rate: eight parallel
range requests, with back-off on 429/503 as the data server asks.
"""
import gzip
import hashlib
import html as htmlmod
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, urlsplit

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GDIR = os.path.join(ROOT, 'research', 'graduates')
CDIR = os.path.join(GDIR, 'commoncrawl')
PAGES = os.path.join(ROOT, 'research', 'graduate-list-pages.json')
PLAN = os.path.join(GDIR, 'plan.json')
DATA = 'https://data.commoncrawl.org/'
os.makedirs(CDIR, exist_ok=True)
S = requests.Session()
S.headers['User-Agent'] = 'opsphdplacements-research (graduate lists; contact via the repository)'

# Address filter. A page is worth a look when its address names a placement, alumni, graduates, job-market or
# dissertation page and either says doctoral (phd, doctoral, dba, job market, dissertation), or sits on a business,
# operations or engineering host or path, or sits on a host that already carries a reviewed page. "placement" must
# not be the tail of replacement/displacement; work, clinical and language placements are not doctoral placements.
URL_LIST = re.compile(r'(?<![a-z])(placements?|job-?placements?|job-?market|jobmarket|where-?are-?they)(?![a-z])', re.I)
# Weaker words: an alumni, graduates, candidates or dissertations page is worth a look only when the address also
# says doctoral, or it is a short address on a host that already carries a reviewed page (a department site).
URL_WEAK = re.compile(r'(?<![a-z])(alumni|alumnae|graduates|candidates|placed|dissertations?|theses)(?![a-z])', re.I)
URL_DOC = re.compile(r'(?<![a-z])(phd|ph-d|ph\.d|doctoral|doctorate|doctorat|dba|job-?market|jobmarket|dissertations?|theses|promovierte|doktor)', re.I)
URL_FIELD = re.compile(r'(business|management|mgmt|gsb|sloan|kellogg|wharton|booth|fuqua|tuck|haas|anderson|stern|darden|fisher|smeal|kenan|mccombs|rady|tepper|olin|foster|mendoza|krannert|scheller|goizueta|carlson|marshall|isom|otim|itom|ieor|isye|ieem|ieda|dsme|msom|operations|supply|logistic|industrial|decision|analytics|engineering|stor-i|rutcor|informs|(^|[./-])(or|om|ie|iems|ise|sem|ds)([./-]|$))', re.I)
URL_NOT = re.compile(r'(work-?placement|clinical|internship|nursing|medicine|medical|health|school-?placement|placement-?(test|exam|credit)|language-?placement|replacement|displacement|/tag/|/category/|\?replytocom|/feed/?$|\.pdf$|/wp-json/|/search\?|/print/|\?page=|undergrad|mba[-_/]|masters?[-_/]|msc[-_/]|executive|/news/|/blog/|/events?/|calendar|bachelors?|prospective|career[-_]?(management|services?|cent(er|re)|development)|alumni[-_]?giving|giving|networking|/connect|reunion|awards?|donat|membership|benefits|/jobs?/|job[-_]search|resume|interview|/resources|/contact|/about[-_]us|spotlight|profile|/people/|/staff|/faculty/|/directory|/apply|admission|tuition|funding|handbook|faq|/login|/user/|/node/|/sites/default/|/print|/share|/tag/|~|_theses/|/theses/?$|/theses/\d+|masters_theses|alumni-in-the-news|/view/creators/|dissertations?_?\d*/\d+/?$|_dissertations/\d+/?$|/handle/\d+/\d+|portal/en/theses/|/theses/[a-z0-9-]{40,}|/phd-candidates/[a-z-]+\.php|placement/dr-|/phd-candidates/[a-z-]+$|/step_|/tags/|fellowship|policies|requirements|datenbanken|bibliothek|/prizes/|graduate-schemes|provide-a-|/hdr/|ntua\.gr|unige\.ch|/register$|libguides|find-vacancies|/erasmus/|go-abroad|teaching/placements|soutenance|completed-theses|theses_status|/trac/|mediatum|tum\.de|kit\.edu|metu\.edu\.tr|sp2\.upenn|learningcenter\.essec|/search/|first_letter|grenoble-inp|/sm_|/students/[a-z-]+$|/alumni/[a-z-]+-phd$|abstracts\.asp|advisors\.asp\?key=|papyrus\.bib|theses\.gla\.ac\.uk/\d+|cyberdocuments|mphotonics|ovgu\.de|tu-dresden\.de|/items?/\d+|/record/\d+|/eprint/\d+|/id/eprint|/bitstream/|in-memoriam|memoriam|obituar|class-?notes|news-classic|distinguished-alumni/.*\.php|/view/funders|/view/publications_funders|wrap\.warwick\.ac\.uk/view/theses/(?!Warwick_Business|School_of_Industrial)|tu-darmstadt\.de/index\.php|degree-requirements|announcements|simple-search|/browse|/handle/\d+/\d+$|copyright|extinguisher|/safety|/registrar|/advising|/testing|/careers/|news-release|/leadership|pulse|rotc|/greif/|cmpid=|/insights/|/rotator/|/orientation|transcript|/coop|/fellows/|/studyabroad|/global|/parents|/policies|catalog|binding|defen[cs]e|guideline|format|template|submission|/publications?/|testimonial|/kwo/|magazine|newsletter|/give|members|recruit|repub\.eur\.nl/res/aut/|/research/|/projects?/|/seminar|/workshop|/conference|/courses?/|/syllab|/forms?/|/student[-_]?life|/campus|/visit|/map|/sitemap|/rss|/feed|/archive/|/image|/photo|/gallery|/survey|/statistics|/stats|/rankings?|/employ|/recruiters?|/hire|/internship|/competition|/awards?|/scholarship|/fellowship|/visiting|/exchange|/study[-_]abroad|/ranking|/overview|/welcome|/home$|/index\.html?$|/\d{4}/\d{2}/\d{2}/|/press|/stories/|/story/|/articles?/|/podcast|/video)', re.I)


# Departments outside operations, management science and industrial engineering: their lists are not in scope and
# they make up most of the addresses on a university site that mention placements or alumni.
URL_OTHER = re.compile(r'(?<![a-z])(english|history|political|politics|theology|philosophy|sociology|psychology|linguistics|classics|economics|econ|finance|accounting|accountancy|marketing|law|physics|chemistry|chem|biology|bio\w*|biochem|neuro\w*|math\w*|statistics|stat|religion|anthropology|geography|music|arts?|education|nursing|pharm\w*|social-?work|architecture|communication|journalism|languages?|spanish|french|german|italian|chinese|japanese|asian|humanities|literature|slavic|romance|cs|computer-?science|computing|informatics|ece|eecs|electrical|mechanical|civil|chemical|aerospace|materials|astronomy|earth|environmental|ecology|geology|public-?policy|public-?health|medicine|dental|veterinary|agri\w*|forestry|kinesiology|physiology|genetics|cancer|biomedical|planning|urban|social-?sciences?|gender|womens?|african|american|european|middle-?east|jewish|hispanic|theatre|theater|film|dance|design|fine-?arts|photography|writing|rhetoric|divinity|ministry|anesthesia|surgery|radiology|optometry|audiology|speech|hearing|epidemiology|biostat\w*|immunology|microbiology|pathology|oncology|cardiology|pediatric|psychiatry|clinical|counsel\w*|criminology|criminal|justice|library|information-?science|ischool|media|cse|cognitive|behavioral|organizational|organisational|ob|hr|hrm|real-?estate|insurance|actuarial|hospitality|tourism|sport|nutrition|food|animal|plant|soil|ocean|marine|atmospheric|meteorology|nuclear|petroleum|mining|textile|polymer|physics)(?![a-z])', re.I)
# Institutions that are business or technology schools as a whole: every page on their hosts is in a business
# or engineering setting, so the address need not name the field.
BUSINESS_INST = re.compile(r'(business|management|insead|indian institute of management|indian school of business|hec|essec|esade|iese|ie university|bocconi|erasmus|tilburg|institute of technology|polytechnic|politecnico|polytechnique|technical university|technische|tsinghua|wharton|kellogg|london school of economics)', re.I)


def url_wanted(u, special_hosts, business_hosts=frozenset()):
    # The cheap list-word test runs first: almost every indexed address fails it, and the long exclusion patterns
    # are slow enough to make a scan CPU-bound when run on every address.
    strong = bool(URL_LIST.search(u))
    weak_word = bool(URL_WEAK.search(u))
    if not strong and not weak_word:
        return False
    if URL_NOT.search(u) or URL_OTHER.search(u):
        return False
    host = urlsplit(u).netloc.lower()
    if host.startswith('www.'):
        host = host[4:]
    path = urlsplit(u).path.lower()
    segs = [x for x in path.split('/') if x]
    # a weak word counts on an accepted page's host only inside the same section of the site (a department page)
    in_section = any(isinstance(k, tuple) and k[0] == host and '/'.join(segs).startswith(k[1]) for k in special_hosts)
    weak = weak_word and (bool(URL_DOC.search(u)) or in_section)
    if not strong and not weak:
        return False
    in_business = host in special_hosts or any(host == h or host.endswith('.' + h) for h in business_hosts)
    return bool(URL_FIELD.search(u) or (in_business and (URL_DOC.search(u) or host in special_hosts)))


def business_hosts_of(domains):
    return frozenset(h for d in domains if BUSINESS_INST.search(d['institution']) for h in d['hosts'])


def special_hosts_of(domains, pages):
    """Hosts that already carry a reviewed page, and hosts listed below a university's main domain."""
    hosts = set()
    for p in pages:
        if (p.get('scope') or 'program-list') not in ('program-list', 'single-record'):
            continue
        u = urlsplit(p['url'])
        h = u.netloc.lower()
        h = h[4:] if h.startswith('www.') else h
        segs = [x for x in u.path.lower().split('/') if x]
        # the host, and the section of the site the accepted page sits in (its first two path segments)
        hosts.add(h)
        hosts.add((h, '/'.join(segs[:2]) if len(segs) >= 2 else ''))
    for d in domains:
        main = urlsplit(d.get('website') or '').netloc.lower()
        main = main[4:] if main.startswith('www.') else main
        for h in d['hosts']:
            if h != main:
                hosts.add(h)
    return hosts


def known_norms(pages):
    return {norm_url(p['url']) for p in pages if (p.get('scope') or 'program-list') in ('program-list', 'single-record')}


def log(*a):
    print(*a, flush=True)


def read_json(p, default):
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default


def write_json(p, v):
    tmp = p + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(v, f, ensure_ascii=False, indent=1)
    os.replace(tmp, p)


def get(url, headers=None, tries=7, timeout=90, stream=False):
    for i in range(tries):
        try:
            r = S.get(url, headers=headers or {}, timeout=timeout, stream=stream)
            if r.status_code in (200, 206):
                return r
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(1.5 * 2 ** i)
                continue
            return None
        except requests.RequestException:
            time.sleep(1.5 * 2 ** i)
    return None


def surt(host):
    parts = host.lower().split('.')
    if parts[0] == 'www':
        parts = parts[1:]
    return ','.join(reversed(parts))


def crawl_list():
    r = get(DATA + 'crawl-data/index.html', tries=10, timeout=60)
    if r is None:
        raise SystemExit('the crawl index could not be read; name crawls with --crawl or try later')
    ids = sorted(set(re.findall(r'CC-MAIN-\d{4}-\d{2}', r.text)))
    return [c for c in ids if int(c[8:12]) >= 2013]


def choose_crawls(args):
    if '--crawl' in args:
        return [a for a in args[args.index('--crawl') + 1:] if a.startswith('CC-MAIN-')]
    ids = crawl_list()
    if '--all' in args:
        return ids
    per_year = int(args[args.index('--per-year') + 1]) if '--per-year' in args else 2
    by_year = {}
    for c in ids:
        by_year.setdefault(c[8:12], []).append(c)
    out = []
    for y, cs in sorted(by_year.items()):
        if len(cs) <= per_year:
            out += cs
        else:
            step = len(cs) / per_year
            out += [cs[int(i * step + step / 2)] for i in range(per_year)]
    return out


def needed_chunks(crawl, prefixes):
    """Stream cluster.idx and return the (file, offset, length) chunks whose key range meets a host prefix."""
    import bisect
    r = get(DATA + f'cc-index/collections/{crawl}/indexes/cluster.idx', stream=True, timeout=600)
    if r is None:
        return None
    need = set()
    prev = None
    for raw in r.iter_lines():
        line = raw.decode('utf-8', 'replace')
        parts = line.split('\t')
        if len(parts) < 4:
            continue
        key = parts[0]
        if prev is not None:
            pk, pp = prev
            j = bisect.bisect_left(prefixes, key)
            for P in reversed(prefixes[:j]):
                if pk < P + '\x7f':
                    need.add((pp[1], int(pp[2]), int(pp[3])))
                else:
                    break
        prev = (key, parts)
    if prev is not None:
        pk, pp = prev
        for P in prefixes:
            if pk < P + '\x7f' and pk + '\x7f' > P:
                need.add((pp[1], int(pp[2]), int(pp[3])))
    return sorted(need)


def scan(args):
    domains = read_json(os.path.join(GDIR, 'domains.json'), [])
    hosts = sorted({h for d in domains for h in d['hosts']})
    pages_known = read_json(PAGES, [])
    special = special_hosts_of(domains, pages_known)
    business = business_hosts_of(domains)
    known = known_norms(pages_known)
    prefixes = sorted({surt(h) + c for h in hosts for c in (')', ',')})
    scanned = read_json(os.path.join(CDIR, 'scanned.json'), {})
    crawls = choose_crawls(args)
    log(f'{len(crawls)} crawls chosen, {len(scanned)} already scanned, {len(hosts)} hosts')
    for crawl in crawls:
        if crawl in scanned:
            continue
        t0 = time.time()
        chunks = needed_chunks(crawl, prefixes)
        if chunks is None:
            log(f'{crawl}: cluster.idx unreadable, skipped')
            continue
        base = DATA + f'cc-index/collections/{crawl}/indexes/'
        hits, failed, done = 0, 0, 0
        out_path = os.path.join(CDIR, f'hits-{crawl}.jsonl')
        out = open(out_path, 'w', encoding='utf-8')
        missing = []

        def work(c):
            f, o, l = c
            time.sleep(0.25)  # the data server refuses bursts above a few requests a second
            r = get(base + f, headers={'Range': f'bytes={o}-{o + l - 1}'}, timeout=120)
            if r is None:
                return None
            res = []
            for line in gzip.decompress(r.content).decode('utf-8', 'replace').split('\n'):
                try:
                    key, ts, js = line.split(' ', 2)
                    j = json.loads(js)
                except ValueError:
                    continue
                u = j.get('url', '')
                if j.get('status') == '200' and 'html' in j.get('mime', '') and (url_wanted(u, special, business) or norm_url(u) in known):
                    res.append({'crawl': crawl, 'key': key, 'ts': ts, 'url': u, 'digest': j.get('digest'), 'filename': j.get('filename'), 'offset': int(j.get('offset', 0)), 'length': int(j.get('length', 0))})
            return res

        with ThreadPoolExecutor(2) as ex:  # more parallel readers make the data server refuse most chunks
            for c, res in zip(chunks, ex.map(work, chunks)):
                done += 1
                if res is None:
                    missing.append(c)
                else:
                    for h in res:
                        out.write(json.dumps(h, ensure_ascii=False) + '\n')
                        hits += 1
                if done % 1000 == 0:
                    log(f'{crawl}: {done}/{len(chunks)} chunks, {hits} hits, {len(missing)} to retry, {int(time.time() - t0)}s')
        # Chunks the data server refused under load are read again one at a time, slowly.
        for round_ in range(3):
            if not missing:
                break
            log(f'{crawl}: retrying {len(missing)} chunks (round {round_ + 1})')
            time.sleep(20)
            still = []
            for c in missing:
                res = work(c)
                if res is None:
                    still.append(c)
                else:
                    for h in res:
                        out.write(json.dumps(h, ensure_ascii=False) + '\n')
                        hits += 1
                time.sleep(0.5)
            missing = still
        failed = len(missing)
        out.close()
        scanned[crawl] = {'scannedAt': time.strftime('%Y-%m-%d'), 'chunks': len(chunks), 'failedChunks': failed, 'missing': [list(c) for c in missing], 'hits': hits, 'seconds': int(time.time() - t0)}
        write_json(os.path.join(CDIR, 'scanned.json'), scanned)
        log(f'{crawl}: done, {hits} hits from {len(chunks)} chunks ({failed} failed), {int(time.time() - t0)}s')


def norm_url(u):
    s = urlsplit(u.strip())
    host = s.netloc.lower()
    if host.startswith('www.'):
        host = host[4:]
    path = (re.sub(r'/+$', '', s.path) or '/').lower()
    # Most query strings are tracking or paging noise, but a few sites select the department or degree by query
    # (a thesis database's ?Fac=20&Degree=3), and those are different pages.
    q = s.query.lower()
    keep = '?' + q if re.search(r'(^|&)(key|fac|degree|dept|department|program|programme|area|field|major|year|id)=', q) else ''
    return host + path + keep


def institution_of(host, domains):
    best = None
    for d in domains:
        for h in d['hosts']:
            if host == h or host.endswith('.' + h):
                if best is None or len(h) > len(best[0]):
                    best = (h, d['institution'])
    return best[1] if best else None


def candidates(args):
    domains = read_json(os.path.join(GDIR, 'domains.json'), [])
    pages = read_json(PAGES, [])
    known = {norm_url(p['url']): p for p in pages}
    special = special_hosts_of(domains, pages)
    business = business_hosts_of(domains)
    groups = {}
    for fn in sorted(os.listdir(CDIR)):
        if not fn.startswith('hits-'):
            continue
        for line in open(os.path.join(CDIR, fn), encoding='utf-8'):
            h = json.loads(line)
            n = norm_url(h['url'])
            if n not in known and not url_wanted(h['url'], special, business):
                continue
            g = groups.setdefault(n, {'url': h['url'], 'host': n.split('/')[0], 'captures': []})
            g['captures'].append({k: h[k] for k in ('crawl', 'ts', 'digest', 'filename', 'offset', 'length', 'url')})
    out = []
    for n, g in groups.items():
        caps = sorted(g['captures'], key=lambda c: c['ts'])
        inst = institution_of(g['host'], domains)
        kp = known.get(n)
        out.append({'normalized': n, 'url': g['url'], 'institution': (kp or {}).get('institution') or inst, 'known': bool(kp), 'scope': (kp or {}).get('scope'), 'years': sorted({c['ts'][:4] for c in caps}), 'captures': caps})
    # A page below another candidate (a per-person page under a list page) is kept but marked, so the review
    # sheet shows the list page once with the count of pages under it.
    norms = {c['normalized'] for c in out}
    for c in out:
        c['underParent'] = None
        parts = c['normalized'].split('/')
        for i in range(len(parts) - 1, 1, -1):
            anc = '/'.join(parts[:i])
            if anc in norms:
                c['underParent'] = anc
                break
    out.sort(key=lambda c: ((c['institution'] or '~'), c['normalized']))
    write_json(os.path.join(CDIR, 'candidates.json'), out)
    with open(os.path.join(CDIR, 'candidates.md'), 'w', encoding='utf-8') as f:
        f.write('# Common Crawl candidate pages (review sheet)\n\nOne line per address: institution | years captured | known page? | address. Accept a new address by adding it to research/graduate-list-pages.json with scope "program-list" and the institution; refuse with scope "not-a-list" and a reason.\n\n')
        children = {}
        for c in out:
            if c['underParent']:
                children[c['underParent']] = children.get(c['underParent'], 0) + 1
        for c in out:
            if c['underParent']:
                continue
            under = f" | {children[c['normalized']]} pages below it" if c['normalized'] in children else ''
            f.write(f"- {c['institution'] or '(no institution for host)'} | {c['years'][0]}–{c['years'][-1]} ({len(c['captures'])}) | {'known ' + str(c['scope']) if c['known'] else 'new'} | {c['url']}{under}\n")
    log(f'{len(out)} addresses ({sum(1 for c in out if c["known"])} known pages, {sum(1 for c in out if not c["institution"])} with no institution for the host) from {sum(len(c["captures"]) for c in out)} captures')


def peek(args):
    """Save the text of the latest capture of every new top-level candidate under commoncrawl/peek/<slug>.txt, for review."""
    cands = read_json(os.path.join(CDIR, 'candidates.json'), [])
    d = os.path.join(CDIR, 'peek')
    os.makedirs(d, exist_ok=True)
    todo = [c for c in cands if not c['known'] and not c['underParent'] and c['institution']]
    log(f'{len(todo)} candidates to peek')

    def work(c):
        base = os.path.join(d, slug(c['url']))
        if os.path.exists(base + '.txt') or os.path.exists(base + '.failed'):
            return 'had'
        cap = max(c['captures'], key=lambda x: x['ts'])
        time.sleep(0.3)
        body = warc_body(cap)
        if body is None:
            open(base + '.failed', 'w').write('')
            return 'failed'
        open(base + '.txt', 'w', encoding='utf-8').write(to_text(body)[:30000] + f"\n\n[page {cap['url']}; capture {cap['ts']} in {cap['crawl']}; institution by host: {c['institution']}]\n")
        return 'saved'
    counts = {}
    with ThreadPoolExecutor(1) as ex:  # the data server refuses bursts; a scan may be running too
        for i, r in enumerate(ex.map(work, todo), 1):
            counts[r] = counts.get(r, 0) + 1
            if i % 200 == 0:
                log(f'{i}/{len(todo)} {counts}')
    log(f'peek: {counts}')


def review_chunks(args):
    """Write commoncrawl/review-N.json batches of peeked candidates for the review agents (--size 40)."""
    size = int(args[args.index('--size') + 1]) if '--size' in args else 40
    start = int(args[args.index('--start') + 1]) if '--start' in args else 1
    cands = read_json(os.path.join(CDIR, 'candidates.json'), [])
    reviewed = set()
    for fn in os.listdir(CDIR):
        if fn.startswith('review-') and fn.endswith('.json') and not fn.startswith('review-chunk'):
            for r in read_json(os.path.join(CDIR, fn), {}).get('pages', []):
                reviewed.add(r['url'])
    todo = []
    for c in cands:
        if c['known'] or c['underParent'] or not c['institution'] or c['url'] in reviewed:
            continue
        t = os.path.join(CDIR, 'peek', slug(c['url']) + '.txt')
        if os.path.exists(t):
            todo.append({'url': c['url'], 'institution': c['institution'], 'years': c['years'], 'text': os.path.relpath(t, ROOT), 'pagesBelow': sum(1 for x in cands if x['underParent'] == c['normalized'])})
    n = start - 1
    for i in range(0, len(todo), size):
        n += 1
        write_json(os.path.join(CDIR, f'review-chunk-{n}.json'), {'chunk': n, 'pages': todo[i:i + size]})
    log(f'{len(todo)} candidates in review chunks {start} to {n}')


def accept(args):
    """Apply the review proposals (commoncrawl/review-N.json) to research/graduate-list-pages.json."""
    pages = read_json(PAGES, [])
    byurl = {p['url']: p for p in pages}
    added = 0
    for fn in sorted(os.listdir(CDIR)):
        if not (fn.startswith('review-') and fn.endswith('.json')) or fn.startswith('review-chunk'):
            continue
        for r in read_json(os.path.join(CDIR, fn), {}).get('pages', []):
            if r.get('scope') not in ('program-list', 'single-record', 'not-a-list'):
                raise SystemExit(f'{fn}: bad scope for {r.get("url")}')
            if r['url'] in byurl:
                continue
            pages.append({'institution': r.get('institution'), 'citations': 0, 'url': r['url'], 'scope': r['scope'], 'scopeReason': r.get('reason'), 'foundVia': 'commoncrawl', 'reviewedAt': r.get('reviewedAt')})
            byurl[r['url']] = pages[-1]
            added += 1
    write_json(PAGES, pages)
    log(f'{added} pages added to graduate-list-pages.json ({len(pages)} now)')


def slug(url):
    s = re.sub(r'^https?://', '', url)
    s = re.sub(r'[^a-z0-9]+', '-', s, flags=re.I).strip('-')[:80]
    return s + '-' + hashlib.md5(url.encode('utf-8')).hexdigest()[:6]


def to_text(h):
    h = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>|<!--[\s\S]*?-->', ' ', h, flags=re.I)
    h = re.sub(r'</(p|div|li|tr|h[1-6]|section|article|br|table)>', '\n', h, flags=re.I)
    h = re.sub(r'</t[dh]>', ' | ', h, flags=re.I)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = htmlmod.unescape(h)
    h = re.sub(r'[ \t\xa0]+', ' ', h)
    h = re.sub(r'\n\s*\n+', '\n', h)
    return h.strip()


def warc_body(c):
    r = get(DATA + c['filename'], headers={'Range': f"bytes={c['offset']}-{c['offset'] + c['length'] - 1}"}, timeout=180)
    if r is None:
        return None
    try:
        raw = gzip.decompress(r.content)
    except OSError:
        return None
    parts = raw.split(b'\r\n\r\n', 2)
    if len(parts) < 3:
        return None
    http_head = parts[1].decode('latin-1', 'replace')
    body = parts[2]
    m = re.search(r'charset=["\']?([\w-]+)', http_head, re.I) or re.search(rb'charset=["\']?([\w-]+)', body[:4000], re.I)
    enc = (m.group(1) if isinstance(m.group(1), str) else m.group(1).decode()) if m else 'utf-8'
    try:
        return body.decode(enc, 'replace')
    except LookupError:
        return body.decode('utf-8', 'replace')


def fetch(args):
    cands = {c['normalized']: c for c in read_json(os.path.join(CDIR, 'candidates.json'), [])}
    pages = read_json(PAGES, [])
    plan = read_json(PLAN, {'generatedAt': None, 'pages': {}})
    only = args[args.index('--page') + 1] if '--page' in args else None
    today = time.strftime('%Y-%m-%d')
    n_pages = n_files = 0
    for p in pages:
        if (p.get('scope') or 'program-list') not in ('program-list', 'single-record'):
            continue
        if only and p['url'] != only:
            continue
        c = cands.get(norm_url(p['url']))
        if not c:
            continue
        key = slug(p['url'])
        d = os.path.join(GDIR, 'snapshots', key)
        os.makedirs(d, exist_ok=True)
        # one capture per calendar year: the last of the year; the same content digest is not read twice
        by_year = {}
        for cap in c['captures']:
            # a page marked readOnce (an undated catalogue, a single profile) is read in its latest capture only
            y = 'latest' if p.get('readOnce') or p.get('scope') == 'single-record' else cap['ts'][:4]
            if y not in by_year or cap['ts'] > by_year[y]['ts']:
                by_year[y] = cap
        seen_digest = set()
        # a readOnce page that already has a saved copy is not read again, whatever newer captures exist
        if (p.get('readOnce') or p.get('scope') == 'single-record') and any(f.endswith('.txt') for f in os.listdir(d)):
            continue
        entry = plan['pages'].setdefault(key, {'institution': p['institution'], 'url': p['url'], 'listedVia': 'commoncrawl', 'listedAt': today, 'error': None, 'snapshots': []})
        entry.setdefault('commoncrawl', [])
        for y, cap in sorted(by_year.items()):
            if cap['digest'] in seen_digest:
                continue
            seen_digest.add(cap['digest'])
            base = os.path.join(d, cap['ts'])
            if os.path.exists(base + '.txt'):
                # saved earlier: make sure the plan knows it (another writer may have rewritten plan.json)
                if not any(s.get('timestamp') == cap['ts'] for s in entry['snapshots']):
                    entry['snapshots'].append({'timestamp': cap['ts'], 'digest': cap['digest'], 'length': cap['length'], 'via': 'commoncrawl', 'crawl': cap['crawl']})
                continue
            if os.path.exists(base + '.failed'):
                continue
            time.sleep(0.3)  # paced: a scan may be running
            body = warc_body(cap)
            if body is None:
                open(base + '.failed', 'w').write(json.dumps({'via': 'commoncrawl', **cap}))
                log(f'{key} {cap["ts"]}: failed')
                continue
            lookup = f"https://index.commoncrawl.org/{cap['crawl']}-index?url={quote(cap['url'], safe='')}&output=json"
            open(base + '.html', 'w', encoding='utf-8').write(body)
            open(base + '.txt', 'w', encoding='utf-8').write(to_text(body) + f"\n\n[source: {lookup}; read {today} via commoncrawl {cap['crawl']} {cap['filename']} offset {cap['offset']} length {cap['length']}; page {cap['url']}]\n")
            if not any(s.get('timestamp') == cap['ts'] for s in entry['snapshots']):
                entry['snapshots'].append({'timestamp': cap['ts'], 'digest': cap['digest'], 'length': cap['length'], 'via': 'commoncrawl', 'crawl': cap['crawl']})
            n_files += 1
        entry['snapshots'].sort(key=lambda s: s['timestamp'])
        n_pages += 1
        plan['generatedAt'] = today
        write_json(PLAN, plan)
    log(f'{n_files} captures saved for {n_pages} pages')


if __name__ == '__main__':
    a = sys.argv[1:]
    mode = a[0] if a else ''
    if mode == 'scan':
        scan(a)
    elif mode == 'candidates':
        candidates(a)
    elif mode == 'peek':
        peek(a)
    elif mode == 'review-chunks':
        review_chunks(a)
    elif mode == 'accept':
        accept(a)
    elif mode == 'fetch':
        fetch(a)
    else:
        print('Give scan, candidates, peek, review-chunks, accept or fetch.')
