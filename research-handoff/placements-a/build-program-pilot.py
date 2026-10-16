import json
from pathlib import Path
D='2026-10-16'
programs=[]
def source(id,url,title,note):return dict(id=id,url=url,title=title,notes=note,lastCheckedAt=D,sourceType='official-primary',access='opened-and-read')
def program(id,university,school,name,degree,fields,sources,scope,status='active',history=None):
 p=dict(id=id,university=university,school=school,department=None,programName=name,degree=degree,field='; '.join(fields),fields=fields,status=status,statusAsOf=D,checkedAt=D,lastCheckedAt=D,establishedYear=None,admissionsEndedAt=None,lastDegreeAwardedAt=None,closureDate=None,renamedTo=None,history=history or [],scopeRationale=scope,eligibilityScope=scope,evidenceNote=' '.join(s['notes'] for s in sources),sources=sources,facts=[])
 for field in ['university','school','programName','degree','fields','status','eligibilityScope']:
  p['facts'].append(dict(field=field,value=p[field],lastCheckedAt=D,sourceIds=[s['id'] for s in sources],evidenceNote='See the cited official program description and the source-specific supporting notes.'))
 for field in ['establishedYear','admissionsEndedAt','lastDegreeAwardedAt','closureDate']:
  p['facts'].append(dict(field=field,value=None,lastCheckedAt=D,sourceIds=[],evidenceNote='Not established in the reviewed primary sources. Null is not a claim that the event did not occur.'))
 programs.append(p)
 return p

program('mit-operations-research-phd','Massachusetts Institute of Technology','Operations Research Center; jointly reports to MIT Sloan and MIT Schwarzman College of Computing','Operations Research','PhD',['Operations Research'],[
 source('mit-catalog','https://catalog.mit.edu/interdisciplinary/graduate-programs/operations-research/','MIT Course Catalog — Operations Research','Current catalog explicitly identifies the OR PhD and interdepartmental center; joint reporting does not determine each graduate’s department.')],
 'Operations Research doctorate; separate from the OR SM and Business Analytics master’s. Center founding year is not treated as first PhD intake or award year.')

p=program('stanford-operations-research-phd-historical','Stanford University','School of Engineering; historical Operations Research program','Operations Research','PhD',['Operations Research'],[
 source('stanford-current','https://msande.stanford.edu/academics-admissions/graduate/phd-program','Stanford MS&E — PhD Program','Current MS&E PhD prepares students for research and technical roles across universities, industry and government.'),
 source('stanford-history','https://or.stanford.edu/oras_history.html','Stanford Operations Research — History','University approved a committee to administer the OR PhD in 1962; seven PhDs were awarded in 1965. OR now resides within MS&E after 1996 and 2000 departmental mergers.'),
 source('stanford-mse-history','https://msande.stanford.edu/our-culture/our-story','Stanford MS&E — Our Story','MS&E became a department in 2000 on completion of mergers involving OR, Engineering-Economic Systems, and Industrial Engineering-Engineering Management.')],
 'Historical Operations Research doctorate. Administrative succession into MS&E is documented; the last OR-title admission and degree award are not established.',status='unknown',history=[
 dict(event='OR doctoral program authorized and administering committee formed',year=1962,lastCheckedAt=D,sourceIds=['stanford-history']),
 dict(event='Seven OR PhD degrees awarded; not asserted to be first-ever awards beyond source wording',year=1965,lastCheckedAt=D,sourceIds=['stanford-history']),
 dict(event='OR department merged with Engineering-Economic Systems',year=1996,lastCheckedAt=D,sourceIds=['stanford-history']),
 dict(event='Departmental mergers completed; MS&E formed',year=2000,lastCheckedAt=D,sourceIds=['stanford-history','stanford-mse-history'])])
p['statusNote']='Historical OR doctorate documented. Current status of admissions under the historical credential, admissions ending and last degree award remain unknown. Departmental merger dates do not establish program closure.'
p['administrativeSuccessorProgramId']='stanford-management-science-engineering-phd'
p['successionRelationship']='Administrative succession only; no asserted credential conversion or program closure date.'
p['facts'].append(dict(field='administrativeSuccessorProgramId',value=p['administrativeSuccessorProgramId'],lastCheckedAt=D,sourceIds=['stanford-history','stanford-mse-history'],evidenceNote=p['successionRelationship']))
program('stanford-management-science-engineering-phd','Stanford University','School of Engineering; Department of Management Science and Engineering','Management Science and Engineering','PhD',['Operations Research','Industrial Engineering'],[
 source('stanford-current','https://msande.stanford.edu/academics-admissions/graduate/phd-program','Stanford MS&E — PhD Program','Current MS&E PhD prepares students for research and technical roles across universities, industry and government.')],
 'Only relevant Operations Research and Industrial Engineering research tracks within the MS&E PhD are in scope. Verify the individual graduate’s field or dissertation; do not include all MS&E graduates automatically.')

program('gatech-industrial-engineering-phd','Georgia Institute of Technology','College of Engineering; H. Milton Stewart School of Industrial and Systems Engineering','Industrial Engineering','PhD',['Industrial Engineering'],[
 source('gatech-ie','https://www.isye.gatech.edu/academics/doctoral/degrees/industrial-engineering','Georgia Tech — PhD in Industrial Engineering','Current IE doctorate, fall admissions and multiple specializations are explicitly described; it covers IE and OR methodology.')],
 'Industrial Engineering PhD across its stated specializations; separate from Georgia Tech’s Operations Research PhD.')
program('gatech-operations-research-phd','Georgia Institute of Technology','College of Engineering; H. Milton Stewart School of Industrial and Systems Engineering','Operations Research','PhD',['Operations Research'],[
 source('gatech-or-catalog','https://catalog.gatech.edu/programs/operations-research-phd/','Georgia Tech Catalog — Doctor of Philosophy with a Major in Operations Research','Catalog identifies a distinct OR doctorate and Optimization, Stochastics and Applications tracks.'),
 source('gatech-doctoral','https://www.isye.gatech.edu/academics/doctoral','Georgia Tech ISyE — Doctoral Programs','Lists Industrial Engineering and Operations Research as separate core doctoral degrees.')],
 'Operations Research PhD, separately identified from IE and the school’s interdisciplinary doctoral degrees.')
program('columbia-operations-research-phd','Columbia University','Fu Foundation School of Engineering and Applied Science; Department of Industrial Engineering and Operations Research','Operations Research','PhD',['Operations Research'],[
 source('columbia-or','https://ieor.columbia.edu/phd','Columbia IEOR — Operations Research Doctoral Program','Current official page identifies the doctoral program specifically as Operations Research.'),
 source('columbia-curriculum','https://ieor.columbia.edu/phd-program','Columbia IEOR — PhD Program','Describes doctoral core optimization/stochastic courses, candidacy requirements and thesis process.')],
 'Operations Research doctorate. The department name alone does not establish a separate Industrial Engineering doctoral degree for a graduate.')
program('berkeley-ieor-phd','University of California, Berkeley','College of Engineering; Department of Industrial Engineering and Operations Research','Industrial Engineering and Operations Research','PhD',['Industrial Engineering','Operations Research'],[
 source('berkeley-grad','https://grad.berkeley.edu/program/industrial-engineering-and-operations-research-phd/','Berkeley Graduate Division — Industrial Engineering and Operations Research PhD','Graduate Division identifies the combined IEOR doctoral program.'),
 source('berkeley-phd','https://ieor.berkeley.edu/academics/phd/','Berkeley IEOR — PhD Program','Current page announces Fall 2027 PhD applications and December 15, 2026 deadline.')],
 'Combined IEOR doctorate, counted once even though it matches two target fields.')
program('cornell-operations-research-phd','Cornell University','Cornell Duffield Engineering; School of Operations Research and Information Engineering','Operations Research','PhD',['Operations Research'],[
 source('cornell-or','https://www.duffield.cornell.edu/orie/phd-operations-research/','Cornell ORIE — PhD in Operations Research','Official current program describes an Operations Research doctorate and dissertation research.')],
 'Degree title is Operations Research; ORIE is the school/graduate-field label. Avoid duplicating the same doctorate by departmental label or campus.')
program('insead-management-tom-phd','INSEAD','INSEAD; Technology and Operations Management area','Management — Technology and Operations Management specialization','PhD',['Operations Management'],[
 source('insead-tom','https://www.insead.edu/phd/academics-and-research/technology-operations-management','INSEAD — Technology and Operations Management, PhD in Management','Official page specifies TOM specialization, research tracks and 2027 intake across Fontainebleau and Singapore.')],
 'TOM specialization of the PhD in Management. Fontainebleau and Singapore are campuses of the program, not automatically separate awarding programs.')
program('penn-oid-om-phd','University of Pennsylvania','The Wharton School; Operations, Information and Decisions','Operations, Information and Decisions — Operations Management specialization','PhD',['Operations Management'],[
 source('wharton-oid','https://doctoral.wharton.upenn.edu/operations-information-decisions/','Wharton Doctoral — Operations, Information and Decisions','Official page explicitly distinguishes Decision Making, Information Systems and Operations Management specializations.')],
 'Operations Management specialization is directly in scope. Other OID specializations need individual field evidence; do not include every OID graduate solely because the department contains operations.')
program('harvard-business-administration-tom-phd','Harvard University','Harvard Business School; Harvard Graduate School of Arts and Sciences','Business Administration — Technology and Operations Management','PhD',['Operations Management'],[
 source('hbs-tom','https://www.hbs.edu/doctoral/phd-programs/technology-operations-management','HBS Doctoral — Technology and Operations Management','Applicants apply to the Business Administration PhD and select TOM; the program explicitly trains in operations management/research and other disciplines.'),
 source('hbs-transition','https://www.hbs.edu/news/releases/nitin-nohria-steps-down','HBS Newsroom — Harvard Business School Dean to Step Down, November 6, 2019','Official account states that the DBA evolved into the joint Business Administration PhD. It does not specify the transition date or last DBA award.')],
 'TOM area of the PhD; operations versus innovation subfield may require dissertation/advisor evidence. Preserve historical DBA credentials exactly rather than relabeling them PhD.')
p=program('harvard-tom-dba-legacy','Harvard University','Harvard Business School','Business Administration — Technology and Operations Management (historical DBA)','DBA',['Operations Management'],[
 source('hbs-dba-2018','https://www.hbs.edu/news/releases/wyss-martin-awards-2018','HBS Newsroom — Doctoral Research Awards, December 5, 2018','Contemporaneous release explicitly identifies TOM as one of the five DBA areas.'),
 source('hbs-transition','https://www.hbs.edu/news/releases/nitin-nohria-steps-down','HBS Newsroom — Dean to Step Down, November 6, 2019','Explicitly documents the DBA-to-PhD evolution, without giving admissions cutoff or final DBA conferral.'),
 source('hbs-tom','https://www.hbs.edu/doctoral/phd-programs/technology-operations-management','HBS Doctoral — Technology and Operations Management','Current TOM page describes Business Administration PhD admission and retains a historical DBA alumnus profile.')],
 'Historical research-doctorate predecessor retained for program lineage and census eligibility review; not counted as a PhD credential without an explicit scope rule.',status='transitioned',history=[dict(event='DBA credential evolved into joint PhD in Business Administration',year=None,documentedBy='2019-11-06',lastCheckedAt=D,sourceIds=['hbs-transition'])])
p['renamedTo']='harvard-business-administration-tom-phd'
p['statusNote']='A credential/program transition, not a literal rename or institutional closure. The exact transition year, admission-ending date and final DBA degree date remain unknown from the opened sources.'
p['successorProgramId']=p.pop('renamedTo')
p['facts'].append(dict(field='successorProgramId',value=p['successorProgramId'],lastCheckedAt=D,sourceIds=['hbs-transition','hbs-tom'],evidenceNote='Official HBS account explicitly describes the DBA-to-PhD evolution.'))
program('nus-business-analytics-operations-phd','National University of Singapore','NUS Business School; Analytics and Operations Department','Business — Analytics and Operations doctoral program','PhD',['Operations Management','Operations Research'],[
 source('nus-ao','https://bschool.nus.edu.sg/analytics-operations/phd/','NUS Business School — Analytics and Operations PhD','Current program explicitly includes Operations Management, Operations Research, Business Analytics, Management Science and other disciplines, and links curriculum and applications.')],
 'Operations-related doctoral research in the Analytics and Operations program. The exact degree wording and individual research field should be verified from each graduate’s degree/dissertation record.')

canonical_sources={}
for row in programs:
 for s in row['sources']:
  if s['id'] in canonical_sources:assert canonical_sources[s['id']]['url']==s['url']
  else:canonical_sources[s['id']]=s
 row['sources']=[canonical_sources[s['id']] for s in row['sources']]
 row['evidenceNote']=' '.join(s['notes'] for s in row['sources'])
out=dict(schemaVersion='research-pilot-1',lastCheckedAt=D,scope='Bounded official-source pilot; not a complete global program census.',recordCount=len(programs),methodology=['Official program/catalog sources opened and read. Search snippets and OpenAlex were not treated as verification.','Each sourced fact carries its own lastCheckedAt and sourceIds. Null historical dates signify unresolved facts.','Program, specialization, awarding credential, administrative department, and campus are kept distinct.','Current offering establishes active status as of the check, not historical program start or uninterrupted admissions.','Departmental merger or degree transition does not establish admissions end or last degree award.'],programs=programs)
Path(__file__).resolve().parents[1].joinpath('program-registry-pilot.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(programs))
