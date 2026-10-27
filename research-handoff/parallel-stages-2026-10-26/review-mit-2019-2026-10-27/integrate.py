"""Reviewed one-shot MIT 2019 integration; do not replay after applied.json."""
import json,pathlib,copy,re,shutil,hashlib
from capture import date
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
assert not (O/'applied.json').exists()
g=read('data/graduate-lists.json');h=read('data/employment-histories.json');og=copy.deepcopy(g['records']);oh=copy.deepcopy(h['records'])
backup=pathlib.Path('research/mit-2019-before');backup.mkdir(parents=True,exist_ok=True)
for p in pathlib.Path('data').glob('*.json'):shutil.copy2(p,backup/p.name)
a=read(O/'degree-audit.json');cohort=read(O/'cohort-observations.json');obs=read(O/'identity-primary-observations.json')['records'];rootobs=read(O/'root-source-observations.json');gaps=read(O/'gap-audit.json')['records']
faculty={r['id'] for f in ['faculty','faculty-roster-people'] for r in read('data/'+f+'.json')['records']}
def sight(url,name,note,meaning='graduation'):
 return dict(sourceUrl=url,pageUrl=url,sourceDate=None,checkedAt='2026-10-27',archive='live',name=name,yearMeaning=meaning,program='PhD Operations Research',destination=None,position=None,degree='PhD',note=note,extractedAt='2026-10-27')
added=[]
for d in a['degreeRecords']:
 name=d['cohortName'];slug=re.sub('[^a-z0-9]+','-',name.lower()).strip('-');pid='grad:massachusetts-institute-of-technology:'+slug+':2019'
 assert not any(r['id']==pid for r in g['records'])
 c=next(x for x in cohort['records'] if x['name']==name);link=next((x for x in a['facultyLinks'] if x['cohortName']==name),None);fid=link['facultyId'] if link else None;assert not fid or fid in faculty
 period={'year':d['degreeYear'],'month':d['degreeMonth'],'precision':'month' if d['degreeMonth'] else 'year' if d['degreeYear'] else 'unknown','asWritten':('September 2019' if d['degreeMonth']==9 else str(d['degreeYear'])) if d['degreeYear'] else None}
 r=dict(id=pid,institution='Massachusetts Institute of Technology',name=name,listedYear=2019,field='operations',programId='mit-operations-research-phd',facultyId=fid,match='reviewed-primary-source-identity' if fid else None,matchLeads=[],careerOwner=('stage-2' if fid.startswith('omlist') else 'stage-3') if fid else ('stage-3' if name=='Ilias Zadik' else 'stage-4'),identityReview={'status':'reviewed','checkedAt':'2026-10-27','evidence':link or 'Exact official ORC thesis matched to reviewed individual degree and professional sources.'},degreeReview={'status':d['status'],'period':period,'awardDay':None,'field':d['field'],'checkedAt':'2026-10-27','sourceUrl':d['sourceUrl'],'evidenceNote':d['evidence']+' '+d['locator'],'dateEvidenceMeaning':d['dateEvidenceMeaning'],'limitations':d['limitations']+['Source-bounded ORC thesis cohort, not a census.']},sightings=[])
 if d.get('completionEvidenceBound'):r['degreeReview']['completionEvidenceBound']=d['completionEvidenceBound']
 r['sightings']=[sight(cohort['sourceUrl'],name,c['thesisTitle']+'; thesis date as written: '+c['thesisDateAsWritten'],'thesis'),sight(d['sourceUrl'],d['recipientName'],d['evidence']+' '+d['locator'])]
 if link:r['sightings'].append(sight(link['sourceUrl'],name,link['evidence'],'identity'))
 for ob in obs:
  if ob['name']==name:
   for s in ob['sources']:r['sightings'].append(sight(s['url'],ob.get('professionalName',name),s['evidence'],'career-observation'))
 for ob in rootobs:
  if ob['name']==name:r['sightings'].append(sight(ob['sourceUrl'],name,ob['evidence'],'career-observation'))
 for m in a['supplementaryMilestones']:
  if name in m['names']:r.setdefault('degreeMilestones',[]).append(dict(kind='reported-completion',displayText=m['evidence'],sourceUrl=m['sourceUrl'],checkedAt=m['checkedAt'],evidenceNote=m['evidence'],limitation='Reported milestone, not independently verified formal conferral.',formalAwardDateAssigned=False))
 if name=='Haihao Lu':r['sightings'][1]['program']='PhD Mathematics and Operations Research'
 g['records'].append(r);added.append(pid)
cv='https://colinpawlowski.com/assets/files/Pawlowski_resume_September_2024.pdf'
simchi='https://bpb-us-e1.wpmucdn.com/sites.mit.edu/dist/9/1246/files/2025/01/vita_dsl.pdf'
reasons={
 'christopher-george-mccord':('Jump Trading','Quantitative Researcher','Jul 2019','industry','professional-employee','Princeton biography explicitly puts the MIT PhD before the next five years in quantitative trading; the identity-matched full profile dates Jump July 2019–May 2024.','https://orfe.princeton.edu/undergraduate/guide'),
 'colin-pawlowski':('nference','Translational Scientist','Jul 2019','industry','professional-employee','Personal CV explicitly reports PhD June 2019, followed by Translational Scientist July–December 2019. Later Director title is not backdated to the initial role.',cv),
 'konstantina-mellou':('Microsoft','Postdoctoral Researcher','Sep 2019','industry','postdoc','MIT dated graduation announcement lists her among PhD graduates by June 7, 2019; full profile dates Microsoft postdoc September 2019. Internships remain separate.','https://idss.mit.edu/news/idss-congratulates-2019-graduates/'),
 'evan-fields':('Zoba','Lead Data Scientist','Sep 2018','industry','professional-employee','Personal biography explicitly places the MIT PhD before joining Zoba; full profile describes leaving academia post-PhD and dates initial Zoba role September 2018. Formal 2018/2019 award discrepancy remains unresolved.','https://evanfields.net/about/'),
 'mila-nambiar':('A*STAR - Agency for Science, Technology and Research',None,'Oct 2019','government','unknown','Official recipient record gives September 2019; full profile starts A*STAR October 2019 after the MIT research role. Senior Scientist is an aggregate five-year title; initial title and promotion dates are not established.',simchi),
 'nishanth-mundru':('University of North Carolina at Chapel Hill','Clinical Assistant Professor','Jul 2019','academia','unknown','Personal biography explicitly places the MIT doctorate before the UNC appointment; full profile dates UNC July 2019–June 2021 and distinguishes the predoctoral WorldQuant job and Google internship.','https://nmundru.github.io/')}
holds={
 'michael-francis-beeler':'Advisor reports graduation August 2019 and profile starts Athanor August 2019; same-month order unknown. Formal September recipient period retained separately.',
 'maximilien-burq':'Study range ends 2018, library degree/thesis year is 2019 and Verily starts November 2018. Actual completion before employment is not established.',
 'yee-sian-ng':'Personal biography gives degree year 2019; candidate role ends May and Google starts August, but study-role dates alone do not establish completion before employment.',
 'joel-tay':'Profile study range ends 2017, advisor thesis year is 2018 and ORC thesis is February 2019. Completion before October 2018 SIMTech role remains unestablished.'}
def mention(emp,title,note,url):return {'employerAsWritten':emp,'titleAsWritten':title,'evidenceNote':note,'sourceUrl':url,'checkedAt':'2026-10-27'}
decisions=[];historyids=[];verified=[]
for p in sorted(O.glob('*.history-proposal.json')):
 r=read(p);pid=r.pop('personId');r['id']=pid;r.pop('integrationStatus',None);r.update(reviewStatus='partial',careerComplete=False)
 assert not any(x['id']==pid for x in h['records'])
 gr=next(x for x in g['records'] if x['id']==pid);r['degreeReview']=copy.deepcopy(gr['degreeReview']);slug=p.name.split('.history')[0]
 r['linkedInCaptures']=[{k:r.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}]
 r['linkedInCaptures'][0]['coverageNote']='All accessible Experience entries read individually in Chrome, including Show all when offered; no completeness claim beyond the accessible profile.'
 r['coverageNote']=r['linkedInCaptures'][0]['coverageNote']
 keep=[];mentions=list(r.get('otherEmploymentMentions',[]))
 for j in r['jobs']:
  if any(w in j['titleAsWritten'].lower() for w in ['intern','research assistant','teaching assistant','phd candidate','phd student','student tutor']) or j.get('employmentTypeAsWritten')=='Internship':mentions.append({**j,'classificationNote':'Student/intern observation retained separately; not a post-PhD first-job conclusion.'})
  else:keep.append(j)
 r['jobs']=keep;r['otherEmploymentMentions']=mentions
 if slug=='colin-pawlowski':
  aggregate=next(j for j in r['jobs'] if j['employerAsWritten'].lower()=='nference');r['jobs'].remove(aggregate)
  r['otherEmploymentMentions'].append({**aggregate,'evidenceNote':'LinkedIn aggregate employer span with retrospective final title; dated CV disaggregates four roles below.'})
  for title,start,end in [('Translational Scientist','Jul 2019','Dec 2019'),('Data Science Partnerships Lead','Jan 2020','Jun 2020'),('Head of Data Sciences','Jul 2020','Nov 2020'),('Director and Head of Data Sciences','Nov 2020','Apr 2025')]:
   r['jobs'].append({'employerAsWritten':'nference','titleAsWritten':title,'start':date(start),'end':date(end),'isCurrent':False,'sourceUrl':cv,'checkedAt':'2026-10-27','sourceType':'personal-cv','evidenceNote':'CV supplies role boundaries through September 2024; final employer departure April 2025 is from LinkedIn aggregate.','supportingSources':[{'url':r['profileUrl'],'checkedAt':'2026-10-27'}]})
  r['otherEmploymentMentions'] += [mention('Mount Holyoke College','REU Undergraduate Researcher','Summer 2013; no invented month.',cv),mention('NASA Microgravity Research','Team Leader','2011–2012; student research activity, not inferred employment.',cv),mention('Massachusetts Institute of Technology','Research Assistant','CV 2014–2019; separate from profile PhD Candidate label.',cv)]
  r['remainingUnknowns']=['Exact award/start days and complete real-world history unknown.','Final nference departure from aggregate profile; CV was current only as of September 2024.']
 if slug=='maximilien-burq':
  r['otherEmploymentMentions'] += [mention('Verily','Senior Machine Learning Data Scientist / Technical Lead','CV starts January 2021, profile November 2020; conflicting promotion dates retained.','https://mburq.github.io/assets/CV_mburq.pdf'),mention('Stanford University','Visiting Student','CV says 2016, profile August 2017–August 2018; unresolved source variants.','https://mburq.github.io/assets/CV_mburq.pdf'),mention('Massachusetts Institute of Technology','Researcher','CV says 2013–2018, profile 2014–2018; source variants retained.','https://mburq.github.io/assets/CV_mburq.pdf')]
  r['remainingUnknowns'].append('Promotion and visiting-research date variants remain unresolved; neither source is silently preferred.')
 if slug=='joel-tay':
  r['otherEmploymentMentions'].append(mention('Singapore Institute of Manufacturing Technology','Deputy Head (Semiconductor Complex Equipment)','Current profile headline; exact promotion date unknown.',r['profileUrl']))
  for s in next(x for x in gaps if x['name']=='Joel Tay')['sources']:gr['sightings'].append(sight(s['url'],r['name'],s['evidence'],'career-observation'))
 if slug=='nishanth-mundru':
  r['otherEmploymentMentions'] += [mention('EPFL','Undergraduate summer research','Computational systems biology; date and pay status unknown.','https://nmundru.github.io/'),mention('National University of Singapore','Undergraduate summer research','Process control; date and pay status unknown.','https://nmundru.github.io/'),mention('Massachusetts Institute of Technology','Teaching Assistant','Courses Spring 2014, Spring 2015, Spring 2016, Summer 2017, Fall 2018; no continuous employment inferred.','https://nmundru.github.io/')]
 if slug=='yee-sian-ng':r['otherEmploymentMentions'].append(mention('Massachusetts Institute of Technology','Teaching Assistant','Courses Spring 2016, 2017, 2018 and 2019; no continuous appointment inferred.',r['profileUrl']))
 if slug in reasons:
  emp,title,start,sector,typ,reason,extra=reasons[slug]
  sources=[{'url':r['profileUrl'],'checkedAt':'2026-10-27','evidenceNote':reason},{'url':gr['degreeReview']['sourceUrl'],'checkedAt':'2026-10-27','evidenceNote':gr['degreeReview']['evidenceNote']}]
  if extra not in [s['url'] for s in sources]:sources.append({'url':extra,'checkedAt':'2026-10-27','evidenceNote':reason})
  first=dict(status='verified',definition='Earliest documented new appointment after doctorate completion',employer=emp,title=title,start=date(start),sector=sector,appointmentType=typ,checkedAt='2026-10-27',reason=reason,sources=sources,degreeBoundary='Reported academic completion and formal award are separate. No exact award or appointment day assigned; retained degree limitations apply.',limitations=['Source-bounded earliest documented appointment; real-world career remains partial.','Exact completion, award and appointment days unknown.'])
  if slug=='evan-fields':first['limitations'].append('Advisor 2018 and ORC February 2019 thesis dates disagree; formal award year unresolved. First-job sequence rests on explicit personal narrative, not a fabricated award date.')
  gr['firstJobReview']=first;r['firstJobAssessment']=copy.deepcopy(first);verified.append(pid)
 else:r['firstJobAssessment']=None;r['parkedCase']={'status':'parked-for-new-evidence','reason':holds[slug]};r['remainingUnknowns'].insert(0,holds[slug])
 for o in rootobs:
  if o['name']==r['name'] and slug in ['michael-francis-beeler','mila-nambiar','colin-pawlowski','konstantina-mellou','christopher-george-mccord']:
   gr.setdefault('degreeMilestones',[]).append({'kind':'reported-completion','displayText':o['evidence'],'sourceUrl':o['sourceUrl'],'checkedAt':'2026-10-27','evidenceNote':o['evidence'],'limitation':'Separate source observation; no exact formal award date assigned.','formalAwardDateAssigned':False})
 if gr.get('degreeMilestones'):r['degreeMilestones']=copy.deepcopy(gr['degreeMilestones'])
 gr['sightings'].append(sight(r['profileUrl'],r['name'],r['identityBasis'],'identity'))
 h['records'].append(r);historyids.append(pid);decisions.append({'id':pid,'firstJobAssessment':r['firstJobAssessment'],'remainingUnknowns':r['remainingUnknowns']})
m=g['metadata'];m.update(updatedAt='2026-10-27',records=len(g['records']),sightings=sum(len(r['sightings']) for r in g['records']),linkedToPeople=sum(bool(r.get('facultyId')) for r in g['records']),verifiedGraduateFirstJobs=sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records']))
m['byField']={k:sum(r['field']==k for r in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for r in g['records'] for s in r['sightings']) for k in m['byArchive']}
coverage=next(x for x in m['coverage'] if x['institution']=='Massachusetts Institute of Technology' and x['listedYear']==2019)
rows=[r for r in g['records'] if r['institution']=='Massachusetts Institute of Technology' and r['listedYear']==2019]
coverage.update(names=len(rows),linked=sum(bool(r.get('facultyId')) for r in rows),pages=list(dict.fromkeys(s['pageUrl'] for r in rows for s in r['sightings'])),rosterStatus='partial')
assert og==g['records'][:len(og)] and oh==h['records'][:len(oh)]
write(O/'decisions.json',decisions)
write(O/'input-manifest.json',[{'path':p.name,'sha256LF':hashlib.sha256(p.read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in sorted(O.glob('*.json')) if p.name!='input-manifest.json'])
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
write(O/'applied.json',{'graduateRecordsAdded':added,'newPartialHistoryIds':historyids,'verifiedFirstJobIds':verified,'remainingFirstJobIds':[x for x in historyids if x not in verified],'newStructuredRoles':sum(len(r['jobs']) for r in h['records'] if r['id'] in historyids),'newSupportingMentions':sum(len(r['otherEmploymentMentions']) for r in h['records'] if r['id'] in historyids),'olderRecordsPreserved':True})
print('Integrated',len(added),'graduates,',len(historyids),'partial histories,',len(verified),'first jobs.')
