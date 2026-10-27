"""Read-only proposal/date/ownership validation. Never merge public data."""
import json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent
def read(f):return json.loads((p/f).read_text(encoding='utf-8'))
co=read('cohort-proposal.json');rs=co['records']
assert len(rs)==len({r['proposedGraduateId'] for r in rs})==18
assert all(r['degreeCompletionYear']==2022 and r['degreeAwardDate'] is None and r['degreeEvidenceSourceUrl'].startswith('https://commencement.mit.edu/') for r in rs)
assert sum(r['degreeAwardPeriod']['month'] is not None for r in rs)==9
assert sum(r['careerOwner']=='stage-2' for r in rs)==4
assert sum(r['careerOwner']=='stage-3' for r in rs)==1
hs=[read(f.name) for f in p.glob('*.history-proposal.json')]
assert len(hs)==len({h['personId'] for h in hs})==13
assert {h['personId'] for h in hs}=={r['proposedGraduateId'] for r in rs if r['careerOwner']=='stage-4'}
assert sum(h['profileHistoryComplete'] for h in hs)==10
assert sum(len(h['jobs']) for h in hs)==69
assert sum(len(h['otherEmploymentMentions']) for h in hs)==11
assert sum(len(h.get('nonEmploymentExperienceEntries',[])) for h in hs)==1
assert sum(h['firstJobAssessment'] is not None for h in hs)==5
assert sum(bool(h.get('parkedCase')) for h in hs)==8
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
assert len(park['cases'])==8 and len(park['formalAwardMonthUnknown'])==9 and len(park['directIndividualAwardDaysUnknown'])==18
manifest=p/'publication-ready.json'
if manifest.exists():
 for f in read('publication-ready.json')['files']:
  assert hashlib.sha256((p/f['path']).read_bytes().replace(b'\r\n',b'\n')).hexdigest()==f['sha256LF'],f['path']
print('PASS:18 recipient matches;13 career outcomes;10 full accessible sections;69 source roles/11 supporting mentions/1 career break;5 first-employer proposals;8 parked;5 faculty deferrals;9 unknown months/18 unknown days. No public writes.')
