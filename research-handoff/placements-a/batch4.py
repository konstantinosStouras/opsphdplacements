from helpers import *
for name,emp,year,url,pos,cat,note in [
('Shubham Akshat','Carnegie Mellon University',2022,'https://www.rhsmith.umd.edu/programs/phd/your-career','Postdoctoral Fellow','postdoc','Maryland lists Akshat among May/August 2022 graduates placed directly upon graduation, with a Carnegie Mellon postdoctoral fellowship.'),
('Hamsa Bastani','IBM Research',2017,'https://hamsabastani.github.io/cv.pdf','Herman Goldstine Postdoctoral Fellow','postdoc','CV lists Stanford PhD 2017, IBM postdoctoral fellowship 2017–2018, then Wharton assistant professorship from 2018.'),
('Yeganeh Alimohammadi','University of California, Berkeley',2024,'https://yalimohammadi.github.io/files/cv_Yeganeh.pdf','UC President\'s Postdoctoral Fellow','postdoc','CV lists Stanford PhD 2024 and Berkeley postdoctoral appointment 2024–2025 before USC in 2025. The Simons fellowship in 2022 occurred during doctoral study.')]:
 add(name,emp,year,url,name+' — CV / official graduate record',note=note,position=pos,category=cat,start=year)
p=next(p for p in faculty if p['id']=='omlist-25f4b50f84b33945')
add(p['name'],'University of Virginia',2016,'https://www.stouras.com/Konstantinos_Stouras_CV.pdf','Konstantinos Stouras — Curriculum Vitae',note='CV lists INSEAD PhD 2016 followed by a 2016–2018 Batten Scholar appointment at Darden. The grants section independently describes the same period as a Batten Institute research fellowship; UCD employment begins in 2018.',position='Batten Scholar in Innovation, Technology and Operations',category='other-academic',start=2016)
for x in records:
 x['name']=next(p['name'] for p in faculty if p['id']==x['facultyId'])
out.write_text(json.dumps(records,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(len(records))
