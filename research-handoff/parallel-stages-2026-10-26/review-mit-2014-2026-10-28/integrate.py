"""One-shot sole-integrator MIT 2014 reviewed cut. Never replay."""
import json,pathlib,copy,re,shutil
O=pathlib.Path(__file__).resolve().parent
R=O.parents[2];D='2026-10-28'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v,n=2):p.write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
def dt(y=None,m=None):return dict(asWritten=(f'{y}-{m:02}' if m else str(y)) if y else None,year=y,month=m,precision='month' if m else 'year' if y else 'unknown')
assert not (O/'applied.json').exists()
orc='https://orc.mit.edu/accordion_item/2014/'
cohort=[('Ross Michael Anderson',6,'Stochastic Models and Data Driven Simulations for Healthcare Operations'),('Adam Nabil Elmachtoub',9,'New Approaches for Integrating Revenue and Supply Chain Management'),('Vishal Gupta',6,'Data-Driven Models for Uncertainty and Behavior'),('Ngai-Hang Zachary Leung',9,'Three Essays in Operations Management'),('Zhe Zhu',9,'New Statistical Techniques for Designing Future Generation Retirement and Insurance Solutions')]
write(O/'cohort-observation.json',dict(sourceUrl=orc,checkedAt=D,scope='Five named ORC 2014 thesis entries; not a census or formal degree-conferral register.',records=[dict(name=n,thesisMonth=m,thesisTitle=t) for n,m,t in cohort]))
ross=dict(name='Ross Michael Anderson',sources=[dict(url='https://research.google/people/rossmichaelanderson/',evidence='Google research biography identifies software engineer, operations research team, Cambridge MA; MIT ORC PhD 2014.'),dict(url='https://rma350.github.io/about/index.html',evidence='Individual professional biography identifies Google software engineer, previously MIT ORC graduate student, graduating 2014; Ashlagi and Gamarnik advisers.'),dict(url='https://rma350.github.io/assets/publications/rossAndersonThesis.pdf',evidence='Thesis cover names Ross Michael Anderson and MIT PhD, June 2014; submission May 15, 2014. These thesis dates do not establish formal conferral.')],degreeEvidence='Google and individual biographies report MIT ORC doctorate 2014; thesis cover separately June 2014.',limitations=['Google employment start and unrestricted first-job sequence unknown.','No identity-matched LinkedIn or full personal CV found in bounded search.'])
write(O/'primary-ross.json',dict(checkedAt=D,people=[ross]))
people={p['name']:p for f in ['primary-academic.json','primary-leung-zhu.json','primary-ross.json'] for p in read(O/f)['people']}
g=read(R/'data/graduate-lists.json');h=read(R/'data/employment-histories.json')
B=R/'research/mit-2014-before';assert not B.exists();B.mkdir(parents=True)
for f in (R/'data').glob('*.json'):shutil.copy2(f,B/f.name)
rows=[];added=[]
for name,month,title in cohort:
 p=people[name];pid='grad:massachusetts-institute-of-technology:'+re.sub('[^a-z0-9]+','-',name.lower()).strip('-')+':2014'
 assert not any(x['id']==pid for x in g['records'])
 fid=p.get('existingFacultyId');ss=p['sources'];identity=p.get('identity') or 'Exact MIT ORC thesis identity matched to named individual doctoral and professional sources; namesakes excluded.'
 r=dict(id=pid,name=name,institution='Massachusetts Institute of Technology',listedYear=2014,field='operations',programId='mit-operations-research-phd',facultyId=fid,match='reviewed-primary-source-identity' if fid else None,matchLeads=[],careerOwner='stage-2' if fid else 'stage-4',identityReview=dict(status='reviewed',checkedAt=D,evidence=identity),sightings=[])
 r['degreeReview']=dict(status='reported-doctorate',period=dt(2014),awardDay=None,field='Operations Research',checkedAt=D,sourceUrl=ss[0]['url'],evidenceNote=p.get('degreeEvidence') or ss[0]['evidence'],dateEvidenceMeaning='Reported doctorate; thesis timing and formal conferral remain separate.',limitations=['Formal award month/day independently unverified.','Source-bounded ORC thesis list is not a class census.'])
 r['degreeMilestones']=[dict(kind='thesis-date',displayText=f'ORC thesis list: {month}/2014.',sourceUrl=orc,checkedAt=D,evidenceNote=title,limitation='Thesis timing is not formal conferral.',formalAwardDateAssigned=False)]
 for s in [dict(url=orc,evidence=title+f'; thesis listed {month}/2014.')]+ss:
  r['sightings'].append(dict(sourceUrl=s['url'],pageUrl=s['url'],sourceDate=s.get('sourceDate'),checkedAt=D,archive='live',name=name,yearMeaning='thesis' if s['url']==orc else 'career-observation',program='PhD Operations Research',destination=None,position=None,degree='PhD',note=s['evidence'],extractedAt=D))
 if 'Leung' in name:r['degreeMilestones'].append(dict(kind='reported-completion',displayText='Adviser reports graduation August 2014.',sourceUrl=ss[3]['url'],checkedAt=D,evidenceNote=ss[3]['evidence'],limitation='Separate from September thesis listing; formal award day unverified.',formalAwardDateAssigned=False))
 if 'Elmachtoub' in name:r['degreeMilestones'].append(dict(kind='reported-completion',displayText='CV doctorate interval ends June 2014.',sourceUrl=ss[0]['url'],checkedAt=D,evidenceNote=p['degreeEvidence'],limitation='Separate from September thesis listing; formal award day unverified.',formalAwardDateAssigned=False))
 g['records'].append(r);rows.append(r);added.append(pid)
 rp=next(iter(O.glob(re.sub('[^a-z0-9]+','-',name.lower()).strip('-')+'.history-proposal.json')),None)
 if name=='Ross Michael Anderson':
  hr=dict(personId=pid,name=name,jobs=[dict(employerAsWritten='Google',titleAsWritten='Software Engineer',start=dt(),end=dt(),isCurrent=None,sourceUrl=ss[0]['url'],checkedAt=D,evidenceNote='Undated employer and individual biographies describe Google role. Start and recency unknown; not assigned as first job.')],otherEmploymentMentions=[],experienceAccess='primary-sources-reviewed',profileHistoryComplete=False,accessLimitations=p['limitations'])
  write(O/'ross-michael-anderson.history-proposal.json',hr)
 else:
  assert rp, name
  hr=read(rp)
 hid=fid or pid
 assert not any(x['id']==hid for x in h['records'])
 hr.pop('personId',None);hr.pop('integrationStatus',None)
 hr.update(id=hid,recordIds=[pid] if fid else [],reviewStatus='partial',careerComplete=False,checkedAt=D,identityBasis=identity,degreeReview=copy.deepcopy(r['degreeReview']),degreeMilestones=copy.deepcopy(r['degreeMilestones']),firstJobAssessment=None)
 hr.setdefault('profileUrl',None);hr.setdefault('reviewer','Codex sole integrator');hr.setdefault('coverageNote','Accessible primary evidence reviewed; career coverage remains partial.')
 hr.setdefault('otherEmploymentMentions',[])
 keep=[]
 for j in hr['jobs']:
  if any(w in (j.get('titleAsWritten') or '').lower() for w in ['intern','teaching assistant','instructor','research assistant']):hr['otherEmploymentMentions'].append(j)
  else:keep.append(j)
 hr['jobs']=keep
 for j in hr['jobs']:
  for k in ['start','end']:
   if j[k]['precision']=='present':j[k]['precision']='unknown'
 if 'Elmachtoub' in name or 'Leung' in name:
  adam='Elmachtoub' in name;seq=ss[1];employer='IBM' if adam else 'Carnegie Mellon University';m=8 if adam else 9
  sources=[dict(url=s['url'],checkedAt=D,evidenceNote=s['evidence']) for s in ss[:3]]
  if not adam:sources.append(dict(url='https://www.linkedin.com/in/ngai-hang-zachary-leung-61397a67/',checkedAt=D,evidenceNote='Individually read entire loaded Experience: Tepper postdoctoral fellow September 2014–July 2015.'))
  v=dict(status='verified',definition='Earliest documented new appointment after doctorate completion',employer=employer,title='Postdoctoral Fellow',start=dt(2014,m),sector='industry' if adam else 'academia',appointmentType='postdoc',checkedAt=D,reason='Official institutional narrative explicitly places this postdoc after doctorate completion; individual career dates corroborate.',sources=sources,sequenceEvidence=dict(kind='explicit-next-position',sourceUrl=seq['url']),degreeBoundary='Individual doctorate evidence and explicit after-graduation narrative; ORC thesis month is not treated as formal conferral.',limitations=['Exact formal award day remains unknown.','Concurrent Columbia visiting-scholar appointment retained.' if adam else 'LinkedIn month dates are self-reported; official sources corroborate 2014–15 postdoc.'])
  if adam:v['title']='Postdoctoral Researcher'
  r['firstJobReview']=v;hr['firstJobAssessment']=copy.deepcopy(v)
 h['records'].append(hr)
m=g['metadata'];m.update(updatedAt=D,records=len(g['records']),sightings=sum(len(x['sightings']) for x in g['records']),linkedToPeople=sum(bool(x.get('facultyId')) for x in g['records']),verifiedGraduateFirstJobs=sum(bool(x.get('firstJobReview')) and not x.get('facultyId') for x in g['records']))
m['byField']={k:sum(x['field']==k for x in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for x in g['records'] for s in x['sightings']) for k in m['byArchive']}
c=next((c for c in m['coverage'] if c['institution']=='Massachusetts Institute of Technology' and c.get('listedYear')==2014),None)
if c is None:c=dict(institution='Massachusetts Institute of Technology',listedYear=2014,field='operations');m['coverage'].append(c)
c.update(names=5,linked=1,pages=list(dict.fromkeys(s['pageUrl'] for x in rows for s in x['sightings'])),rosterStatus='partial')
write(R/'data/graduate-lists.json',g,1);write(R/'data/employment-histories.json',h)
write(O/'applied.json',dict(graduateRecordsAdded=added,newPartialHistoryIds=[r.get('facultyId') or r['id'] for r in rows],newVerifiedFirstJobs=2,remainingFirstJobGaps=['Ross Michael Anderson','Zhe Zhu'],existingGuptaFirstJobPreserved=True,newStructuredRoles=sum(len(x['jobs']) for x in h['records'][-5:]),newSupportingMentions=sum(len(x['otherEmploymentMentions']) for x in h['records'][-5:])))
print('Integrated five graduates, five partial histories, two supported first jobs.')
