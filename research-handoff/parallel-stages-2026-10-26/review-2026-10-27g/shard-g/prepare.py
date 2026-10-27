import json,pathlib,hashlib,copy,calendar
root=pathlib.Path.cwd();base=root/'research-handoff/parallel-stages-2026-10-26';lane=base/'stage-3';out=base/'review-2026-10-27g/shard-g'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
m=read(lane/'career-continuation-65.ready.json');f=lane/m['files'][0]['path'];assert hashlib.sha256(f.read_bytes()).hexdigest()==m['files'][0]['sha256'];p=read(f)
old=next(x for x in read(root/'data/employment-histories.json')['records'] if x['id']==p['id']);assert any(x['id']==p['id'] for x in read(root/'data/faculty-roster-people.json')['records'])
write(out/'frozen'/f.name,p);write(out/'frozen'/'career-continuation-65.ready.json',m);write(out/'prior'/'65.json',old)
x=copy.deepcopy(old);x.update(copy.deepcopy(p));x.pop('personId',None);x.pop('integrationStatus',None);x['reviewStatus']='partial';x['careerComplete']=False;x['profileHistoryComplete']=True
x['profileHistoryCompletenessNote']='All eleven accessible LinkedIn Experience rows were read; this does not establish a complete real-world career.'
for k in ['sources','degreeFacts']:
 vals=old.get(k,[])+x.get(k,[]);x[k]=[];seen=set()
 for v in vals:
  key=json.dumps(v,sort_keys=True,ensure_ascii=False)
  if key not in seen:seen.add(key);x[k].append(v)
moved=[j for j in x['jobs'] if j['employerAsWritten'] in ['Columbia University Science Honors Program','Moroccan International Mathematical Olympiad team']]
x['jobs']=[j for j in x['jobs'] if j not in moved]
for j in moved:j['evidenceNote']='The CV documents this teaching activity; employment and paid status are not established. '+j['evidenceNote']
x['otherEmploymentMentions'].extend(moved)
for j in x['jobs']:
 for k in ['start','end']:
  d=j[k]
  if d['precision'] not in ['year','month','unknown']:d['precision']='month' if d.get('month') and d.get('year') else 'year' if d.get('year') else 'unknown'
  if d.get('year') and d.get('month') and d.get('asWritten')==str(d['year']):
   d['sourceYearLabel']=d['asWritten'];d['asWritten']=f"{calendar.month_name[d['month']]} {d['year']}"
 if j['end'].get('year') is not None:j['isCurrent']=False
 if j['employerAsWritten'] in ['Amazon','Uber'] and j['start'].get('year') in [2016,2017,2018]:
  j['titleSourceAsWritten']=j['titleAsWritten'];j['titleAsWritten']+=' (internship)'
  j['supportingSources']=[{'url':'https://elhousni.orie.cornell.edu/assets/cv_omar_tex-15.pdf','checkedAt':'2026-10-27','supports':'The CV explicitly identifies this role as an internship; LinkedIn supplies month dates.'}]
x['firstJobAssessment']={'status':'unresolved','candidateEmployer':'Cornell Tech','candidatePosition':'Visiting Assistant Professor','reason':'Cornell visiting employment began in July 2020, but the PhD conferral month and day are unknown. Repository publication on 31 July 2020 is not the degree date, so it cannot establish the order.'}
x['coverageNote']='The recovered October 2026 CV and all eleven LinkedIn Experience rows document eleven employment roles and two additional teaching activities. Cornell visiting employment began in July 2020 and the assistant professorship in January 2022; Amazon Scholar work began in January 2025. Separate 2016 and 2017 Amazon internships, a 2018 Uber internship and earlier roles are retained. First-job ordering remains unresolved.'
x['accessLimitations']=['The older CV address was unavailable on 26 October; the current CV was successfully read on 27 October.','The dissertation download was blocked by the browser client. Repository metadata was read, but it does not establish formal conferral.']
x['otherEmploymentMentions'].append({'sourceUrl':'https://academiccommons.columbia.edu/doi/10.7916/d8-1z4d-r784','checkedAt':'2026-10-27','evidenceNote':'The repository lists the Operations Research PhD in 2020 and publication on 31 July 2020. Publication is not formal conferral and cannot establish whether the July 2020 Cornell appointment began after the doctorate.'})
x['integrationReview']={'checkedAt':'2026-10-27','reviewer':'Codex review shard G','basis':'Reviewed saved correction65 against the current public identity and history; no new source visit claimed.','changes':['Existing accepted faculty identity retained.','Two teaching activities with unknown employment status moved to supporting mentions.','Distinct internships kept separate and explicitly labelled; duplicate Cornell listings consolidated.','Month precision displayed rather than hidden behind year-only label.','Earlier source failures preserved as dated observations and superseded by successful current-CV read.','Repository publication is not a degree-conferral date; first-job status remains unresolved.']}
priorhash=hashlib.sha256(json.dumps(old,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
write(out/'replacements.json',[{'id':x['id'],'priorSha256':priorhash,'priorHashContract':'SHA256 of UTF-8 JSON with ensure_ascii=false and separators comma/colon, insertion-order keys','manifestNumber':65,'replacement':x}])
write(out/'first-job-recommendations.json',[{'id':x['id'],'action':'retain-unresolved','assessment':x['firstJobAssessment']}])
write(out/'audit.json',{'id':x['id'],'acceptedFaculty':True,'priorRoles':len(old['jobs']),'reviewedRoles':len(x['jobs']),'changes':x['integrationReview']['changes']})
print('Prepared',len(x['jobs']),'roles')
