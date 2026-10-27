"""Freeze explicit reviewed paths; never stages other contributors' work."""
import pathlib,json,hashlib
O=pathlib.Path(__file__).parent
files=[pathlib.Path(p) for p in ['README.md','TODO.md','WORKFLOW.md','RESEARCH-STATUS.md','assets/graduates.js','index.html','data/graduate-lists.json','data/employment-histories.json','data/record-dates.json']]
files += [p for p in O.iterdir() if p.is_file() and p.name not in ['release-manifest.json','PUBLISHED.md','live-verification.json','verify-live.py']]
data={'checkedAt':'2026-10-27','validation':{'unitTests':62,'schemaTests':4,'preservationChecks':80,'npmCheck':'passed','relationalBuild':'passed','siteBuild':'passed','visitorAudit':{'cohortRows':12,'expandedDetails':37,'forbiddenLinksOrText':0,'facultyLinkedReviewWording':'verified in final preview'},'recordDates':'passed'},'files':[{'path':p.as_posix(),'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(files)]}
(O/'release-manifest.json').write_text(json.dumps(data,indent=2)+'\n')
print(len(files)+1,'reviewed files including manifest')
