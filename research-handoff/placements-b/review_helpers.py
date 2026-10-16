import json
from pathlib import Path

base=Path(__file__).resolve().parent
faculty=json.loads((base.parents[1]/'data/faculty.json').read_text(encoding='utf-8'))['records'][1::3]
assigned={f['name']:f for f in faculty}
records=json.loads((base/'results.json').read_text(encoding='utf-8'))

def save(r):
    records[:]=[x for x in records if x['facultyId']!=r['facultyId']]+[r]
    (base/'results.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def cv(name,employer,year,phd,position,note,category='tenure-track',url=None):
    f=assigned[name]
    if not url: url=(base/'cvs'/f"{f['id']}.txt").read_text(encoding='utf-8').splitlines()[0][8:]
    r=dict(facultyId=f['id'],name=name,status='verified',checkedAt='2026-10-16',sources=[dict(url=url,title=name+' official profile',notes=note)],reason='University profile or academic biography establishes the post-doctoral chronology.',employer=employer,position=position,placementYear=year,category=category,phdYearVerified=phd,evidenceNote=note,evidenceUrl=url)
    if phd and f.get('phdYear') and phd!=f['phdYear']: r['phdYearResolution']=f"Source explicitly dates the doctorate to {phd}, correcting imported {f['phdYear']}."
    save(r)

def unresolved(name,note,url=None):
    f=assigned[name]
    if not url: url=(base/'cvs'/f"{f['id']}.txt").read_text(encoding='utf-8').splitlines()[0][8:]
    save(dict(facultyId=f['id'],name=name,status='unresolved',checkedAt='2026-10-16',sources=[dict(url=url,title=name+' official profile',notes=note)],reason=note))



def profile_unresolved(name,note):
    f=assigned[name]
    d=json.loads((base/'documents'/f"{f['id']}.json").read_text('utf-8'))
    save(dict(facultyId=f['id'],name=name,status='unresolved',checkedAt='2026-10-16',reason=note,sources=[dict(url=x['url'],title=name+' academic profile',notes=note) for x in d['documents']]))
