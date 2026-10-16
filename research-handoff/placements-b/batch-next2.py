from review_helpers import *
cv('Leela Nageswaran','University of Washington',2018,2018,'Assistant Professor of Operations Management','Academic biography and official profile date Carnegie Mellon doctorate and Washington assistant professorship to 2018; prior BCG employment ended in 2012 and IBM internship in 2013.',url='https://sites.google.com/view/leelanageswaran/')
cv('Jing Sun','Tsinghua University',1999,1999,'Assistant Professor','Tsinghua education and work history dates doctorate to 1999 and assistant professorship from July 1999; preceding Beijing faculty role ended in 1996.',url='https://www.sem.tsinghua.edu.cn/en/info/1219/7027.htm')
cv('Ting Zhang','Shanghai University',2017,2017,None,'Bristol biography dates joint USTC/City University doctorate to 2017 and Shanghai employment 2017–2023 before Bristol; initial position title is unspecified.',category='unknown',url='https://research-information.bris.ac.uk/en/persons/ting-zhang')
cv('Yang Dong','University of Southern Denmark',2008,2008,'Assistant Professor','Academic biography explicitly says that after Kobe doctorate in 2008 he successively served at Southern Denmark 2008–2010, NUS 2010–2012 and China Waterborne Transport Research Institute.',url='https://www.yangdong.info/')
cv('Yingda Song','National University of Singapore',2013,2013,'Research Fellow','SJTU education and academic employment history dates HKUST doctorate to 2013 and NUS Research Fellow 2013–2015 as the earliest role.',category='other-academic',url='https://www.acem.sjtu.edu.cn/en/faculty/songyingda.html#container?55')
cv('Serge Nyawa','TBS Education',2018,2018,'Professor in Information Management','TBS curriculum vitae dates Toulouse doctorate to 2018 and TBS role from 2018; earlier Toulouse teaching ended in 2017 and non-academic work ended in 2012. Original rank is reported as listed.',category='other-academic',url='https://www.tbs-education.com/teacher/nyawa-serge/')
notes={
'Dayna Simpson':'The Monash biography discusses research and current role without a dated doctoral and first-employment chronology.',
'Naveed Chehrazi':'The WashU profile dates Stanford doctorate to 2013 but neither retrieved academic biography establishes earliest employment after completion.',
'Jane Iversen':'The Texas A&M profile describes current assistant professorship but provides no doctoral completion or prior employment dates.',
'Adem Orsdemir':'The personal academic page lists degrees without dates and does not provide an early employment chronology; UCR returned an application shell.',
'Vasco Sanchez Rodrigues':'The Cardiff profile returned an access-denied response.',
'Ye Shi':'The USTC biography dates doctorate and joining USTC to 2016 but does not supply a complete employment chronology or explicit first-employer statement.',
'Li Jiang':'USTC academic chronology dates PolyU assistant professorship January 2007 and Michigan doctorate April 29, 2007. Employment began before completion; first post-completion role remains ambiguous.',
'Guiyun Feng':'The SMU profile lists two doctorates, City University 2014 and Minnesota 2018, and current role from January 2019. Earliest work after each doctorate and the 2018 interval need clarification.',
'Ronald S. Tibben-Lembke':'The Nevada profile dates Northwestern doctorate to 1995 but does not provide earliest employment dates.',
'Burak Boyaci':'The Lancaster profile describes research and teaching without doctoral completion or earliest employment dates.',
'Ming Luo':'The Bristol profile describes current role and research without an early degree and employment chronology.',
'Juan Camilo':'The McGill biography focuses on current research initiatives and lacks an early career chronology; the public Google Doc CV returned only document navigation.',
'Anna-Lena Sachs':'The Lancaster profile describes current role and research without a dated doctoral or initial employment chronology.',
'Chris Zobel':'The Virginia Tech biography and personal homepage list degrees and current role but no early employment dates.',
'Sahika Sahan':'Texas State dates the operations doctorate to 2024 but faculty employment from September 2023. A separate mathematics doctorate dates to 2017; the first-job relationship to each degree is unresolved.',
'Daniel Corsten':'IE lists earlier St Gallen, LBS and corporate roles without dates for doctoral completion or the corporate positions; first post-doctoral employer cannot be ordered.',
'Danko Turcic':'The UCR profile returned an application shell without a readable individual biography.',
'Christoph Bode':'The Mannheim biography identifies earlier Tilburg and ETH affiliations and the WHU doctorate without dates or explicit first-employer wording.'}
for n,note in notes.items():profile_unresolved(n,note)
unresolved('Gabriel Weintraub','CV dates Stanford doctorate to 2006, Columbia assistant professorship July 2006 and Harvard visiting scholar July 2006. Concurrent appointments require clarification of the first employer.',url='https://www.justice.gov/atr/media/1368371/dl')
print('Saved',len(records))
