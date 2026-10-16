from review_helpers import *
cv('Fehmi Tanrısever','Eindhoven University of Technology',None,2009,'Assistant Professor of Operations Management and Finance','Bilkent biography explicitly places Eindhoven assistant professorship after the 2009 Texas doctorate and before 2013; exact start year is unspecified.',url='https://fba.bilkent.edu.tr/academic-staff/fehmi-tanrisever/')
cv('Sumit Kunnumkal','Indian School of Business',2007,2007,'Assistant Professor','ISB education and employment chronology lists Cornell doctorate in 2007 and ISB assistant professorship 2007–2012 as the earliest appointment.',url='https://www.isb.edu/faculty-and-research/faculty-directory/sumit-kunnumkal')
cv('Hosun Rhim','Hanyang University',1997,1996,'Full-time Lecturer','Korea University Korean-language education and career chronology lists UCLA doctorate September 1996 and Hanyang full-time lecturer March 1997–February 2000; earlier Ssangyong research employment ended in 1991.',category='other-academic',url='https://biz.korea.ac.kr/professor/professor_view.html?pinfo=glhd1okUGYKVGAJo_Undeg&refer=%2Fprofessor%2Fprofessor_list1.html%3Fmajor%3DM06')
cv('Zahra Mobini','Georgia Institute of Technology',None,2022,'George Family Foundation Postdoctoral Fellow','Scheller biography places ISyE postdoctoral fellowship between completed UT Dallas doctorate and Scheller faculty role; education section dates doctorate to 2022. Exact postdoc start date unspecified.',category='postdoc',url='https://www.scheller.gatech.edu/directory/faculty/mobini/index.html')
notes={
'Shivam Gupta':'The Nebraska profile dates the Texas Dallas doctorate 2011–2016 but lacks an early employment chronology.',
'Dongyuan Zhan':'The USTC profile states joining in 2024 but does not establish doctoral completion or earliest employment.',
'Saed Alizamir':'The Darden biography identifies earlier Yale appointment and Duke doctorate without dates; linked CV returned a missing-page response.',
'Mehmet Murat Kristal':'The publicly linked York CV returned a missing-page response.',
'Joaquim Gromicho':'The Amsterdam profile describes publications but does not provide a doctoral and early employment chronology.',
'Christopher Kirkbride':'The Lancaster profile describes current research and supervision without a doctoral and first employment chronology.',
'Brian Hwang':'The linked NUS CV returned no readable text and the discovery profile returned an application shell.',
'Max Finne':'The Aalto profile lists current role and awards but does not establish doctoral completion or earliest post-doctoral employment.',
'Zhixi Wan':'The HKU biography identifies HEC, Illinois, Oregon and industry roles without dates or ordering around doctoral completion.',
'Xinyan Cao':'The NIU profile lists degrees without completion dates and gives no early employment chronology.',
'Luis Henrique Rigato Vasconcellos':'The FGV profile dates doctorate to 2010 but describes prior executive and consulting work without dates; first post-doctoral employer cannot be ordered.',
'Lei Li':'The PolyU and personal profiles date doctorate and faculty appointment to 2023 but do not provide complete employment chronology or explicit first-employer wording.',
'Xu Li':'The Fudan profile returned a template without readable education or employment details.',
'Jan Schoenfelder':'The Lancaster profile lists current lecturer role without degree or early career dates.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
