"""Read deployed graduate milestones and verify that formal dates remain unknown."""
import datetime
import json
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent
stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
base = 'https://www.stouras.com/opsphdplacements/'
with urllib.request.urlopen(base + 'data/graduate-lists.json?milestones=' + stamp, timeout=40) as response:
    data = json.load(response)
rows = data if isinstance(data, list) else data['records']
expected = {
    'leann-thayaparan': ('advisor-reported-graduation', 5, None),
    'kimberly-m-villalobos-carballo': ('doctoral-defence', 4, 25),
    'cynthia-zeng': ('ambiguous-advisor-graduation-event', 4, 30),
}
checks = []
for slug, (kind, month, day) in expected.items():
    identity = 'grad:massachusetts-institute-of-technology:' + slug + ':2024'
    row = next(r for r in rows if r['id'] == identity)
    milestones = [m for m in row.get('degreeMilestones', []) if m.get('kind') == kind]
    milestone = milestones[0] if len(milestones) == 1 else {}
    observation = milestone.get('observation', {})
    passed = (len(milestones) == 1 and observation.get('year') == 2024
              and observation.get('month') == month and observation.get('day') == day
              and milestone.get('checkedAt') == '2026-10-27'
              and milestone.get('formalAwardDateAssigned') is False
              and row['degreeReview']['period'].get('month') is None
              and row['degreeReview'].get('awardDay') is None)
    checks.append({'id': identity, 'confirmed': passed, 'milestone': milestone,
                   'formalAwardMonth': row['degreeReview']['period'].get('month'),
                   'formalAwardDay': row['degreeReview'].get('awardDay')})
cohort = json.loads((root / 'mit-or-2024.cohort-proposal.json').read_text(encoding='utf-8'))
ids = {r['proposedGraduateId'] for r in cohort['records']}
cohort_rows = [r for r in rows if r['id'] in ids]
months_unknown = sum(r['degreeReview']['period'].get('month') is None for r in cohort_rows)
days_unknown = sum(r['degreeReview'].get('awardDay') is None for r in cohort_rows)
proof = {'checkedAt': stamp, 'siteUrl': base, 'checks': checks,
         'graduateRecordsPresent': len(cohort_rows), 'formalAwardMonthsUnknown': months_unknown,
         'directIndividualAwardDaysUnknown': days_unknown,
         'liveConfirmed': all(c['confirmed'] for c in checks) and len(cohort_rows) == 14
         and months_unknown == 9 and days_unknown == 14,
         'method': 'Fresh independent public read; milestone meaning and formal-date preservation checked separately.'}
(root / 'live-degree-milestones-2026-10-27.json').write_text(
    json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(proof, ensure_ascii=True))
if not proof['liveConfirmed']:
    raise SystemExit('Three degree milestones not yet fully confirmed live')
