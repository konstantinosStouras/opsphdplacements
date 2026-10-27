"""Pure proposal checks: no public writes, mergers or downloads."""
import json
from pathlib import Path
p=Path(__file__).resolve().parent
co=json.loads((p/'cohort-proposal.json').read_text(encoding='utf-8'))
assert len(co['records'])==12 and len({r['proposedGraduateId'] for r in co['records']})==12
assert all(r['programId']=='mit-operations-research-phd' and r['checkedAt']=='2026-10-27' and r['degreeEvidenceSourceUrl'].startswith('https://commencement.mit.edu/') for r in co['records'])
assert sum(r['degreeAwardPeriod']['month'] is not None for r in co['records'])==2
assert all(r['degreeAwardDate'] is None for r in co['records'])
assert sum(r['careerOwner']=='stage-4' for r in co['records'])==7
hs=[json.loads(f.read_text(encoding='utf-8')) for f in p.glob('*.history-proposal.json')]
assert len(hs)==len({h['personId'] for h in hs})==7
ids={r['proposedGraduateId'] for r in co['records'] if r['careerOwner']=='stage-4'}
assert {h['personId'] for h in hs}==ids
assert sum(len(h['jobs']) for h in hs)==64
assert sum(len(h['otherEmploymentMentions']) for h in hs)==9
assert sum(h['firstJobAssessment'] is not None for h in hs)==5
for h in hs:
 assert h['profileHistoryComplete'] and h['experienceAccess']=='read-all-visible' and not h['careerComplete']
 for j in h['jobs']:
  assert j['sourceUrl']==h['profileUrl'] and j['checkedAt']=='2026-10-27' and j['titleAsWritten'] and j['employerAsWritten']
  for k in ['start','end']:
   d=j[k];assert d['precision'] in ['unknown','year','month']
   if d['precision']=='unknown':assert d['year'] is None and d['month'] is None
   if d['precision']=='year':assert d['year'] is not None and d['month'] is None
   if d['precision']=='month':assert d['year'] is not None and 1<=d['month']<=12
  if j['isCurrent']:assert j['end']['asWritten']=='Present'
park=json.loads((p/'parked-cases.json').read_text(encoding='utf-8'))
assert len(park['cases'])==2 and len(park['formalAwardMonthUnknown'])==10 and len(park['directIndividualAwardDaysUnknown'])==12
print('PASS:12 unique recipient matches;7 complete accessible sections/64 source entries/9 supporting mentions;5 first-employer proposals;2 parked chronologies;10 unknown formal months/12 unknown direct days. No public writes.')
