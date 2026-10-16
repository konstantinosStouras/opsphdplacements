import json
from pathlib import Path
p=Path('research/placements-a/results.json')
r=json.loads(p.read_text(encoding='utf-8'))
for x in r:
 if x['name'] in ['Tianjun Feng','Qingxia (Cynthia) Kong']:
  x['status']='unresolved'
  x['reason']='Conflicting graduation/cohort year between official initial-placement table and imported directory. Initial employer is documented, but chronology requires another degree/appointment source before publication.'
  x['candidateEmployer']=x.pop('employer')
  x['candidatePhdYear']=x.pop('phdYearVerified')
  for key in ['position','placementYear','category']: x.pop(key,None)
 if x['name']=='David Almog':
  x['sources'].append(dict(url='https://faculty.harvard.edu/2026-2027-new-ladder-faculty',title='Harvard — New Ladder Faculty 2026–2027',notes='Confirms appointment as Assistant Professor of Business Administration in Technology and Operations Management.'))
  x['position']='Assistant Professor of Business Administration'
  x['placementYear']=2026
  x['category']='tenure-track'
  x['evidenceNote']='Kellogg identifies Harvard as the 2026 job-market placement. Harvard lists Almog among its new 2026–2027 ladder faculty, and his personal academic website confirms the PhD was received.'
  x['sources'].append(dict(url='https://www.david-almog.com/home',title='David Almog — academic website',notes='Confirms received PhD and current Harvard assistant professorship.'))
p.write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
