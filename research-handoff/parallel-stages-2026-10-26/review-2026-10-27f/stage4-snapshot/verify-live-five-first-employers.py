"""Independently verify the five reviewed MIT graduate first employers."""
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
            'haoyue-wang': ('Susquehanna International Group', None),
            'chen-wen-sabrina-zhai': ('Citadel', 9)}

def read(name):
    with urllib.request.urlopen(base + 'data/' + name + '?stage4five=' + stamp, timeout=40) as response:
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
career_ids = {'grad:massachusetts-institute-of-technology:' + slug + ':2024'
              for slug in [*expected, 'nicholas-andre-g-johnson', 'sohil-shah']}
career_rows = [r for r in histories if r['id'] in career_ids]
nicholas = next(r for r in career_rows if ':nicholas-andre-g-johnson:' in r['id'])
def mit_affiliate(role):
    return (role.get('employerAsWritten') == 'Massachusetts Institute of Technology'
            and role.get('titleAsWritten') == 'Research Affiliate')
affiliations = [r for r in nicholas.get('otherEmploymentMentions', []) if mit_affiliate(r)]
policy_confirmed = (not any(mit_affiliate(r) for r in nicholas.get('jobs', []))
                    and len(affiliations) == 1
                    and affiliations[0].get('checkedAt') == '2026-10-26'
                    and affiliations[0].get('classificationReview', {}).get('checkedAt') == '2026-10-27'
                    and nicholas.get('firstJobAssessment') is None)
proof = {'checkedAt': stamp, 'siteUrl': base, 'checks': checks,
         'graduateRecordsPresent': len(rows), 'degreeMonthsUnknown': unknown_months,
         'directAwardDaysUnknown': unknown_days,
         'partialCareerHistories': len(career_rows),
         'structuredPositions': sum(len(r.get('jobs', [])) for r in career_rows),
         'nicholasUnpaidAffiliationMigrationConfirmed': policy_confirmed,
         'nicholasFirstJobRemainsUnresolved': nicholas.get('firstJobAssessment') is None,
         'prometheusSupportingObservationPresent': any('Prometheus' in json.dumps(r)
             for r in nicholas.get('otherEmploymentMentions', [])),
         'liveConfirmed': all(r['confirmed'] for r in checks) and len(rows) == 14
         and unknown_months == 9 and unknown_days == 14 and policy_confirmed
         and len(career_rows) == 7 and all(r.get('careerComplete') is False for r in career_rows),
         'method': 'Fresh independent public graduate/career reads; no remote mutation.'}
(root / 'live-five-first-employers-2026-10-27.json').write_text(
    json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(proof, ensure_ascii=True))
if not proof['liveConfirmed']:
    raise SystemExit('Five-employer release not yet fully confirmed live')
