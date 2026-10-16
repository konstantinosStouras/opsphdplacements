from review_helpers import *
cv('Shuo Huang','Tsinghua University',2002,2002,'Assistant Professor','Tsinghua education and work history dates doctorate to 2002 and assistant professorship 2002–2010 as earliest appointment.',url='https://www.sem.tsinghua.edu.cn/en/info/1219/7083.htm')
notes={
'Michael Goulder':'The Case Western profile dates Doctor of Management to 2022 but does not provide early employment chronology or establish a first job after that degree.',
'Nasser Barjesteh':'The Toronto profile lists Chicago doctorate without completion date or first employment chronology; linked CV returned a missing page.',
'David Rea':'The Lehigh biography lists degrees without dates; the personal vitae page returned only a heading and print link.',
'Li Ding':'The personal page dates Georgia Tech doctorate to 2024 but does not establish initial appointment dates or exclude preceding post-doctoral employment.',
'Chonghuan Wang':'The Texas Dallas faculty profile returned a missing-page response.',
'James Dyer':'The Texas profile and public CV link returned application shells without readable chronology.',
'Nezih Altay':'The DePaul profile dates doctorate to 2001 and teaching since 1999 without employer chronology around completion.',
'Yiming Zhang':'The CUHK Shenzhen profile could not be retrieved because of a TLS handshake failure.',
'Rodney Thomas':'The Arkansas link returned directory navigation without individual biography.',
'Federico Pasin':'The HEC profile lists an industrial engineering doctorate without date or early employment chronology.',
'Qinghe Sun':'The personal page dates NUS doctorate 2017–2022 but neither retrieved profile supplies earliest employment dates.',
'Sidhartha Das':'The George Mason biography lists degrees and research without doctoral completion or initial appointment dates.',
'Richard E. Wendell':'The Pittsburgh biography dates doctorate to 1971 but lists earlier Ohio State, Carnegie Mellon and RPI affiliations without dates or first-employer ordering.',
'Hung-Jui (Henry) Wu':'The Tilburg biography identifies Bath doctorate before joining but omits degree and employment dates and a complete chronology.',
'Kate McLoughlin':'The UCD profile returned an application shell without a readable biography.',
'Haresh Gurnani':'The Stony Brook profile lists Carnegie Mellon doctorate without dates; linked CV returned a missing-page response.',
'Sezer Ulku':'The Georgetown biography lists INSEAD degrees and current role without doctoral completion or initial appointment dates.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
