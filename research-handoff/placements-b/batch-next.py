from review_helpers import *
cv('Xiaoshan Peng','Indiana University',2017,2017,None,'Kelley profile lists Chicago doctorate in 2017 and Indiana employment from 2017 as the only professional appointment; exact initial title unspecified.',category='unknown',url='https://kelley.iu.edu/faculty-research/faculty-directory/profile.html?id=XP1')
cv('Sripad Devalkar','Indian School of Business',2011,2011,'Assistant Professor','ISB education and employment chronology dates Michigan doctorate and ISB assistant professorship to 2011; earlier professional consulting ended in 2004.',url='https://www.isb.edu/faculty-and-research/faculty-directory/sripad-devalkar')
notes={
'Gudrun P. Kiesmüller':'The linked TUM profile returned a missing-page response.',
'Joel Goh':'The NUS profile returned a JavaScript application shell without a readable biography.',
'Garrett van Ryzin':'The Columbia profile was access-denied; Amazon author page describes current affiliation without doctoral and earliest employment chronology.',
'Mikaella Polyviou':'The ASU profile lists the Ohio State doctorate without a completion date or earliest employment chronology.',
'Diptesh Ghosh':'The IIM profile lists employment at Lucknow from 1997 and later Groningen, but does not date doctoral completion, so ordering is unverified.',
'Cindy Kuijpers':'The Tilburg profile gives teaching and publications without a doctoral or early employment chronology.',
'Xiaoming Yan':'The USTC profile states joining in 2015 but does not establish doctoral completion or preceding employment.',
'Hans Sebastian Heese':'The NC State biography lists earlier EBS and Indiana affiliations and UNC doctorate without dates or a first-employer statement.',
'Nitindra Joglekar':'The linked Villanova URL returned the general faculty directory rather than an individual biography.',
'Joe Hanna':'The Auburn profile dates doctorate to 1997 and mentions earlier industry employers, but does not establish first employment after completion.',
'Bhavani Shanker Uppari':'The SMU profile dates INSEAD doctorate and current faculty appointment to 2018, but does not provide a complete earlier employment chronology; the linked CV could not be retrieved.',
'Stefan Spinler':'The WHU chair page describes current role and teaching without doctoral completion and earliest employment dates.',
'Adam Hindle':'The Lancaster profile describes current senior lecturer role without doctoral or early employment chronology.',
'Brian Fugate':'The Arkansas link returned directory navigation without an individual biography.',
'Ming Dong':'The SJTU profile dates doctorate to 2001 and UIC research specialist role to 2003–2004, leaving the immediate post-doctoral interval unexplained.',
'Caterina Trevisan':'The CBS profile describes research and current affiliation without doctoral completion or first employment chronology.',
'Yuanyuan Ding':'The Oregon profile dates Minnesota doctorate to 2025 but does not establish appointment start or exclude an intervening role.',
'Melvyn Sim':'The NUS profile returned an application shell and the publicly linked Dropbox CV could not be retrieved in readable form.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
