from helpers import *
for id,note in [
('omlist-5d5a8146e4c2f54e','Calgary and personal biographies identify a UBC doctorate and current appointment but omit degree and initial employment dates; linked CV points back to the homepage.'),
('omlist-5efb4347d2bebc5b','Primary biographies identify a Carnegie Mellon doctorate and a prior Berkeley faculty appointment, but do not date the doctoral-to-employment transition.'),
('omlist-5f5b64378f9007d2','Utah biography identifies Pittsburgh doctorate without dates or early employment chronology.'),
('omlist-6399880c96f6615b','NIU biography identifies Indiana doctorate and current appointment without dated initial employment.'),
('omlist-63b021f4a21c1f0e','Institutional CV identifies Toulouse doctorate in 2007 and TBS employment from 2012, with no employment chronology for 2007-2012.'),
('omlist-63e587b1ada3a0e1','Cardiff institutional biography returned HTTP403; no readable primary first-employment evidence obtained.'),
('omlist-65299133f305f6a3','ETH profile returned a JavaScript-dependent page without a readable career chronology.'),
('omlist-66e3dcb70d99d4bf','HEC biography identifies its doctorate and current professorship without dated early appointments.'),
('omlist-66e893ef19f8f45c','Imported individual Villanova profile redirects to a general faculty/research page, not a dated individual biography.'),
('omlist-67050e90253b4948','Cardiff institutional biography returned HTTP403; first employment could not be verified.'),
('omlist-679b6693e2033de6','Dayton biography identifies Michigan State PhD2008 and extensive corporate experience but does not date transition into first academic or post-PhD employment.'),
('omlist-679e0fb0cea3d65f','Emory biography identifies Wharton doctorate and predoctoral Oracle work but omits initial post-PhD employment chronology.'),
('omlist-67a00712ca3cf179','Imported Maryland institutional profile returned HTTP404; no readable primary chronology obtained.'),
('omlist-69d67844e558420c','Cardiff profile returned HTTP403 and the additional public profile contains no readable early career chronology.')]:bio_unresolved(id,note)
# Explicit dates and ordered career histories.
bio('omlist-672bda65e35dd504','IE University',2022,'Assistant Professor','unknown','Institutional career history gives UNC business doctorate2022, IE assistant professorship2022-present, and all corporate roles ending by2016.',2022)
bio('omlist-698222c365754893','Western University',2010,None,'unknown','Ivey biography states Indiana doctorate completed2010 and joining Ivey later that year; earlier industry employment was2002-2005. Original rank is unspecified.',2010)
bio('omlist-69bc2afdcd9e8b9d','University of California, Berkeley',2007,'Assistant Professor','unknown','Personal academic CV lists NYU doctorateOctober2007 and earliest faculty appointment Berkeley2007-2014, followed by HKUST. Employment month is unspecified.',2007,source=1)
add('Shixiang Zhu','Carnegie Mellon University',2022,'https://www.andrew.cmu.edu/user/shixianz/bio.html','Shixiang Zhu institutional personal biography','Biography lists Georgia Tech doctorate2017-2022, graduate research2017-2022 and CMU assistant professorship2022-present; Argonne research aide role endedJanuary2021.')
out[-1].update(position='Assistant Professor',placementYear=2022,category='unknown',reason='Primary education and career chronology establishes the first post-PhD role.')
add('Maria Mayorga','Clemson University',2006,'https://mayorga.wordpress.ncsu.edu/files/2013/11/mayorga-cv-april-13.pdf','Maria Mayorga institutional CV','CV gives Berkeley doctorate2006 and Clemson assistant professorshipAugust2006; NC State career narrative explicitly describes Clemson as the next role after obtaining the PhD.')
out[-1].update(position='Assistant Professor',placementYear=2006,category='unknown',reason='CV dates corroborated by explicit institutional narrative of transition after the doctorate.')
out[-1]['sources'].append(dict(url='https://ise.ncsu.edu/2016/11/09/faculty-profile-maria-mayorga/',title='NC State faculty profile: Maria Mayorga',notes='Narrative explicitly describes choosing Clemson after obtaining the doctorate.'))
r=by['Wallace (Wally) Hopp'];out.append(dict(facultyId=r['id'],name=r['name'],status='unresolved',checkedAt='2026-10-16',sources=[dict(url='https://www.bus.umich.edu/facultybios/cv/whopp.pdf',title='Wallace Hopp institutional CV',notes='CV lists Michigan doctorate1984, Eastern Michigan instructorSummer1984 and Northwestern faculty1984-2007; degree month and appointment order are not fully specified.')],reason='Competing same-year appointments: Eastern Michigan summer instruction may precede Northwestern, but doctorate month is unspecified. Earliest post-PhD role cannot be established confidently.'))
save()
