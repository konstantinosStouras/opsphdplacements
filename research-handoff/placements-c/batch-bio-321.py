from helpers import *
for id,note in [
('omlist-1ee58cc60ff2727e','The linked SFU profile returned navigation text without a readable faculty biography or employment chronology.'),
('omlist-1efe9e602a1a4faf','The primary George Washington University faculty profile returned 403; first employment chronology is not established.'),
('omlist-1f5ede69a7bb1151','PolyU biography and linked CV identify a Hong Kong maritime engineering PhD but no degree date or early employment chronology.'),
('omlist-2308b94215daf96f','Tilburg biography identifies prior Eindhoven and Kuehne roles without dates or doctoral timing; personal site certificate has expired.'),
('omlist-231a0e268ac0ae85','Michigan State faculty profile returned an access challenge rather than a readable biography; no chronology verified.'),
('omlist-23d2dba1db5c5edf','Cranfield biography describes 2022 appointment and prior Aston role but omits doctoral timing and early appointments.'),
('omlist-243e54a812a18ea8','WHU chair page provides current role, team and awards without a dated early career chronology.'),
('omlist-246affe89591726c','Monash biography dates the PhD to 2003 but omits first employment chronology.'),
('omlist-249a88c905f77e04','Linked TUM profile returns 404. Humboldt Foundation biography dates MIT appointment to 1998 and dissertation awards to 1996, leaving the intervening early career unverified.'),
('omlist-24b253c8e5cd1561','ASU biography dates the Ohio State PhD August 2022 and predoctoral industry employment 2016-2018, but does not date the ASU appointment or establish the first role.'),
('omlist-24b98624edb6eb76','Bucknell biography dates Michigan PhD to 2002 but provides no early employment chronology.')]:bio_unresolved(id,note)
for name,employer,year,pos,cat,url,note,start in [
('Deishin Lee','Harvard University',2004,'Assistant Professor of Business Administration','unknown','https://www.hbs.edu/ris/Profile%20Files/lee_deishin_cv-2013-03-20_64a6917c-5409-43de-af0d-76dfa54f1e42.pdf','CV lists Stanford PhD 2004 and Harvard assistant professorship beginning 2004. Motorola industry experience ended in 1999 before the doctorate.',2004),
('Melvin Drent','Eindhoven University of Technology',2021,'Assistant Professor','unknown','https://research.tue.nl/en/persons/melvin-drent','Eindhoven biography states he received the Luxembourg PhD in October 2021 and subsequently joined Eindhoven as assistant professor, remaining until December 2024. Exact job start is not specified.',None),
('Kuang Xu','Microsoft Research-Inria Joint Centre',2014,'Postdoctoral Fellow','postdoc','https://business.columbia.edu/sites/default/files-efs/person/cv/cwchan_CV_July24_0.pdf','Carri Chan CV doctoral-advising list identifies MIT PhD 2014 and a Microsoft Research-Inria postdoc preceding Stanford faculty placement. Postdoc start year is not stated.',None),
('Dmitry Krass','University of Toronto',None,None,'unknown','https://www.rotman.utoronto.ca/the-rotman-experience/our-community/people/krass-dmitry/','Rotman biography says he joined the school in 1989 upon obtaining his Johns Hopkins OR PhD. The degree year and original appointment title are not independently stated.',1989)]:
 add(name,employer,year,url,name+' academic career evidence',note);out[-1].update(position=pos,category=cat,placementYear=start,reason='Opened primary academic biography or CV establishes first postdoctoral employment.');out[-1]['sources'][0]['notes']=note
save()
