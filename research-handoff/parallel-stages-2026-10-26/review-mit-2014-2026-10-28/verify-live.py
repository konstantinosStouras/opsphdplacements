"""Read-only own-site release verification, not source research scraping."""
import json,pathlib,urllib.request,hashlib,sys
O=pathlib.Path(__file__).parent
release=sys.argv[1]
result={'release':release,'checkedAt':'2026-10-28','checks':[]}
for file in ['data/graduate-lists.json','data/employment-histories.json','data/record-dates.json']:
 with urllib.request.urlopen('https://www.stouras.com/opsphdplacements/'+file+'?release='+release,timeout=45) as response:raw=response.read()
 assert json.loads(raw)==json.loads(pathlib.Path(file).read_bytes()),file+' differs on live site'
 result['checks'].append({'path':file,'matchesReviewedCut':True,'sha256Live':hashlib.sha256(raw).hexdigest()})
(O/'live-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print('All three deployed datasets exactly match reviewed release.')
