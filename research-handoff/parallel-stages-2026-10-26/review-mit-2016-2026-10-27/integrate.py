import json,pathlib,copy,re,unicodedata,shutil
O=pathlib.Path(__file__).parent
D='2026-10-27'
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
def slug(n):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()).strip('-')
def date(v):return {'asWritten':str(v) if v else None,'year':int(v) if v else None,'month':None,'precision':'year' if v else 'unknown'}
def sight(u,n,note,meaning='career-observation'):return dict(sourceUrl=u,pageUrl=u,sourceDate=None,checkedAt=D,archive='live',name=n,yearMeaning=meaning,program='PhD Operations Research',destination=None,position=None,degree='PhD',note=note,extractedAt=D)
assert not (O/'applied.json').exists()
g=read('data/graduate-lists.json');h=read('data/employment-histories.json')
b=pathlib.Path('research/mit-2016-before');assert not b.exists();b.mkdir(parents=True)
for p in pathlib.Path('data').glob('*.json'):shutil.copy2(p,b/p.name)
people={p['name']:p for f in ['primary-a.json','primary-b.json','primary-c.json'] for p in read(O/f)['people']}
cohort=[('Iain Robert Dunning',6,'Advances in Robust and Adaptive Optimization: Algorithms, Software, and Insights'),('Paul Grigas',9,'Methods for Convex Optimization and Statistical Learning'),('Velibor V. Misic',6,'Data, Models and Decisions for Large-Scale Stochastic Optimization Problem'),('Alexander Remorov',6,'Dynamic Trading and Behavioral Finance'),('Yaron Shaposhnik',9,'Exploration vs. Exploitation: Reducing Uncertainty in Operational Problems'),('Peng Shi',6,'Prediction and Optimization in School Choice'),('He Wang',6,'Dynamic Learning and Optimization for Operations Management Problems'),('Nataly Youssef',2,'Stochastic Analysis via Robust Optimization'),('Rong Yuan',9,'Velocity-based Storage and Stowage Decisions in a Semi-automated Fulfillment System')]
orc='https://orc.mit.edu/research/phd-and-masters-theses/'
added=[];rows=[]
for n,mo,title in cohort:
 p=people[n];fid=p.get('existingFacultyId');pid=p.get('existingGraduateId') or 'grad:massachusetts-institute-of-technology:'+slug(n)+':2016'
 sources=p.get('sources') or [p['sourceUrl']]
 ss=[{'url':s,'evidence':p.get('degreeEvidence','Opened professional source.')} if isinstance(s,str) else {'url':s['url'],'evidence':s.get('evidence') or '; '.join(s.get('observations',[]))} for s in sources]
 if n=='Rong Yuan':ss=ss[::-1]
 r=next((x for x in g['records'] if x['id']==pid),None)
 if r is None:r={'id':pid,'sightings':[]};g['records'].append(r);added.append(pid)
 r.update(institution='Massachusetts Institute of Technology',name=n,listedYear=2016,field='operations',programId='mit-operations-research-phd',facultyId=fid,match='reviewed-primary-source-identity' if fid else None,matchLeads=[],careerOwner='stage-2' if fid else 'stage-4',identityReview={'status':'reviewed','checkedAt':D,'evidence':p.get('identityEvidence') or p.get('identity') or 'Named MIT ORC thesis reconciled with individual doctoral and professional primary evidence.'})
 r['degreeReview']={'status':'reported-doctorate','period':date(2016),'awardDay':None,'field':'Operations Research','checkedAt':D,'sourceUrl':ss[0]['url'],'evidenceNote':p.get('degreeEvidence') or ss[0]['evidence'],'dateEvidenceMeaning':'Source-reported doctorate; thesis, study endpoints and formal conferral remain separate.','limitations':['Formal award month and day independently unverified.','ORC thesis-year list is source-bounded, not a graduating-class census.']}
 r['sightings'].append(sight(orc,n,title+'; thesis listing '+str(mo)+'/2016.','thesis'))
 r['sightings'] += [sight(s['url'],n,s['evidence']) for s in ss]
 r['degreeMilestones']=[{'kind':'thesis-date','displayText':'ORC thesis list: '+str(mo)+'/2016.','sourceUrl':orc,'checkedAt':D,'evidenceNote':title,'limitation':'Thesis timing is not necessarily completion or formal conferral.','formalAwardDateAssigned':False}]
 if n=='Alexander Remorov':r['degreeMilestones'].append({'kind':'reported-completion','displayText':'First-person Waterloo interview: completed PhD May2016.','sourceUrl':ss[0]['url'],'checkedAt':D,'evidenceNote':ss[0]['evidence'],'limitation':'Separate from June thesis listing; not independent formal award-day verification.','formalAwardDateAssigned':False})
 if n=='Paul Grigas':r['degreeReview']['limitations'].append('August2016 welcome reports doctorate received before fall appointment; ORC lists September thesis. These are different source milestones, not an assigned award date.')
 if n=='Rong Yuan':r['identityReview']['evidence']='Exact adviser-linked dissertation matches 2016 ORC title and author. Existing stable unknown-year ID retained; historical Stitch Fix affiliation preserved alongside newly observed TikTok, neither labelled first employment.'
 rows.append(r)
new=[]
for path in sorted(O.glob('*.history-proposal.json')):
 r=read(path);pid=r.pop('personId');r.pop('integrationStatus',None);r.update(id=pid,reviewStatus='partial',careerComplete=False)
 assert not any(x['id']==pid for x in h['records']),pid
 gr=next(x for x in rows if x['id']==pid or x.get('facultyId')==pid)
 r.pop('sourceObservations',None);r.pop('existingHistoryReview',None)
 r['identityBasis']=gr['identityReview']['evidence']
 r['coverageNote']='Accessible primary career sources reviewed; real-world career remains partial. No LinkedIn profile read in this review because Chrome disconnected.'
 for m in r.get('otherEmploymentMentions',[]):
  if 'observation' in m:
   obs=m.pop('observation');m.update(employerAsWritten=obs.get('employer') if isinstance(obs,dict) else None,titleAsWritten=obs.get('title','Supporting professional observation') if isinstance(obs,dict) else 'Supporting professional observation',evidenceNote=json.dumps(obs,ensure_ascii=False) if isinstance(obs,dict) else obs)
  m.setdefault('evidenceNote','Supporting source observation.')
 if gr['name']=='Nataly Youssef':
  for m in r['otherEmploymentMentions']:m['sourceUrl']='https://www.conference-board.org/bio/pdfbio.cfm?bioid=23152'
 keep=[]
 for j in r['jobs']:
  if any(w in (j.get('titleAsWritten') or '').lower() for w in ['intern','research assistant','teaching assistant','summer associate','guest lecturer','module instructor']):r['otherEmploymentMentions'].append(j)
  else:keep.append(j)
 r['jobs']=keep
 r['recordIds']=[gr['id']] if gr.get('facultyId') else [];r['degreeReview']=copy.deepcopy(gr['degreeReview']);r['degreeMilestones']=copy.deepcopy(gr['degreeMilestones']);r['firstJobAssessment']=None
 if gr['name']=='Alexander Remorov':
  p=people[gr['name']];first={'status':'verified','definition':'Earliest documented new appointment after doctorate completion','employer':'BlackRock','title':'Quantitative Researcher','start':date(None),'sector':'industry','appointmentType':'industry','checkedAt':D,'reason':'First-person university interview explicitly reports completed doctorate May2016 and working at BlackRock as Quantitative Researcher since completion. CV corroborates employer from2016; later VP rank is not assigned to first job.','sources':[{'url':s['url'],'checkedAt':D,'evidenceNote':'; '.join(s['observations'])} for s in p['sources']],'sequenceEvidence':{'kind':'explicit-next-position','sourceUrl':p['sources'][0]['url']},'degreeBoundary':'Explicit completion-before-BlackRock narrative; start month and formal conferral day unknown.','limitations':['First-job start month unverified.','2020 CV is historical; subsequent career remains incomplete.']}
  r['firstJobAssessment']=copy.deepcopy(first);gr['firstJobReview']=first
 h['records'].append(r);new.append(pid)
assert len(new)==9,len(new)
m=g['metadata'];m.update(updatedAt=D,records=len(g['records']),sightings=sum(len(x['sightings']) for x in g['records']),linkedToPeople=sum(bool(x.get('facultyId')) for x in g['records']),verifiedGraduateFirstJobs=sum(bool(x.get('firstJobReview')) and not x.get('facultyId') for x in g['records']))
m['byField']={k:sum(x['field']==k for x in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for x in g['records'] for s in x['sightings']) for k in m['byArchive']}
for c in m['coverage']:
 if c['institution']=='Massachusetts Institute of Technology' and c.get('listedYear') in [2016,None]:
  rr=[x for x in g['records'] if x['institution']==c['institution'] and x.get('listedYear')==c.get('listedYear')];c.update(names=len(rr),linked=sum(bool(x.get('facultyId')) for x in rr),pages=list(dict.fromkeys(s['pageUrl'] for x in rr for s in x['sightings'])),rosterStatus='partial')
write(O/'cohort-observation.json',{'sourceUrl':orc,'checkedAt':D,'access':'Root individually read Chrome PhD2016 accordion, excluding masters.','records':cohort})
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
write(O/'applied.json',{'graduateRecordsAdded':added,'graduateRecordsUpdated':['grad:massachusetts-institute-of-technology:rong-yuan:unknown'],'newPartialHistoryIds':new,'verifiedFirstJobIds':[x['id'] for x in rows if x.get('firstJobReview')],'newStructuredRoles':sum(len(x['jobs']) for x in h['records'] if x['id'] in new),'newSupportingMentions':sum(len(x.get('otherEmploymentMentions',[])) for x in h['records'] if x['id'] in new)})
print('Integrated 8 new graduates, Rong correction, 9 histories, Remorov first job.')
