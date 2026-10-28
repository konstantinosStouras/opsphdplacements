"""Root integration: individually read Maokai Lin profile; no first-job inference."""
import json,copy,pathlib
R=pathlib.Path(__file__).resolve().parents[2]; O=pathlib.Path(__file__).parent
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def dt(s):
 if s=='Present':return dict(asWritten=s,year=None,month=None,precision='unknown')
 y,m=s.split('-');return dict(asWritten=s,year=int(y),month=int(m),precision='month')
p=R/'data/employment-histories.json';h=json.loads(p.read_text(encoding='utf8'))
r=next(x for x in h['records'] if x['id']=='grad:massachusetts-institute-of-technology:maokai-lin:2015')
assert not r['profileHistoryComplete'];save(O/'followup-2026-10-28-0309-before.json',r)
u='https://www.linkedin.com/in/maokailin/';D='2026-10-28'
r['jobs']=[]
for e,t,s,end,loc in [('Smarking Inc.','Co-Founder and CTO','2015-01','Present','San Francisco, CA'),('Facebook','Data Scientist','2013-06','2013-08','Menlo Park, CA'),('Morgan Stanley','Summer Associate','2011-06','2011-08','New York City')]:
 j=dict(employerAsWritten=e,titleAsWritten=t,employmentTypeAsWritten=None,locationAsWritten=loc,start=dt(s),end=dt(end),isCurrent=end=='Present',sourceUrl=u,checkedAt=D,sourceSection='Entire accessible Experience section',evidenceNote='Individually read self-reported role and dates; employment type not stated.')
 if e=='Smarking Inc.':
  j['additionalSourceUrls']=['https://web.mit.edu/jaillet/www/research/','https://meche.mit.edu/node/1593']
  j['evidenceNote']+=' Adviser confirms co-founder/CTO. LinkedIn start January 2015 differs from MIT News describing company-building during doctoral study in 2014. Preserve the stated role interval without treating it as the company founding date or a verified first post-PhD job. Present is self-reported at check date.'
 r['jobs'].append(j)
r['otherEmploymentMentions'].append(dict(employerAsWritten='Massachusetts Institute of Technology',titleAsWritten='Doctoral education observation',sourceUrl=u,checkedAt=D,evidenceNote='LinkedIn Education lists PhD, Operations Research, 2009–2014; MS Computation for Design and Optimization, 2007–2009. Study endpoint does not establish conferral; earlier MIT thesis/adviser 2015 and MIT News PhD14 conflict remains.'))
r.update(profileHistoryComplete=True,experienceAccess='read-all-visible',coverageNote='All three accessible Experience entries read individually in Chrome. No Show all experiences control was present. Complete profile capture is not complete lifetime career.',identityBasis='Maokai profile matched by MIT Operations Research doctorate and Smarking co-founder/CTO role to official MIT adviser and MIT News records.',accessLimitations=['Earlier header-only observation superseded by loaded full Experience section; no access-control bypass.'],remainingUnknowns=['Formal doctorate year and completion boundary unresolved: study endpoint 2014 versus thesis/adviser 2015.','Smarking company-building began during doctoral study; LinkedIn role start January 2015 does not establish a new post-degree appointment.','No unrestricted first-job sequence or complete lifetime history established.'])
save(p,h)
save(O/'followup-2026-10-28-0309-observations.json',dict(personId=r['id'],profileUrl=u,checkedAt=D,identityBasis=r['identityBasis'],experienceAccess=r['experienceAccess'],profileHistoryComplete=True,careerComplete=False,jobs=r['jobs'],educationObservation=r['otherEmploymentMentions'][-1],firstJobAssessment=None,integrationStatus='reviewed and integrated'))
