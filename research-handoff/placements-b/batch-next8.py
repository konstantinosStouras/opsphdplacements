from review_helpers import *
notes={
'Jason Merrick':'The VCU biography identifies George Washington doctorate and research activities without completion or earliest employment dates.',
'Xiaoping Yang':'The USTC profile dates joining to 1999 but does not establish doctoral completion or earliest employment.',
'Shraddha Mishra':'The IMI profile mentions earlier BIMTECH faculty and Cognizant project work without dates or ordering around doctoral completion.',
'Steven Melnyk':'The MSU profile returned an access-protection response.',
'Daniel Tapiador de Pedro':'The linked IE page has a source identity mismatch: its biography names Professor Soffritti and describes Boston College economics training under Daniel Tapiador de Pedro header. No career facts from that biography were transferred.',
'Wolfram Wiesemann':'The Imperial profile supplies current role and contact details without an early degree and employment chronology.',
'Abdelhak Elidrissi':'The RBS profile lists two doctorates at UPHF and EMI without dates or earliest employment chronology; degree institution descriptions also differ between header and biography.',
'Cheng (Emily) Zhu':'The Texas State profile dates McGill doctorate to 2018 but does not establish earliest employment after completion.',
'Ricky Roet-Green':'The Rochester biography dates doctorate to 2014 and reports a two-year Toronto postdoc before Simon, but does not date that appointment or explicitly exclude an earlier role; Box CV was not readable.',
'Philip Moscoso':'The IESE biography and linked personal page describe degrees and current roles without dated earliest employment.',
'Duo Shi':'The CUHK Shenzhen profile could not be retrieved because of a TLS handshake failure.',
'Wenyi Xia':'The HEC profile lists UBC degrees without completion dates or early employment chronology.',
'Di Fan':'The PolyU profile dates Macau assistant professorship from September 2015 and later ANU employment, but does not establish doctoral completion or first-job ordering.',
'Henri Groenevelt':'The Rochester biography notes 44 years of service without degree or earliest appointment dates; Box CV returned an application shell.',
'Thomas Breugem':'The Tilburg biography identifies Erasmus doctorate and INSEAD visiting affiliation without dates or earliest employment chronology.',
'Ken Petersen':'The Oklahoma biography lists several prior universities and Navy service without dates or doctoral completion chronology.',
'Torbjörn Netland':'The ETH individual and group pages returned navigation without a readable individual biography.',
'Sameer Mehta':'The RSM profile identifies earlier Illinois assistant professorship and Texas Dallas doctorate but omits appointment dates needed to establish the earliest employer.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
