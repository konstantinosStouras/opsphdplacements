import json, pathlib, hashlib, copy, re
B=pathlib.Path('research-handoff/parallel-stages-2026-10-26/stage-3')
O=pathlib.Path(__file__).parent
def read(p): return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(v): return hashlib.sha256(json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
H={r['id']:r for r in read('data/employment-histories.json')['records']}
R={r['id']:r for r in read('data/faculty-roster-people.json')['records']}
summaries={
79:('The CV, current academic biography, host profile and all six accessible LinkedIn Experience entries were reviewed. Eleven career and programme observations include the Lehman internship and Simons visits. Date conflicts remain explicit.',[
'The 2013 PhD completion month is unknown. Stanford starts in August 2013 in the CV and September in LinkedIn; first-job ordering remains unresolved. An unavailable thesis and its search snippet do not verify the degree month.',
'Lyft starts in July 2014 in LinkedIn and August in the CV. The separate June–December 2018 consultancy is omitted from LinkedIn; the broader 2014–2018 biography does not establish continuous employment.',
'The older LinkedIn assistant-professor title does not override the official associate-professor title and July 2021 promotion. Simons programme organization does not establish a separate paid job.',
'The earliest listed internship is Lehman in 2006; earlier work and a complete real-world career are not established.']),
80:('Professional experience, special appointments, short courses, editorial and administrative sections of the CV were reviewed. Fifty source observations include the graduate-studies directorship and eight additional short courses. No matched individual LinkedIn profile was found.',[
'The Purdue fellowship began in 1969 and spans the January 1970 doctorate. Technion in February 1970 is the earliest documented new post-degree appointment; Ford in summer 1967 remains pre-degree employment.',
'Industry follow-up for Ford and AT&T remains incomplete because no identity-matched individual LinkedIn profile was found.',
'The 1982 Technion visit and 1981 Lady Davis grant remain distinct. The source gives an impossible June 31, 2007 Munich end date; it is not silently repaired using the separate course dates.',
'The CV and current official biography give June 2004 for the directorship end; the older biography says July 2003. Other faculty end dates are unknown. Short courses do not establish separate staff employment or compensation.']),
81:('Academic biographies, the host profile, thesis title page and all four accessible LinkedIn Experience entries were reviewed. Four career observations retain the ETH end-month conflict and the distinction between thesis presentation and reported completion.',[
'ETH began in October 2020, after the individually read LinkedIn education end in July 2020. The thesis presentation on June 17 is not the formal conferral date; the EPFL assistantship spans completion.',
'The ETH host gives August 2021 as the end; LinkedIn gives July 2021. The CMU start is August 2021.',
'The thesis names the Management of Technology doctoral programme and Docteur ès Sciences award. Cornell’s Operations Research education label is retained as a conflicting description, not substituted for the award title.',
'No full CV was found and no industry employment is listed. Work before the EPFL assistantship remains unknown.']),
83:('Official and conference-host biographies and all four LinkedIn Experience entries were reviewed, together with three volunteer-service entries. Five consolidated career observations separate Salomon and Citi; no CV was found.',[
'The conference-host biography explicitly places Salomon after the 1997 Cornell PhD. LinkedIn dates the start to August 1997. Formal conferral month/day and earlier paid work remain unknown.',
'The combined Cornell practice-professor/director LinkedIn entry begins July 2007. This establishes the reported Cornell period but does not independently date appointment to the practice rank.',
'The Deutsche Bank role is dated 2004–2007 only. No start month or promotion date is inferred from Citi’s end date.',
'No accessible CV was found. Volunteer board service does not establish paid industry employment. One Cornell conference PDF was unavailable.']),
84:('The six-page CV, academic biography, all two LinkedIn Experience entries and the ORCID education entry were reviewed. Twenty career, teaching and visit observations are retained, with student visits and tutorials distinguished from staff employment.',[
'The September 2023 Wharton appointment follows the self-reported ORCID education end of June 15, 2023. This supports the earliest documented new post-degree appointment; it does not verify the registrar’s conferral day or the earliest paid job of any kind.',
'Compensation for the Simons and IAS student visits and IMSI tutorial is unknown; these are not assumed staff employment.',
'Stanford teaching-assistant terms retain their academic-year season labels. They do not establish continuous full-year employment. The two LinkedIn jobs omit this teaching history.',
'No industry role was found in the accessed career sources. Coauthors and paper affiliations are not additional jobs.'])}
replacements=[];audit=[];recommendations=[]
for n in range(79,86):
 mpath=B/f'career-continuation-{n}.ready.json';m=read(mpath);write(O/'frozen'/mpath.name,m)
 f=m['files'][0];src=B/f['path']; raw=src.read_bytes(); assert hashlib.sha256(raw).hexdigest()==f['sha256']
 dst=O/'frozen'/f['path'];dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(raw)
 p=read(src);id=p['id'];old=H.get(id)
 if not old or id not in R:
  audit.append({'manifestNumber':n,'id':id,'disposition':'scope-held','reason':'Not in accepted faculty roster or public career history. Statistics/ECE affiliation and nonqualifying degree do not independently satisfy the named-title population rule. Preserve correction without adding a person.','proposalSha256':f['sha256']})
  continue
 write(O/'prior'/f'{id.split(":")[-1]}.json',old)
 r=copy.deepcopy(old)
 for k,v in p.items():
  if k not in ['personId','integrationStatus','workflowReview','linkedinObservation']:r[k]=copy.deepcopy(v)
 r['reviewStatus']='partial';r['status']='partial';r['careerComplete']=False
 r['coverageNote'],r['remainingUnknowns']=summaries[n]
 r['previousCoverageNotes']=old.get('previousCoverageNotes',[])+[{'checkedAt':old.get('checkedAt'),'coverageNote':old.get('coverageNote'),'remainingUnknowns':old.get('remainingUnknowns',[])}]
 r['integrationReview']={'checkedAt':'2026-10-27','manifestNumber':n,'status':'reviewed-compatible-replacement','note':'Individually matched prior identity retained. Source dates and conflicting observations preserved; all careers remain partial.'}
 li=p.get('linkedinObservation')
 if li:
  r['profileHistoryComplete']=bool(li.get('entireLoadedExperienceRead'))
  r['linkedinExperienceRows']=copy.deepcopy(li.get('entries',[]))
  r['linkedinProfileUrl']=li['url'];r['linkedinCheckedAt']=li['checkedAt']
  r['serviceObservations']=copy.deepcopy(li.get('volunteering',li.get('volunteerEntries',[])))
 # Restore known coarse precision rather than regressing seasonal years to null.
 for j in r['jobs']:
  for d in [j['start'],j['end']]:
   s=d.get('asWritten') or ''
   if d.get('year') is None and re.fullmatch(r'(?:Summer|Spring|Fall|Autumn|Winter) ?\d{4}',s):d.update(year=int(s[-4:]),month=None,precision='year')
  if not j.get('evidenceNote'):j['evidenceNote']='The linked source documents this role; no additional appointment boundaries are inferred.'
 # Date-only observations are displayed as observations, not open-ended intervals.
 if n==79:
  notes={1:'LinkedIn still lists Assistant Professor from July 2015 to Present. The CV and current official title establish the July 2021 promotion; the stale title is not retained as current.',2:'The CV gives August 2013; LinkedIn gives September 2013. The start-month conflict is unresolved.',3:'The CV gives August 2014; LinkedIn gives July 2014. Both give a November end.',5:'The CV summer interval is refined using the individually read LinkedIn months.',6:'The CV summer interval is refined using the individually read LinkedIn months.',7:'LinkedIn lists this earlier industry internship, omitted from the CV, with year precision only.'}
  for i,v in notes.items():r['jobs'][i]['evidenceNote']=v
  for i in [8,9,10]:r['jobs'][i]['evidenceNote']='The host lists this seasonal visit or programme role. No exact months or separate paid employment are inferred.'
  r['firstJobAssessment']={'status':'unresolved','candidateEmployer':'Stanford University','reason':r['remainingUnknowns'][0]}
 if n==80:
  r['jobs'][7]['evidenceNote']=r['remainingUnknowns'][3]
  for j in r['jobs'][42:]:j['evidenceNote']='The CV lists this short course with the stated dates. Compensation and employment-contract status are unknown; it is not a continuous faculty appointment.'
  for i in [18,31,32]:
   j=r['jobs'][i];j['observedPeriod']=j['start']['asWritten'];j['evidenceNote']='The CV records a visit during this month; exact appointment boundaries are unknown.'
  for i in range(36,41):r['jobs'][i]['end']=copy.deepcopy(r['jobs'][i]['start']);r['jobs'][i]['evidenceNote']='The CV explicitly describes a month-long February visit in each year 2015–2019.'
  r['jobs'][17]['end']={'asWritten':'July 21, 1992','year':1992,'month':7,'precision':'month'}
  r['jobs'][17]['evidenceNote']='The CV gives July 1–21, 1992; normalized month precision does not invent exact dates.'
  r['firstJobAssessment']=copy.deepcopy(old['firstJobAssessment'])
 if n==81:
  notes=['The official profile explicitly dates the Cornell start to July 2023.','Individually read LinkedIn months refine the biography’s year labels.','The official host gives October 2020–August 2021; LinkedIn gives October 2020–July 2021. The end-month conflict remains unresolved.','The EPFL assistantship spans the reported July 2020 degree completion and is not a newly begun post-degree job.']
  for j,v in zip(r['jobs'],notes):j['evidenceNote']=v
  r['degreeFacts'][0]['evidenceNote']=r['remainingUnknowns'][2]+' The presentation date is distinct from formal conferral.'
 if n==83:
  r['jobs'][1]['evidenceNote']=r['remainingUnknowns'][1]
  r['jobs'][2]['evidenceNote']='LinkedIn reports August 1997–August 1998. The conference-host biography explicitly places this role after the Cornell PhD.'
  r['jobs'][3]['evidenceNote']='The biography and LinkedIn document Deutsche Bank in 2004–2007. No exact start month or date of promotion to the head role is established.'
  r['jobs'][4]['evidenceNote']='The separate Citi role is reported August 1998–February 2004; it is not collapsed into the earlier Salomon entry.'
  r['degreeFacts'][0]['evidenceNote']='The conference-host biography explicitly identifies the 1997 Cornell ORIE PhD and subsequent Salomon role. Formal conferral month remains unknown.'
 if n==84:
  for j in r['jobs'][2:16]:j['observedPeriod']=j['start']['asWritten'];j['evidenceNote']='The CV lists this teaching assignment for the stated academic-year term. Exact dates and continuous year-long employment are not established.'
  r['jobs'][16]['evidenceNote']='The CV lists summer 2024 and the homepage specifies June–July. This teaching assignment took place during the Penn postdoc.'
  for j in r['jobs'][17:19]:j['evidenceNote']='A student visit is documented; paid employment is not established.'
  r['jobs'][19]['evidenceNote']='The CV lists this tutorial. Compensation and a separate staff appointment are not established.'
  r['degreeFacts'][0]['evidenceNote']='ORCID gives a self-reported education end, not an independently verified registrar conferral day. The Stanford alumni profile confirms the 2023 degree and identity.'
 # Public notes use plain prose; original fine-grained audit strings remain frozen.
 for s in r.get('sources',[]):
  if s.get('note') and any(len(t)>35 for t in s['note'].split()):s['note']='The source was inspected to the extent recorded in its outcome. Source limitations and conflicts are summarized in this history.'
 if n in [81,84]:
  r['remainingUnknowns'][0]=('ETH began in October 2020 and LinkedIn reports an education end in July 2020. An education endpoint and the June 17 thesis presentation do not independently establish completion before employment; first-job ordering remains unresolved.' if n==81 else 'Wharton began in September 2023 and ORCID reports an education end on June 15, 2023. The self-reported study endpoint does not independently establish degree completion before the appointment; first-job ordering remains unresolved.')
  r['firstJobAssessment']={'status':'unresolved','candidateEmployer':'ETH Zürich' if n==81 else 'University of Pennsylvania','reason':r['remainingUnknowns'][0]}
  if n==81:
   r['degreeFacts'][0]['selfReportedEducationEnd']=r['degreeFacts'][0].pop('selfReportedCompletion')
   r['coverageNote']=r['coverageNote'].replace('reported completion','reported education end')
   r['jobs'][3]['evidenceNote']='The EPFL assistantship spans the July 2020 education endpoint reported on LinkedIn. This endpoint is not independently verified as the completion date.'
 if n==83:
  emp,title,start,cat={81:('ETH Zürich','Postdoctoral Researcher',r['jobs'][2]['start'],'postdoc'),83:('Salomon Brothers','Fixed Income Research strategist',r['jobs'][2]['start'],'industry'),84:('University of Pennsylvania','Postdoctoral Researcher, Wharton',r['jobs'][1]['start'],'postdoc')}[n]
  assessment={'status':'verified','definition':'Earliest documented new appointment after reported doctorate completion','employer':emp,'title':title,'start':copy.deepcopy(start),'checkedAt':'2026-10-27','reason':r['remainingUnknowns'][0]}
  r['firstJobAssessment']=assessment
  recommendations.append({'id':id,'action':'add-supported-first-job','employer':emp,'jobTitle':title,'jobType':cat,'placementYear':start['year'],'phdInstitution':r['degreeFacts'][0]['institutionAsWritten'],'phdYear':r['degreeFacts'][0]['year'],'reason':assessment['reason'],'sourceUrls':[s['url'] for s in r['sources'] if 'unavailable' not in s.get('outcome','')],'checkedAt':'2026-10-27','completionEvidenceType':'explicit-relative-biography' if n==83 else 'individually-read-self-reported-education-end'})
 for j in r['jobs']:
  if isinstance(j.get('observedPeriod'),str):j['observedPeriod']={'asWritten':j['observedPeriod']}
  j['titleAsWritten']=j['titleAsWritten'].replace('DecisionTheory','Decision Theory').replace('DecisionSciences','Decision Sciences').replace('MathematicalStatistics','Mathematical Statistics').replace('shortcourse','short course')
  for key in ['start','end','observedPeriod']:
   if isinstance(j.get(key),dict) and j[key].get('asWritten'):
    j[key]['asWritten']=re.sub(r'([A-Za-z])(\d)',r'\1 \2',j[key]['asWritten'])
 if n==79:
  for i in [1,2,3,5,6]:r['jobs'][i]['checkedAt']='2026-10-27'
  r['sources'][2]['note']='The individually read profile matches Cornell ORIE and UT Austin ECE. The 2018 Lyft consultancy is omitted; its separate CV interval is preserved.'
  r['sources'][4]['note']='The unavailable thesis appears in search results with an August 2013 date; this remains a discovery lead and does not verify completion.'
 if n==80:
  r['otherEmploymentMentions'][0]['evidenceNote']='The Purdue fellowship spans the doctorate. Technion’s 1982 visit and the Lady Davis grant in 1981 remain distinct. The impossible June 31 Munich appointment end is not repaired using course dates. Short courses: Gothenburg December 10–15, 2001; Finland June 3–8, 2002; Bern June 2–27, 2004; Eurandom May 10–June 18, 2005; Munich May 9–June 30, 2007; Sonderborg August 13–17, 2007; Louvain May 13–21, 2008; EPFL September 14–15, 2009; Carlos III Madrid May 21–25, 2009; Copenhagen June 23–25, 2015; Bocconi April 27–May 17, 2019; UNC January 8–27, 2023. Lectures, grants and editorial service are not automatically new employment.'
  r['sources'][0]['note']='All professional experience, special appointments, short courses and editorial sections were read. The publication and talk remainder was not wholly read; full date strings retain source precision.'
  r['sources'][2]['note']='No identity-matched individual profile was found. Follow-up on Ford and AT&T remains incomplete.'
  r['sources'][3]['note']='Career sections were reread; the bibliography was not wholly read.'
 if n==81:
  r['otherEmploymentMentions'][0]['evidenceNote']='Cornell courses in 2023–2026 occur within the faculty role. SNSF mobility funding in 2020 is not an additional employer. Advisor and student affiliations are not his employment.'
  r['sources'][3]['note']='The thesis title and degree page were read, not the full 213-page dissertation. No career CV was found.'
  r['sources'][4]['note']='All four listed Experience entries and the September 2014–July 2020 EPFL education range were read. No additional Experience expansion control or industry role was listed.'
 if n==83:
  for i in [1,2,3]:r['jobs'][i]['checkedAt']='2026-10-27'
  for s in r['serviceObservations']:
   s.update(sourceUrl=li['url'],checkedAt=li['checkedAt'])
   date=re.sub(r'([A-Za-z])(\d)',r'\1 \2',s['datesAsWritten'])
   r['otherEmploymentMentions'].append({'sourceUrl':li['url'],'checkedAt':li['checkedAt'],'evidenceNote':s['titleAsWritten']+' at '+s['organizationAsWritten']+', '+date+'. Listed as volunteering; paid employment is not established.'})
 if n==84:
  r['otherEmploymentMentions'][0]['evidenceNote']='Penn STAT1010 teaching in summer 2024 falls within the postdoc. Stanford academic-year season labels are preserved. Simons in fall 2021 and IAS in December 2022 are student visits, not established paid jobs. The Stanford master’s and doctoral minor are not additional doctorates. Future talks are not jobs.'
 replacements.append({'id':id,'priorSha256':sha(old),'priorHashContract':'SHA256 of UTF-8 JSON with ensure_ascii=false and separators comma/colon, insertion-order keys','manifestNumber':n,'replacement':r})
 audit.append({'manifestNumber':n,'id':id,'disposition':'replace-existing-history','priorSha256':sha(old),'priorRoles':len(old['jobs']),'reviewedRoles':len(r['jobs']),'proposalSha256':f['sha256'],'reviewedSha256':sha(r)})
write(O/'replacements.json',replacements);write(O/'audit.json',audit);write(O/'first-job-recommendations.json',recommendations)
ledger=[]
for x in replacements:
 r=x['replacement'];a=r['firstJobAssessment'];n=x['manifestNumber']
 if n not in [79,81,83,84]:continue
 row={'facultyId':r['id'],'name':r['name'],'status':a['status'],'checkedAt':'2026-10-27','reason':a['reason'],'sources':[{'url':s['url'],'title':r['name']+': career evidence','checkedAt':s['checkedAt'],'notes':s.get('note','Individual career evidence read; scope recorded in the history.')} for s in r['sources'] if 'unavailable' not in s.get('outcome','')]}
 if n==83:row.update(employer='Salomon Brothers',position='Fixed Income Research strategist',placementYear=1997,category='industry',phdYearVerified=1997,phdInstitutionVerified='Cornell University',evidenceUrl='https://www.rebellionresearch.com/victoria-averbukh-director-cornell-financial-engineering-manhattan-conference-chair',evidenceNote=a['reason'])
 ledger.append(row)
write(O/'ledger-proposals.json',{'records':ledger})
print(json.dumps({'replacements':len(replacements),'priorRoles':sum(len(H[x['id']]['jobs']) for x in replacements),'reviewedRoles':sum(len(x['replacement']['jobs']) for x in replacements),'scopeHeld':2,'firstJobRecommendations':len(recommendations)}))
