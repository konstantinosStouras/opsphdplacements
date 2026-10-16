from review_helpers import *
cv('Shantanu Bhattacharya','INSEAD',1998,1998,'Assistant Professor of Operations Management','SMU education and employment chronology dates Texas doctorate July 1998 and INSEAD assistant professorship September 1998; Texas instructor role ended May 1998.',url='https://faculty.smu.edu.sg/profile/shantanu-bhattacharya-2296')
cv('Avishai Mandelbaum','Stanford University',1983,1983,None,'Technion biography dates Cornell doctorate to 1983 and Stanford GSB faculty service 1983–1991 before Technion. Initial faculty rank is not specified separately.',category='unknown',url='https://dds.technion.ac.il/people/academic-staff/avishai-mandelbaum/')
notes={
'Rajni Kant Bansal':'IIM Ahmedabad profile dates doctorate to 2023 and appointment to 2025, leaving the immediate post-doctoral interval unexplained; personal link requires sign-in.',
'Klaus Bengler':'The TUM biography dates doctorate to 1995 and BMW employment to 1997, but describes intervening research without identifying the employer.',
'Mabel Chou':'The NUS profile returned an application shell and linked PDF returned no readable text.',
'Ajay Deshmukh':'The Cranfield biography lists earlier World Maritime University research associate and industry roles without dates or ordering around doctoral completion.',
'Arnd Huchzermeier':'The WHU chair page describes research, alumni and current chair activity without individual doctoral completion and early employment chronology.',
'Daeki Kim':'The Korean university chronology dates MIT doctorate to 1997 but IBM postdoctoral appointment from November 1996. The apparent pre-completion postdoc start requires clarification.',
'Pietro Micheli':'The Warwick biography identifies earlier Cranfield and AIM roles without dates or ordering around doctorate completion.',
'Uta Mohring':'The personal biography dates doctorate to 2022 and reports Toronto and Eindhoven postdocs totaling three years, but does not establish their exact sequence or initial employer.',
'Walid Nasr':'The AUB profile returned navigation without readable individual biography.',
'Arne Strauss':'The WHU chair page lacks an individual career chronology and linked CV returned a missing page.',
'Hannah M Yee':'The RSM profile lists current role and publications without doctoral completion or first employment chronology.',
'Dainis Zegners':'The RSM biography identifies Munich doctorate and earlier Cologne assistant professorship without completion or appointment dates.',
'Yueyang Zhong':'The LBS profile dates appointment to 2024 and earlier consulting to 2023 but does not state doctorate completion date; linked CV returned a missing page.',
'Rob Zuidwijk':'The RSM biography describes current research and role without doctoral completion or earliest employment chronology.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
