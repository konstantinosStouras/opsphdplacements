"""One-shot root integration of reviewed MIT2015 evidence; do not replay."""
import json,pathlib,copy,re,unicodedata,shutil
O=pathlib.Path(__file__).resolve().parent
R=O.parents[2]
D='2026-10-28'
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
def slug(n):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()).strip('-')
def date(y):return dict(asWritten=str(y) if y else None,year=y,month=None,precision='year' if y else 'unknown')
def sight(u,n,note,meaning='career-observation'):return dict(sourceUrl=u,pageUrl=u,sourceDate=None,checkedAt=D,archive='live',name=n,yearMeaning=meaning,program='PhD Operations Research',destination=None,position=None,degree='PhD',note=note,extractedAt=D)
assert not (O/'applied.json').exists()
g=read(R/'data/graduate-lists.json');h=read(R/'data/employment-histories.json')
B=R/'research/mit-2015-before';assert not B.exists();B.mkdir(parents=True)
for f in (R/'data').glob('*.json'):shutil.copy2(f,B/f.name)
people={}
for filename in ['primary-a.json','primary-b.json','primary-c.json']:
 data=read(O/filename)
 for p in data['people']:
  if not p.get('sources'):
   ids=set(p.get('degree',{}).get('sourceIds',[]))
   for role in p.get('roles',[]):ids.update(role.get('sourceIds',[]))
   p['sources']=[s for s in data['sources'] if s['id'] in ids]
  people[p.get('cohortName',p['name'])]=p
cohort=read(O/'cohort-observation.json');orc=cohort['sourceUrl'];rows=[];added=[];updated=[]
for c in cohort['records']:
 p=people[c['name']];name=p['name'];fid=p.get('existingFacultyId') or p.get('existingPersonId')
 pid='grad:massachusetts-institute-of-technology:'+slug(name)+':2015'
 if 'Calmon' in name:pid='grad:massachusetts-institute-of-technology:andre-calmon:unknown'
 r=next((x for x in g['records'] if x['id']==pid),None)
 if r is None:r=dict(id=pid,sightings=[]);g['records'].append(r);added.append(pid)
 else:updated.append(pid)
 ss=p['sources'];identity=p.get('identity') or p.get('identityEvidence') or 'MIT ORC named thesis matched to individual primary doctoral and career evidence.'
 r.update(institution='Massachusetts Institute of Technology',name=name,listedYear=2015,field='operations',programId='mit-operations-research-phd',facultyId=fid,match='reviewed-primary-source-identity' if fid else None,matchLeads=[],careerOwner='stage-2' if str(fid).startswith('omlist-') else 'stage-3' if fid else 'stage-4',identityReview=dict(status='reviewed',checkedAt=D,evidence=identity))
 ds=next((s for s in ss if s.get('id') in p.get('degree',{}).get('sourceIds',[])),ss[0])
 r['degreeReview']=dict(status='reported-doctorate',period=date(2015),awardDay=None,field='Operations Research',checkedAt=D,sourceUrl=ds['url'],evidenceNote=p.get('degreeEvidence') or ds.get('evidence') or ds.get('readDetail'),dateEvidenceMeaning='Source-reported doctorate; thesis, study endpoint and formal conferral remain separate.',limitations=['Formal award month/day independently unverified.','ORC thesis list is source-bounded, not a graduating-class census.'])
 r['sightings'].append(sight(orc,name,c['thesisTitle']+'; thesis listed '+str(c['thesisMonth'])+'/2015.','thesis'))
 r['sightings'] += [sight(s['url'],name,s.get('evidence') or s.get('readDetail')) for s in ss]
 r['degreeMilestones']=[dict(kind='thesis-date',displayText='ORC thesis list: '+str(c['thesisMonth'])+'/2015.',sourceUrl=orc,checkedAt=D,evidenceNote=c['thesisTitle'],limitation='Thesis timing is not necessarily completion or formal conferral.',formalAwardDateAssigned=False)]
 if name=='Maokai Lin':
  r['degreeReview'].update(period=date(None),evidenceNote='MIT library and adviser report 2015; MIT News labels PhD14. Degree-year conflict remains unresolved.')
  r['degreeReview']['limitations'].append('Conflicting 2014/2015 degree-year observations; thesis-listed year is not adjudicated conferral year. Smarking founding overlaps doctoral study.')
  r['degreeMilestones'].append(dict(kind='conflicting-degree-year',displayText='MIT News reports PhD14; library thesis and adviser use 2015.',sourceUrl=ss[2]['url'],checkedAt=D,evidenceNote=ss[2]['evidence'],limitation='No formal degree-year resolution.',formalAwardDateAssigned=False))
 if name=='Maxime C. Cohen':r['degreeMilestones'].append(dict(kind='reported-completion',displayText='Adviser CV reports graduation August 2015.',sourceUrl=ss[1]['url'],checkedAt=D,evidenceNote=ss[1]['evidence'],limitation='Separate from September thesis listing; formal award day unverified.',formalAwardDateAssigned=False))
 rows.append(r)
new=[];changed=[];reconciliations=[]
for f in sorted(O.glob('*.history-proposal.json')):
 p=read(f);pid=p['personId'];gr=next(x for x in rows if x['id']==pid or x.get('facultyId')==pid)
 r=copy.deepcopy(p)
 for key in ['personId','integrationStatus','sourceObservations','sourceObservationFile','existingHistoryReview']:r.pop(key,None)
 r.update(id=pid,reviewStatus='partial',careerComplete=False,recordIds=[gr['id']] if gr.get('facultyId') else [],identityBasis=gr['identityReview']['evidence'],degreeReview=copy.deepcopy(gr['degreeReview']),degreeMilestones=copy.deepcopy(gr['degreeMilestones']),firstJobAssessment=None,coverageNote='Accessible primary career evidence reviewed. Coverage is partial; source-dated roles do not establish a complete career.')
 for m in r.get('otherEmploymentMentions',[]):
  obs=m.pop('observation',None)
  if obs is not None:m.update(employerAsWritten=obs.get('employer') if isinstance(obs,dict) else None,titleAsWritten=obs.get('title','Supporting professional observation') if isinstance(obs,dict) else 'Supporting professional observation',evidenceNote=json.dumps(obs,ensure_ascii=False) if isinstance(obs,dict) else str(obs))
  m['sourceUrl']=m.get('sourceUrl') or next((u for u in m.get('sourceUrls',[]) if u),gr['degreeReview']['sourceUrl'])
  m.setdefault('evidenceNote','Supporting primary-source observation.');m.pop('sourceObservationFile',None)
 keep=[]
 for j in r['jobs']:
  j.pop('sourceObservation',None)
  if gr['name']=='Benjamin Letham' and j['employerAsWritten']=='Meta':
   j['titleAsWritten']='Research scientist (initial rank unspecified)';j['evidenceNote']+=' Corporate biography reports Meta employment from 2015 and current Senior Staff rank; promotion timing is unknown, so Senior Staff is not assigned to 2015.'
  if any(w in (j.get('titleAsWritten') or '').lower() for w in ['intern','research assistant','teaching assistant','guest lecturer']):r['otherEmploymentMentions'].append(j)
  else:keep.append(j)
 r['jobs']=keep
 old=next((x for x in h['records'] if x['id']==pid),None)
 if old:
  # Preserve all previously reviewed dated jobs, checks and assessments exactly.
  old['recordIds']=list(dict.fromkeys(old.get('recordIds',[])+[gr['id']]))
  old['degreeMilestones']=old.get('degreeMilestones',[])+r['degreeMilestones']
  old.setdefault('otherEmploymentMentions',[])
  if 'Calmon' in gr['name']:
   extra=[j for j in r['jobs'] if 'Director' in (j.get('titleAsWritten') or '')]
   old['otherEmploymentMentions']+=extra+r['otherEmploymentMentions']
  else:
   for j in r['jobs']:
    old['otherEmploymentMentions'].append(dict(employerAsWritten=j['employerAsWritten'],titleAsWritten='Corroborating primary-source observation',sourceUrl=j['sourceUrl'],checkedAt=D,evidenceNote=j['titleAsWritten']+'. '+j['evidenceNote']+' Previously reviewed dated employment intervals remain authoritative; this is not an additional appointment.'))
  changed.append(pid);reconciliations.append(dict(id=pid,decision='Preserved all existing jobs and first-job assessment; added graduate linkage and source observations.'))
 else:h['records'].append(r);new.append(pid)
profiles=[('Dimitrios Bisias','dimitrios-b-3837a23','Quantitative Portfolio Manager; employer not shown.'),('David Erik Fagnan','dfagnan','Machine Learning leader; MIT PhD, Netflix, Zillow, Artica mentioned in header; no job dates.'),('Maokai Lin','maokailin','Co-Founder & CTO at Smarking; MIT.'),('Benjamin Letham','bletham','Senior Staff Research Scientist at Meta; MIT. Claritev board announcement in activity.')]
observations=[]
for name,handle,note in profiles:
 gr=next(x for x in rows if x['name']==name);hr=next(x for x in h['records'] if x['id']==gr['id']);url='https://www.linkedin.com/in/'+handle+'/'
 hr['profileUrl']=url;hr['profileHistoryComplete']=False
 hr['accessLimitations'].append('Chrome profile header/activity individually read on 2026-10-28; Experience and Education were not visible. No full employment capture or dates inferred.')
 hr['otherEmploymentMentions'].append(dict(employerAsWritten=None,titleAsWritten='LinkedIn professional header observation',sourceUrl=url,checkedAt=D,evidenceNote=note+' Header only; not a complete employment history.'))
 observations.append(dict(name=name,profileUrl=url,checkedAt=D,access='header-and-activity-only',experienceVisible=False,profileHistoryComplete=False,professionalObservation=note))
write(O/'browser-observations.json',observations)
m=g['metadata'];m.update(updatedAt=D,records=len(g['records']),sightings=sum(len(x['sightings']) for x in g['records']),linkedToPeople=sum(bool(x.get('facultyId')) for x in g['records']),verifiedGraduateFirstJobs=sum(bool(x.get('firstJobReview')) and not x.get('facultyId') for x in g['records']))
m['byField']={k:sum(x['field']==k for x in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for x in g['records'] for s in x['sightings']) for k in m['byArchive']}
for c in m['coverage']:
 if c['institution']=='Massachusetts Institute of Technology' and c.get('listedYear') in [2015,None]:
  rr=[x for x in g['records'] if x['institution']==c['institution'] and x.get('listedYear')==c.get('listedYear')];c.update(names=len(rr),linked=sum(bool(x.get('facultyId')) for x in rr),pages=list(dict.fromkeys(s['pageUrl'] for x in rr for s in x['sightings'])),rosterStatus='partial')
write(R/'data/graduate-lists.json',g,1);write(R/'data/employment-histories.json',h)
write(O/'applied.json',dict(graduateRecordsAdded=added,graduateRecordsUpdated=updated,newPartialHistoryIds=new,updatedHistoryIds=changed,reconciliations=reconciliations,newVerifiedFirstJobs=0,newStructuredRoles=sum(len(x['jobs']) for x in h['records'] if x['id'] in new),newSupportingMentions=sum(len(x.get('otherEmploymentMentions',[])) for x in h['records'] if x['id'] in new)))
print('Integrated',len(added),'new graduates;',len(updated),'graduate correction;',len(new),'new histories;',len(changed),'additive history updates.')
