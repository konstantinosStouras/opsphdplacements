# Integrator scan of a first-job proposal: structure problems and rows worth a human look.
import json, sys, re, collections
n = sys.argv[1]
base = '/home/user/opsphdplacements/research/placements-roster'
rows = json.load(open(f'{base}/proposal-{n}.json'))
chunk = {p['facultyId']: p for p in json.load(open(f'{base}/chunk-{n}.json'))['people']}
print(n, len(rows), 'rows', dict(collections.Counter(r['status'] for r in rows)))
CATS = {'tenure-track','postdoc','other-academic','industry','government','nonprofit','unknown'}
for r in rows:
    p = chunk.get(r['facultyId']); flags = []
    if not p: flags.append('UNKNOWN-ID')
    elif p['name'] != r['name']: flags.append('NAME-MISMATCH')
    if r['status'] == 'verified':
        if r.get('category') not in CATS: flags.append('BAD-CATEGORY')
        if r.get('evidenceUrl') not in [s.get('url') for s in r.get('sources', [])]: flags.append('EVIDENCE-NOT-IN-SOURCES')
        py, y = r.get('placementYear'), (r.get('phdYearVerified') or (p or {}).get('phdYear'))
        if py is not None and y is not None and py < y: flags.append(f'START-{py}-BEFORE-PHD-{y}')
        if py is not None and y is not None and py - y > 3: flags.append(f'GAP-{py - y}y')
        if r.get('phdYearVerified') and p and p.get('phdYear') and r['phdYearVerified'] != p['phdYear'] and not r.get('phdYearResolution'): flags.append('YEAR-CONFLICT-UNEXPLAINED')
        note = (r.get('evidenceNote') or '').lower()
        if re.search(r'\bcurrent(ly)?\b|\bnow\b', note) and not re.search(r'\b(19|20)\d\d\b', note): flags.append('UNDATED-CURRENT?')
    if flags:
        print('  ', flags, r['name'], '|', r.get('employer'), r.get('placementYear'), r.get('category'))
