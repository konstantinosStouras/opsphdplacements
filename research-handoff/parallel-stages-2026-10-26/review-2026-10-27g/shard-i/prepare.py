import json,pathlib,hashlib,copy
root=pathlib.Path.cwd();base=root/'research-handoff/parallel-stages-2026-10-26';lane=base/'stage-3';out=base/'review-2026-10-27g/shard-i'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
hist={x['id']:x for x in read(root/'data/employment-histories.json')['records']};people={x['id'] for x in read(root/'data/faculty-roster-people.json')['records']}
replacements=[];audit=[];recommendations=[]
summaries={67:'The CV and all nine LinkedIn Experience rows refine academic and industry chronology. Cornell assistant employment and the PhD both fall in June 2009, so their order remains unresolved. Cornell promotions, Saddlepoint leadership and prior software work are documented; overlapping ranks and conflicting source endpoints remain explicit.',68:'The historical CV, current biographies and all five LinkedIn Experience rows document Cornell, SUTD, early Bechtel work and dated consulting relationships. The Cornell biography and LinkedIn report a 1980 doctorate, while the historical CV reports June 1978. Both observations remain; no degree-year conflict is silently resolved.',69:'The CV, detailed biography and all thirteen LinkedIn Experience rows refine internship, teaching and company dates. Joint Harvard/MIT FODSI rows are consolidated into one appointment. Cornell visiting and regular ranks remain distinct; Traversal founding and CTO dates are not conflated. The August 2021 degree/postdoc boundary remains unresolved.'}
limits={67:['Cornell employment and the Princeton PhD both fall in June 2009; exact day ordering remains unknown.','ViaWorks founder versus employee wording differs. The Cornell associate rank has a September 2024 LinkedIn endpoint but a current label in the CV. Uber aggregate and detailed rank dates differ.','Nature Source Genetics and Jane Street consulting are omitted from LinkedIn; exact terms remain unknown. The COVID team role ends in 2023 on the homepage but remains current in the CV.'],68:['The historical CV reports a June 1978 PhD; the Cornell biography and LinkedIn report 1980. Neither assertion is discarded or assigned new certainty.','Cornell begins in September 1980 in the CV and August 1980 in LinkedIn. Degree completion month is unknown.','Cornell promotion and administrative term dates remain unknown. Retirement in 2016 overlaps the July 2016 SUTD start; no contiguous transition is inferred.','Dated consulting observations are relationships, not full-time employee claims. Exact contracts and undated clients remain unresolved.'],69:['FODSI starts in August 2021; LinkedIn doctoral education also ends in August 2021. The biography reports summer completion, but exact ordering is unknown. The 11 August thesis report date is not conferral.','Traversal cofounder work begins in November 2023 on LinkedIn; the CV dates CTO/cofounder to 2024. The CTO start is not backdated.','The CV distinguishes a fall 2023 Cornell visiting appointment from the January 2024 regular appointment. The current leave interval is unknown.','The July 2023 CDT course lasted one week. Student mentoring and short-course paid status are unknown; these activities are retained separately.']}
for n in [67,68,69]:
 m=read(lane/f'career-continuation-{n}.ready.json');f=lane/m['files'][0]['path'];assert hashlib.sha256(f.read_bytes()).hexdigest()==m['files'][0]['sha256'];p=read(f);old=hist[p['id']];assert p['id'] in people
 write(out/'frozen'/f.name,p);write(out/'frozen'/f'career-continuation-{n}.ready.json',m);write(out/'prior'/f'{n}.json',old)
 x=copy.deepcopy(old);x.update(copy.deepcopy(p));x.pop('personId',None);x.pop('integrationStatus',None);x['reviewStatus']='partial';x['careerComplete']=False;x['profileHistoryComplete']=True
 x['profileHistoryCompletenessNote']='All accessible LinkedIn Experience rows were individually read. This is not a complete real-world career claim.'
 for k in ['sources','degreeFacts','otherEmploymentMentions']:
  vals=old.get(k,[])+x.get(k,[]);x[k]=[];seen=set()
  for v in vals:
   key=json.dumps(v,sort_keys=True,ensure_ascii=False)
   if key not in seen:seen.add(key);x[k].append(v)
 if n==69:
  moved=[j for j in x['jobs'] if j['employerAsWritten']=='CDT Summer School, Missenden' or 'Student Mentor' in j['titleAsWritten']];x['jobs']=[j for j in x['jobs'] if j not in moved]
  for j in moved:j['evidenceNote']='The source records this teaching or mentoring activity; paid employment is not established. The CDT course lasted one week in July 2023.' if j['employerAsWritten'].startswith('CDT') else 'Student mentoring activity is reported for July 2012–April 2014; paid employment is not established.'
  x['otherEmploymentMentions'].extend(moved)
  x['otherEmploymentMentions'].append({'sourceUrl':'https://www.linkedin.com/in/raaz-dwivedi','checkedAt':'2026-10-27','evidenceNote':'LinkedIn dates Traversal cofounder work from November 2023. The CV dates the combined CTO/cofounder title to 2024. Founding does not establish the CTO start date.'})
 for j in x['jobs']:
  for k in ['start','end']:
   d=j[k]
   if d['precision'] not in ['year','month','unknown']:d['precision']='month' if d.get('month') and d.get('year') else 'year' if d.get('year') else 'unknown'
  if j['end'].get('year') is not None:j['isCurrent']=False
  if not j.get('evidenceNote'):
   match=next((a for a in old['jobs'] if a['employerAsWritten']==j['employerAsWritten'] and a['titleAsWritten']==j['titleAsWritten']),None)
   j['evidenceNote']=match['evidenceNote'] if match else 'The reviewed CV explicitly records this role at the stated date precision. Missing endpoints remain unknown.'
  if n==69 and j['employerAsWritten']=='Harvard University and MIT':
   j['sourceUrl']='https://www.linkedin.com/in/raaz-dwivedi';j['sourceType']='self-reported-linkedin';j['checkedAt']='2026-10-27';j['evidenceNote']='Two simultaneous LinkedIn host rows report August 2021–August 2023. The CV and biography corroborate one joint FODSI appointment; these are not successive jobs.'
   j['supportingSources']=[{'url':'https://raazdwivedi.github.io/documents/resume/Raaz_CV.pdf','checkedAt':'2026-10-26','supports':'Joint FODSI appointment, 2021–2023.'}]
 x['coverageNote']=summaries[n];x['remainingUnknowns']=limits[n];x['firstJobAssessment']['status']='unresolved';x['firstJobAssessment']['reason']=limits[n][0]
 if n==68:
  x['degreeConflictReview']={'status':'unresolved','checkedAt':'2026-10-27','reason':'Preserved historical CV June 1978 and current biography/self-reported 1980 assertions. No verified degree field or placement ledger changed by this review.'}
  x['firstJobAssessment']['reason']='The doctorate year is disputed (historical CV June 1978; biography and LinkedIn 1980). Cornell starts in August or September 1980 depending on source, and degree completion month is unknown.'
  x['otherEmploymentMentions'].append({'sourceUrl':'https://www.duffield.cornell.edu/people/peter-jackson/','checkedAt':'2026-10-27','evidenceNote':'The current biography reports a 1980 Stanford PhD, consistent with LinkedIn. The historical CV instead says June 1978. The conflict remains unresolved; neither the degree date nor the first-job boundary is silently changed.'})
 x['integrationReview']={'checkedAt':'2026-10-27','reviewer':'Codex review shard I','basis':'Reviewed saved corrections against current accepted identities and public histories; no new source visits claimed.','changes':['Existing identity retained.','Earlier source and degree observations preserved.','Unsupported date precision normalized without adding months.','First-job and degree conflicts remain explicit.']}
 sha=hashlib.sha256(json.dumps(old,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 replacements.append({'id':x['id'],'priorSha256':sha,'priorHashContract':'SHA256 of UTF-8 JSON with ensure_ascii=false and separators comma/colon, insertion-order keys','manifestNumber':n,'replacement':x});audit.append({'id':x['id'],'acceptedFaculty':True,'priorRoles':len(old['jobs']),'reviewedRoles':len(x['jobs']),'degreeConflict':n==68});recommendations.append({'id':x['id'],'action':'retain-unresolved','assessment':x['firstJobAssessment'],'doNotOverwriteVerifiedDegree':n==68})
write(out/'replacements.json',replacements);write(out/'first-job-recommendations.json',recommendations);write(out/'audit.json',audit);print(audit)
