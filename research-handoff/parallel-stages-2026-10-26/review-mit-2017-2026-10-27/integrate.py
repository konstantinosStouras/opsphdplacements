"""Root-only, reviewed MIT2017 one-shot integration. Never replay after applied.json."""
import json,pathlib,copy,re,unicodedata,shutil,hashlib
from capture import date
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
def slug(n):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()).strip('-')
def sight(url,n,note,meaning='career-observation'):
 return dict(sourceUrl=url,pageUrl=url,sourceDate=None,checkedAt='2026-10-27',archive='live',name=n,yearMeaning=meaning,program='PhD Operations Research',destination=None,position=None,degree='PhD',note=note,extractedAt='2026-10-27')
def mention(emp,title,note,url,start=None,end=None):
 return dict(employerAsWritten=emp,titleAsWritten=title,evidenceNote=note,sourceUrl=url,checkedAt='2026-10-27',start=date(start),end=date(end))
assert not (O/'applied.json').exists()
g=read('data/graduate-lists.json');h=read('data/employment-histories.json')
backup=pathlib.Path('research/mit-2017-before');assert not backup.exists();backup.mkdir(parents=True)
for p in pathlib.Path('data').glob('*.json'):shutil.copy2(p,backup/p.name)
people={p['name']:p for f in ['primary-a.json','primary-b.json','primary-c.json'] for p in read(O/f)['people']}
names=['Mohammed Aouad','Wang Chi Cheung','Patrick Clark Eschenfeldt','Arthur Flajolet','Swati Gupta','Nikita Korolko','Jerry Lai Kung','Miles Lubin','Christopher E. Marks','Charles Mark Thraves Cortés-Monroy','Alexander Michael Weinstein','Chiwei Yan']
titles=['Revenue Management in Face of Choice Heterogeneity','Data-driven Algorithms for Operational Problems','Multiserver Queueing Systems in Heavy Traffic','Adaptive Optimization Problems under Uncertainty with Limited Feedback','Combinatorial Structures in Online and Convex Optimization','A Robust Optimization Approach to Online Problems','An Analytics Approach to Problems in Health Care','Mixed-Integer Convex Optimization: Outer Approximation Algorithms and Modeling Power','Analytic Search Methods in Online Social Networks','New Applications in Revenue Management','From Data to Decisions in Healthcare: An Optimization Perspective','Airline Scheduling and Air Traffic Control: Incorporating Passenger and Airline Preferences and Uncertainty']
months=[9,2,2,6,6,6,6,9,6,6,6,9]
orc='https://orc.mit.edu/research/phd-and-masters-theses/'
alias='https://orc.mit.edu/student-life/resources-prospective-students/'
testimonials='https://orc.mit.edu/alumni/alumni-testimonials/'
added=[]
for n,title,month in zip(names,titles,months):
 p=people[n];pid='grad:massachusetts-institute-of-technology:'+slug(n)+':2017';fid=p.get('existingFacultyId');assert not any(x['id']==pid for x in g['records'])
 degree=p.get('degree',{});url=degree.get('sourceUrl') or p.get('sourceUrl') or (p.get('sources') or [{'url':orc}])[0]['url']
 if n=='Wang Chi Cheung':url=read(O/'boundary-a.json')['wangChiCheung']['sourceUrl']
 note=degree.get('basis') or degree.get('evidence') or 'MIT ORC lists this named Operations Research PhD thesis in 2017; this does not independently verify a formal conferral date.'
 if n=='Swati Gupta':note=p['sources'][0]['evidence']
 if n=='Miles Lubin':note='Personal biography explicitly reports MIT Operations Research PhD2017; defence June2017 is a separate milestone.'
 if n in ['Christopher E. Marks','Alexander Michael Weinstein','Chiwei Yan','Charles Mark Thraves Cortés-Monroy']:note='Opened personal or institutional source explicitly reports MIT Operations Research PhD2017; formal award day/month independently unverified.'
 if n=='Wang Chi Cheung':note='Own CV reports PhD February2017; adviser CV reports graduated August2016. These could be different milestones, but this is not established; formal award year unresolved.'
 r=dict(id=pid,institution='Massachusetts Institute of Technology',name=n,listedYear=2017,field='operations',programId='mit-operations-research-phd',facultyId=fid,match='reviewed-primary-source-identity' if fid else None,matchLeads=[],careerOwner='stage-2' if fid else 'stage-4',identityReview={'status':'reviewed','checkedAt':'2026-10-27','evidence':'Named ORC thesis identity reconciled with the cited individual professional and doctoral sources.'},degreeReview={'status':'reported-doctorate','period':date(None if n=='Wang Chi Cheung' else '2017'),'awardDay':None,'field':'Operations Research','checkedAt':'2026-10-27','sourceUrl':url,'evidenceNote':note,'dateEvidenceMeaning':'Source-reported doctorate or thesis timing; not independent formal conferral verification.','limitations':['Formal award month and day unverified.','Source-bounded ORC thesis cohort, not a graduating-class census.']},sightings=[sight(orc,n,title+'; thesis date '+str(month)+'/2017.','thesis')])
 r['sightings'].append(sight(url,n,note,'graduation'))
 for s in p.get('sources',[]):r['sightings'].append(sight(s['url'],p.get('preferredName',n),s['evidence']))
 for j in p.get('roles',[]):
  u=j.get('sourceUrl') or p.get('roleSourceDefault') or p.get('sourceUrl')
  if u:r['sightings'].append(sight(u,n,j['employer']+': '+j['title']+'. '+j.get('evidence','')))
 r['degreeMilestones']=[dict(kind='thesis-date',displayText='ORC thesis list: '+str(month)+'/2017.',sourceUrl=orc,checkedAt='2026-10-27',evidenceNote=title,limitation='Thesis timing is not necessarily actual completion or formal degree conferral.',formalAwardDateAssigned=False)]
 def milestone(text,url):r['degreeMilestones'].append(dict(kind='reported-milestone',displayText=text,sourceUrl=url,checkedAt='2026-10-27',evidenceNote=text,limitation='Source milestone retained separately from formal conferral.',formalAwardDateAssigned=False))
 if n=='Mohammed Aouad':
  r['facultyName']='Ali Aouad';r['identityReview']['evidence']='MIT ORC explicitly names Mohammed Ali Aouad PhD17; MIT library aliases Ali (Mohammed Ali) Aouad. Library/CV thesis title differs from ORC summary title, retained as discrepancy.'
  r['sightings'] += [sight(alias,'Mohammed Ali Aouad','Opened Chrome: Mohammed Ali Aouad PhD17.','identity'),sight(p['identity']['sourceUrl'],'Ali (Mohammed Ali) Aouad',p['identity']['facts'],'identity')]
  milestone('ORC title differs from library/CV Assortment and inventory optimization: from predictive choice models to near-optimal algorithms. Identity linked through explicit MIT name aliases; title discrepancy unresolved.',p['identity']['sourceUrl'])
 if n=='Wang Chi Cheung':
  b=read(O/'boundary-a.json')['wangChiCheung'];milestone('Own CV: PhD February2017.',b['sourceUrl']);milestone(b['conflict']['evidence'],b['conflict']['sourceUrl'])
 if n=='Miles Lubin':milestone('Personal talk list dates thesis defence June2017; not formal conferral.','https://mlubin.github.io/')
 if n=='Alexander Michael Weinstein':milestone('MIT testimonial explicitly reports graduation June2017, followed by Zillow employment.',testimonials)
 if n=='Charles Mark Thraves Cortés-Monroy':milestone('Adviser CV reports graduated May2017, distinct from June thesis listing.',p['sources'][3]['url'])
 g['records'].append(r);added.append(pid)
newhist=[];decisions=[]
for path in sorted(O.glob('*.history-proposal.json')):
 r=read(path);pid=r.pop('personId');r['id']=pid;r.pop('integrationStatus',None);r.update(reviewStatus='partial',careerComplete=False)
 assert not any(x['id']==pid for x in h['records'])
 gr=next(x for x in g['records'] if x['id']==pid or (x.get('facultyId')==pid and x['id'] in added))
 r['recordIds']=[gr['id']] if gr.get('facultyId') else [];r['degreeReview']=copy.deepcopy(gr['degreeReview']);r['degreeMilestones']=copy.deepcopy(gr['degreeMilestones'])
 isli='linkedin.com/' in (r.get('profileUrl') or '')
 if isli:
  r['linkedInCaptures']=[{k:r.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}]
  gr['sightings'].append(sight(r['profileUrl'],r['name'],r['identityBasis'],'identity'))
 for m in r.get('otherEmploymentMentions',[]):
  if m.get('text'):m['evidenceNote']=m['text']+' '+m['evidenceNote'];m.setdefault('titleAsWritten','Supporting professional observation');m.setdefault('employerAsWritten',None)
 keep=[];mentions=r.get('otherEmploymentMentions',[])
 for j in r['jobs']:
  t=(j.get('titleAsWritten') or '').lower()
  supporting=any(s in t for s in ['intern','research assistant','teaching assistant','collaboration:','consultancy:','co-op','predoctoral','online forum','counselor']) or (r['name']=='Nikita Korolko' and j['employerAsWritten']=='Massachusetts Institute of Technology')
  if supporting:mentions.append({**j,'classificationNote':'Student, internship, consulting or supporting observation; no first-job conclusion inferred.'})
  else:keep.append(j)
 r['jobs']=keep;r['otherEmploymentMentions']=mentions
 if r['name']=='Arthur Flajolet':
  r['otherEmploymentMentions'] += [mention('Orange Labs R&D','Research Assistant','Education section project,2012; no month or continuous appointment inferred.',r['profileUrl'],'2012'),mention('Ecole Normale Superieure','Research Assistant','Education section project,2011.',r['profileUrl'],'2011')]
 if r['name']=='Chiwei Yan':r['otherEmploymentMentions'].append(mention('Uber','Postdoctoral Research Scientist','Official UW2020 biography reports this role; profile instead labels September2017–March2019 Data Scientist II. Exact relationship and dates unverified.','https://www.engr.washington.edu/facresearch/newfaculty/2020/yan'))
 if r['name']=='Jerry Lai Kung':r['otherEmploymentMentions'].append(mention('Goldman Sachs Asset Management','Vice President, Quantitative Strategist','Employer biography supports quantitative strategist role; initial rank and promotion date unknown.','https://aos.cloud/about/'))
 if r['name']=='Alexander Michael Weinstein':r['otherEmploymentMentions'].append(mention('Massachusetts Institute of Technology','Tutoring and teaching activities','MIT testimonial mentions Executive MBA tutoring, MITx MOOC administration and student software-course teaching during doctorate; dates unknown.',testimonials))
 first=None
 if r['name']=='Alexander Michael Weinstein':
  first=dict(status='verified',definition='Earliest documented new appointment after doctorate completion',employer='Zillow Group',title='Data Scientist',start=date('Jul 2017'),sector='industry',appointmentType='industry',checkedAt='2026-10-27',reason='MIT testimonial explicitly reports June2017 graduation followed by move to Zillow; individually read full profile dates Zillow July2017–February2018. Earlier research jobs/internships precede doctorate.',sources=[dict(url=testimonials,checkedAt='2026-10-27',evidenceNote='Explicit graduation-before-Zillow narrative and matching thesis/adviser.'),dict(url=r['profileUrl'],checkedAt='2026-10-27',evidenceNote='Entire accessible Experience read: Zillow Data Scientist July2017–February2018; earlier roles retained.')],degreeBoundary='Explicit reported June2017 graduation precedes July2017 start; independently verified formal award day remains unknown.',limitations=['Source-bounded earliest documented job; full real-world history remains partial.','DoorDash aggregate current title does not establish initial title or promotion dates.'])
  gr['firstJobReview']=copy.deepcopy(first)
 r['firstJobAssessment']=first
 if not first:r['parkedCase']={'status':'existing-faculty-assessment-retained' if gr.get('facultyId') else 'parked-for-new-evidence','reason':r['remainingUnknowns'][0]}
 h['records'].append(r);newhist.append(pid);decisions.append({'id':pid,'firstJobAssessment':first,'remainingUnknowns':r['remainingUnknowns']})
# Existing Aouad career kept intact; append newly documented consulting/founder evidence.
ali=next(r for r in h['records'] if r['id']=='omlist-c02430ef1166545c')
cv=people['Mohammed Aouad']['degree']['sourceUrl']
ali['jobs'].append({**mention('Uber Technologies','External Consultant','CV explicitly lists external consulting January–December2019, overlapping London Business School.',cv,'Jan 2019','Dec 2019'),'sourceType':'cv','isCurrent':False})
ali['otherEmploymentMentions'].append(mention('S&A','Co-founder','2016 MIT seminar biography reports co-founding financial-services startup; appointment dates and continuity unknown.','https://web.mit.edu/orc/www/archive/seminars/2016s/bios/Aouad_bio.html'))
ali['remainingUnknowns'].append('ORC summary thesis title differs from library/CV title; name aliases independently matched in MIT sources. August2017 Uber versus September thesis does not resolve completion ordering.')
ali['recordIds']=list(dict.fromkeys(ali.get('recordIds',[])+[added[0]]))
ali['checkedAt']='2026-10-27'
m=g['metadata'];m.update(updatedAt='2026-10-27',records=len(g['records']),sightings=sum(len(r['sightings']) for r in g['records']),linkedToPeople=sum(bool(r.get('facultyId')) for r in g['records']),verifiedGraduateFirstJobs=sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records']))
m['byField']={k:sum(r['field']==k for r in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for r in g['records'] for s in r['sightings']) for k in m['byArchive']}
coverage=next(x for x in m['coverage'] if x['institution']=='Massachusetts Institute of Technology' and x['listedYear']==2017)
rows=[r for r in g['records'] if r['institution']=='Massachusetts Institute of Technology' and r['listedYear']==2017]
coverage.update(names=len(rows),linked=sum(bool(r.get('facultyId')) for r in rows),pages=list(dict.fromkeys(s['pageUrl'] for r in rows for s in r['sightings'])),rosterStatus='partial')
write(O/'decisions.json',decisions)
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
write(O/'applied.json',dict(graduateRecordsAdded=added,newPartialHistoryIds=newhist,updatedHistoryIds=[ali['id']],verifiedFirstJobIds=[x['id'] for x in decisions if x['firstJobAssessment']],newStructuredRoles=sum(len(r['jobs']) for r in h['records'] if r['id'] in newhist)+1,newSupportingMentions=sum(len(r['otherEmploymentMentions']) for r in h['records'] if r['id'] in newhist)+1))
print('Integrated',len(added),'graduates,',len(newhist),'new histories, one updated history, one firstjob.')
