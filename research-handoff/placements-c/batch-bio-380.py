from helpers import *
cv('omlist-3a3040ad2a02cb00','Columbia University',2015,'Assistant Professor','unknown','CV gives Harvard economics PhD 2015 and Columbia DRO assistant professorship 2015-2023 as first employment. Later visiting positions are listed separately.',folder='cv-extra')
add('Sidika Candogan','National University of Singapore',2022,'https://bizfaculty.nus.edu.sg/wp-content/uploads/sites/139/2024/05/TPFrr1663297675.pdf','Sidika Candogan curriculum vitae','CV gives UCL PhD August 2022 and NUS assistant professorship September 2022. Earlier teaching and consultancy preceded the PhD.');out[-1].update(position='Assistant Professor',placementYear=2022,reason='Opened primary CV establishes degree and earliest post-PhD appointment.');out[-1]['sources'][0]['notes']='Faculty CV with degree and first appointment dates.'
bio('omlist-52129cdb8227614c','Shanghai Jiao Tong University',2020,'Assistant Professor','unknown','Official SJTU biography lists Georgia Tech OR doctorate 2020 and SJTU assistant professorship starting August 2020 as first employment.',start=2020)
for id,note in [
('omlist-43fc974cc1cd09c4','Michigan State faculty profile returned an access challenge; no readable degree and early job chronology.'),
('omlist-440921d6ac72aac9','Amsterdam faculty profile contains publications and doctoral thesis listing but no dated employment chronology.'),
('omlist-457002fa613c23a2','CBS institutional profiles describe research, teaching and current affiliation but no dated early career chronology.'),
('omlist-46565b8ad0991315','NTU profile returned only a site heading without readable biography or chronology.'),
('omlist-472f53f14d6cffc6','Cologne CV dates Karlsruhe doctorate 1991, habilitation 1995 and Mainz hospital executive role 1993-1995, leaving employment immediately after PhD unestablished.'),
('omlist-477a00f9b5ebbf56','Imported McGill faculty profile returned 404; no primary chronology was established.'),
('omlist-482e02b17ff93ac2','Emory and personal biographies identify NYU doctorate and current Emory role but supply no early employment dates.'),
('omlist-4926b8de478754d7','Purdue biography dates current appointment to January 2026 but omits doctoral and earliest employment chronology.'),
('omlist-49c81275c32b7cdc','Calgary biography identifies VU PhD 2009 and prior Montreal postdoc, Aarhus visit and Rotterdam faculty role without dated ordering.'),
('omlist-49cd064458b4396f','UNSW biography identifies Berkeley doctorate and prior Maryland and Missouri-Rolla faculty roles without a dated sequence.'),
('omlist-4ae674bb38139513','Dayton biography gives two doctorates, Illinois materials science 2006 and UC San Diego operations 2017, but no employment dates. First-job scope must distinguish the two degrees.'),
('omlist-4b6d749df9579c58','INSEAD faculty profile returned 403; no primary chronology was established.'),
('omlist-4baaaee5909dbd11','Rotman biography gives Columbia OR PhD 2009 but does not provide early employment history.'),
('omlist-4beab51de1b73ab1','CBS biographies describe current teaching and research without dated doctoral and early employment chronology.'),
('omlist-4bf47b04f6623b79','POMS professional biography gives Carnegie Mellon PhD 1970 and MIT appointment 1969-1972, explicitly starting before degree completion. A unique first job newly begun after PhD is not established.'),
('omlist-4ed3073b6549a17c','HEC biography gives INSEAD PhD 2003 and previous LBS assistant professorship, but does not date that role or exclude intervening employment.'),
('omlist-4ff96bb85b4322ba','NTU profile returned only a site heading without readable biography or chronology.'),
('omlist-5089beefbdd688aa','NUS discovery requires JavaScript and personal website identifies only current role; no early employment chronology.'),
('omlist-51a93b7bf1f3350b','Cardiff faculty profile returned 403; no readable primary chronology.'),
('omlist-520e08e78e51c33d','Rotterdam profile lists publications and doctoral thesis but no dated first-employment chronology.'),
('omlist-54375570bbbca1b4','ASU biography gives Michigan State PhD 1990 but no dated early job chronology. Linked CV could not be opened due to rate limiting.')]:bio_unresolved(id,note)
r=next(x for x in out if x['name']=='Paul Kleindorfer');r['sources']=[dict(url='https://www.poms.org/sites/default/files/chronicles/Vol12No3.pdf',title='POMS Chronicle 2005 fellow biography',notes=r['reason'])]
save()
