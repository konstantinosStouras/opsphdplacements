"""Preserve individually read MIT2020 observations; no public writes."""
from capture import *
save('kevin-zhang','Kevin Zhang','https://www.linkedin.com/in/kzhang4400/','MIT Operations Research PhD 2014–2020, Yale mathematics/statistics 2008–2012 and Volpe employer match the official Volpe biography and ORC thesis.',[
('U.S. DOT Volpe National Transportation Systems Center','Data Scientist','Jul 2020','Present','Full-time','Cambridge, Massachusetts, United States'),
('Analytics Operations Engineering (acquired by McKinsey)','Analyst','Sep 2012','Jul 2014',None,None),
('Federal Reserve Bank of Kansas City','Economic Research Intern','May 2011','Aug 2011',None,None),
('United States Department of Defense','Summer Research Intern','May 2010','Aug 2010',None,None)],['Official current title Mathematical Statistician differs from LinkedIn Data Scientist; promotion/reclassification date unknown.','Exact award and appointment days unknown; employer explicitly reports doctorate before joining.'])
levi='https://mitsloan.mit.edu/sites/default/files/faculty-cv/2022/08/29/cv-document-10881.pdf'
umass='https://websites.umass.edu/umassinf/author/csipetas/'
save('michael-hu','Michael Hu',levi,'Advisor Retsef Levi lists MIT ORC PhD Michael Hu graduating2020 and assuming position at MGH; university-hosted October23,2020 event identifies Dr Michael Hu at MGH.',[],['Appointment start/end unknown.','No complete career source or identity-matched LinkedIn profile read.'])
p=OUT/'michael-hu.history-proposal.json';r=json.loads(p.read_text());r.update(experienceAccess='primary-biography-observations',profileHistoryComplete=False,coverageNote='Two primary observations, not a complete career history. MGH role observed October 2020; current employment is unknown.')
r['jobs']=[{'employerAsWritten':'Massachusetts General Hospital','titleAsWritten':'Operations Research Scientist','start':date(None),'end':date(None),'isCurrent':False,'sourceUrl':umass,'checkedAt':'2026-10-27','sourceType':'official-university-event','evidenceNote':'October23,2020 event identifies Dr Michael Hu as MGH Operations Research Scientist. This is an observation date, not start date; no present-day employment claim.'}]
p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
