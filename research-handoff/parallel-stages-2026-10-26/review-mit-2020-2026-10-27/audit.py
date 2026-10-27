import json,pathlib,hashlib
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf8'))
result={}
for p in pathlib.Path('research/mit-2020-before').glob('*.json'):
 now=read(pathlib.Path('data')/p.name);old=read(p)
 if p.name in ['graduate-lists.json','employment-histories.json']:
  current={r['id']:r for r in now['records']};assert all(current[r['id']]==r for r in old['records']);result[p.name]={'olderRecordsUnchanged':len(old['records']),'added':len(now['records'])-len(old['records'])}
 elif p.name!='record-dates.json':assert now==old,p.name
result['unrelatedPublicDatasetsUnchanged']=True
(O/'preservation-audit.json').write_text(json.dumps(result,indent=2)+'\n')
files=[p for p in O.iterdir() if p.is_file() and p.suffix in ['.json','.py','.md'] and p.name!='release-manifest.json']
(O/'release-manifest.json').write_text(json.dumps([{'path':p.name,'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(files)],indent=2)+'\n')
print(result)
