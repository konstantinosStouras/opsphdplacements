import json,pathlib
p=pathlib.Path('research/placements-c'); by={r['name']:r for r in json.loads((p/'assigned.json').read_text(encoding='utf-8-sig'))}; out=json.loads((p/'results.json').read_text(encoding='utf-8'))
def add(name,employer,year,url,title,note=None):
 r=by[name]; out.append(dict(facultyId=r['id'],name=name,status='verified',checkedAt='2026-10-16',sources=[dict(url=url,title=title,notes='University doctoral placement list.')],reason='Graduating institution identifies doctoral placement.',employer=employer,position=None,placementYear=None,category='unknown',phdYearVerified=year,evidenceNote=note or 'Listed in the '+str(year)+' doctoral cohort with this placement; position and employment start date are not stated.',evidenceUrl=url))
def save():
 for r in out:
  if r['status']=='verified' and r['phdYearVerified'] is not None and r['phdYearVerified']!=by[r['name']]['phdYear'] and not r.get('phdYearResolution'):
   r['phdYearResolution']='Imported year '+str(by[r['name']]['phdYear'])+' differs from the primary source year '+str(r['phdYearVerified'])+'. Primary evidence: '+r['evidenceNote']
 ids=[r['facultyId'] for r in out]; assert len(ids)==len(set(ids)); (p/'results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8'); print(len(out))

def cv(id,employer,phdyear,pos,category,note,start=None,folder='cv-text'):
 c=json.loads((p/folder/f'{id}.json').read_text(encoding='utf8'));add(c['name'],employer,phdyear,c['url'],c['name']+' curriculum vitae',note);out[-1].update(position=pos,placementYear=start if start is not None else phdyear,category=category,reason='CV education and employment chronology establishes earliest post-PhD appointment.');out[-1]['sources'][0]['notes']='Faculty CV with education and appointment chronology.'
def unresolved(id,note,folder='cv-text'):
 c=json.loads((p/folder/f'{id}.json').read_text(encoding='utf8'));out.append(dict(facultyId=id,name=c['name'],status='unresolved',checkedAt='2026-10-16',sources=[dict(url=c['url'],title=c['name']+' curriculum vitae',notes=note)],reason=note))

def bio_unresolved(id,note):
 c=json.loads((p/'bio-text'/f'{id}.json').read_text(encoding='utf8'))
 out.append(dict(facultyId=id,name=c['name'],status='unresolved',checkedAt='2026-10-16',sources=[dict(url=s['url'],title=c['name']+' '+s['label'],notes=('Fetch failed: '+s['error']) if s.get('error') else note) for s in c['sources']],reason=note))

def bio(id,employer,phdyear,position,category,note,start=None,source=0):
 c=json.loads((p/'bio-text'/f'{id}.json').read_text(encoding='utf8'));s=c['sources'][source]
 add(c['name'],employer,phdyear,s['url'],c['name']+' academic biography',note)
 out[-1].update(position=position,category=category,placementYear=start,reason='Primary academic biography explicitly establishes degree and first employment chronology.')
 out[-1]['sources'][0]['notes']='Institutional or personal academic biography with career chronology.'
