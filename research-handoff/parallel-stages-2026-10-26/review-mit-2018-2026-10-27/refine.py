"""Prepublication evidence normalization; root-only, bounded to new MIT2018 records."""
import json,pathlib
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf8'))
def write(p,x):pathlib.Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
h=read('data/employment-histories.json');a=read(O/'applied.json');g=read('data/graduate-lists.json')
for gr in g['records']:
 if gr['id'] not in a['graduateRecordsAdded']:continue
 for m in gr.get('degreeMilestones',[]):m.setdefault('limitation','Source-reported milestone or study period; formal conferral remains independently unverified.')
for r in h['records']:
 if r['id'] not in a['newPartialHistoryIds']:continue
 gr=next(x for x in g['records'] if x['id']==r['id'])
 if gr.get('degreeMilestones'):r['degreeMilestones']=gr['degreeMilestones']
 for m in r.get('otherEmploymentMentions',[]):
  if r['name']=='Joseph Andrew Huchette' and not m.get('sourceUrl'):m['sourceUrl']='https://www.joehuchette.com/files/cv.pdf';m['titleAsWritten']='Academic and software service'
  if r['name']=='Andrew A. Li' and m.get('title'):
   m['titleAsWritten']=m['title'];m['employerAsWritten']='Carnegie Mellon University';m['evidenceNote']='CV service/teaching observation: '+m['title']+'; '+(m.get('dates') or 'dates unknown')+'. '+m.get('limitation','')
   if m.get('employersAsMentioned'):m['evidenceNote']+=' Teaching clients: '+', '.join(m['employersAsMentioned'])+'. Not separate employers.'
 if r['name']=='Joseph Andrew Huchette':r['parkedCase']['reason']='Google postdoc July2018 follows June study endpoint, but explicit actual completion boundary is not established.'
 if r['name']=='Andrew A. Li':r['parkedCase']['reason']='CMU start and degree both2018; actual completion-before-appointment order unknown.'
 if r.get('parkedCase') and r['parkedCase']['reason'] not in r['remainingUnknowns']:r['remainingUnknowns'].insert(0,r['parkedCase']['reason'])
write('data/employment-histories.json',h)
pathlib.Path('data/graduate-lists.json').write_text(json.dumps(g,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
write(O/'decisions.json',[dict(id=r['id'],firstJobAssessment=r.get('firstJobAssessment'),remainingUnknowns=r['remainingUnknowns']) for r in h['records'] if r['id'] in a['newPartialHistoryIds']])
