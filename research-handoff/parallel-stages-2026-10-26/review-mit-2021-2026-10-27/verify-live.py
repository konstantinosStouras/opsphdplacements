import json,pathlib,urllib.request,datetime
out=pathlib.Path(__file__).parent
read=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
applied=read(out/'applied.json');checks={}
for file,ids in [('graduate-lists',applied['graduateRecordsAdded']),('employment-histories',applied['newPartialHistoryIds'])]:
    url='https://www.stouras.com/opsphdplacements/data/'+file+'.json?release=0c926b6'
    with urllib.request.urlopen(url,timeout=60) as response:remote=json.load(response)
    local=read('data/'+file+'.json'); lr={r['id']:r for r in local['records']}; rr={r['id']:r for r in remote['records']}
    for identity in ids:assert rr.get(identity)==lr[identity],identity
    checks[file]={'exactPublishedRecords':len(ids),'totalRecords':len(rr),'url':url}
    if file=='graduate-lists':assert remote['metadata']['verifiedGraduateFirstJobs']==21
receipt={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':'0c926b6bddac3fc6f5f717dfd59bf7db69ab4f7e','checks':checks,'verifiedGraduateFirstJobs':21}
(out/'live-data-verification.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt))

