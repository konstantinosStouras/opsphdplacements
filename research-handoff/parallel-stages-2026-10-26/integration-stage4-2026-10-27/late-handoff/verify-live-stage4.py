"""Read-only live checks, saving only compact publication evidence in this lane."""
import json, urllib.request, datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root=Path(__file__).resolve().parent
cohort=json.loads((root/'mit-or-2024.cohort-proposal.json').read_text(encoding='utf-8'))
ids={r['proposedGraduateId'] for r in cohort['records']}
history_ids={json.loads(p.read_text(encoding='utf-8'))['personId'] for p in root.glob('*.history-proposal.json')}
base='https://www.stouras.com/opsphdplacements/'
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
def read_public(path):
    with urllib.request.urlopen(base+path+'?stage4verify='+stamp,timeout=45) as response:
        data=json.load(response)
    return data if isinstance(data,list) else data['records']
with ThreadPoolExecutor(max_workers=2) as pool:
    graduates,histories=list(pool.map(read_public,['data/graduate-lists.json','data/employment-histories.json']))
g=[r for r in graduates if r['id'] in ids]
h=[r for r in histories if r['id'] in history_ids]
result={'checkedAt':stamp,'siteUrl':base,'verificationMethod':'Fresh read of live public graduate and employment datasets; no remote mutation.','graduateIdsExpected':len(ids),'graduateIdsPresent':len(g),'historyIdsExpected':len(history_ids),'historyIdsPresent':len(h),'histories':[{'id':r['id'],'name':r['name'],'structuredRoles':len(r.get('jobs',[])),'careerComplete':r.get('careerComplete'),'degreeMonth':r.get('commencementEvidence',{}).get('degreeMonth')} for r in h],'structuredRoles':sum(len(r.get('jobs',[])) for r in h),'allHistoriesRemainPartial':all(r.get('careerComplete') is False for r in h)}
result['liveConfirmed']=len(g)==14 and len(h)==7 and result['structuredRoles']==45 and result['allHistoriesRemainPartial']
(root/'live-publication-confirmation-2026-10-27.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
if not result['liveConfirmed']:
    raise SystemExit('Live check did not match reviewed cut')
