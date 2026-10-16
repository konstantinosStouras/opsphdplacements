from helpers import *
old={r['name']:r.copy() for r in records}
addcv('omlist-6d32a173d5776c3c','Yale University',2019,'Assistant Professor','tenure-track','CV dates Wharton doctorate 2014–2019 and begins academic employment with Yale assistant professorship in July 2019.')
addcv('omlist-5b0972d2f618937f','University of Pittsburgh',2017,'Assistant Professor','tenure-track','CV dates Duke doctorate to 2017 and Pittsburgh assistant professorship from July 2017. Its professional experience section lists Oracle internship during the PhD and consulting in 2024, neither preceding the initial post-PhD appointment.')
addcv('omlist-69e87d84236de23d','Purdue University',2023,'Assistant Professor of Management','tenure-track','CV lists Duke doctorate 2017–2023 and Purdue assistant professorship beginning August 2023 as the first academic appointment; official Purdue biography describes joining after his Duke doctorate.')

def revise(name,url,title,note,year,pos,emp=None,cat='tenure-track'):
 r=next(x for x in records if x['name']==name)
 r.update(evidenceUrl=url,evidenceNote=note,reason='Dated degree and employment chronology corroborates the reported placement.',position=pos,placementYear=year,category=cat)
 if emp:r['employer']=emp
 r['sources'].insert(0,dict(url=url,title=title,notes=note))

revise('Serasu Duran','https://profiles.ucalgary.ca/sites/default/files/2021-11/serasu-duran-cv.pdf','Serasu Duran — academic CV','CV lists Northwestern PhD 2018 and Calgary assistant professorship from 2018. Calgary contemporaneous hiring announcement explicitly describes joining from the newly completed doctorate, effective July 1, 2018.',2018,'Assistant Professor')
next(x for x in records if x['name']=='Serasu Duran')['sources'].append(dict(url='https://haskayne.ucalgary.ca/sites/default/files/Research/Research%20Round-up/2018-Apr-Jun-Research-Round-up.pdf',title='Haskayne Research Round-up April–June 2018',notes='Page 1 identifies Duran as a July 1, 2018 new assistant professor joining from her recently completed Kellogg PhD.'))
revise('Fan Zhou','https://myweb.cuhk.edu.cn/zhoufan/Home/Index','Fan Zhou — official CUHK Shenzhen profile','Official biography dates Michigan doctorate to 2025 and employment chronology lists CUHK Shenzhen assistant professorship from 2025. Amazon research scientist internship explicitly occurred during doctoral study.',2025,'Assistant Professor','The Chinese University of Hong Kong, Shenzhen')
revise('Yangzi Jiang','https://myweb.cuhk.edu.cn/yangzijiang','Yangzi Jiang — official CUHK Shenzhen profile','Official employment chronology lists assistant professorship at CUHK Shenzhen from 2022, Alibaba internship in 2019 and consulting in 2013. Kellogg identifies her in the 2022 graduating placement cohort; earlier roles predate completion.',2022,'Assistant Professor')
revise('Xavier Warnes','https://xavierwarnes.com/assets/CV_Xavier_Warnes_2025_July.pdf','Xavier Warnes — academic CV','CV lists Stanford PhD 2015–2021, Stanford Woods Institute postdoctoral scholarship 2021–2024, and Indiana assistant professorship from 2024.',2021,'Postdoctoral Scholar',cat='postdoc')
revise('David Almog','https://drive.google.com/file/d/16JZrOqwqwN4CxT4rf95VTQg9E7IzVa5C/view?usp=sharing','David Almog — academic CV','CV explicitly lists Kellogg PhD 2026 and Harvard assistant professorship from 2026 as its first employment appointment. Doctoral teaching/research assistant roles are separately listed before completion.',2026,'Assistant Professor of Business Administration')

audit=[]
for name in ['Nitin Bakshi','Hakjin Chung','Alys Liang','Jiankun Sun']:
 r=next(x for x in records if x['name']==name)
 prior=r.copy()
 reason=f"The program placement table reports {r['employer']} for the {r['phdYearVerified']} cohort, but does not explicitly establish first employment across sectors. Reviewed profile information does not provide a complete dated initial-job chronology; the placement therefore needs corroboration before publication as the first post-PhD job."
 if name=='Jiankun Sun':reason+=' Durham seminar biography confirms joining Imperial in 2019, but does not exclude an earlier short appointment.'
 sources=r['sources'][:]
 for s in sources:s['notes']='Program-reported placement retained as a lead; not sufficient alone to establish first post-PhD employment.'
 docs=json.loads((root/f"research/placements-a/documents/{r['facultyId']}.json").read_text(encoding='utf8'))['documents']
 for d in docs:
  if d.get('kind')=='html' and d.get('text'):sources.append(dict(url=d['url'],title=name+' — professional profile',notes='Reviewed; does not establish complete first-job chronology.'))
 if name=='Jiankun Sun':sources.append(dict(url='https://operations.webspace.durham.ac.uk/seminar_20240308/',title='Durham Operations seminar biography — Jiankun Sun',notes='Confirms Imperial joining year 2019, but not a complete employment chronology.'))
 r.clear();r.update(facultyId=prior['facultyId'],name=name,status='unresolved',checkedAt='2026-10-16',reason=reason,sources=sources)
 audit.append(dict(name=name,facultyId=prior['facultyId'],previousReportedPlacement=prior,decision='unresolved pending cross-sector chronology'))
for r in records:
 if r.get('evidenceUrl') and r['name'] in old and r['evidenceUrl']!=old[r['name']].get('evidenceUrl'):
  existing={s['url'] for s in r['sources']}
  r['sources'].extend(s for s in old[r['name']]['sources'] if s['url'] not in existing)
save()
(root/'research/placements-a/table-audit.json').write_text(json.dumps(dict(checkedAt='2026-10-16',downgraded=audit,notes='Generic Wharton/Kellogg/Ross/Stanford tables reviewed. CVs/profile employment chronology corroborated all other A-shard generic-table entries; both Duke first-academic placement entries corroborated by complete CV employment history. OSU, HBS, Kelley and Yale explicitly distinguish initial placements; NUS upon-graduation wording retained. Kuang Xu belongs to C, not A.'),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
