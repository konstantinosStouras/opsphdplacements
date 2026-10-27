"""Root-only reviewed one-shot MIT2018 integration. Never replay after applied.json."""
import json,pathlib,copy,re,shutil,unicodedata,hashlib
from capture import date
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
def slug(n):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()).strip('-')
def sight(url,name,note,meaning='career-observation'):
 return dict(sourceUrl=url,pageUrl=url,sourceDate=None,checkedAt='2026-10-27',archive='live',name=name,yearMeaning=meaning,program='PhD Operations Research',destination=None,position=None,degree='PhD',note=note,extractedAt='2026-10-27')
assert not (O/'applied.json').exists()
g=read('data/graduate-lists.json');h=read('data/employment-histories.json');og=copy.deepcopy(g['records']);oh=copy.deepcopy(h['records'])
backup=pathlib.Path('research/mit-2018-before');assert not backup.exists();backup.mkdir(parents=True)
for p in pathlib.Path('data').glob('*.json'):shutil.copy2(p,backup/p.name)
a=read(O/'degree-audit.json');c=read(O/'cohort-observations.json');prim=read(O/'identity-primary-observations.json')['persons'];other=read(O/'remaining-primary-observations.json')['records'];fac=read(O/'faculty-primary-observations.json')['records']
added=[]
for d in a['degreeRecords']:
 name=d['cohortName'];pid='grad:massachusetts-institute-of-technology:'+slug(name)+':2018'
 assert not any(r['id']==pid for r in g['records'])
 cr=next(x for x in c['records'] if x['name']==name);link=next((x for x in a['facultyLinks'] if x['cohortName']==name),None)
 r=dict(id=pid,institution='Massachusetts Institute of Technology',name=name,listedYear=2018,field='operations',programId='mit-operations-research-phd',facultyId=link['facultyId'] if link else None,match='reviewed-primary-source-identity' if link else None,matchLeads=[],careerOwner='stage-2' if link else 'stage-4',identityReview={'status':'reviewed','checkedAt':'2026-10-27','evidence':link or 'Exact ORC thesis identity reconciled with individual degree and professional sources.'},degreeReview={'status':d['status'],'period':date(str(d['degreeYear'])) if d['degreeYear'] else date(None),'awardDay':None,'field':d['field'],'checkedAt':'2026-10-27','sourceUrl':d['sourceUrl'],'evidenceNote':d['evidence']+' '+d['locator'],'dateEvidenceMeaning':d['dateEvidenceMeaning'],'limitations':d['limitations']+['Source-bounded ORC thesis cohort, not a census.']},sightings=[])
 r['sightings']=[sight(c['sourceUrl'],name,cr['thesisTitle']+'; thesis date as written: '+cr['thesisDateAsWritten'],'thesis'),sight(d['sourceUrl'],d['recipientName'],d['evidence']+' '+d['locator'],'graduation')]
 if name=='Zachary Davis Owen':r['sightings'][0]['name']='Owen, Zachary Davis Owen';r['sightings'][0]['note']+='; source duplicates surname, reconciled to Zachary Davis Owen using exact thesis/advisor.'
 if link:r['sightings'].append(sight(link['sourceUrl'],name,link['evidence'],'identity'))
 for ob in prim+other+fac:
  if ob['name']!=name:continue
  for s in ob['sources']:
   note=s.get('evidence') or '; '.join(s.get('observations',[])) or s.get('note') or ob.get('identityBasis')
   if note:r['sightings'].append(sight(s['url'],ob.get('professionalName',name),note))
  for v in ob.get('careerObservations',[]):r['sightings'].append(sight(v['sourceUrl'],name, '; '.join(str(v[k]) for k in ['employer','title','ordering','concurrency','observation'] if v.get(k))))
 for m in a['supplementaryMilestones']:
  if name in m['names']:r.setdefault('degreeMilestones',[]).append(dict(kind='reported-milestone',displayText=m['evidence'],sourceUrl=m['sourceUrl'],checkedAt=m['checkedAt'],evidenceNote=m['evidence'],limitation='Reported source milestone, not independently verified formal conferral.',formalAwardDateAssigned=False))
 if name=='Siong Thye Goh':r.setdefault('degreeMilestones',[]).append(dict(kind='study-range',displayText='LinkedIn PhD study range 2012–2016; MIT research assistant through June2018 and ORC June2018 thesis. Award year unresolved.',sourceUrl='https://www.linkedin.com/in/goh-siong-thye-b0a2aa98/',checkedAt='2026-10-27',evidenceNote='Individually read Education and entire Experience; study endpoint is not conferral.',formalAwardDateAssigned=False))
 if name=='Chong Yang Goh':r.setdefault('degreeMilestones',[]).append(dict(kind='study-range',displayText='LinkedIn PhD study range 2012–June2018, not independently verified completion.',sourceUrl='https://www.linkedin.com/in/cygoh/',checkedAt='2026-10-27',evidenceNote='Education individually read.',formalAwardDateAssigned=False))
 if name=='Virgile Galle':r.setdefault('degreeMilestones',[]).append(dict(kind='reported-degree-date',displayText='Personal CV reports PhD February2018; BP also starts February2018 in the profile, within-month order unknown.',sourceUrl='https://vgalle.github.io/files/CV.pdf',checkedAt='2026-10-27',evidenceNote='Explicit CV degree date, separate from formal conferral.',formalAwardDateAssigned=False))
 g['records'].append(r);added.append(pid)

def mention(emp,title,note,url,start=None,end=None):
 return dict(employerAsWritten=emp,titleAsWritten=title,evidenceNote=note,sourceUrl=url,checkedAt='2026-10-27',start=date(start),end=date(end))
historyids=[];verified=[];decisions=[]
for p in sorted(O.glob('*.history-proposal.json')):
 r=read(p);pid=r.pop('personId');r['id']=pid;r.pop('integrationStatus',None);r.update(reviewStatus='partial',careerComplete=False)
 assert not any(x['id']==pid for x in h['records'])
 gr=next(x for x in g['records'] if x['id']==pid);r['degreeReview']=copy.deepcopy(gr['degreeReview']);s=slug(r['name'])
 if r.get('profileUrl'):
  r['linkedInCaptures']=[{k:r.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}]
  r['coverageNote']='All accessible Experience entries read individually in Chrome, including Show all where offered. Additional primary source observations retained; real-world history remains partial.'
  gr['sightings'].append(sight(r['profileUrl'],r['name'],r['identityBasis'],'identity'))
 keep=[];mentions=list(r.get('otherEmploymentMentions',[]))
 for j in r['jobs']:
  t=(j.get('titleAsWritten') or '').lower()
  if any(w in t for w in ['intern','research assistant','teaching assistant','research and teaching assistant','undergraduate researcher']) or t in ['student','student ambassador'] or j.get('employmentTypeAsWritten')=='Internship' or j.get('employerAsWritten')=="NTU Students' Union":mentions.append({**j,'classificationNote':'Student, internship or service observation; not a post-PhD first-job conclusion.'})
  else:keep.append(j)
 r['jobs']=keep;r['otherEmploymentMentions']=mentions
 if s=='chongli-daniel-chen':
  cv='https://www.mit.edu/~dcchen/docs/DanielChen_CV.pdf'
  r['otherEmploymentMentions'] += [mention('Singapore University of Technology and Design','Adjunct Lecturer','Spring2024; teaching appointment, no invented month.',cv,'2024','2024'),mention('Massachusetts Institute of Technology','Research Assistant','CV2013–2018; not postdoctoral.',cv,'2013','2018'),mention('IHPC / Amazon','Senior Research Scientist','CV titles differ from LinkedIn Research Scientist; concurrent part-time Amazon and IHPC from2021. Historical present not extended beyond dated profile departures.',cv),mention('Amazon','Postdoctoral Associate','Advisor title differs from detailed personal CV and profile Research Scientist; not silently classified as postdoc.','https://mitmgmtfaculty.mit.edu/gperakis/research-group/')]
  r['remainingUnknowns'].append('Earlier contributor interpretation of broad personal biography wording was withdrawn in boundary-followup: it does not settle July start versus August/September degree dates.')
 if s=='virgile-galle':
  cv='https://vgalle.github.io/files/CV.pdf'
  r['otherEmploymentMentions'] += [mention('MIT sports team','Consultant','CV2014–2015; student-period consulting, no continuous employment claim.',cv,'2014','2015'),mention('Ecole Centrale Paris','Assistant Researcher','CV2012–2013; additional research observation.',cv,'2012','2013')]
 if s=='ying-daisy-zhuo':
  cv='https://www.mit.edu/~zhuo/CV.pdf';url='https://www.mit.edu/~zhuo/'
  r['otherEmploymentMentions'] += [mention('Analysis Group','Analyst','CV July2012 start conflicts with LinkedIn June2012; both retained.',cv,'Jul 2012','May 2014'),mention('Massachusetts Institute of Technology','Teaching / course management','PhD machine learning Spring2018; software analytics instructor2017; edX Analytics Edge course manager Summer2017; Analytics Edge TA Spring2017 EMBA and Spring2016 MBA. Separate course episodes, not continuous appointment.',url),mention('Middlebury College','Teaching Assistant','September2009–May2012 from personal biography.',url,'Sep 2009','May 2012')]
 if s=='stefano-traca':gr['sightings'].append(sight('https://la.disneyresearch.com/alumni/',r['name'],'Disney Research alumni lists Stefano Traca as Lab Associate; undated observation, not first-job proof.'))
 if gr.get('degreeMilestones'):r['degreeMilestones']=copy.deepcopy(gr['degreeMilestones'])
 first=None
 if s in ['clark-pixton','rajan-udwani']:
  if s=='clark-pixton':
   emp='Brigham Young University';title='Assistant Professor, Supply Chain Analytics';start=date('Jul 2018');typ='unknown';url='https://marriott.byu.edu/news/?article=1808';reason='Advisor explicitly reports May2018 graduation; full profile starts BYU July2018, and BYU article places teaching development after earning the PhD. Earlier PillPack collaboration was during doctorate. Tenure status not inferred.'
  else:
   emp='Columbia University';title='Postdoctoral Researcher';start=date(None);typ='postdoc';url='https://ieor.berkeley.edu/people/rajan-udwani/';reason='Official Berkeley biography explicitly places Columbia postdoc after MIT PhD; Goyal CV dates it 2018–2020. Exact start month unknown. Prior quant job explicitly predoctoral.'
  sources=[dict(url=url,checkedAt='2026-10-27',evidenceNote=reason),dict(url=gr['degreeReview']['sourceUrl'],checkedAt='2026-10-27',evidenceNote=gr['degreeReview']['evidenceNote'])]
  sources.append(dict(url=r['profileUrl'] if r.get('profileUrl') else 'https://www.columbia.edu/~vg2277/vgoyal-cv.pdf',checkedAt='2026-10-27',evidenceNote='Dated employment chronology read; no invented day.'))
  first=dict(status='verified',definition='Earliest documented new appointment after doctorate completion',employer=emp,title=title,start=start,sector='academia',appointmentType=typ,checkedAt='2026-10-27',reason=reason,sources=sources,degreeBoundary='Explicit reported graduation/sequence, separate from independently unverified formal award date.',limitations=['Source-bounded earliest documented appointment; full career remains partial.','Exact completion and appointment days unknown.'])
  if s=='rajan-udwani':first['sequenceEvidence']={'kind':'explicit-next-position','sourceUrl':url};first['limitations'].append('Start year2018 is retained in the career role; this first-job field lacks a supported month.')
  gr['firstJobReview']=first;verified.append(pid)
 r['firstJobAssessment']=copy.deepcopy(first)
 if not first:r['parkedCase']={'status':'parked-for-new-evidence','reason':r['remainingUnknowns'][0]}
 h['records'].append(r);historyids.append(pid);decisions.append(dict(id=pid,firstJobAssessment=first,remainingUnknowns=r['remainingUnknowns']))
m=g['metadata'];m.update(updatedAt='2026-10-27',records=len(g['records']),sightings=sum(len(r['sightings']) for r in g['records']),linkedToPeople=sum(bool(r.get('facultyId')) for r in g['records']),verifiedGraduateFirstJobs=sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records']))
m['byField']={k:sum(r['field']==k for r in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for r in g['records'] for s in r['sightings']) for k in m['byArchive']}
coverage=next(x for x in m['coverage'] if x['institution']=='Massachusetts Institute of Technology' and x['listedYear']==2018)
rows=[r for r in g['records'] if r['institution']=='Massachusetts Institute of Technology' and r['listedYear']==2018]
coverage.update(names=len(rows),linked=sum(bool(r.get('facultyId')) for r in rows),pages=list(dict.fromkeys(s['pageUrl'] for r in rows for s in r['sightings'])),rosterStatus='partial')
assert og==g['records'][:len(og)] and oh==h['records'][:len(oh)]
write(O/'decisions.json',decisions)
write(O/'input-manifest.json',[{'path':p.name,'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(O.glob('*.json')) if p.name!='input-manifest.json'])
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
write(O/'applied.json',dict(graduateRecordsAdded=added,newPartialHistoryIds=historyids,verifiedFirstJobIds=verified,remainingFirstJobIds=[x for x in historyids if x not in verified],newStructuredRoles=sum(len(r['jobs']) for r in h['records'] if r['id'] in historyids),newSupportingMentions=sum(len(r['otherEmploymentMentions']) for r in h['records'] if r['id'] in historyids),olderRecordsPreserved=True))
print('Integrated',len(added),'graduates,',len(historyids),'histories,',len(verified),'firstjobs.')
