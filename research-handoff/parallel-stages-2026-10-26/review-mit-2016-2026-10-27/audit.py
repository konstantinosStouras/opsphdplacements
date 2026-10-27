import json,pathlib
O=pathlib.Path(__file__).resolve().parent
R=O.parents[2]
B=R/'research/mit-2016-before'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def index(v):return {x['id']:x for x in v['records']}
errors=[];checks={}
a=read(O/'applied.json')
g=index(read(R/'data/graduate-lists.json'));bg=index(read(B/'graduate-lists.json'))
h=index(read(R/'data/employment-histories.json'));bh=index(read(B/'employment-histories.json'))
adds=set(g)-set(bg);changes={k for k in bg if g.get(k)!=bg[k]}
checks['graduateAdds']=sorted(adds);checks['graduateChanges']=sorted(changes)
if adds!=set(a['graduateRecordsAdded']) or len(adds)!=8:errors.append('Unexpected graduate additions')
if changes!=set(a['graduateRecordsUpdated']):errors.append('Unexpected preexisting graduate changes')
rong=a['graduateRecordsUpdated'][0]
if not all(s in g[rong]['sightings'] for s in bg[rong]['sightings']):errors.append('Rong historical sighting lost')
checks['rongHistoricalSightingsPreserved']=all(s in g[rong]['sightings'] for s in bg[rong]['sightings'])
hadds=set(h)-set(bh)
if hadds!=set(a['newPartialHistoryIds']) or len(hadds)!=9:errors.append('Unexpected history additions')
if any(h.get(k)!=v for k,v in bh.items()):errors.append('Preexisting history changed')
if set(bh)-set(h):errors.append('Preexisting history deleted')
cohort=[g[k] for k in adds|changes]
checks['facultyLinks']={x['name']:x.get('facultyId') for x in cohort if x.get('facultyId')}
if len(checks['facultyLinks'])!=4:errors.append('Expected four faculty links')
newfirst=[x['id'] for x in cohort if x.get('firstJobReview')]
if newfirst!=a['verifiedFirstJobIds'] or len(newfirst)!=1 or 'alexander-remorov' not in newfirst[0]:errors.append('Unexpected new first job')
roles=0;mentions=0;proposalaudit=[]
for file in O.glob('*.history-proposal.json'):
 p=read(file);v=h[p['personId']];allrows=v.get('jobs',[])+v.get('otherEmploymentMentions',[])
 missing=[]
 for j in p['jobs']:
  if not any(all(q.get(k)==j.get(k) for k in ['employerAsWritten','titleAsWritten','start','end','sourceUrl','checkedAt']) for q in allrows):missing.append(j)
 for m in p.get('otherEmploymentMentions',[]):
  if 'observation' not in m:
   if not any(all(q.get(k)==m.get(k) for k in ['employerAsWritten','titleAsWritten','start','end','sourceUrl']) for q in allrows):missing.append(m)
  else:
   note=json.dumps(m['observation'],ensure_ascii=False) if isinstance(m['observation'],dict) else m['observation']
   if not any(q.get('evidenceNote')==note for q in allrows):missing.append(m)
 if missing:errors.append('Lost proposal roles/mentions: '+p['name'])
 if '-linkedin.' in file.name:
  if v.get('remainingUnknowns')!=p.get('remainingUnknowns'):errors.append('LinkedIn unknown limits lost: '+p['name'])
  if v.get('profileUrl')!=p.get('profileUrl') or not v.get('linkedInCaptures'):errors.append('LinkedIn provenance lost: '+p['name'])
  if v.get('firstJobAssessment') is not None:errors.append('First job inferred from LinkedIn: '+p['name'])
 elif p['name'] not in ['Nataly Youssef','Rong Yuan']:
  if not all(x in v.get('remainingUnknowns',[]) for x in p.get('remainingUnknowns',[])):errors.append('Unknown limits lost: '+p['name'])
 if v.get('careerComplete') is not False or v.get('reviewStatus')!='partial':errors.append('False complete status: '+p['name'])
 if any(not q.get('sourceUrl') or not q.get('checkedAt') for q in allrows):errors.append('Missing source/check date: '+p['name'])
 if '-linkedin.' not in file.name:
  roles+=len(v['jobs']);mentions+=len(v.get('otherEmploymentMentions',[]))
 proposalaudit.append({'name':p['name'],'roles':len(v['jobs']),'mentions':len(v.get('otherEmploymentMentions',[])),'missing':missing})
checks['roles']=roles;checks['mentions']=mentions;checks['proposalRetention']=proposalaudit
if roles!=32 or mentions!=33:errors.append('Role totals differ from approved cut')
checks['linkedInRoleCounts']={}
for name,expected in [('nataly-youssef',4),('rong-yuan',11)]:
 p=read(O/(name+'-linkedin.history-proposal.json'))
 checks['linkedInRoleCounts'][name]=len(p['jobs'])
 if len(p['jobs'])!=expected:errors.append('Unexpected LinkedIn role count: '+name)
 v=h[p['personId']]
 if v.get('profileHistoryComplete') is not True or v.get('careerComplete') is not False:errors.append('LinkedIn coverage incorrectly represented: '+name)
 if name=='rong-yuan' and not any(q.get('titleAsWritten')=='President (volunteering)' and q.get('sourceUrl')==p['profileUrl'] for q in v.get('otherEmploymentMentions',[])):errors.append('Rong volunteering missing')
# Source faculty and institution records must remain semantically unchanged.
changedfiles=[]
for old in B.glob('*.json'):
 if old.name in ['graduate-lists.json','employment-histories.json','record-dates.json','research-status.json']:continue
 if read(old)!=read(R/'data'/old.name):changedfiles.append(old.name)
checks['unexpectedOtherDatasetChanges']=changedfiles
if changedfiles:errors.append('Other datasets changed')
out={'checkedAt':'2026-10-27','status':'pass' if not errors else 'fail','checks':checks,'errors':errors,'limits':['Compares frozen public cut and saved proposals; source interpretations remain subject to integrator adjudication.','Record stamps and regenerated research-status are intentionally excluded from whole-file equality.']}
(O/'audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':out['status'],'errors':errors,'roles':roles,'mentions':mentions}))
