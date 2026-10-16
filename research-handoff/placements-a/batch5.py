from helpers import *
for id,emp,year,pos,cat,note in [
('omlist-099ac7f3f49a5d73','University of New Hampshire',1993,'Assistant Professor of Management Science','tenure-track','CV education and employment chronology identifies PhD in 1993 followed by a 1993–1999 UNH assistant professorship; earlier research engineering was before doctoral study.'),
('omlist-0e5538650082a347','The University of Texas at El Paso',1995,'Assistant Professor','tenure-track','CV lists Toledo PhD in 1995 and UTEP assistant professorship 1995–1999. Prior Toledo research assistantship and lectureship occurred before completion.'),
('omlist-0e74cdae4593983b','Chinese Academy of Sciences',2011,'Postdoctoral researcher','postdoc','CV lists the PhD completed in 2011, followed by a July 2011–July 2013 postdoctoral role at AMSS, Chinese Academy of Sciences, before USTC faculty employment.')]:
 p=next(p for p in faculty if p['id']==id)
 doc=json.loads((root/f'research/placements-a/documents/{id}.json').read_text(encoding='utf-8'))['documents'][0]
 add(p['name'],emp,year,doc['url'],p['name']+' — Curriculum Vitae',note=note,position=pos,category=cat,start=year)
 records[-1]['reason']='Degree date and full chronological academic/professional appointment record in the faculty CV establish the first post-PhD role.'
for id,reason in [('omlist-02d432164604346a','CV shows KNUST lecturer employment from 2007 and senior lecturer from 2012, before the 2014 PhD. Continued employment after graduation is documented, but no distinct first post-PhD appointment can be identified without a policy on continuing pre-PhD jobs.'),('omlist-0876fde60a838ac6','CV lists PhD 2005 and a teaching/research assistant appointment at Ecole Centrale Paris from 2002–2006, spanning the degree, before Salford research employment 2006–2008. Whether the continuing role was postdoctoral employment is unclear.')]:
 p=next(p for p in faculty if p['id']==id)
 doc=json.loads((root/f'research/placements-a/documents/{id}.json').read_text(encoding='utf-8'))['documents'][0]
 records.append(dict(facultyId=id,name=p['name'],status='unresolved',checkedAt='2026-10-16',reason=reason,sources=[dict(url=doc['url'],title=p['name']+' — Curriculum Vitae',notes='Education and employment chronology reviewed; appointment spans degree completion.')]))
out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(len(records))
