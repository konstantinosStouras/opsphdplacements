from helpers import *
addcv('omlist-dde2093c28a9dc4f','Vanderbilt University',2012,'Assistant Professor of Operations Management','tenure-track','CV records Cornell PhD in 2012 and Vanderbilt assistant professor, 2012–2020, as the earliest academic appointment.')
addcv('omlist-e0a6cba92ab76332','Ohio State University',2010,'Assistant Professor of Operations Management','tenure-track','CV dates UNC PhD to 2010 and Ohio State assistant professorship from July 2010 to June 2017 as the earliest academic job.')
addcv('omlist-e4bb48942eb3dbfc','Old Dominion University',1992,'Assistant Professor of Operations Management','tenure-track','CV dates Georgia PhD to 1992 and Old Dominion assistant professor to 1992–1994 as the earliest academic appointment, before Air Force Institute of Technology and Suffolk.')
addcv('omlist-e6631e99d740cb1e','Loyola University Chicago',1997,'Assistant Professor of Operations Management','tenure-track','CV records Purdue PhD in 1997 and Loyola Chicago assistant professor beginning 1997, before Miami in 2001 and Syracuse in 2007.')
addcv('omlist-e6d4e5988ddb47af','University of New Hampshire',2018,'Assistant Professor','tenure-track','CV records Minnesota industrial engineering PhD in 2018 and New Hampshire assistant professorship from 2018 as the first academic appointment.')
addcv('omlist-e7125e77ad968865','Johns Hopkins University',2013,'Assistant Professor of Operations Management and Business Analytics','tenure-track','CV dates Carnegie Mellon PhD to 2013 and Johns Hopkins Carey assistant professorship to 2013–2018 as the first academic appointment.')
unresolvedcv('omlist-db42fd66738c1b31','CV dates Wharton PhD to 2001, NYU instructor to 2000–2001, NYU assistant professor from 2001, and 4R Systems industry/consulting experience spanning 2000–2003. Degree and employment transition months and the nature of the industry role are needed to establish the first post-PhD job.')
unresolvedcv('omlist-de7626a2aedd4736','CV omits doctoral completion year and lists both Northwestern assistant professor and Donald P. Jacobs Scholar from 2018, without clarifying the sequence or relationship of those appointments. A dated degree source and role clarification are needed.')
unresolvedcv('omlist-dfb90de21ffe86ec','Rice CV reports assistant professorship beginning July 2024 but still labels the Stanford PhD as 2018–present. A current completed-degree source is needed before accepting the post-PhD appointment.')
unresolvedcv('omlist-dfe32c87bf74bc82','CV confirms INSEAD/Sorbonne PhD ending 2021 and identifies the current Católica assistant professorship but gives no appointment start date. Teaching since fall2021 alone does not establish the first job chronology.')
unresolvedcv('omlist-e1eb62d69cf58a47','CV dates Cornell PhD to January1986 and Chr. Michelsen Institute scientist employment to October1985–July1987, therefore continuing from before completion. Yale visiting professorship begins academic1987–1988; a new initial post-PhD placement is not established.')
unresolvedcv('omlist-f1ca99ece12178d6','CV dates MIT PhD to1998 and IBM research staff employment to1997–2005, therefore beginning before degree completion. IBM employment at completion is established, but this is not a newly begun post-PhD placement.')
for r in records:
 if 'CV' in r['reason'] or 'cv' in r['reason']:
  for s in r['sources']:
   if s['notes']=='Official doctoral-program placement record; initial destination distinguished from later affiliation.':s['notes']='Faculty CV education and employment chronology reviewed.'
save()
