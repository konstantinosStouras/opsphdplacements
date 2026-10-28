import json,pathlib
R=pathlib.Path(__file__).resolve().parents[3]
O=pathlib.Path(__file__).resolve().parent
ids=json.loads((O/'applied.json').read_text(encoding='utf8'))['newPartialHistoryIds']
p=R/'data/employment-histories.json';d=json.loads(p.read_text(encoding='utf8'))
for r in d['records']:
 if r['id'] not in ids:continue
 for j in r['jobs']:
  for k in ['start','end']:
   if j[k]['precision']=='present':j[k]['precision']='unknown'
 if 'elmachtoub' in r['id']:r['firstJobAssessment']['title']='Postdoctoral Researcher'
 if 'ngai-hang-zachary-leung' in r['id']:
  r['jobs'][0]['evidenceNote']='Individually reviewed LinkedIn reports September 2014–July 2015. Supervisor CV corroborates 2014–15; official CityU biography explicitly places this postdoc after the PhD.'
  r['jobs'][1]['evidenceNote']='Individually reviewed LinkedIn reports August 2015–August 2022. Official CityU interview corroborates the 2015 start; current official adjunct title has an unknown start date.'
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=R/'data/graduate-lists.json';d=json.loads(p.read_text(encoding='utf8'))
next(r for r in d['records'] if r['id']==ids[1])['firstJobReview']['title']='Postdoctoral Researcher'
p.write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
print('Normalized present date precision and source-written IBM title.')
