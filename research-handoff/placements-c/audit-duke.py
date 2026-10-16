from helpers import *
for r in out:
 if r['status']=='verified' and 'areas.fuqua.duke.edu/operations-management/ph-d-program/placement' in r.get('evidenceUrl',''):
  r['reportedAcademicPlacement']={k:r.get(k) for k in ['employer','position','placementYear','phdYearVerified','evidenceUrl','evidenceNote']}
  r['status']='unresolved';r['reason']='Duke source establishes initial academic placement, but not necessarily first employment after the PhD across all sectors. Individual career chronology is required.'
  for k in ['employer','position','placementYear','category','phdYearVerified','evidenceNote','evidenceUrl','phdYearResolution']:r.pop(k,None)
# Preserve reviewed destinations from the other generic-table audit, without publishing them as verified.
for old in json.loads((p/'placement-table-audit-original.json').read_text(encoding='utf8')):
 r=next(x for x in out if x['facultyId']==old['facultyId'])
 if r['status']=='unresolved':r['reportedAcademicPlacement']={k:old.get(k) for k in ['employer','position','placementYear','phdYearVerified','evidenceUrl','evidenceNote']}
save()
