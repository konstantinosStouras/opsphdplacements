from helpers import *
roots=['oid.wharton','business.columbia.edu/faculty/divisions/dro','kellogg.northwestern.edu/doctoral','scheller.gatech.edu/explore','mccombs.utexas.edu/placement']
audit=[x for x in out if x['status']=='verified' and any(z in x['evidenceUrl'] for z in roots)]
(p/'placement-table-audit-original.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf8')
for x in audit:
 if x['name'] in ['Santiago Gallino','Robert Swinney','Dennis Zhang','Marcus Bellamy']:continue
 x['status']='unresolved';x['reason']='Placement-table audit: the source reports a placement but does not explicitly establish first employment or exclude an earlier postdoc. Individual CV chronology is required.'
 if x['name']=='Park Sinchaisri':
  x['reason']='CV dates both Berkeley assistant professorship and Wharton lecturer appointment to July 2021, following May 2021 PhD. Same-month competing appointments prevent a unique first employer determination.';x['sources'].append(dict(url='https://parksinchaisri.github.io/files/cv.pdf',title='Park Sinchaisri curriculum vitae',notes=x['reason']))
 for k in ['employer','position','placementYear','category','phdYearVerified','evidenceNote','evidenceUrl','phdYearResolution']:x.pop(k,None)
for name,employer,year,note in [
('Santiago Gallino','Dartmouth College',2013,'CV gives Pennsylvania PhD May 2013 and Dartmouth assistant professorship starting summer 2013.'),
('Robert Swinney','Stanford University',2008,'CV gives Pennsylvania OM PhD 2008 and Stanford assistant professorship 2008-2012 as first academic appointment.'),
('Dennis Zhang','Washington University in St. Louis',2016,'CV gives Northwestern doctorate 2016 and Washington University assistant professorship from 2016. Earlier industry roles are expressly internships.'),
('Marcus Bellamy','Boston University',2015,'CV gives Georgia Tech OM PhD 2015 and Boston University assistant professorship from 2015 as first academic appointment.')]:
 old=next(x for x in out if x['name']==name);out.remove(old);cv(old['facultyId'],employer,year,'Assistant Professor','unknown',note);out[-1]['sources']+=old['sources']
save()
