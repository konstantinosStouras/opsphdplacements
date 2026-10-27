import json, pathlib, hashlib, copy
ROOT=pathlib.Path.cwd()
BASE=ROOT/'research-handoff/parallel-stages-2026-10-26'
OUT=BASE/'review-2026-10-27g/shard-c'
LANE=BASE/'stage-3'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(x): return hashlib.sha256(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
hist={x['id']:x for x in read(ROOT/'data/employment-histories.json')['records']}
people={x['id'] for x in read(ROOT/'data/faculty-roster-people.json')['records']}
summaries={
50:'The current four-page CV, professional biographies and full one-row LinkedIn history were reviewed. A professional biography reports completion of the Operations Research PhD in May 2022. Harvard postdoctoral work is dated 2022–2023; its exact start relative to the degree remains unknown.',
51:'Official biographies document Wisconsin postdoctoral work, Yale employment, Cornell faculty service from 1975 and four visiting appointments. Additional Cornell administrative roles are documented without complete term dates. The history remains partial; industry leads and a possible LinkedIn match are not verified.',
52:'The current CV and all six LinkedIn Experience rows document academic promotions, two industry internships and Biogen consulting. Cornell starts in July 2025 in official sources and June 2025 on LinkedIn. The May 2015 doctoral study endpoint and Walmart internship start do not establish a first post-PhD job.',
53:'The author’s professional biography documents Cornell faculty service from July 1968 to retirement in July 2018, earlier fellowships and later visits. Degree completion within 1968 remains unknown. Graduate funding is retained separately from employment.',
54:'All 13 LinkedIn Experience rows, five Education entries and primary biographies were reviewed. New observations include BBVA, Guggenheim, AQR and more precise overlapping appointments. ADIA start dates, Citadel titles and some affiliation boundaries conflict. Employment during a doctorate is not a new post-PhD hire.',
55:'An official institutional report documents a doctoral defence on 17 December 2003. This is not a verified conferral date. Cornell, ETH and Brussels roles remain partially dated; the Binghamton namesake candidate is not merged.',
56:'The matched LinkedIn profile, attributed professional biography and Cornell reporting document ExxonMobil employment in 1975–1997, Cornell senior lecturer and MEng director roles in 1997–2007, and an undated communications role. Employment immediately after the 1970 doctorate remains unknown.',
59:'The CV, official biographies and all ten LinkedIn Experience rows document Cornell promotions, administrative appointments, Amazon Scholar work and an undated Florida State teaching assistantship. Amazon starts in May 2024 in the employer biography and July 2024 on LinkedIn. The official 2026 INFORMS presidency is retained as service.',
61:'The CV, current biographies, full one-row LinkedIn history and self-reported ORCID record document academic and administrative appointments plus two undated consultancies. Cornell begins in August 1987 on LinkedIn and September 1987 on ORCID. The reported June 1987 education endpoint is not formal conferral evidence; historical Present appointments remain source-bounded.'}
audit=[];replacements=[];recommendations=[]
for n in [50,51,52,53,54,55,56,59,61]:
 manifest=read(LANE/f'career-continuation-{n}.ready.json');entry=manifest['files'][0];path=LANE/entry['path']
 assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256']
 prop=read(path);old=hist[prop['id']];assert prop['id'] in people
 write(OUT/'frozen'/f'continuation-{n}.ready.json',manifest);write(OUT/'frozen'/path.name,prop);write(OUT/'prior'/f'{n}.json',old)
 x=copy.deepcopy(old);x.update(copy.deepcopy(prop));x.pop('personId',None);x.pop('integrationStatus',None)
 x['recordIds']=list(dict.fromkeys(old.get('recordIds',[])+prop.get('recordIds',[])))
 x['reviewStatus']='partial';x['status']='partial';x['careerComplete']=False;x['coverageNote']=summaries[n]
 for key in ['sources','otherEmploymentMentions']:
  values=old.get(key,[])+prop.get(key,[]);seen=set();x[key]=[]
  for value in values:
   marker=json.dumps(value,sort_keys=True,ensure_ascii=False)
   if marker not in seen: seen.add(marker);x[key].append(value)
 changes=['Accepted existing faculty identity; no new person or scope inference.','Earlier public record preserved in prior snapshot; earlier source observations retained.','First-job conclusion remains unresolved; no placement upgrade recommended.']
 if n in [52,61]:
  for fact in x['degreeFacts']:
   if fact.get('month'):
    fact['reportedStudyEndMonth']=fact.pop('month');fact['month']=None
    changes.append('Removed degree month derived only from education interval; retained reported study endpoint separately.')
 if n==52:
  moved=x['jobs'][-2:];x['jobs']=x['jobs'][:-2]
  for j in moved:j['evidenceNote']='Teaching activity is documented; an employment appointment and pay are not established. '+j.get('evidenceNote','')
  x['otherEmploymentMentions'].extend(moved);changes.append('Moved guest lecture and preparatory-class teaching to other mentions: employment status not established.')
 if n==53:
  moved=[j for j in x['jobs'] if j['titleAsWritten']=='NDEA Graduate Fellow'];x['jobs']=[j for j in x['jobs'] if j not in moved];x['otherEmploymentMentions'].extend(moved);changes.append('NDEA graduate fellowship retained as funding mention, not a job.')
 if n==54:
  moved=[j for j in x['jobs'] if j['titleAsWritten'] in ['Research Affiliate','FinTech Faculty']];x['jobs']=[j for j in x['jobs'] if j not in moved];x['otherEmploymentMentions'].extend(moved);changes.append('LBNL affiliate interval and FinTech affiliation retained as mentions; no duplicate concurrent employment inference.')
  x['firstJobAssessment']['status']='unresolved'
 for j in x['jobs']:
  for key in ['start','end']:
   d=j[key]
   if d['precision'] not in ['year','month','unknown']:
    d['precision']='year' if d.get('year') and not d.get('month') else 'month' if d.get('year') and d.get('month') else 'unknown'
  if j.get('end',{}).get('year') is not None:j['isCurrent']=False
 # Keep the full raw observation in the frozen proposal; visitor-facing summary is readable.
 x['priorCorrectionRemainingUnknowns']=copy.deepcopy(x.get('remainingUnknowns',[]))
 x['remainingUnknowns']=[summaries[n], {
 50:'Earlier teaching appears only in an unavailable older CV. Harvard start and end months and the order of degree completion and employment remain unknown.',
 51:'Wisconsin and Yale term boundaries, four visit dates, promotion dates and administrative terms remain unknown. Industry leads and the possible LinkedIn identity need independent confirmation.',
 52:'The Walmart internship and doctoral study endpoint both fall in May 2015. Formal conferral and internship start days are unknown. Biogen consulting does not establish employee status.',
 53:'PhD completion month, rank promotions and most visit endpoints remain unknown. No matched LinkedIn profile or complete CV was found. Fellowship funding does not establish a separate employee appointment.',
 54:'ADIA reports an effective start on 8 September 2020; LinkedIn reports January 2020. Citadel titles differ. Undated Hess and PEAK6 roles prevent a first-job conclusion. LBNL affiliation began in 2011, but the Fellow title transition is unknown.',
 55:'The defence is not a formal degree award. ETH and Brussels dates are unknown. The Binghamton identity is unconfirmed. No matched LinkedIn profile or accessible CV was found.',
 56:'Employment in 1970–1974 and 1960–1965 remains unknown. The communications role was observed in December 2010; its full term is unknown. The NBER lead remains unconfirmed.',
 59:'The 1998 PhD, Bell Labs endpoint and UBC postdoc boundaries remain insufficiently dated. Amazon reports May 2024 and LinkedIn July 2024. Florida State assistantship dates are unknown. The LinkedIn President-Elect label is stale relative to the official 2026 presidency.',
 61:'Cornell start dates conflict between August and September 1987. ORCID education ending June 1987 is self-reported, not formal conferral. Historical chair terms and two consultancies remain partly undated; the 2002–2008 BSCB chair term has an unresolved conflicting historical lead.'
 }[n]]
 if x.get('firstJobAssessment'):
  x['firstJobAssessment']['priorReason']=x['firstJobAssessment'].get('reason')
  x['firstJobAssessment']['reason']=x['remainingUnknowns'][-1]
 if n==59:
  x['otherEmploymentMentions'].append({'employerAsWritten':'INFORMS','titleAsWritten':'President (professional service)','sourceUrl':'https://www.informs.org/About-INFORMS/Governance/INFORMS-Board-of-Directors','checkedAt':'2026-10-27','evidenceNote':'The opened official 2026 board page lists Mark Lewis as President. This is professional service, not a separate industry job. LinkedIn still reports President-Elect from 2025.'})
 if n==55:
  x['otherEmploymentMentions'].append({'sourceUrl':'https://www.ceremade.dauphine.fr/fileadmin/mediatheque/ceremade/documents/rapport_2007/Doss.Sci.pdf','checkedAt':'2026-10-27','evidenceNote':'The institutional report records a doctoral defence on 17 December 2003. A defence is not a formal degree-conferral date.'})
 for j in x['jobs']:
  original=j.get('evidenceNote','')
  # Long run-on strings are preserved for audit, but not repeated in the public prose.
  if not original or any(len(w)>42 for w in original.split()):
   j['sourceObservationNote']=original
   j['evidenceNote']=f"The reviewed source records {j.get('titleAsWritten','this role')} at {j.get('employerAsWritten','this institution')}. Dates retain the source's stated precision; missing endpoints remain unknown. See the history limitations for conflicts and concurrent roles."
 x['integrationReview']={'checkedAt':'2026-10-27','reviewer':'Codex integrator review shard C','basis':'Review of saved source observations and current public record; no fresh source visit claimed.','changes':changes,'manifest':f'career-continuation-{n}.ready.json'}
 replacements.append({'id':x['id'],'priorSha256':sha(old),'priorHashContract':'SHA256 of UTF-8 JSON with ensure_ascii=false and separators comma/colon, insertion-order keys','manifestNumber':n,'replacement':x})
 recommendations.append({'id':x['id'],'action':'retain-unresolved','assessment':x.get('firstJobAssessment'),'note':'No new first-job verification from this correction. Compare public placement ledger before release.'})
 audit.append({'id':x['id'],'name':x['name'],'manifest':n,'acceptedFaculty':True,'priorRoles':len(old['jobs']),'reviewedRoles':len(x['jobs']),'changes':changes})
write(OUT/'replacements.json',replacements);write(OUT/'audit.json',audit);write(OUT/'first-job-recommendations.json',recommendations)
print(json.dumps(audit,ensure_ascii=False,indent=2))
