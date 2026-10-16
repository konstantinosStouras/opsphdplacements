from review_helpers import *
cv('Vincent Slaugh','The Pennsylvania State University',None,2015,'Visiting Faculty Member in Supply Chain Management','Cornell biography dates Carnegie Mellon doctorate to 2015 and states a year as Penn State visiting faculty before joining Cornell in July 2016. Exact Penn State start date is unspecified.',category='other-academic',url='https://business.cornell.edu/profiles/vws8/')
cv('Clara Carrera','IESE Business School',2025,None,'Assistant Professor of Operations, Information and Technology','IESE biography explicitly states joining in 2025 after earning INSEAD doctorate; consulting and Amazon work are expressly identified as pre-doctoral.',url='https://www.iese.edu/faculty-research/faculty/clara-carrera/')
notes={
'Fatima Lopez Castellanos':'The Bristol profile describes research and current role without doctoral completion or early career chronology.',
'Oded Berman':'The Toronto profile returned a JavaScript application shell without a readable biography.',
'Jen Blackhurst':'The Auburn profile dates Iowa doctorate to 2002 and describes later Iowa leadership but does not establish the first post-doctoral employer.',
'Robert Fildes':'The Lancaster profile lists qualifications without dates and no early employment chronology.',
'Zhong Ning':'The Fudan profile returned a template without readable education or employment details.',
'Richard Cuthbertson':'The Oxford profile returned an access-denied response.',
'Ye Liu':'The personal biography identifies Washington University doctorate without a completion date or earliest employment chronology; Syracuse link returned a missing page.',
'Junfei Huang':'The CUHK profile lists two doctorates and joining in 2013 but does not date either doctorate or intervening employment.',
'Anna Land':'The Boise State biography dates Kassel doctorate to 2016 and mentions earlier Wisconsin-Whitewater associate professorship without its start or initial role.',
'Seongtae Kim':'The Aalto profile dates Hull doctorate to 2016 and reports an ETH Zurich postdoc before Aalto in 2019, but does not date the postdoc or explicitly establish it as first employer.',
'Bruna Suzanne Aiello Tsu Nishikawa':'The FGV profile describes dissertation and research but lacks doctoral completion and employment chronology.',
'Johannes Meuer':'The KLU CV dates doctorate to 2011, Cranfield visiting fellowship 2011–2016 and Zurich postdoc 2012–2015. Ordering and employment status of the earliest visiting fellowship are unclear.',
'Xi Dai':'The Fudan profile returned a template without readable education or employment details.',
'Dongping Song':'The Liverpool biography lists earlier universities and joining in 2013 but lacks doctoral completion and first-employment dates.',
'Shawnee Vickery':'The MSU profile returned an access-protection response and its linked legacy Word CV returned no readable text.',
'Jiayi Yu':'The Fudan profile returned a template without readable education or employment details.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
