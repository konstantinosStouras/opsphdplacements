"""Visitor-readable evidence paraphrases; unchanged source observations stay in handoff."""
import json,pathlib,copy
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf8'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
g=read('data/graduate-lists.json');h=read('data/employment-histories.json')
notes={
'Christopher George McCord':'Princeton biography reports MIT Operations Research PhD followed by five years in quantitative trading and a spring 2025 visiting lectureship. This matches the July 2019–May 2024 Jump Trading profile history; exact award day unknown.',
'Konstantina Mellou':'MIT graduation announcement dated June 7, 2019 lists Konstantina Mellou among PhD graduates. It establishes graduation before the September 2019 Microsoft postdoc, without assigning the announcement date as her award date.',
'Colin Pawlowski':'Personal CV reports PhD in Operations Research in June 2019, followed by nference Translational Scientist in July–December 2019; Data Science Partnerships Lead January–June 2020; Head of Data Sciences July–November 2020; Director from November 2020. These roles are distinct from the retrospective aggregate profile title.',
'Michael Francis Beeler':'Advisor reports graduation in August 2019 and an Athanor affiliation. The profile starts Athanor in the same month, so completion-before-employment ordering remains unknown.',
'Mila Nambiar':'Advisor reports Milashini Nambiar graduated in June 2019 and was a research scientist at A*STAR IHPC. Formal September 2019 award is recorded separately; the advisor destination alone does not establish a first job.',
'Maximilien Burq':'CV dates Verily Machine Learning Data Scientist November 2018–December 2020 and senior role from January 2021; profile promotion starts November 2020. CV Stanford visit is 2016, versus profile August 2017–August 2018. Both variants remain unresolved.'}
for r in g['records']:
 if r['id'] not in read(O/'applied.json')['graduateRecordsAdded']:continue
 root=next((x for x in read(O/'root-source-observations.json') if x['name']==r['name']),None)
 if root:
  for s in r['sightings']:
   if s['sourceUrl']==root['sourceUrl'] and s['yearMeaning']=='career-observation':s['note']=notes[r['name']]
  for m in r.get('degreeMilestones',[]):
   if m['sourceUrl']==root['sourceUrl']:m['displayText']=notes[r['name']];m['evidenceNote']=notes[r['name']]
 if r['name']=='Konstantina Mellou':
  r['degreeReview']['evidenceNote']=notes[r['name']]
  r['degreeReview']['limitations']=['Individual formal award month and day unknown.','Announcement date is an upper bound on reported graduation, not an individual conferral date.','Source-bounded ORC thesis cohort, not a census.']
  for s in r['sightings']:
   if s['sourceUrl']==r['degreeReview']['sourceUrl']:s['note']=notes[r['name']]
  for s in r['firstJobReview']['sources']:
   if s['url']==r['degreeReview']['sourceUrl']:s['evidenceNote']=notes[r['name']]
 for hr in h['records']:
  if hr['id']==r['id']:
   hr['degreeReview']=copy.deepcopy(r['degreeReview'])
   if r.get('degreeMilestones'):hr['degreeMilestones']=copy.deepcopy(r['degreeMilestones'])
   if r.get('firstJobReview'):hr['firstJobAssessment']=copy.deepcopy(r['firstJobReview'])
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
dec=read(O/'decisions.json')
for d in dec:d['firstJobAssessment']=next(r for r in h['records'] if r['id']==d['id'])['firstJobAssessment']
write(O/'decisions.json',dec)
