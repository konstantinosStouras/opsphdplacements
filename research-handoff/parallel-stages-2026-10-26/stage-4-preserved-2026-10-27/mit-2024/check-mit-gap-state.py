"""Read the live MIT 2024 gap state without changing public records."""
import datetime
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

root = Path(__file__).resolve().parent
stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
base = 'https://www.stouras.com/opsphdplacements/'
cohort = json.loads((root / 'mit-or-2024.cohort-proposal.json').read_text(encoding='utf-8'))
ids = {r['proposedGraduateId'] for r in cohort['records']}

def read(name):
    with urllib.request.urlopen(base + 'data/' + name + '?gapcheck=' + stamp, timeout=40) as response:
        data = json.load(response)
    return data if isinstance(data, list) else data['records']

with ThreadPoolExecutor(max_workers=2) as pool:
    graduates, histories = list(pool.map(read, ['graduate-lists.json', 'employment-histories.json']))
rows = []
for r in graduates:
    if r['id'] not in ids:
        continue
    degree = r.get('degreeReview', {})
    first = r.get('firstJobReview') or {}
    rows.append({'personId': r['id'], 'name': r['name'],
                 'formalAwardMonth': degree.get('period', {}).get('month'),
                 'directAwardDay': degree.get('awardDay'),
                 'recipientSourceUrl': degree.get('sourceUrl'),
                 'recipientCheckedAt': degree.get('checkedAt'),
                 'firstJobStatus': first.get('status'), 'firstEmployer': first.get('employer'),
                 'degreeMilestones': r.get('degreeMilestones', [])})
careers = [r for r in histories if r['id'] in ids]
proof = {'checkedAt': stamp, 'siteUrl': base, 'records': rows,
         'graduateRecordsPresent': len(rows),
         'verifiedGraduateFirstEmployers': sum(r['firstJobStatus'] == 'verified' for r in rows),
         'formalAwardMonthsUnknown': sum(r['formalAwardMonth'] is None for r in rows),
         'directIndividualAwardDaysUnknown': sum(r['directAwardDay'] is None for r in rows),
         'stage4HistoriesPresent': len(careers),
         'completeCareers': sum(r.get('careerComplete') is True for r in careers),
         'method': 'Fresh public read; retrieval time does not replace original fact/source check dates.'}
for slug in ['sohil-shah', 'nicholas-andre-g-johnson']:
    identity = 'grad:massachusetts-institute-of-technology:' + slug + ':2024'
    history = next(r for r in careers if r['id'] == identity)
    proof[slug] = {'careerComplete': history.get('careerComplete'),
                   'firstJobAssessment': history.get('firstJobAssessment')}
(root / 'live-gap-state-2026-10-27T1111.json').write_text(
    json.dumps(proof, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: v for k, v in proof.items() if k != 'records'}, ensure_ascii=True))
