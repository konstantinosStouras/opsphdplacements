from helpers import *
changes={'Michel Mandjes':'Vrije Universiteit Amsterdam','Vahideh Manshadi':'Stanford University','Charles Fine':'Stanford University','Stephen C. Graves':'University of Rochester','Najat Bara':'Paris 1 Panthéon-Sorbonne University','Peter Zhang':'Massachusetts Institute of Technology'}
for r in records:
 if r['name'] in changes:
  r['phdInstitutionVerified']=changes[r['name']]
  r['phdInstitutionResolution']='The faculty CV explicitly identifies '+changes[r['name']]+' as the doctoral degree-granting institution; the original imported value is retained separately.'
save()
