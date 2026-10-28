"""Root integration of individually read full LinkedIn Experience, 28 October."""
import pathlib,json,copy
R=pathlib.Path(__file__).resolve().parents[2];O=pathlib.Path(__file__).parent;D='2026-10-28'
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def date(s):
 if s=='Present':return dict(asWritten=s,year=None,month=None,precision='unknown')
 parts=s.split('-');return dict(asWritten=s,year=int(parts[0]),month=int(parts[1]) if len(parts)>1 else None,precision='month' if len(parts)>1 else 'year')
specs=[('david-erik-fagnan','David Erik Fagnan','dfagnan',[
 ('Netflix','Engineering Manager, Machine Learning','2025-02','Present','Full-time','Seattle, Washington, United States · Remote',False),
 ('Artica','Chief Analytics Officer','2021-09','2024-10','Full-time','Bellevue, Washington, United States · On-site',False),
 ('Zillow','Director - Applied Science - Zillow Offers','2019-02','2021-09','Full-time',None,False),
 ('Zillow','Sr. Manager, Applied Science - Zillow Offers','2018-02','2019-02',None,None,False),
 ('Zillow','Sr. Manager, Applied Science','2017-02','2018-02',None,'Greater Seattle Area',False),
 ('Zillow','Senior Data Scientist','2015-07','2017-01',None,'Greater Seattle Area',False),
 ('MIT','PhD Student','2011-09','2015-06',None,None,True),
 ('State Street','PhD Intern - State Street Global Exchange','2014-06','2014-08',None,'Cambridge, MA',True),
 ('Analytics Operations Engineering','PhD Summer Intern','2013-06','2013-08',None,'Boston, MA',True),
 ('QuIC Financial Technology','Financial Engineering Intern','2009-07','2009-09',None,'Greater Vancouver Metropolitan Area',True)
 ]),('dimitrios-bisias','Dimitrios Bisias','dimitrios-b-3837a23',[
 ('DRW','Quantitative Portfolio Manager','2025','Present','Full-time','Miami, Florida, United States',False),
 ('ExodusPoint Capital Management, LP','Quantitative Portfolio Manager','2022','2024',None,'Miami, Florida, United States',False),
 ('Cubist Systematic Strategies','Quantitative Portfolio Manager','2018','2022',None,'New York, United States',False),
 ('Cubist Systematic Strategies','Quantitative Researcher','2015','2018',None,'New York, United States',False),
 ('Goldman Sachs','Strategist','2013-06','2013-08',None,None,False),
 ('Barclays Capital','Quantitative Analytics','2011-06','2011-08',None,None,False),
 ('Merrill Lynch','Risk Management','2007-03','2008-05',None,None,False)
 ])]
p=R/'data/employment-histories.json';h=json.loads(p.read_text(encoding='utf8'));before=[];observations=[]
for slug,name,handle,roles in specs:
 pid='grad:massachusetts-institute-of-technology:'+slug+':2015';r=next(x for x in h['records'] if x['id']==pid);assert not r.get('profileHistoryComplete');before.append(copy.deepcopy(r));u='https://www.linkedin.com/in/'+handle+'/'
 jobs=[];mentions=[]
 for e,t,s,end,typ,loc,mention in roles:
  j=dict(employerAsWritten=e,titleAsWritten=t,employmentTypeAsWritten=typ,locationAsWritten=loc,start=date(s),end=date(end),isCurrent=end=='Present',sourceUrl=u,checkedAt=D,sourceSection='Full Experience page, all accessible entries',evidenceNote='Individually read self-reported employment entry; original date precision retained.',employerGroup=e if e in ['Zillow','Cubist Systematic Strategies'] else None)
  if t=='PhD Student':j['evidenceNote']='Profile Experience lists doctoral study September2011–June2015; student status is not paid employment or a formal degree-conferral date.'
  if e=='Zillow' and t.startswith('Director'):
   j['additionalSourceUrls']=['https://events.zillowgroup.com/aiforum2019'];j['evidenceNote']+=' Official2019 employer event corroborates Director of Applied Science title; LinkedIn supplies interval.'
  (mentions if mention else jobs).append(j)
 obs=dict(personId=pid,name=name,profileUrl=u,checkedAt=D,reviewer='Codex root, Chrome individual read',identityBasis='Andrew Lo official MIT doctoral-students page directly links this exact profile and records Operations Research2015; profile education and career agree.',experienceAccess='read-all-visible',profileHistoryComplete=True,careerComplete=False,jobs=jobs+mentions,otherEmploymentMentions=[],firstJobAssessment=None,remainingUnknowns=['Formal doctorate completion boundary and unrestricted first-job sequence unresolved.'],integrationStatus='reviewed and integrated')
 if 'fagnan' in slug:obs['educationObservation']='MIT PhD Operations Research2011–2015, exact thesis Analytics for financing drug development. Experience study endpointJune2015 is not formal conferral.'
 else:obs['educationObservation']='MIT Sloan PhD Operations Research and Stanford MS Electrical Engineering; doctorate dates absent.'
 observations.append(obs)
 r['jobs']=jobs;r['otherEmploymentMentions']+=mentions
 r.update(profileHistoryComplete=True,experienceAccess='read-all-visible',identityBasis=obs['identityBasis'],coverageNote='All accessible Experience entries read individually on the full LinkedIn Experience page. Self-reported profile capture is complete; real-world career and first-job sequence remain partial.')
 r['accessLimitations']=['Earlier same-day header-only observation superseded by full loaded Experience read; no access-control bypass.']
 r['remainingUnknowns']=['Formal doctorate completion boundary and unrestricted first-job sequence unresolved.','Unreported career gaps and missing month dates are not filled.']
 r['otherEmploymentMentions'].append(dict(employerAsWritten='Massachusetts Institute of Technology',titleAsWritten='Doctoral chronology observation',sourceUrl=u,checkedAt=D,evidenceNote=obs['educationObservation']))
write(O/'followup-2026-10-28-0239-before.json',before);write(O/'followup-2026-10-28-0239-observations.json',observations);write(p,h)
print('Integrated17 accessible entries:13 structured roles and4 study/internship mentions; net12 structured roles added. First jobs remain unresolved.')
