"""Read-only pure proposal validation; never merge or publish."""
import json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent
def read(f):return json.loads((p/f).read_text(encoding='utf-8'))
rs=read('cohort-proposal.json')['records']
assert len(rs)==len({r['proposedGraduateId'] for r in rs})==9
assert all(r['degreeCompletionYear']==2021 and r['degreeAwardDate'] is None and r['degreeEvidenceSourceUrl'].startswith('https://commencement.mit.edu/') for r in rs)
assert sum(r['degreeAwardPeriod']['month'] is not None for r in rs)==6
assert sum(r['careerOwner']=='stage-2' for r in rs)==3
hs=[read(f.name) for f in p.glob('*.history-proposal.json')]
assert len(hs)==len({h['personId'] for h in hs})==6
assert {h['personId'] for h in hs}=={r['proposedGraduateId'] for r in rs if r['careerOwner']=='stage-4'}
assert sum(h['profileHistoryComplete'] for h in hs)==5
assert sum(len(h['jobs']) for h in hs)==40
assert sum(len(h['otherEmploymentMentions']) for h in hs)==5
assert sum(h['firstJobAssessment'] is not None for h in hs)==2
assert sum(bool(h.get('parkedCase')) for h in hs)==4
for h in hs:
 assert h['integrationStatus']=='proposal-only' and not h['careerComplete']
 if h['profileHistoryComplete']:assert h['experienceAccess']=='read-all-visible'
 for j in h['jobs']:
  assert j['titleAsWritten'] and j['employerAsWritten'] and j['checkedAt']=='2026-10-27'
  for k in ['start','end']:
   d=j[k];assert d['precision'] in ['unknown','year','month']
   if d['precision']=='unknown':assert d['year'] is None and d['month'] is None
   if d['precision']=='year':assert d['year'] is not None and d['month'] is None
   if d['precision']=='month':assert d['year'] is not None and 1<=d['month']<=12
park=read('parked-cases.json')
assert len(park['cases'])==4 and len(park['formalAwardMonthUnknown'])==3 and len(park['directIndividualAwardDaysUnknown'])==9
if (p/'publication-ready.json').exists():
 for f in read('publication-ready.json')['files']:
  assert hashlib.sha256((p/f['path']).read_bytes().replace(b'\r\n',b'\n')).hexdigest()==f['sha256LF'],f['path']
print('PASS:9 recipient matches;6 career outcomes;5 full accessible sections;40 source roles/5 supporting mentions;2 first-employer proposals;4 parked;3 faculty deferrals;3 unknown formal months/9 unknown days. No public writes.')
