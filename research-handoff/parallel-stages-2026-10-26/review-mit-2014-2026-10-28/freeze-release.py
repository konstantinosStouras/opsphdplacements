import pathlib,json,hashlib
O=pathlib.Path(__file__).parent
files=[pathlib.Path(p) for p in ['README.md','TODO.md','RESEARCH-STATUS.md','index.html','data/graduate-lists.json','data/employment-histories.json','data/record-dates.json']]
files += [p for p in O.iterdir() if p.is_file() and p.name not in ['release-manifest.json','PUBLISHED.md','live-verification.json','verify-live.py']]
data={'checkedAt':'2026-10-28','files':[{'path':p.as_posix(),'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(files)]}
(O/'release-manifest.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
print(len(files),'files frozen')
