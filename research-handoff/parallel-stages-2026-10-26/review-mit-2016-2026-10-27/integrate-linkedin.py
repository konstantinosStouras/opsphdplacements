import json,pathlib,copy
from capture import date
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,x,n=2):pathlib.Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
h=read('data/employment-histories.json');g=read('data/graduate-lists.json')
for slug in ['nataly-youssef','rong-yuan']:
 p=read(O/(slug+'-linkedin.history-proposal.json'));pid='grad:massachusetts-institute-of-technology:'+slug+(':unknown' if slug=='rong-yuan' else ':2016');p['personId']=pid;write(O/(slug+'-linkedin.history-proposal.json'),p)
 r=next(x for x in h['records'] if x['id']==pid);gr=next(x for x in g['records'] if x['id']==pid)
 assert not r.get('linkedInCaptures')
 if slug=='nataly-youssef':
  kept=[]
  for j in r['jobs']:
   if j['employerAsWritten'] in ['Reclaim Health','P2 Analytics']:r['otherEmploymentMentions'].append({**j,'evidenceNote':j['evidenceNote']+' Undated biography observation retained; individually read profile supplies dated role below.'})
   else:kept.append(j)
  r['jobs']=kept
 for j in p['jobs']:
  (r['otherEmploymentMentions'] if any(t in j['titleAsWritten'].lower() for t in ['intern','research assistant']) else r['jobs']).append(j)
 r.update(profileUrl=p['profileUrl'],experienceAccess='read-all-visible',profileHistoryComplete=True,coverageNote='Entire accessible LinkedIn Experience read individually in Chrome, including all expanded/grouped entries; primary-source observations retained. Real-world career remains partial.',remainingUnknowns=p['remainingUnknowns'])
 r['linkedInCaptures']=[{k:r.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}]
 if slug=='rong-yuan':r['otherEmploymentMentions'].append({'employerAsWritten':'Harvard SEED on Social Innovation','titleAsWritten':'President (volunteering)','start':date('Sep 2015'),'end':date('Present'),'sourceUrl':p['profileUrl'],'checkedAt':'2026-10-27','evidenceNote':'Profile Volunteering section reports September2015–present; service activity, not inferred paid employment.'})
 if slug=='nataly-youssef':
  milestone={'kind':'reported-study-period','displayText':'LinkedIn doctoral study period2011–2015; MIT alumni biography labels PhD2016. Completion and formal award timing unresolved.','sourceUrl':p['profileUrl'],'checkedAt':'2026-10-27','evidenceNote':'Entire loaded Education and Experience sections read; MIT RA ends December2015 and P2 starts January2016.','limitation':'A study endpoint is not a formal conferral date; no explanation of the2015/2016 difference inferred.','formalAwardDateAssigned':False}
  gr['degreeMilestones'].append(milestone);r['degreeMilestones']=copy.deepcopy(gr['degreeMilestones'])
 for m in r['remainingUnknowns']:
  pass
 gr['sightings'].append({'sourceUrl':p['profileUrl'],'pageUrl':p['profileUrl'],'sourceDate':None,'checkedAt':'2026-10-27','archive':'live','name':r['name'],'yearMeaning':'career-observation','program':'PhD Operations Research','destination':None,'position':None,'degree':'PhD','note':p['identityBasis']+' Entire accessible Experience read; source dates retained without inferring first job.','extractedAt':'2026-10-27'})
d=next(x for x in h['records'] if x['name']=='Iain Robert Dunning');d['otherEmploymentMentions'].append({'employerAsWritten':'Google DeepMind','titleAsWritten':'Research Engineer (prospective announcement)','sourceUrl':'https://orc.mit.edu/testimonials/iain-dunning/','checkedAt':'2026-10-27','evidenceNote':'Root opened official testimonial in reconnected Chrome: future-tense intention to work at DeepMind after graduation. Does not independently prove completion occurred before July2016 start.'});d['remainingUnknowns'].append('MIT testimonial is prospective, not proof of completed degree before July2016 DeepMind start; first-job conclusion remains withheld.')
g['metadata']['sightings']=sum(len(x['sightings']) for x in g['records']);g['metadata']['byArchive']={k:sum(s.get('archive','live')==k for x in g['records'] for s in x['sightings']) for k in g['metadata']['byArchive']}
for c in g['metadata']['coverage']:
 if c['institution']=='Massachusetts Institute of Technology' and c.get('listedYear')==2016:c['pages']=list(dict.fromkeys(s['pageUrl'] for x in g['records'] if x['institution']==c['institution'] and x.get('listedYear')==2016 for s in x['sightings']))
write('data/employment-histories.json',h);write('data/graduate-lists.json',g,1)
a=read(O/'applied.json');ids=a['newPartialHistoryIds'];a.update(newStructuredRoles=sum(len(x['jobs']) for x in h['records'] if x['id'] in ids),newSupportingMentions=sum(len(x.get('otherEmploymentMentions',[])) for x in h['records'] if x['id'] in ids),individuallyReadLinkedInProfiles=2);write(O/'applied.json',a)
print(a['newStructuredRoles'],a['newSupportingMentions'])
