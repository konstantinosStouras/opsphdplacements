from review_helpers import *
cv('Mengzhenyu (Zhenyu) Zhang','IBM T. J. Watson Research Center',2021,2021,'Postdoctoral Researcher, AI and Marketing','Full CV dates Michigan doctorate to 2021, IBM postdoctoral research 2021–2022, and UCL assistant professorship only from 2022; Oracle internship was in 2018.',category='postdoc')
cv('Jordan Tong','University of Wisconsin–Madison',2012,2012,'Assistant Professor','Full CV dates Duke doctorate to 2012 and Wisconsin assistant professorship 2012–2018 as the earliest academic employment.')
cv('Jiaqi Lu','Chinese University of Hong Kong, Shenzhen',2021,2021,'Assistant Professor','Full CV lists Columbia doctorate in 2021 and CUHK Shenzhen tenure-track assistant professorship from 2021 as the earliest employment.')
cv('Ali Tuna','Tilburg University',2024,2024,'Assistant Professor of Operations Management','CV lists Duke doctorate in 2024 and Tilburg assistant professorship from August 2024. Amazon internship ended September 2022 and consulting ended June 2018.')
cv('Nil Karacaoglu','The Ohio State University',2019,2019,'Assistant Professor of Operations Management','CV lists Kellogg doctorate 2014–2019 and Ohio State assistant professorship from 2019 as the earliest academic position; Harvard visits were as a student.')
cv('Zhe Liu','Imperial College London',2019,2019,'Assistant Professor of Operations Management','CV dates Columbia doctorate 2013–2019 and Imperial assistant professorship 2019–2026 as the earliest appointment; Amazon industry internship was in 2018.',url='https://blogs.imperial.ac.uk/zhe-liu/files/2026/07/Zhe-Liu_Imperial_cv.pdf')
cv('Seungki Min','Korea Advanced Institute of Science and Technology',2021,2021,'Assistant Professor of Industrial and Systems Engineering','CV dates Columbia doctorate to June 2021 and KAIST assistant professorship from September 2021. All listed financial-industry jobs and internships ended before doctoral completion.',url='https://biz.snu.ac.kr/en/external/faculty?mode=downloadcv&idx=13201')
# Keep previous table leads for unresolved records; append corroboration without discarding them.
r=next(x for x in records if x['name']=='Kejia Hu')
r['sources'].append(dict(url='https://www.kejiahu.com/uploads/9/0/9/3/90937100/kejia_hu_oxford_public_cv.pdf',title='Kejia Hu public CV',notes='CV lists 2017 doctorate, Vanderbilt assistant professorship 2017–2023 and Cornell Academic Scholars from 2017. Exact nature/order of the Cornell affiliation remains unclear. Earlier industry roles ended by 2013.'))
r['reason']='Full CV corroborates Vanderbilt employment but also lists a Cornell Academic Scholars affiliation from the same year; first-employer ordering remains unresolved.'
save(r)
print('Saved',len(records),sum(x['status']=='verified' for x in records))
