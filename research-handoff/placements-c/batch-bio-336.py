from helpers import *
for id,note in [
('omlist-259dcb1aedaf2d44','Aalto biography dates current logistics professorship from 2009 but does not provide degree timing or early career chronology.'),
('omlist-25c920c29c81e491','IE chronology gives Maryland PhD 1995, IESA researcher 1989-1995 and associate professor 1995-1998. Employment began before the PhD; exact completion-to-role transition is not established.'),
('omlist-2683c821b7741310','UAI biography gives Georgia Tech doctorate 1998 and prior Northwestern, Ohio State and Illinois Chicago roles without their dates or order.'),
('omlist-278cc46dbdff7915','Rochester biography dates employment from August 1984 but omits degree timing and early career chronology; linked CV is a Box viewer.'),
('omlist-27974fd242cc5f8e','FGV biography dates doctorate to 2023 and lists concurrent faculty and earlier consulting/industry roles without start and end dates, preventing first-job attribution.'),
('omlist-284935f2c9992fc7','Imported directory profile supplies no primary biography or CV link; no individual employment chronology has been verified.'),
('omlist-28ae3da320118152','Drexel biography identifies prior Northwestern faculty, Cornell visiting and Fort Rock Asset Management roles but omits doctoral and postdoctoral employment dates.'),
('omlist-292573dd7fb54975','The linked McCombs profile returned only navigation/cookie text, without readable biographical chronology.'),
('omlist-2aedbf142d67ee5f','HKUST department profile could not be fetched because certificate verification failed; no readable chronology reviewed.'),
('omlist-2b74269a37bf18a0','ASU biography dates joining in 2016 and identifies Michigan State doctorate, but does not date degree completion or expressly identify first employment after it.'),
('omlist-2c6c6009e7cdbdf0','The linked AUB profile returned a shell page without a readable faculty biography.'),
('omlist-2d095712ac43702a','UT Dallas profile returned general faculty-page content without an individual education and employment chronology.'),
('omlist-2d93faf973ea2cb6','HKU and personal biographies identify a Northwestern postdoc before HKU and a UNC doctorate, but provide no dated chronology to establish this as the first post-PhD role.'),
('omlist-303eb0c2252383ce','Imported North Texas faculty link returns 404; no readable primary chronology was established.'),
('omlist-3195b4f12420e5f7','PolyU research profile establishes current role and publications but no dated degree or early employment history.'),
('omlist-321a639170c643f2','FGV biography mentions Wharton postdoctoral study, USP doctorate, industry employment and several academic appointments without a dated sequence.'),
('omlist-321fb2c60aa2833b','Personal biography identifies Carnegie Mellon doctorate and predoctoral BCG work but no dated appointment chronology; imported UCL profile returns 404.')]:bio_unresolved(id,note)
for name,employer,year,pos,cat,url,note,start in [
('Ilan Lobel','Microsoft Research',2009,'Postdoctoral Researcher','postdoc','https://pages.stern.nyu.edu/~ilobel/Lobel%20-%20CV.pdf','CV gives MIT PhD 2009, Microsoft Research New England postdoc 2009-2010, then NYU assistant professorship from 2010.',2009),
('Minje Park','Columbia University',2022,'Postdoctoral Researcher','postdoc','https://www.pninafeldman.com/_files/ugd/369cb5_846f168541b8496d8fe009bbf18bc3b3.pdf','Doctoral committee member Pnina Feldman CV explicitly gives Boston University graduation 2022 and first position as Columbia Business School postdoc. Exact start date unstated.',None)]:
 add(name,employer,year,url,name+' primary CV evidence',note);out[-1].update(position=pos,category=cat,placementYear=start,reason='Opened faculty CV explicitly establishes first employment after PhD.');out[-1]['sources'][0]['notes']=note
bio('omlist-309a28c7f389b789','Kuaishou Technology',2019,'Economist / Operations Research Scientist','industry','Personal academic employment chronology gives USC PhD 2014-2019, Kwai economist/OR scientist summer 2019-summer 2020, then ASU faculty appointment fall 2020. Earlier Amazon roles were internships.',start=2019,source=1)
save()
