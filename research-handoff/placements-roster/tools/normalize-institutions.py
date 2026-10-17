# Integrator pre-merge step for first-job proposals (faculty-page people by default; FJ_DIR=placements-omlist for OM List people).
# A verified PhD institution that names the record's university in a longer or shorter form (a school or note in
# brackets, a trailing country, a leading "The") is stored under the record's name, with the written form kept in
# phdInstitutionVerifiedAsWritten and an integrator note. Any other difference is listed for a decision:
#   python3 normalize-institutions.py N [N ...]                      (normalize and report)
#   python3 normalize-institutions.py N --same "<facultyId>" ...     (record a reviewed same-university decision)
#   python3 normalize-institutions.py N --differs "<facultyId>" ...  (keep the verified name and add a resolution)
import json, sys, re, unicodedata, os
ROOT = '/home/user/opsphdplacements'
COUNTRIES = 'usa|united states|u s a|us|uk|united kingdom|england|scotland|canada|france|germany|belgium|sweden|norway|denmark|finland|netherlands|the netherlands|italy|spain|portugal|switzerland|austria|israel|india|china|p r china|taiwan|japan|korea|south korea|singapore|australia|new zealand|brazil|mexico|chile|turkey|iran|greece|ireland|hong kong|saudi arabia|egypt|pakistan|bangladesh|russia|poland'
def fold(s): return re.sub(r'[^a-z0-9]+', ' ', unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()).strip()
def core(s):
    s = re.sub(r'\([^)]*\)', ' ', s or '')
    f = fold(s)
    f = re.sub(r'^the ', '', f)
    f = re.sub(r'(?:\s+(?:' + COUNTRIES + r'))+$', '', f)
    return f.strip()
args = sys.argv[1:]; chunks = [a for a in args if a.isdigit()]
same = set(args[args.index('--same') + 1:]) if '--same' in args else set()
differs = set(args[args.index('--differs') + 1:]) if '--differs' in args else set()
for k in ('--same', '--differs'):
    if k in args: break
same = {x for x in same if not x.startswith('--')}; differs = {x for x in differs if not x.startswith('--')}
FJ_DIR = os.environ.get('FJ_DIR', 'placements-roster'); OM = FJ_DIR == 'placements-omlist'
people = {p['id']: p for p in json.load(open(f'{ROOT}/data/' + ('faculty.json' if OM else 'faculty-roster-people.json')))['records']}
aliases = json.load(open(f'{ROOT}/data/institution-aliases.json'))['aliases']
for n in chunks:
    path = f'{ROOT}/research/{FJ_DIR}/proposal-{n}.json'; rows = json.load(open(path)); changed = 0
    for r in rows:
        v = r.get('phdInstitutionVerified'); rec = people.get(r['facultyId'], {}).get('phdInstitution')
        if r['status'] != 'verified' or not v or not rec or v == rec or r.get('phdInstitutionResolution'): continue
        canon = aliases.get(v, {}).get('canonical')
        if r['facultyId'] in same or core(v) == core(rec) or canon == rec:
            r['phdInstitutionVerifiedAsWritten'] = v; r['phdInstitutionVerified'] = rec
            r['evidenceNote'] = r['evidenceNote'].rstrip() + f" Integrator: the evidence writes the doctorate-awarding institution as '{v}', the same university as the record's '{rec}', so it is stored under the record's name."
            changed += 1
        elif r['facultyId'] in differs:
            r['phdInstitutionResolution'] = ("The imported OM List record" if OM else "The faculty page") + f" names the doctorate-awarding institution as '{rec}'; the evidence cited in this review names '{v}', which is recorded as verified. Integrator decision."
            changed += 1
        else:
            print(f'  DECIDE chunk {n}: {r["facultyId"]} | record "{rec}" | verified "{v}"')
    json.dump(rows, open(path, 'w'), indent=1, ensure_ascii=False)
    print(f'chunk {n}: {changed} institution names reconciled')
