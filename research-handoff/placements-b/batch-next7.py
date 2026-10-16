from review_helpers import *
cv('Ulrich W. Thonemann','Stanford University',1994,1994,'Acting Assistant Professor','Cologne CV lists Stanford doctorate 1992–1994 and Acting Assistant Professor 1994–1995 before McKinsey consulting 1995–1998.',category='other-academic',url='https://wiso.uni-koeln.de/de/forschung/professorinnen/professorinnen-a-bis-z/prof-ulrich-w-thonemann-phd')
notes={
'Thomas Magnanti':'The MIT biography lists Stanford doctorate and later leadership without a dated early employment chronology.',
'Hamed Mamani':'Profiles date MIT doctorate August 2008 and Washington employment from 2008, but do not establish exact ordering or provide complete early employment history; CV is available only upon request.',
'Juan Pablo Madiedo':'The RSM biography mentions IE doctorate and earlier IE and Los Andes roles without degree or appointment dates.',
'Richard W. Conway':'The INFORMS biography returned an access-denied response.',
'Mark Johnson':'The Warwick biography identifies an EngD but supplies no completion date or early employment chronology.',
'Rajeev R. Tripathi':'The personal biography identifies IIT Madras doctorate and current IIM Bangalore role without a dated initial employment chronology; official page was access-denied.',
'Jennifer Davies':'The Liverpool biography describes a substantial earlier creative-industry career and doctoral research without completion or transition dates.',
'Binyamin Oz':'The Auckland profile returned an application shell without a readable biography.',
'Erkut Sönmez':'The Nebraska profile lists Carnegie Mellon degrees without dates or earliest employment chronology.',
'Wei Yu (Kevin) Chiang':'The personal biography reports earlier US faculty and consulting work without dates, preventing first post-doctoral employer ordering.',
'Alfredo Roa-Henriquez':'The NDSU profile dates doctorate to 2019 and identifies earlier NIST/Johns Hopkins postdoctoral work without dates or the employment relationship between those institutions.',
'Rohan Ghuge':'The Texas profile and public CV link returned application shells without readable degree and employment chronology.',
'Han Oh':'The Tilburg profile redirected to sign-in and the public personal domain did not resolve.',
'Ilker Birbil':'The Amsterdam and personal biographies describe earlier Sabanci and Erasmus roles without doctoral completion or first-job dates.',
'Jannis Kurtz':'The Amsterdam profile lists current role and publications without a doctoral or early employment chronology.',
'Edward C. Rosenthal':'The Temple CV request was rejected and the faculty profile returned a missing-page response.',
'Anne Dohmen':'The MSU profile returned an access-protection response and linked PDF returned no readable text.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
