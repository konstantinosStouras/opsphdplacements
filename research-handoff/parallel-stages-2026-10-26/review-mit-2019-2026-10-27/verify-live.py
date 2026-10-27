"""Read-only comparison of deployed reviewed records; no research scraping."""
import json,pathlib,urllib.request,hashlib,re
O=pathlib.Path(__file__).parent
base='https://www.stouras.com/opsphdplacements/'
release='ccbfaac57c57c06ab8c87d3da1df152f0d90e10c'
result={'release':release,'checkedAt':'2026-10-27','checks':[]}
for file in ['data/graduate-lists.json','data/employment-histories.json','assets/graduates.js']:
 with urllib.request.urlopen(base+file+'?release='+release,timeout=45) as response:raw=response.read()
 local=pathlib.Path(file).read_bytes()
 same=json.loads(raw)==json.loads(local) if file.endswith('.json') else re.sub(rb'\?v=[a-f0-9]+',b'',raw.replace(b'\r\n',b'\n'))==local.replace(b'\r\n',b'\n')
 assert same,file+' differs on live site'
 result['checks'].append({'path':file,'matchesReviewedCut':True,'sha256Live':hashlib.sha256(raw).hexdigest()})
(O/'live-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
