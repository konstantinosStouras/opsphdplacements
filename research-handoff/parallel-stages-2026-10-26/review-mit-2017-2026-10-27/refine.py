"""Applied presentation normalization; do not replay over later evidence."""
import json,pathlib
O=pathlib.Path(__file__).parent
p=pathlib.Path('data/employment-histories.json');h=json.loads(p.read_text(encoding='utf8'))
r=next(x for x in h['records'] if x['name']=='Wang Chi Cheung')
r['remainingUnknowns']=['Own CV reports February2017 PhD; adviser reports August2016 graduation. Actual completion relative to September2016 IHPC employment is unresolved; NUS2019 is a later appointment.','Open-ended CV appointment does not establish continuous employment through today.']
r['parkedCase']['reason']=r['remainingUnknowns'][0]
for r in h['records']:
 if r['id'] in json.loads((O/'applied.json').read_text())['newPartialHistoryIds'] and 'linkedin.com/' in (r.get('profileUrl') or ''):
  r['coverageNote']='Entire accessible Experience section read individually in Chrome, including Show all when offered; real-world career remains partial.'
  for j in r['jobs']+r['otherEmploymentMentions']:
   if j.get('sourceSection')=='Entire accessible Experience detail view':j['sourceSection']='Entire accessible Experience section'
p.write_text(json.dumps(h,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
