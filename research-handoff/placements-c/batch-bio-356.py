from helpers import *
for id,note in [
('omlist-32b84491b9d9ea12','SJTU biography identifies current professor and research but provides no doctoral or employment chronology.'),
('omlist-33d2828fdf1d6846','Bristol profile dates Sussex lectureship September 2020-April 2022 but omits doctoral completion and earlier roles.'),
('omlist-356f439a5859bcb6','CUHK Shenzhen personal profile failed TLS handshake; no readable primary chronology reviewed.'),
('omlist-357cbdb5e6f6bb46','Melbourne Business School profile returned 403; primary chronology could not be reviewed.'),
('omlist-38736a9436ee2ab6','Imported Drexel profile returned 404; no readable primary chronology reviewed.'),
('omlist-38ad82f907b59105','Personal biography identifies UCLA PhD before joining UCL in 2010, but does not date degree completion or exclude an intervening role.'),
('omlist-391d37b33e292ca7','UCD profile yielded only a Discovery page heading; no readable chronology.'),
('omlist-3b3d85f94554eb87','VCU biography identifies Clemson PhD and current appointment but supplies no dated degree or early job chronology.'),
('omlist-3b9acef77e450669','Peking University faculty link failed TLS handshake; no readable primary chronology reviewed.'),
('omlist-3ce4205b4de44ea6','Bath profile dates Cambridge PhD 2010-2014 but omits early employment chronology.'),
('omlist-3d4d587ddd61a921','Bilkent biography gives Wisconsin IE PhD 2019 but no dated early appointment history.'),
('omlist-3e64f2271587c94d','Indiana biography gives Michigan PhD 2012 and predoctoral healthcare industry experience but does not date first faculty or postdoctoral job.'),
('omlist-401c588bd98e3194','IIM Ahmedabad biography dates Kansas faculty appointment from 2019 and GM work 2005-2012, but gives no date for UNC PhD completion.'),
('omlist-4063431edb666f51','Bristol research profile contains interests, publications and prizes but no dated degree and first employment chronology.'),
('omlist-40eb0180bc11a8b9','UCD profile yielded only a Discovery page heading; no readable chronology.'),
('omlist-41b6ff9d5ff6f1da','UMass Lowell biography dates Oklahoma State doctorate to 2010 but lacks dated early employment chronology.'),
('omlist-41e3347f6c53877c','Bristol profile describes research and current role but omits early degree and appointment chronology.'),
('omlist-41eab280563d68e6','Personal site establishes NUS PhD April 2021 and current Fudan role; no start date or complete employment chronology is supplied.')]:bio_unresolved(id,note)
bio('omlist-32410fd8b56f39cc','University of Illinois Chicago',2016,'Assistant Professor','unknown','Personal academic site gives Michigan IOE doctorate 2010-2016 and UIC assistant professorship 2016-2022. Earlier corporate positions were summer internships.',start=2016,source=1)
bio('omlist-35c8e8f158909fad','Eindhoven University of Technology',2007,'Assistant Professor','unknown','Tilburg research profile lists Erasmus PhD candidate 2003-2007, degree awarded December 2007, followed by Eindhoven assistant professorship 2007-2012; prior Eindhoven assistantship was in 2003.',start=2007,source=1)
bio('omlist-3adac9ed5b3addb2','City University of Hong Kong',2013,'Postdoctoral Fellow','postdoc','USTC official chronology lists HKUST doctorate ending July 2013 and City University postdoc August 2013-June 2016, before USTC faculty appointment.',start=2013)
bio('omlist-3c74973e6f5fdd0e','Washington University in St. Louis',2007,'Postdoctoral Research Fellow','postdoc','SJTU official chronology lists Ohio State OR doctorate ending August 2007 and Washington University postdoc September 2007-June 2010. Software developer work ended in 2000.',start=2007)
add('Yong-Pin Zhou','University of Washington',2000,'https://faculty.washington.edu/yongpin/cv.html','Yong-Pin Zhou academic CV','CV lists Pennsylvania PhD August 2000 and University of Washington academic appointment from 2000, the earliest academic position. Original rank not stated.');out[-1].update(placementYear=2000,reason='Personal academic CV establishes degree and earliest appointment chronology.');out[-1]['sources'][0]['notes']='Opened faculty CV education and appointment sections.'
cv('omlist-36ddbc966bdd66fc','Stony Brook University',2025,'Assistant Professor of Analytics','unknown','CV gives McGill doctoral study 2020-2025 and Stony Brook assistant professorship from 2025. CV retains the word candidate; Stony Brook biography independently states the PhD was earned. Industry positions ended in 2020.',folder='cv-extra');out[-1]['sources'].append(dict(url='https://www.stonybrook.edu/commcms/business/about/_faculty/profile/nybandi',title='Nymisha Bandi Stony Brook faculty biography',notes='Institutional biography confirms completed McGill doctorate.'))
save()
