from helpers import *
url='https://www.smeal.psu.edu/phd/scis/placements'
for name,emp,year in [('Jimmy Chen','Bucknell University',2014),('Long Gao','University of California, Riverside',2007),('John Saldanha','The Ohio State University',2006)]:
 add(name,emp,year,url,'Penn State Smeal — PhD Student Alumni',note=f'Penn State explicitly lists {emp} as the initial placement for its {year} graduate. The page says academic placements are tenure-track unless otherwise specified and occur within one year of graduation; exact start year and title are unspecified.',category='tenure-track')
url='https://areas.fuqua.duke.edu/operations-management/ph-d-program/placement/'
for name,emp,year in [('Arian Aflaki','University of Pittsburgh',2017),('Chen-An (Andy) Lin','Purdue University',2023)]:
 add(name,emp,year,url,'Duke Fuqua — Operations Management initial placements')
url='https://michiganross.umich.edu/phd/areas-of-study/technology-operations'
for name,emp,year in [('Hakjin Chung','KAIST',2016),('Yao Cui','Cornell University',2015),('Alys Liang','McGill University',2024),('Fan Zhou','Chinese University of Hong Kong',2025)]:
 add(name,emp,year,url,'Michigan Ross — Technology and Operations doctoral placements',note=f'Ross lists {emp} in the {year} graduate placement cohort. The page does not specify role title or exact appointment start date.')
url='https://www.gsb.stanford.edu/programs/phd/placement/academic-placements'
add('Xavier Warnes','Stanford University',2021,url,'Stanford GSB — Academic Placements',note='Stanford lists Xavier Sebastian Warnes in the 2021 graduating cohort and specifically identifies a postdoctoral placement at its Woods Institute. Exact start date is not provided.',position='Postdoctoral researcher',category='postdoc')
out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(len(records))
