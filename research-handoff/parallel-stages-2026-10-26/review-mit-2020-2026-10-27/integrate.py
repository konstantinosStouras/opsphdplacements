"""Guarded one-shot reviewed MIT2020 integration. Never replay after applied.json."""
import json,pathlib,copy,hashlib,re,shutil
from capture import date
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,indent=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=indent)+'\n',encoding='utf-8')
assert not (O/'applied.json').exists()
audit=read(O/'degree-audit.json'); transfers=read(O/'new-faculty-identity.json')['records']
g=read('data/graduate-lists.json');h=read('data/employment-histories.json');og=copy.deepcopy(g['records']);oh=copy.deepcopy(h['records'])
backup=pathlib.Path('research/mit-2020-before');backup.mkdir(parents=True,exist_ok=True)
for p in pathlib.Path('data').glob('*.json'):shutil.copy2(p,backup/p.name)
titles=['New Optimization Approaches to Matrix Factorization Problems with Connections to Natural Language Processing','Structure, Dynamics, and Inference in Networks','Past Price and Trend Effects in Promotion Planning; from Prediction to Prescription','Investigations in Applied Probability and High-Dimensional Statistics','Leveraging Data Analytics to Improve Outpatient Healthcare Operations','New Approaches to Maximizing Influence in Large-Scale Social Networks','Structural and Algorithmic Aspects of Linear Inequality Systems','Probabilistic Models and Optimization Algorithms for Large-scale Transportation Problems','Algorithmic Advancements in Discrete Optimization Applications to Machine Learning and Healthcare Operations','Data-Driven Decision Making in Online and Offine Retail','Improving Farmers’ and Consumers’ Welfare in Agricultural Supply Chains via Data-driven Analytics and Modeling: From Theory to Practice','Dynamic Optimization in the Age of Big Data','Online and Offline Learning in Operations','Interpretable Machine Learning Methods with Applications to Health Care','From Data to Decisions in Urban Transit and Logistics','Real-Time Calibration of Large-Scale Traffic Simulators: Achieving Efficiency Through the Use of Analytical Models']
months=['June','September','September','June','February','February','September','February','June','September','September','June','September','June','June','September']
cohort=[];added=[]
faculty={r['id'] for f in ['faculty','faculty-roster-people'] for r in read('data/'+f+'.json')['records']}
def sight(url,name,note,meaning='graduation',destination=None,position=None):return dict(sourceUrl=url,pageUrl=url,sourceDate=None,checkedAt='2026-10-27',archive='live',name=name,yearMeaning=meaning,program='PhD Operations Research',destination=destination,position=position,degree='PhD',note=note,extractedAt='2026-10-27')
for i,d in enumerate(audit['degreeRecords']):
 name=d['cohortName'];slug=re.sub('[^a-z0-9]+','-',name.lower()).strip('-');pid='grad:massachusetts-institute-of-technology:'+slug+':2020'
 assert not any(r['id']==pid for r in g['records'])
 link=next((x for x in audit['facultyLinks'] if x['cohortName']==name),None);fid=link['facultyId'] if link else None;assert not fid or fid in faculty
 transfer=next((x for x in transfers if x['graduateName'] in [name,d['recipientName']]),None)
 period={'year':2020,'month':d['degreeMonth'],'precision':'month' if d['degreeMonth'] else 'year','asWritten':(('February' if d['degreeMonth']==2 else 'September')+' 2020') if d['degreeMonth'] else '2020'}
 r=dict(id=pid,institution='Massachusetts Institute of Technology',name=name,listedYear=2020,field='operations',programId='mit-operations-research-phd',facultyId=fid,match='reviewed-primary-source-identity' if fid else None,matchLeads=[],careerOwner=('stage-2' if fid and fid.startswith('omlist') else 'stage-3') if fid or transfer else 'stage-4',identityReview={'status':'reviewed','checkedAt':'2026-10-27','evidence':link or (transfer['identityDecision'] if transfer else 'Exact official ORC thesis and recipient identity matched.')},degreeReview={'status':'official-recipient-match','period':period,'awardDay':None,'checkedAt':'2026-10-27','sourceUrl':d['sourceUrl'],'evidenceNote':d['evidence']+' '+d['locator'],'limitations':['Individual award day unknown; thesis/study dates remain separate.','Source-bounded roster, not an independently established census.']},sightings=[])
 r['sightings']=[sight('https://orc.mit.edu/research/phd-and-masters-theses/',name,titles[i]+'; thesis date as written: '+months[i]+' 2020','thesis'),sight(d['sourceUrl'],d['recipientName'],d['evidence']+' '+d['locator'])]
 if link:r['sightings'].append(sight(link['sourceUrl'],name,link['evidence'],'identity'))
 if transfer:
  r['identityReview']['facultyIdentityEvidence']=transfer
  for s in transfer['sources']:r['sightings'].append(sight(s['url'],transfer['professionalName'],s['supports'],'career-observation'))
 g['records'].append(r);added.append(pid);cohort.append({'id':pid,'name':name,'thesisTitle':titles[i],'thesisDateAsWritten':months[i]+' 2020'})
write(O/'cohort-observations.json',{'sourceUrl':'https://orc.mit.edu/research/phd-and-masters-theses/','checkedAt':'2026-10-27','scope':'Expanded PHD THESES BY YEAR > 2020 read in Chrome; Masters excluded.','records':cohort})
levi='https://mitsloan.mit.edu/sites/default/files/faculty-cv/2022/08/29/cv-document-10881.pdf';simchi='https://bpb-us-e1.wpmucdn.com/sites.mit.edu/dist/9/1246/files/2025/01/vita_dsl.pdf';volpe='https://www.volpe.dot.gov/our-work/policy-planning-and-environment/energy-analysis-and-sustainability';news='https://carolinaosorio.net/news/'
reasons={
'david-scott-hunter':('Jump Trading Group','Quantitative Researcher','Aug 2020','industry','Formal February2020 award precedes August2020 earliest documented new appointment in individually read full accessible profile.',None),
'li-wang':('Lyft','Senior Data Scientist, Rider Pricing','Aug 2020','industry','Advisor CV page36 explicitly reports graduation June2020; individually read profile records new Lyft role August2020. Formal September award preserved separately.',simchi),
'michael-hu':('Massachusetts General Hospital','Operations Research Scientist',None,'nonprofit','Advisor CV page10 lists Michael Hu graduating2020 and assuming a position at MGH. October23,2020 university event independently identifies his MGH Operations Research Scientist role; exact start unknown.',levi),
'kevin-zhang':('U.S. DOT Volpe National Transportation Systems Center','Data Scientist','Jul 2020','government','Official employer biography explicitly places MIT doctorate before joining Volpe in2020. Individually read profile dates start July2020 and consultancy2012–2014, resolving the predoctoral job ambiguity; formal September award remains separate.',volpe)}
decisions=[];historyids=[];verified=[]
for p in sorted(O.glob('*.history-proposal.json')):
 r=read(p);pid=r.pop('personId');r['id']=pid;r.pop('integrationStatus',None);r.update(reviewStatus='partial',careerComplete=False)
 assert not any(x['id']==pid for x in h['records'])
 gr=next(x for x in g['records'] if x['id']==pid);r['degreeReview']=copy.deepcopy(gr['degreeReview']);slug=p.name.split('.history')[0]
 r['linkedInCaptures']=[{k:r.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}] if 'linkedin.com/in/' in r['profileUrl'] else []
 # Preserve student/intern observations, without classifying them as post-PhD appointments.
 keep=[];mentions=[]
 for j in r['jobs']:
  if any(w in j['titleAsWritten'].lower() for w in ['intern','research assistant','teaching assistant']):mentions.append({**j,'classificationNote':'Student/intern observation retained separately; not a post-PhD first-job conclusion.'})
  else:keep.append(j)
 r['jobs']=keep;r['otherEmploymentMentions']=mentions
 if slug in reasons:
  emp,title,start,sector,reason,extra=reasons[slug]
  sources=[{'url':r['profileUrl'],'checkedAt':'2026-10-27','evidenceNote':reason},{'url':gr['degreeReview']['sourceUrl'],'checkedAt':'2026-10-27','evidenceNote':gr['degreeReview']['evidenceNote']}]
  if extra and extra!=r['profileUrl']:sources.append({'url':extra,'checkedAt':'2026-10-27','evidenceNote':reason})
  if slug=='michael-hu':sources.append({'url':r['jobs'][0]['sourceUrl'],'checkedAt':'2026-10-27','evidenceNote':r['jobs'][0]['evidenceNote']})
  a=dict(status='verified',definition='Earliest documented new appointment after doctorate completion',employer=emp,title=title,start=date(start),sector=sector,appointmentType='professional-employee',checkedAt='2026-10-27',reason=reason,sources=sources,degreeBoundary='Formal recipient period and reported academic completion are distinct; no exact completion, award or appointment day assigned.',limitations=['Source-bounded earliest documented appointment; career remains partial.','Exact award and appointment days unknown.'])
  if start is None:a['sequenceEvidence']={'kind':'explicit-next-position','sourceUrl':levi}
  gr['firstJobReview']=a;r['firstJobAssessment']=copy.deepcopy(a);verified.append(pid)
  r['remainingUnknowns']=[x for x in r['remainingUnknowns'] if not ('requires' in x or 'ordering' in x)]
 else:
  hold=('Formal award and Cruise appointment both February2020; advisor reports January thesis completion, not explicitly completion of all degree requirements. Within-month ordering remains unresolved.' if slug=='jing-lu' else 'Huawei starts July2020; official recipient confirms year2020 without month. Exact doctorate completion before new employment remains unestablished.')
  r['remainingUnknowns']=[hold,'Real-world career remains partial.'];r['parkedCase']={'status':'parked-for-new-evidence','reason':hold}
 if slug in ['li-wang','kevin-zhang','jing-lu']:
  url=simchi if slug=='li-wang' else volpe if slug=='kevin-zhang' else news
  label={'li-wang':'Advisor reports graduation June2020','kevin-zhang':'Employer reports doctorate received before joining Volpe in2020','jing-lu':'Advisor reports PhD thesis completed January2020'}[slug]
  m={'kind':'reported-completion' if slug!='jing-lu' else 'thesis-completion','displayText':label,'sourceUrl':url,'checkedAt':'2026-10-27','evidenceNote':label,'limitation':'Separate from formal award; exact completion day unknown. Thesis completion alone is not completion of every degree requirement.','formalAwardDateAssigned':False}
  gr['degreeMilestones']=[m];r['degreeMilestones']=[copy.deepcopy(m)]
 if slug=='kevin-zhang':r['otherEmploymentMentions'].append({'employerAsWritten':'U.S. DOT Volpe National Transportation Systems Center','titleAsWritten':'Mathematical Statistician','sourceUrl':volpe,'checkedAt':'2026-10-27','evidenceNote':'Official biography updated August24,2026 uses this current title; LinkedIn uses Data Scientist. No title-change date assigned.'})
 if slug=='david-scott-hunter':r['remainingUnknowns'].append('Primary GitHub dscotthunter self-description says2019 OR PhD; formal recipient saysFebruary2020. Formal award retained, not overwritten. Employment May2024–November2025 unknown.')
 h['records'].append(r);historyids.append(pid);decisions.append({'id':pid,'firstJobAssessment':r['firstJobAssessment'],'remainingUnknowns':r['remainingUnknowns']})
m=g['metadata'];m.update(updatedAt='2026-10-27',records=len(g['records']),sightings=sum(len(r['sightings']) for r in g['records']),linkedToPeople=sum(bool(r.get('facultyId')) for r in g['records']),verifiedGraduateFirstJobs=sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records']))
m['byField']={k:sum(r['field']==k for r in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for r in g['records'] for s in r['sightings']) for k in m['byArchive']}
cv=next(x for x in m['coverage'] if x['institution']=='Massachusetts Institute of Technology' and x['listedYear']==2020)
rows=[r for r in g['records'] if r['institution']=='Massachusetts Institute of Technology' and r['listedYear']==2020]
cv.update(names=len(rows),linked=sum(bool(r.get('facultyId')) for r in rows),pages=list(dict.fromkeys(s['pageUrl'] for r in rows for s in r['sightings'])),rosterStatus='partial')
assert og==g['records'][:len(og)] and oh==h['records'][:len(oh)]
write(O/'decisions.json',decisions)
write(O/'input-manifest.json',[{'path':p.name,'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(O.glob('*.json')) if p.name!='input-manifest.json'])
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
write(O/'applied.json',{'graduateRecordsAdded':added,'newPartialHistoryIds':historyids,'verifiedFirstJobIds':verified,'remainingFirstJobIds':[x for x in historyids if x not in verified],'newStructuredRoles':sum(len(r['jobs']) for r in h['records'] if r['id'] in historyids),'newSupportingMentions':sum(len(r['otherEmploymentMentions']) for r in h['records'] if r['id'] in historyids),'olderRecordsPreserved':True})
print('Integrated16graduates,6partialhistories,4firstjobs;2firstjobholds;7existingfacultylinks;3facultyidentityobservations.')
