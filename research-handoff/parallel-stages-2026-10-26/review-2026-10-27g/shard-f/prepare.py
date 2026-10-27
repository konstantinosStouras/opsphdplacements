import json,pathlib,hashlib,copy
root=pathlib.Path.cwd();base=root/'research-handoff/parallel-stages-2026-10-26';lane=base/'stage-3';out=base/'review-2026-10-27g/shard-f'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
m=read(lane/'career-continuation-64.ready.json');f=lane/m['files'][0]['path'];assert hashlib.sha256(f.read_bytes()).hexdigest()==m['files'][0]['sha256'];p=read(f)
old=next(x for x in read(root/'data/employment-histories.json')['records'] if x['id']==p['id']);assert any(x['id']==p['id'] for x in read(root/'data/faculty-roster-people.json')['records'])
write(out/'frozen'/f.name,p);write(out/'frozen'/'career-continuation-64.ready.json',m);write(out/'prior'/'64.json',old)
x=copy.deepcopy(old);x.update(copy.deepcopy(p));x.pop('personId',None);x.pop('integrationStatus',None);x['reviewStatus']='partial';x['careerComplete']=False
x['profileHistoryComplete']=True
x['profileHistoryCompletenessNote']='All sixteen accessible LinkedIn Experience rows were read; this does not establish a complete real-world career.'
# Preserve old source events and degree assertions, not duplicate old job renderings.
for k in ['sources','degreeFacts']:
 vals=old.get(k,[])+x.get(k,[]);x[k]=[];seen=set()
 for v in vals:
  key=json.dumps(v,sort_keys=True,ensure_ascii=False)
  if key not in seen:seen.add(key);x[k].append(v)
moved=[j for j in x['jobs'] if 'title unspecified' in j['titleAsWritten'] or j['employerAsWritten'] in ['GreenEarth','AddisCoder']]
x['jobs']=[j for j in x['jobs'] if j not in moved]
for j in moved:
 j['evidenceNote']='The source documents this activity or affiliation. Employment and paid status are not established; dates retain the source precision. '+j['evidenceNote']
x['otherEmploymentMentions'].extend(moved)
for j in x['jobs']:
 for k in ['start','end']:
  d=j[k]
  if d['precision'] not in ['year','month','unknown']:d['precision']='month' if d.get('month') and d.get('year') else 'year' if d.get('year') else 'unknown'
 if j['end'].get('year') is not None:j['isCurrent']=False
 if j['employerAsWritten'] in ['University of California, Berkeley','PredictWise'] and j['start'].get('month')==11:
  j['supportingSources']=[{'url':'https://www.linkedin.com/in/nikhil-garg-52226950','checkedAt':'2026-10-27','supports':'November 2020 start month; the CV reports the year and the later endpoint.'}]
  j['evidenceNote']='LinkedIn reports a November 2020 start. The CV supplies the recorded end year; its endpoint takes precedence over the stale LinkedIn current label. Both source observations are preserved.'
x['firstJobAssessment']['status']='unresolved'
x['coverageNote']='The October 2026 CV and all sixteen LinkedIn Experience rows were reviewed. Industry internships and PredictWise roles gained month precision; a June–July 2010 research assistantship was added. Berkeley and PredictWise advisor roles both begin in November 2020. Their first-job order remains unresolved. Group affiliations and activities with unknown employment status are shown separately.'
x['integrationReview']={'checkedAt':'2026-10-27','reviewer':'Codex review shard F','basis':'Reviewed saved correction64 against the existing public identity and history; no new source visit claimed.','changes':['Existing accepted ORIE faculty identity retained; doctorate remains Electrical Engineering.','Three UT group affiliations, GreenEarth and AddisCoder retained as supporting activity mentions rather than paid employment.','CV end years retained instead of stale LinkedIn current flags.','Season wording retained with year precision; no fabricated season month.','First-job conclusion remains unresolved.']}
priorhash=hashlib.sha256(json.dumps(old,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
write(out/'replacements.json',[{'id':x['id'],'priorSha256':priorhash,'priorHashContract':'SHA256 of UTF-8 JSON with ensure_ascii=false and separators comma/colon, insertion-order keys','manifestNumber':64,'replacement':x}])
write(out/'first-job-recommendations.json',[{'id':x['id'],'action':'retain-unresolved','assessment':x['firstJobAssessment']}])
write(out/'audit.json',{'id':x['id'],'acceptedFaculty':True,'priorRoles':len(old['jobs']),'reviewedRoles':len(x['jobs']),'movedToSupportingMentions':[{'employer':j['employerAsWritten'],'title':j['titleAsWritten']} for j in moved],'changes':x['integrationReview']['changes']})
print('Prepared',len(x['jobs']),'roles; supported activity mentions',len(x['otherEmploymentMentions']))
