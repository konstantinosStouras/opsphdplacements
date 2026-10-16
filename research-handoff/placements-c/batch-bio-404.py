from helpers import *
bio('omlist-54adabdc50a8bdc0','Shanghai University of Finance and Economics',2015,'Visiting Assistant Professor','other-academic','Personal employment chronology lists Minnesota PhD October 2015 and Shanghai visiting assistant professorship 2015-2016 before Tianjin and PolyU faculty roles.',start=2015,source=1)
cv('omlist-59003626d5e184c4','Lyft',2020,'Postdoctoral Research Fellow','postdoc','CV gives MIT PhD May 2020 followed by Lyft Rideshare Labs postdoc August 2020-June 2021, then UBC faculty appointment. Consulting analyst employment ended before doctoral study in 2015.',folder='cv-extra')
for name,employer,year,pos,cat,url,note in [
('Kaitlin Wowak','University of Notre Dame',2012,'Visiting Assistant Professor','other-academic','https://d23loykajbcndr.cloudfront.net/kdunn6/pci/K.%20Wowak%20CV%20-%206-13-2025%20-%20Public-1.pdf','CV lists Penn State PhD 2008-2012 and Notre Dame visiting assistant professorship 2012-2013 before regular assistant professor role.'),
('Shining Wu','Hong Kong University of Science and Technology',2014,'Postdoctoral Fellow','postdoc','https://www.polyu.edu.hk/lms/docdrive/people/curriculum-vitae/Shining%20WU.pdf','CV lists HKUST PhD 2014, HKUST postdoc September 2014-September 2015 and PolyU faculty role from September 2015.')]:
 add(name,employer,year,url,name+' curriculum vitae',note);out[-1].update(position=pos,placementYear=year,category=cat,reason='Opened primary CV establishes degree and earliest post-PhD job.');out[-1]['sources'][0]['notes']='Faculty education and employment chronology.'
for id,note in [
('omlist-4a233ed8b22b7ad5','Personal site gives Texas A&M PhD 2018-2023 and predoctoral industry work 2015-2018 but no dated academic appointment; CV page contains no readable document link.'),
('omlist-556c0c7e76826a0f','Imperial biography identifies MIT doctorate, US Airways and prior Northwestern/Pompeu Fabra employment but lacks dates. Secondary CV excerpts are not sufficient primary verification.'),
('omlist-559abe23b40fbec8','Tennessee biography identifies Penn State doctorate and prior Purdue faculty appointment without dates or complete early chronology.'),
('omlist-55a17243f671e745','Koc profile returned 403 and linked personal site redirects to sign-in; no readable primary chronology.'),
('omlist-567019cfdb07634e','RSM profile returned navigation and directory material without a dated degree and early employment chronology.'),
('omlist-569c08ee65435c16','Georgia Tech biography identifies Texas Austin doctorate but no dated first employment chronology.'),
('omlist-573e8ef1159fb682','Bath biography identifies doctorate and decades of executive work but lacks dates to distinguish predoctoral and postdoctoral employment.'),
('omlist-573f1dfb66ae8978','Cambridge biography dates joining to 2014 and lists previous international roles but omits doctoral and early appointment dates.'),
('omlist-57497a0597a401a5','UNC biography identifies Stanford doctorate but no dated first appointment chronology.'),
('omlist-5776120e80d04684','Iowa State biography identifies Michigan State PhD 2022 but no dated appointment history.'),
('omlist-57d7ef048a4b7d5e','Saarland chair homepage provides current research and team navigation but no dated personal career history.'),
('omlist-5921d242355659fd','Amsterdam profile identifies current affiliation and Travix data science role but gives no doctoral completion or early employment timeline.'),
('omlist-5aee2d44bc45b67e','Monash biography identifies Bradford PhD and later awards but no dated early career chronology.'),
('omlist-5bbefc34c793630c','HKU biography identifies NYU PhD and prior Oregon faculty appointment but no dates establishing first post-PhD employment.'),
('omlist-5beced8ddbbe842c','Michigan State profile returned an access challenge; no readable primary career history.'),
('omlist-5c2d9f167cda11a6','Personal biography identifies Rochester doctorate and current INSEAD role but no dated early employment chronology; institutional profile returned 403.')]:bio_unresolved(id,note)
save()
