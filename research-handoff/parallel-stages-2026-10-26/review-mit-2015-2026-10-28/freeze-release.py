import pathlib,json,hashlib
O=pathlib.Path('research-handoff/parallel-stages-2026-10-26/review-mit-2015-2026-10-28')
files=[pathlib.Path(p) for p in ['README.md','TODO.md','WORKFLOW.md','RESEARCH-STATUS.md','index.html','data/graduate-lists.json','data/employment-histories.json','data/record-dates.json']]
files += [p for p in O.iterdir() if p.is_file() and p.name not in ['release-manifest.json','PUBLISHED.md','live-verification.json','verify-live.py']]
for p in files:
 if p.suffix=='.py':p.write_text(p.read_text(encoding='utf-8-sig').rstrip()+'\n',encoding='utf8')
data={'checkedAt':'2026-10-28','files':[{'path':p.as_posix(),'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(files)]}
(O/'release-manifest.json').write_text(json.dumps(data,indent=2)+'\n')
print(len(files),'files frozen')
