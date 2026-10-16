from batch import *
url='https://oid.wharton.upenn.edu/programs/phd/post-wharton/'
for name,emp,year in [('Nitin Bakshi','London Business School',2008),('Hessam Bavafa','University of Wisconsin–Madison',2014),('Karan Girotra','INSEAD',2007),('Jose Guajardo','University of California, Berkeley',2012),('Jun Li','University of Michigan at Ann Arbor',2012),('Lesley Meng','Yale University',2019)]:
 add(name,emp,year,url,'Wharton OID — Post-Wharton graduate placements',note=f'Wharton lists the destination for the graduating {year} cohort as {emp}. Job title and exact appointment start date are not provided.')
url='https://www.gerard-cachon.com/cv'
for name,emp,year in [('Pnina Feldman','University of California, Berkeley',2010),('Gürhan Kök','Duke University',2003)]:
 add(name,emp,year,url,'Gerard Cachon — CV and dissertation supervision',note=f'The dissertation adviser explicitly identifies {emp} as the first position and {year} as the graduating year. Job title and exact start date are not provided.')
url='https://www.kellogg.northwestern.edu/doctoral/placement/jobplacement/'
for name,emp,year in [('David Almog','Harvard University',2026),('Yangzi Jiang','Chinese University of Hong Kong, Shenzhen',2022),('Simrita Singh','Santa Clara University',2022),('Jiankun Sun','Imperial College London',2019),('Serasu Duran','University of Calgary',2018)]:
 add(name,emp,year,url,'Northwestern Kellogg — doctoral job placements',note=f'Kellogg lists {emp} as the job-market destination in its {year} placement cohort. Exact appointment date and title are not stated.')
url='https://bschool.nus.edu.sg/analytics-operations/phd/placements/'
for name,emp,year,pos,cat in [('Zhi Chen','Imperial College London',2017,'Research Associate','other-academic'),('Qinshen Tang','Nanyang Technological University',2019,'Assistant Professor','tenure-track'),('Huan Zheng','Shanghai Jiao Tong University',2007,'Assistant Professor','tenure-track'),('Qingxia (Cynthia) Kong','Universidad Adolfo Ibáñez',2012,'Assistant Professor','tenure-track')]:
 note=f'NUS explicitly identifies the appointment held upon graduation: {pos} at {emp}, in the {year} cohort.'
 if name=='Qingxia (Cynthia) Kong': note+=' The imported PhD year is 2014, differing from the degree institution placement cohort; date discrepancy needs resolution.'
 add(name,emp,year,url,'NUS Analytics & Operations — initial student placements',note=note,position=pos,category=cat,start=year)
p=shard['Neha Sharma']
records.append(dict(facultyId=p['id'],name=p['name'],status='unresolved',checkedAt='2026-10-16',reason='Conflicting primary sources: Kellogg placement cohort and current Wharton biography say 2023; university-hosted CV lists a 2023–24 lecturer appointment and PhD expected June 2024. Cannot confidently distinguish pre-PhD role from first post-PhD position.',sources=[dict(url='https://faculty.wharton.upenn.edu/wp-content/uploads/2023/07/Neha_CV.pdf',title='Neha Sharma — university-hosted CV',notes='Lists lecturer 2023–24, assistant professor from July 2024, expected PhD June 2024.'),dict(url='https://oid.wharton.upenn.edu/profile/nehash/',title='Wharton — Neha Sharma faculty biography',notes='Current biography states PhD 2023.')]))
out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(len(records))
