from review_helpers import *
cv('Behrooz Pourghannad','Mayo Clinic',2019,2019,'Postdoctoral Fellow','Oregon degree and previous-position chronology dates Minnesota doctorate to 2019, Mayo Clinic postdoc 2019–2021 and Laurier faculty appointment 2021–2022.',category='postdoc',url='https://business.uoregon.edu/directory/operations-business-analytics/all/behroozp')
cv('Michael R. Wagner','California State University, East Bay',2006,2006,None,'Washington education and positions chronology dates MIT doctorate to 2006 and Cal State East Bay employment 2006–2009 as earliest listed position before Saint Marys and Washington. Initial rank unspecified.',category='unknown',url='https://foster.uw.edu/faculty-research/directory/michael-wagner/')
cv('Özge Tüncel','Eindhoven University of Technology',None,None,'Postdoctoral Researcher','Maastricht biography explicitly places Eindhoven postdoctoral appointment after the Singapore University of Technology and Design doctorate and before the current role. Degree and start years unspecified.',category='postdoc',url='https://www.maastrichtuniversity.nl/o-t%C3%BCncel')
cv('Shixin Wang','The Chinese University of Hong Kong',2021,2021,'Assistant Professor','Georgia Tech academic biography dates NYU doctorate to 2021 and CUHK assistant professorship 2021–2025 before Georgia Tech.',url='https://sites.gatech.edu/shixinwang/')
notes={
'Xiaomeng Guo':'The PolyU profile lists Washington University doctorate without dates or early employment chronology; the linked CV requires sign-in.',
'Rob Klassen':'The Ivey profile describes current role and research without a doctoral and early employment chronology; discovery profile returned an application shell.',
'Xingyu Bai':'The PolyU biography dates Illinois doctorate to 2024 but does not date appointment start or give a complete employment chronology.',
'André Tchokogué':'The HEC profile lists Bordeaux doctorate without completion date and does not establish earliest employment.',
'Christophe Bernard':'The TBS chronology dates doctorate to 1997 but Toulouse lecturer employment 1995–1998, spanning completion; first post-completion job remains ambiguous.',
'Christopher Kwaramba':'The VCU biography mentions prior Virginia Tech and East Carolina teaching without dated degree and employment chronology.',
'Ye Lu':'The City University profile returned an HTTP 400 response.',
'Zakaria EL Hathat':'The RBS profile identifies doctorate and dissertation award but does not give completion or initial employment dates.',
'Pranadharthiharan Narayanan':'The Nova profile dates IE doctorate to 2023 but does not establish earliest employment or start date.',
'Ruomeng Cui':'The Emory biography lists doctorate and current role without early career dates; linked CV returned a missing-page response.',
'Tsan-Ming (Jason) Choi':'The Liverpool biography describes current role and research without a dated doctoral and earliest employment chronology.',
'Xiaorong Chen':'The SJTU biography identifies Kyushu doctorate and later visiting roles without degree or initial appointment dates.',
'Wenjin Hu':'The Bristol profile describes research and current lecturer role without a doctoral and early employment chronology.',
'Volodymyr Babich':'The Georgetown biography identifies Case Western doctorate and earlier Michigan appointment and visiting roles without dates or initial-employer wording.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
