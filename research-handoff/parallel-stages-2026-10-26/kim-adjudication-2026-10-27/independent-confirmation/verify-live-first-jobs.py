"""Read public records and save compact proof of the reviewed two-person release."""
import datetime
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
base = 'https://www.stouras.com/opsphdplacements/'
expected = {'cheol-woo-kim': ('Harvard University', 9), 'kevin-hu': ('MITRE', 11)}

def read(name):
    with urllib.request.urlopen(base + 'data/' + name + '?stage4firstjobs=' + stamp, timeout=40) as response:
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
    checks.append({'id': identity, 'graduateStatus': review.get('status'),
                   'historyStatus': assessment.get('status'), 'employer': review.get('employer'),
                   'start': review.get('start'), 'degreeAwardDay': graduate['degreeReview'].get('awardDay'),
                   'careerComplete': history.get('careerComplete'),
                   'confirmed': review.get('status') == assessment.get('status') == 'verified'
                   and review.get('employer') == assessment.get('employer') == employer
                   and review.get('start', {}).get('month') == month
                   and graduate['degreeReview'].get('awardDay') is None
                   and history.get('careerComplete') is False})

proof = {'checkedAt': stamp, 'siteUrl': base, 'checks': checks,
         'liveConfirmed': all(r['confirmed'] for r in checks),
         'method': 'Fresh independent public graduate and employment record reads; no remote mutations.'}
target = Path(__file__).with_name('live-first-job-confirmation-2026-10-27.json')
target.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(proof, ensure_ascii=True))
if not proof['liveConfirmed']:
    raise SystemExit('Accepted assessments not yet both confirmed live')
