import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
faculty=json.loads((root/'data/faculty.json').read_text(encoding='utf-8-sig'))['records']
shard={p['name']:p for i,p in enumerate(faculty) if i%3==0}
out=root/'research/placements-a/results.json'
records=json.loads(out.read_text()) if out.exists() else []
def add(name,employer,year,url,title,note='',position=None,category='unknown',start=None):
 p=shard[name]
 row=dict(facultyId=p['id'],name=name,status='verified',checkedAt='2026-10-16',employer=employer,position=position,placementYear=start,category=category,phdYearVerified=year,evidenceNote=note or f'The doctoral program explicitly identifies {employer} as the initial placement for the {year} graduate. The exact appointment start date and job title are not stated.',evidenceUrl=url,sources=[dict(url=url,title=title,notes='Official doctoral-program placement record; initial destination distinguished from later affiliation.')],reason='Explicit initial-placement record published by the degree-granting institution.')
 records[:]=[r for r in records if r['facultyId']!=p['id']]
 records.append(row)
url='https://fisher.osu.edu/academic-departments/operations-business-analytics/operations-management-phd/phd-alumni'
for name,emp,year in [('Avijit Banerjee','Drexel University',1977),('Kenneth Boyer','DePaul University',1994),('John Gardner','Brigham Young University',2012),('Soumen Ghosh','Georgia Institute of Technology',1987),('Sean M. Handley','Rutgers University',2008),('Yingchao Lan','University of Nebraska-Lincoln',2018),('John Lowrey','Northeastern University',2021),('Claire Senot','Tulane University',2014),('Hojung Shin','University of Notre Dame',2001),('Keith Skowronski','University of South Carolina',2016),('Aleda Roth','Boston University',1986)]:
 add(name,emp,year,url,'Ohio State Fisher — PhD Alumni')
url='https://www.hbs.edu/doctoral/placement/technology-operations-management'
for name,emp,year in [('Maya Balakrishnan','The University of Texas at Dallas',2024),('Raha Imanirad','York University',2020),('Michelle Kinch','Boston University',2020)]:
 add(name,emp,year,url,'Harvard Business School — Technology & Operations Management placements')
url='https://kelley.iu.edu/faculty-research/departments/operations-decision-technologies/phd/placements.html'
for name,emp,year in [('Iman Attari','University of Cincinnati',2025),('Chengcheng Zhai','University of Notre Dame',2024)]:
 add(name,emp,year,url,'Indiana Kelley — Operations & Decision Technologies placements')
url='https://som.yale.edu/programs/phd/overview/operations/recent-graduates-and-current-students'
for name,emp,year in [('Cheng Hua','Shanghai Jiao Tong University',2020),('Scott Rodilitz','University of California, Los Angeles',2021)]:
 add(name,emp,year,url,'Yale School of Management — Operations graduates')
url='https://merage.uci.edu/programs/phd/placements.html'
add('Mojtaba Hosseini','University of Iowa',2022,url,'UC Irvine Merage — PhD placements')
add('Tianjun Feng','Fudan University',2008,url,'UC Irvine Merage — PhD placements',note='UC Irvine explicitly lists Fudan University as the first placement and PhD 2008. The imported directory says 2009; this disagreement is retained here. Appointment start date and title are unstated.')
out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(len(records))
