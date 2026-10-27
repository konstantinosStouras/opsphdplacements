"""Read public MIT2022 publication state; never change public records."""
import json,datetime,urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
p=Path(__file__).resolve().parent
co=json.loads((p/'mit-or-2022/cohort-proposal.json').read_text(encoding='utf-8'))
ids={r['proposedGraduateId'] for r in co['records']}
base='https://www.stouras.com/opsphdplacements/'
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
def read(name):
 with urllib.request.urlopen(base+'data/'+name+'?stage4check='+stamp,timeout=40) as response:d=json.load(response)
 return d if isinstance(d,list) else d['records']
with ThreadPoolExecutor(max_workers=2) as pool: gs,hs=list(pool.map(read,['graduate-lists.json','employment-histories.json']))
g=[r for r in gs if r['id'] in ids];h=[r for r in hs if r['id'] in ids]
proof={'checkedAt':stamp,'siteUrl':base,'graduateRecordsPresent':len(g),'historyRecordsPresent':len(h),'verifiedGraduateFirstEmployers':sum((r.get('firstJobReview') or {}).get('status')=='verified' for r in g),'records':[{'id':r['id'],'name':r['name'],'degreeReview':r.get('degreeReview'),'firstJobReview':r.get('firstJobReview')} for r in g],'historyStates':[{'id':r['id'],'name':r['name'],'jobs':len(r['jobs']),'firstJobAssessment':r.get('firstJobAssessment'),'careerComplete':r.get('careerComplete')} for r in h],'method':'Independent fresh public-data reads. Retrieval time does not refresh original fact/source checkedAt. Does not prove visitor-interface audit.'}
(p/'live-mit-2022-publication-check-2026-10-27.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in proof.items() if k not in ['records','historyStates']}))
