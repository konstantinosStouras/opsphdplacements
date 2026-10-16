from review_helpers import *
cv('Tian Heong Chan','Emory University',None,None,None,'Emory biography explicitly states that Chan joined Goizueta after completing the INSEAD doctorate. Exact initial title and dates are unspecified.',category='unknown',url='https://goizueta.emory.edu/faculty/profiles/tian-heong-chan')
notes={
'Robin Dillon-Merrill':'The Georgetown biography describes Stanford doctorate and earlier engineering work without doctoral or initial faculty dates; linked CV returned a missing page.',
'Lori S. Cook':'The DePaul profile dates doctorate to 1992 and mentions earlier engineering jobs without dates; first post-doctoral employer cannot be ordered.',
'Panos Kouvelis':'The WashU profile dates Stanford doctorate to 1988 but lacks an early employment chronology; the Box CV returned an application shell.',
'Chaithanya Bandi':'The NUS profile returned an application shell and linked PDF returned no readable text.',
'Dnyaneshwar Mogale':'The Cardiff profile returned an access-denied response.',
'Serpil Sayın':'Both linked Koç academic pages returned access-denied responses.',
'Laurens Debo':'Tuck profiles date INSEAD doctorate to 2002 and mention earlier Carnegie Mellon and Chicago affiliations without start dates or first-employer wording.',
'Chandrasekararao Seepana':'The Bristol profile describes research and current role without doctoral or earliest employment dates.',
'Donna Marshall':'The UCD profile returned an application shell without a readable biography.',
'Kannan Sethuraman':'The Melbourne profile returned an access-denied response.',
'Jafar Namdar':'The MSU profile returned an access-protection response.',
'YunShin Lee':'The KAIST profile lists Cambridge degrees without dates or initial employment chronology.',
'Tim Kraft':'The NC State profile dates Stanford doctorate to 2011 and reports earlier Darden and MIT appointments without their dates or ordering; linked CV returned a missing page.',
'Zhaowei She':'The SMU profile dates Georgia Tech doctorate to 2021 but lacks an employment chronology; linked PDF returned no readable text.',
'Zhiwen Yin':'The Fudan profile returned a template without readable education or employment details.',
'Peter Zhang':'The Georgia State biography describes research and current role without doctoral completion or earliest employment chronology.',
'Chris Voss':'The Warwick profile returned a person-not-found response.'}
for n,note in notes.items():profile_unresolved(n,note)
print('Saved',len(records))
