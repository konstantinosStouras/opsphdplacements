import json,pathlib
out=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
def write(p,v):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
d=read('data/employment-histories.json'); ids=set(read(out/'applied.json')['newPartialHistoryIds'])
g=read('data/graduate-lists.json')
for r in d['records']:
    if r['id'] not in ids:continue
    for j in r.get('otherEmploymentMentions',[]):
        j.setdefault('evidenceNote',j.get('note',''))
        j.setdefault('employerAsWritten',j.get('organizationAsWritten',j.get('organization')))
        j.setdefault('titleAsWritten',j.get('roleAsWritten',j.get('role')))
        if j.get('classificationNote') and j['classificationNote'] not in j['evidenceNote']:j['evidenceNote']=j['classificationNote']+' '+j['evidenceNote']
    if r.get('firstJobAssessment'):
        v=r['firstJobAssessment'];v['reason']=v['reason'].replace('Root read the complete announcement in Chrome. ','')
        v['degreeBoundary']='Formal degree-recipient dates are recorded separately above. Where completion or an explicit initial-placement statement establishes the sequence, it does not supply an exact award or appointment day.'
        next(x for x in g['records'] if x['id']==r['id'])['firstJobReview']=v
write('data/employment-histories.json',d)
pathlib.Path('data/graduate-lists.json').write_text(json.dumps(g,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
for filename in pathlib.Path('research/mit-2022-2023-before').glob('*.json'):
    if filename.stem in ['graduate-lists','employment-histories','record-dates']:continue
    assert read(filename)==read(pathlib.Path('data')/filename.name),filename.name
report={}
for name in ['graduate-lists','employment-histories']:
    before=read('research/mit-2022-2023-before/'+name+'.json');now=read('data/'+name+'.json');new={r['id']:r for r in now['records']}
    for r in before['records']:assert r==new[r['id']],r['id']
    report[name]={'unchangedOlderRecords':len(before['records']),'addedRecords':len(new)-len(before['records'])}
report['otherPublicDatasets']='Unchanged, except expected stamp ledger updates';write(out/'public-preservation-audit.json',report)
