from helpers import *
addcv('omlist-80cda0d4915387d0','Federal University of Rio Grande do Sul',1997,'Post-Doctoral Fellow','postdoc','CV dates Warwick PhD to 1997 and UFRGS postdoctoral fellowship to 1997–1998, preceding faculty appointments.')
addcv('omlist-80fdbb05c8dc8bfe','University of Michigan',2016,'Assistant Professor of Technology and Operations','tenure-track','CV dates Wharton finance PhD to 2016 and Michigan Ross assistant professorship from 2016 to 2023 as earliest academic appointment.')
addcv('omlist-8394dc7529bf2891','University of Notre Dame',2017,'Assistant Professor of Operations','tenure-track','CV dates South Carolina PhD to 2017 and Notre Dame assistant professorship to 2017–2020, preceding Colorado.')
addcv('omlist-9061dc94d6c43c71','University of Michigan',2012,'Assistant Professor of Industrial and Operations Engineering','tenure-track','CV dates MIT PhD to August 2012 and Michigan assistant professor from September 2012. Industry internships are all dated before degree completion.')
addcv('omlist-9203f5c9ba37f332','Universidad Adolfo Ibáñez',1996,'Assistant Professor','tenure-track','CV dates MIT PhD to 1996 and Universidad Adolfo Ibáñez assistant professor to 1996–1997, preceding Harvard and Texas A&M. Earlier Monterrey role ended before doctoral study.')
addcv('omlist-947a57d9191a94c5','Duke University',2003,'Assistant Professor','tenure-track','CV dates MIT PhD to 2003 and Duke assistant professorship to 2003–2008 as earliest listed appointment.')
addcv('omlist-a0394b5c97b28fef','University of Florida',2019,'Assistant Professor of Industrial and Systems Engineering','tenure-track','CV dates Columbia PhD to 2019 and Florida assistant professorship to 2019–2023, before Miami.')
unresolvedcv('omlist-84efc68b35303c19','CV dates Exeter PhD completion to April 2010 and Innovorsa/XPO consulting employment from December 2006 to April 2011. Exeter research fellowship begins April 2011. Employment continuing through graduation is documented; the initial post-degree transition needs separate treatment.')
unresolvedcv('omlist-86c8929851f1fcfa','CV dates MIT PhD and Harvard assistant professorship to 1995, but also lists McKinsey management consultant in 1995. Months and order are absent, preventing verification of whether consulting or Harvard was the first post-PhD employment.')
unresolvedcv('omlist-8f5d4321f4884f00','CV dates McGill PhD to 2014, UBC research assistant to May–October 2014 and UBC postdoctoral fellow from November 2014. The degree completion month is missing, so the first role after completion cannot yet be distinguished.')
unresolvedcv('omlist-985de3a198a51517','CV dates Stanford PhD and Kellogg assistant professorship to 1995, but also McKinsey summer associate in summer 1995. Degree completion month and employment order require clarification before identifying the initial post-PhD job.')
unresolvedcv('omlist-9de2540fecf86898','Linked CV describes a Columbia PhD candidacy beginning in 2016 without completed degree or post-PhD appointment dates. The document appears stale and cannot establish present degree status or first placement.')
for r in records:
 if r.get('reason','').startswith('Faculty CV'):
  for s in r['sources']:
   if s['notes'].startswith('Official doctoral-program'):s['notes']='Faculty CV education and employment chronology reviewed.'
save()
