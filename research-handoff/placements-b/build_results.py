import json
from pathlib import Path

root=Path(__file__).resolve().parents[2]
faculty=json.loads((root/'data/faculty.json').read_text(encoding='utf-8'))['records']
assigned={x['name']:x for i,x in enumerate(faculty) if i%3==1}
out=Path(__file__).with_name('results.json')
records=json.loads(out.read_text(encoding='utf-8')) if out.exists() else []

def add(name, employer, url, title, note, year=None, phd=None, position=None, category='unknown'):
    f=assigned[name]
    r=dict(facultyId=f['id'],name=name,status='verified',checkedAt='2026-10-16',sources=[dict(url=url,title=title,notes=note)],reason='Official doctoral placement record.',employer=employer,position=position,placementYear=year,category=category,phdYearVerified=phd,evidenceNote=note,evidenceUrl=url)
    records[:]=[x for x in records if x['facultyId']!=f['id']]+[r]

u='https://oid.wharton.upenn.edu/programs/phd/post-wharton/'
t='Wharton OID: Post-Wharton placements'
for name,employer,cohort in [
 ('Jingxing (Rowena) Gan','Southern Methodist University',2020),
 ('Dawson Kaaua','Georgetown University',2020),
 ('Robert J. Batt','University of Wisconsin–Madison',2013),
 ('Joel Wooten','University of South Carolina',2013),
 ('Alessandro Arlotto','Duke University',2012),
 ('Necati Tereyagoglu','Georgia Institute of Technology',2012),
 ('Fangyun (Tom) Tan','Southern Methodist University',2012),
]:
    add(name,employer,u,t,f'Listed in the {cohort} graduating-student placement table; exact role and start date unspecified.')

u='https://www.kellogg.northwestern.edu/doctoral/placement/jobplacement/'
t='Kellogg doctoral job placements'
for name,employer,cohort in [('Angela Kohlenberg','University of Michigan',2025),('Nil Karacaoglu','The Ohio State University',2019),('Kejia Hu','Vanderbilt University',2017)]:
    add(name,employer,u,t,f'Operations Management {cohort} placement list; exact role and start date unspecified.')

u='https://www.gerard-cachon.com/cv'
t='Gerard Cachon curriculum vitae'
add('Kaitlin Daniels','Washington University in St. Louis',u,t,'Advisor explicitly identifies 2016 graduation and first position; corrects imported 2017 PhD year.',phd=2016)
records[-1]['phdYearResolution']='Dissertation advisor Gerard Cachon identifies graduation in 2016 in the first-position section of his CV; Wharton OID placement table independently lists Daniels in 2016. Imported OM List 2017 is superseded.'
records[-1]['sources'].append(dict(url='https://oid.wharton.upenn.edu/programs/phd/post-wharton/',title='Wharton OID placements',notes='Independent department placement record lists Daniels in 2016.'))
add('Fuqiang Zhang','University of California, Irvine',u,t,'Advisor explicitly identifies 2004 graduation and first position.',phd=2004)
add('Dawson Kaaua','Georgetown University',u,t,'Advisor explicitly identifies 2020 graduation and first position.',phd=2020)
f=assigned['Gérard Cachon']
records[:]=[r for r in records if r['facultyId']!=f['id']]+[dict(facultyId=f['id'],name=f['name'],status='unresolved',checkedAt='2026-10-16',sources=[dict(url=u,title=t,notes='CV reports PhD 1995 and Duke assistant professorship beginning 1994.')],reason='Faculty role began before PhD completion; first new job after completion needs clarification.')]

u='https://fisher.osu.edu/academic-departments/operations-business-analytics/operations-management-phd/phd-alumni'
t='Ohio State Fisher PhD alumni initial placements'
for name,employer,cohort in [('Gopesh Anand','University of Illinois Urbana-Champaign',2006),('James Hill','Vanderbilt University',1999),('Jay Kim','Boston University',1989)]:
    add(name,employer,u,t,'Employer appears in the initial-placement column, separate from current affiliation.',phd=cohort)

u='https://kelley.iu.edu/faculty-research/departments/operations-decision-technologies/phd/placements.html'
t='Indiana Kelley Operations and Decision Technologies initial placements'
for name,employer,cohort in [('Buyun Li','Lehigh University',2026),('Vinit Tipnis','University of Minnesota',2025),('Masoud Kamalahmadi','University of Miami',2020)]:
    add(name,employer,u,t,'Employer appears in the initial-placement column; start date and role unspecified.',phd=cohort)
add('Caleb Kwon','The University of Texas at Austin','https://www.hbs.edu/doctoral/placement/technology-operations-management','Harvard Business School Technology and Operations Management placements','2024 graduate record explicitly identifies initial placement at McCombs.',phd=2024)

u='https://www.smeal.psu.edu/phd/scis/placements'
t='Penn State Smeal PhD student alumni'
for name,employer,cohort in [('James Abbey','Texas A&M University',2013),('Paolo Letizia','Erasmus University Rotterdam',2012),('Bernardo (Bernie) F. Quiroga','Clemson University',2015),('Alex Scott','Northeastern University',2016),('Daewon Sun','University of Notre Dame',2004)]:
    add(name,employer,u,t,'Explicit initial-placement record. Page classifies academic placements as tenure-track unless otherwise indicated.',phd=cohort,category='tenure-track')

u='https://areas.fuqua.duke.edu/operations-management/ph-d-program/placement/'
t='Duke Fuqua Operations Management initial placements'
for name,employer,cohort in [('Ali Tuna','Tilburg University',2024),('Yuexing Li','Johns Hopkins University',2022),('Soudipta Chakraborty','University of Kansas',2020),('Jordan Tong','University of Wisconsin–Madison',2012),('Mark Ferguson','Georgia Institute of Technology',2001)]:
    add(name,employer,u,t,'Explicit initial doctoral academic placement; role and precise start date unspecified.',phd=cohort)

u='https://www.gsb.stanford.edu/programs/phd/placement/academic-placements'
t='Stanford GSB academic placements'
add('Bar Light','Microsoft Research',u,t,'2021 graduate listed at Microsoft Research as postdoc before Tel Aviv University.',phd=2021,position='Postdoctoral researcher',category='postdoc')
add('Danqi Luo','University of California San Diego',u,t,'2021 doctoral graduate academic placement list identifies UC San Diego.',phd=2021)
add('Dimitris Bertsimas','Massachusetts Institute of Technology','https://dbertsim.mit.edu/','Dimitris Bertsimas academic biography','Biography and full appointment chronology document PhD completion and MIT assistant professorship in 1988.',year=1988,phd=1988,position='Assistant Professor of Management Science',category='tenure-track')

u='https://business.columbia.edu/faculty/divisions/dro/phd'
t='Columbia Decision Risk and Operations doctoral placements'
for name,employer,cohort in [('Jerry Anunrojwong','Yale University',2025),('Yuri Resende Fonseca','University College London',2024),('Omar Mouchtaki','New York University',2024),('Jimmy Qin','The University of Texas at Dallas',2024),('Yue Hu','Stanford University',2022),('Seungki Min','Korea Advanced Institute of Science and Technology',2021),('Jiaqi Lu','The Chinese University of Hong Kong',2021),('Zhe Liu','Imperial College London',2019),('Daniela Saban','Stanford University',2015)]:
    add(name,employer,u,t,'Doctoral placement table, organized by graduation year; exact role/start date unspecified.',phd=cohort)

u='https://michiganross.umich.edu/phd/areas-of-study/technology-operations'
t='Michigan Ross Technology and Operations doctoral placements'
for name,employer,cohort in [('Xinyu Liang','INSEAD',2024),('Mengzhenyu (Zhenyu) Zhang','University College London',2021),('Guihua Wang','The University of Texas at Dallas',2019),('Yixin (Iris) Wang','University of Illinois Urbana-Champaign',2018),('Ruth Beer','Indiana University Bloomington',2015)]:
    add(name,employer,u,t,'Department doctoral placement list; exact role and start date unspecified.',phd=cohort)

add('George Chen','The University of Texas at Dallas','https://assets.london.edu/hxo16fanegqh/fd090761-ea46-4367-93ab-c26e7fbcc020/4fa72534919d2f60ac9696a060de6d61/curriculum-vitaeqigeorgechen202008--public.pdf','Qi (George) Chen curriculum vitae','CV lists Michigan PhD 2017 followed by UT Dallas assistant professorship 2017–2018 before London Business School.',year=2017,phd=2017,position='Assistant Professor of Operations Management',category='tenure-track')
f=assigned['Joonho Bae']
records[:]=[r for r in records if r['facultyId']!=f['id']]+[dict(facultyId=f['id'],name=f['name'],status='unresolved',checkedAt='2026-10-16',sources=[dict(url='https://joonhobae.com/',title='Joonho Bae academic website',notes='News reports Indiana faculty start January 2026, PhD received May 2026.')],reason='Indiana position started before PhD completion; cannot classify as a new job begun after the doctorate.')]

u='https://www.mccombs.utexas.edu/placement/'
t='Texas McCombs doctoral placements'
for name,employer,cohort in [('Parshuram Hotkar','Indian School of Business',2020),('Long Zhao','National University of Singapore',2019),('Abhishek Roy','Temple University',2018)]:
    add(name,employer,u,t,'Doctoral placement table explicitly gives assistant professor role; precise start date unspecified.',phd=cohort,position='Assistant Professor',category='tenure-track')

u='https://wpcarey.asu.edu/supply-chain-management-degrees/phd-placement-data'
t='Arizona State supply chain PhD placement data'
for name,employer,cohort in [('Arash Azadegan','New Mexico State University',2008),('Cynthia (Cindy) Wallin Blair','Brigham Young University',2006),('Craig Carter','University of Maryland',1996),('Sina Golara','Massachusetts Institute of Technology',2018),('Seongkyoon Jeong','University of Tennessee',2022),('Yusoon Kim','Georgia Southern University',2010),('Wendy Tate','University of Tennessee',2006),('Eunae Yoo','University of Tennessee',2018)]:
    add(name,employer,u,t,'Employer explicitly in initial-placement column; PhD year separately provided.',phd=cohort)

out.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Saved {len(records)} records')
