from review_helpers import *
cv('Luyi Yang','Johns Hopkins University',2017,2017,'Assistant Professor of Operations Management and Business Analytics','Personal academic education and employment chronology dates Chicago doctorate to 2017 and Johns Hopkins assistant professorship 2017–2020 as the earliest appointment.',url='https://sites.google.com/view/luyiyang/home')
cv('Hyunwoo Park','Georgia Institute of Technology',2015,2015,'Postdoctoral Fellow','Personal academic chronology lists Georgia Tech doctorate in 2015 and Tennenbaum Institute postdoctoral fellowship 2015–2017 before Ohio State faculty appointment.',category='postdoc',url='https://hyunwoopark.com/')
notes={
'Emrah Demir':'The Cardiff profile returned an access-denied response.',
'Xuying Zhao':'The Texas A&M biography describes sixteen years at Notre Dame and the Texas Dallas doctorate, but supplies no doctoral or first-employment dates.',
'Martin Grunow':'The TUM profile returned a missing-page response.',
'Oleg Prokopyev':'The linked Zurich pages describe the research group rather than an individual doctoral and career chronology.',
'Elena Katok':'The linked Texas Dallas page returned faculty-directory navigation without an individual biography.',
'Kuldeep Lamba':'The IMI profile dates BIMTECH employment from 2019 but omits doctoral completion date and earlier academic employment dates, preventing first-job ordering.',
'Glenn Richey':'The Auburn profile dates doctorate to 2003 and describes earlier industry work, but does not establish initial academic employment or its ordering around completion.',
'Shaohui Zheng':'The personal HKUST page dates Columbia doctorate to 1994 but gives no early employment chronology; the official profile encountered a certificate error.',
'George Vairaktarakis':'The Case Western profile dates joining to 1997 but does not date the doctorate or earlier employment; the alternate link is malformed.',
'Ricardo Ernst':'The Georgetown biography dates joining to 1987 but does not date the doctorate or establish the first employer after completion.',
'Qing Li':'The linked HKUST profile could not be retrieved because of a certificate verification error.',
'Çiğdem Gizem Körpeoğlu':'The personal biography identifies earlier UCL postdoc and Bilkent teaching but provides no dates or ordering relative to Carnegie Mellon doctorate.',
'Ranjit Godavarthy':'The NDSU profile lists degrees without dates and does not establish earliest employment after completion.',
'Fernanda Bravo':'The UCLA biography dates MIT doctorate and joining UCLA to 2015 but does not give a complete early employment chronology or explicit first-employer statement.',
'Johannes Fottner':'The TUM profile returned a missing-page response.',
'Biying Shou':'The linked CUHK Shenzhen profile could not be retrieved because of a TLS handshake failure.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
