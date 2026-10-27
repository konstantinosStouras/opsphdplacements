import json,pathlib,hashlib,copy
root=pathlib.Path.cwd();base=root/'research-handoff/parallel-stages-2026-10-26';lane=base/'stage-3';out=base/'review-2026-10-27g/shard-h'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
m=read(lane/'career-continuation-66.ready.json');f=lane/m['files'][0]['path'];assert hashlib.sha256(f.read_bytes()).hexdigest()==m['files'][0]['sha256'];p=read(f)
old=next(x for x in read(root/'data/employment-histories.json')['records'] if x['id']==p['id']);assert any(x['id']==p['id'] for x in read(root/'data/faculty-roster-people.json')['records'])
write(out/'frozen'/f.name,p);write(out/'frozen'/'career-continuation-66.ready.json',m);write(out/'prior'/'66.json',old)
x=copy.deepcopy(old);x.update(copy.deepcopy(p));x.pop('personId',None);x.pop('integrationStatus',None);x['reviewStatus']='partial';x['careerComplete']=False;x['profileHistoryComplete']=True
x['profileHistoryCompletenessNote']='All four accessible LinkedIn Experience rows were read; this does not establish a complete real-world career.'
for k in ['sources','degreeFacts']:
 vals=old.get(k,[])+x.get(k,[]);x[k]=[];seen=set()
 for v in vals:
  key=json.dumps(v,sort_keys=True,ensure_ascii=False)
  if key not in seen:seen.add(key);x[k].append(v)
for j in x['jobs']:
 for k in ['start','end']:
  d=j[k]
  if d['precision'] not in ['year','month','unknown']:d['precision']='month' if d.get('month') and d.get('year') else 'year' if d.get('year') else 'unknown'
 if j['end'].get('year') is not None:j['isCurrent']=False
 if j['employerAsWritten']=='Harvard University':
  j['evidenceNote']='The full LinkedIn history reports September 2022–July 2023; the authored CV corroborates the postdoctoral role. Official Carnegie Mellon graduation in August 2022 precedes this appointment.'
  j['supportingSources']=[{'url':'https://paulgoelz.de/other/cv.pdf','checkedAt':'2026-10-27','supports':'Harvard postdoctoral appointment in 2022–2023.'},{'url':'https://csd.cs.cmu.edu/academics/doctoral/degrees-conferred/paul-golz','checkedAt':'2026-10-27','supports':'Graduated August 2022.'}]
 elif j['employerAsWritten']=='Cornell University':j['evidenceNote']='LinkedIn reports July 2024; the authored CV and homepage joining announcement corroborate the Cornell appointment.'
 elif j['employerAsWritten']=='Simons Laufer Mathematical Sciences Institute':j['evidenceNote']='LinkedIn reports August–December 2023, corroborated by the CV at year precision. The December transition to Berkeley does not establish simultaneous full-month employment.'
 elif j['titleAsWritten']=='Mathematics Preparation Course Coach':j['evidenceNote']='The CV reports a one-month preparation course in September/October 2016. The exact interval is unknown; this is not a two-month duration.'
x['firstJobAssessment']={'status':'earliest-documented-postdegree-role-supported','employer':'Harvard University','position':'Postdoctoral Fellow','start':{'asWritten':'September 2022','year':2022,'month':9,'precision':'month'},'reason':'The official CMU record reports graduation in August 2022. The individually read LinkedIn history reports Harvard postdoctoral employment from September 2022 to July 2023, corroborated by the authored CV. This supports Harvard as the earliest documented new post-PhD appointment; it does not certify an exhaustive lifetime history.','evidenceUrls':['https://csd.cs.cmu.edu/academics/doctoral/degrees-conferred/paul-golz','https://www.linkedin.com/in/paul-g%C3%B6lz-381773238','https://paulgoelz.de/other/cv.pdf']}
x['coverageNote']='Eleven career observations were checked against the CV, all four LinkedIn Experience rows and an official CMU degree record. August 2022 graduation precedes the Harvard postdoc beginning in September 2022. Later postdoctoral and Cornell appointments now have month dates. Earlier teaching and internship details remain partial.'
x['remainingUnknowns']=['Harvard is the earliest documented new post-PhD appointment. This review does not establish a complete history of all paid work.','Berkeley starts in December 2023 on LinkedIn but is labelled 2024 in the CV. The December SLMath/Berkeley transition does not prove a full month of concurrent employment.','Abiturma teaching in October 2015, the TTIC summer 2019 internship and earlier teaching are omitted from LinkedIn; their exact endpoints and company employment details remain unknown.','The September/October 2016 preparation course lasted one month. Pro-bono consulting from 2020 is volunteer activity, not industry employment.']
x['otherEmploymentMentions'].append({'sourceUrl':'https://csd.cs.cmu.edu/academics/doctoral/degrees-conferred/paul-golz','checkedAt':'2026-10-27','evidenceNote':'The official CMU degree record states graduation in August 2022. Harvard postdoctoral employment begins in September 2022 on the individually read LinkedIn profile; the CV corroborates the appointment.'})
x['integrationReview']={'checkedAt':'2026-10-27','reviewer':'Codex review shard H','basis':'Reviewed saved correction66 against current public identity and history; source-check dates retained, no fresh source visit claimed.','changes':['Existing accepted faculty identity retained.','Month ordering now supports Harvard as earliest documented new post-PhD job; root adjudicates placement publication.','Season and month-range wording retained at year precision, without fabricated months.','Prior observations and cross-source Berkeley date discrepancy retained.','Volunteer consulting remains separate from employment.']}
priorhash=hashlib.sha256(json.dumps(old,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
write(out/'replacements.json',[{'id':x['id'],'priorSha256':priorhash,'priorHashContract':'SHA256 of UTF-8 JSON with ensure_ascii=false and separators comma/colon, insertion-order keys','manifestNumber':66,'replacement':x}])
write(out/'first-job-recommendations.json',[{'id':x['id'],'action':'supported-first-job-candidate-root-adjudication','employer':'Harvard University','position':'Postdoctoral Fellow','placementYear':2022,'placementMonth':9,'category':'postdoc','verifiedPhdYear':2022,'verifiedPhdMonth':8,'assessment':x['firstJobAssessment'],'checkedAt':'2026-10-27'}])
write(out/'audit.json',{'id':x['id'],'acceptedFaculty':True,'priorRoles':len(old['jobs']),'reviewedRoles':len(x['jobs']),'changes':x['integrationReview']['changes']})
print('Prepared',len(x['jobs']),'roles')
