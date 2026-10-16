from helpers import *
old={r['name']:r.copy() for r in records}
for id,emp,year,note in [
 ('omlist-e6bd261099379043','University of Wisconsin–Madison',2014,'CV education dates Wharton PhD to 2014; appointment chronology begins with Wisconsin assistant professorship 2014–2021.'),
 ('omlist-b02f45606c2dc440','INSEAD',2007,'CV lists Wharton PhD 2007 and INSEAD assistant professorship 2007–2014 as the earliest academic appointment.'),
 ('omlist-543860c441dd6922','University of California, Berkeley',2012,'CV lists Wharton PhD June 2012 and Berkeley assistant professorship beginning July 2012; earlier consulting appointments ended in 2007.'),
 ('omlist-a145d1e0d2f0ae00','University of Michigan',2012,'CV dates Wharton PhD to 2012 and lists Michigan assistant professorship 2012–2019 as the first employment appointment.'),
 ('omlist-6145b94db3b2e1b3','Cornell University',2015,'CV dates Michigan doctorate to 2015 and lists Cornell assistant professorship 2015–2024 as the earliest academic appointment.')]:
 addcv(id,emp,year,'Assistant Professor','tenure-track',note)
addhtml('omlist-38b1bb53757ba39b','Santa Clara University',2022,'Assistant Professor','tenure-track','Personal academic CV lists Northwestern doctorate 2018–2022 and Santa Clara assistant professorship from 2022; Indian School of Business research associate role was before the doctorate, 2016–2018.')
records[-1]['sources'][0]['title']='Simrita Singh — personal academic CV'
records[-1]['reason']='Personal academic CV provides dated degree and employment chronology.'
for r in records:
 if r['name'] in old and r['evidenceUrl']!=old[r['name']].get('evidenceUrl') if r.get('evidenceUrl') else False:
  r['sources'].extend(old[r['name']]['sources'])
save()
