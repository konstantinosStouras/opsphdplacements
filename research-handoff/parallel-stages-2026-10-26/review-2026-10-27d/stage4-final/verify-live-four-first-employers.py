"""Independently verify the four reviewed MIT graduate first employers."""
import datetime
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

root = Path(__file__).resolve().parent
stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
base = 'https://www.stouras.com/opsphdplacements/'
expected = {'cheol-woo-kim': ('Harvard University', 9),
            'kevin-hu': ('MITRE', 11), 'kayhan-behdin': ('LinkedIn', 7),
            'haoyue-wang': ('Susquehanna International Group', None)}

def read(name):
    with urllib.request.urlopen(base + 'data/' + name + '?stage4four=' + stamp, timeout=40) as response:
        value = json.load(response)
    return value if isinstance(value, list) else value['records']

with ThreadPoolExecutor(max_workers=2) as pool:
    graduates, histories = list(pool.map(read, ['graduate-lists.json', 'employment-histories.json']))

checks = []
for slug, (employer, month) in expected.items():
    identity = 'grad:massachusetts-institute-of-technology:' + slug + ':2024'
    graduate = next(r for r in graduates if r['id'] == identity)
    history = next(r for r in histories if r['id'] == identity)
    review = graduate.get('firstJobReview', {})
    assessment = history.get('firstJobAssessment', {})
    start = review.get('start', {})
    passed = (review.get('status') == assessment.get('status') == 'verified'
              and review.get('employer') == assessment.get('employer') == employer
              and start.get('month') == month
              and graduate['degreeReview'].get('awardDay') is None
              and history.get('careerComplete') is False)
    if slug == 'haoyue-wang':
        passed = passed and start.get('year') is None and review.get('title') is None
    checks.append({'id': identity, 'status': review.get('status'), 'employer': review.get('employer'),
                   'start': start, 'title': review.get('title'), 'confirmed': passed,
                   'degreeAwardDay': graduate['degreeReview'].get('awardDay'),
                   'careerComplete': history.get('careerComplete')})

cohort = json.loads((root / 'mit-or-2024.cohort-proposal.json').read_text(encoding='utf-8'))
ids = {r['proposedGraduateId'] for r in cohort['records']}
rows = [r for r in graduates if r['id'] in ids]
unknown_months = sum(r.get('degreeReview', {}).get('period', {}).get('month') is None for r in rows)
unknown_days = sum(r.get('degreeReview', {}).get('awardDay') is None for r in rows)
proof = {'checkedAt': stamp, 'siteUrl': base, 'checks': checks,
         'graduateRecordsPresent': len(rows), 'degreeMonthsUnknown': unknown_months,
         'directAwardDaysUnknown': unknown_days,
         'liveConfirmed': all(r['confirmed'] for r in checks) and len(rows) == 14
         and unknown_months == 9 and unknown_days == 14,
         'method': 'Fresh independent public graduate/career reads; no remote mutation.'}
(root / 'live-four-first-employers-2026-10-27.json').write_text(
    json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(proof, ensure_ascii=True))
if not proof['liveConfirmed']:
    raise SystemExit('Four-employer release not yet fully confirmed live')
