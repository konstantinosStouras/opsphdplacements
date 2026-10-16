import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
faculty=json.loads((root/'data/faculty.json').read_text(encoding='utf-8-sig'))['records']
shard={p['name']:p for i,p in enumerate(faculty) if i%3==0}
out=root/'research/placements-a/results.json'
records=json.loads(out.read_text(encoding="utf-8")) if out.exists() else []
def add(name,employer,year,url,title,note='',position=None,category='unknown',start=None):
 p=shard[name]
 row=dict(facultyId=p['id'],name=name,status='verified',checkedAt='2026-10-16',employer=employer,position=position,placementYear=start,category=category,phdYearVerified=year,evidenceNote=note or f'The doctoral program explicitly identifies {employer} as the initial placement for the {year} graduate. The exact appointment start date and job title are not stated.',evidenceUrl=url,sources=[dict(url=url,title=title,notes='Official doctoral-program placement record; initial destination distinguished from later affiliation.')],reason='Explicit initial-placement record published by the degree-granting institution.')
 records[:]=[r for r in records if r['facultyId']!=p['id']]
 records.append(row)

def addcv(id,emp,year,pos,cat,note):
 p=next(p for p in faculty if p['id']==id)
 doc=next(d for d in json.loads((root/f'research/placements-a/documents/{id}.json').read_text(encoding='utf-8'))['documents'] if d.get('kind')=='pdf')
 add(p['name'],emp,year,doc['url'],p['name']+' — Curriculum Vitae',note=note,position=pos,category=cat,start=year)
 records[-1]['reason']='Faculty CV degree and employment chronology establishes the first post-PhD appointment.'
 records[-1]['sources'][0]['notes']='Faculty CV education and employment chronology reviewed.'
 if p['phdYear']!=year:records[-1]['phdYearResolution']='The faculty CV explicitly dates the completed doctorate to '+str(year)+'. Original imported value retained separately.'
def unresolvedcv(id,reason):
 p=next(p for p in faculty if p['id']==id)
 doc=next(d for d in json.loads((root/f'research/placements-a/documents/{id}.json').read_text(encoding='utf-8'))['documents'] if d.get('kind')=='pdf')
 records[:]=[r for r in records if r['facultyId']!=id]
 records.append(dict(facultyId=id,name=p['name'],status='unresolved',checkedAt='2026-10-16',reason=reason,sources=[dict(url=doc['url'],title=p['name']+' — Curriculum Vitae',notes='Education and employment chronology reviewed; requires further clarification.')]))
def save():out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8');print(len(records))

def unresolvedhtml(id,reason):
 p=next(p for p in faculty if p['id']==id)
 docs=json.loads((root/f'research/placements-a/documents/{id}.json').read_text(encoding='utf-8'))['documents']
 records[:]=[r for r in records if r['facultyId']!=id]
 records.append(dict(facultyId=id,name=p['name'],status='unresolved',checkedAt='2026-10-16',reason=reason,sources=[dict(url=d['url'],title=p['name']+' — public academic profile',notes='Professional biography and degree information reviewed for first-job evidence.') for d in docs if d.get('kind')=='html']))

def addhtml(id,emp,year,pos,cat,note,start=None):
 p=next(p for p in faculty if p['id']==id)
 doc=next(d for d in json.loads((root/f'research/placements-a/documents/{id}.json').read_text(encoding='utf-8'))['documents'] if d.get('kind')=='html')
 add(p['name'],emp,year,doc['url'],p['name']+' — official faculty profile',note=note,position=pos,category=cat,start=start if start is not None else year)
 records[-1]['reason']='Official faculty profile degree and employment chronology establishes the initial appointment.'
 records[-1]['sources'][0]['notes']='Dated faculty education and employment history reviewed.'
 if p['phdYear']!=year:records[-1]['phdYearResolution']='The official faculty profile explicitly dates the completed doctorate to '+str(year)+'. Original imported value retained separately.'
