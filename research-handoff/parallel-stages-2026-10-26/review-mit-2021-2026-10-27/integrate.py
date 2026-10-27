"""One-shot MIT2021 integration; frozen proposals and explicit reviewed decisions only."""
import json,pathlib,hashlib,copy
ROOT=pathlib.Path('research-handoff/parallel-stages-2026-10-26');OUT=ROOT/'review-mit-2021-2026-10-27';SRC=ROOT/'stage-4-mit-2021-preserved-2026-10-27/mit-or-2021'
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,indent=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=indent)+'\n',encoding='utf-8')
assert not (OUT/'applied.json').exists(),'Already applied'
decisions=read(OUT/'decisions.json');cohort=read(SRC/'cohort-proposal.json')
g=read('data/graduate-lists.json');h=read('data/employment-histories.json');oldg=copy.deepcopy(g['records']);oldh=copy.deepcopy(h['records'])
faculty={r['id'] for f in ['faculty','faculty-roster-people'] for r in read('data/'+f+'.json')['records']}
manifest=[]
for item in read(SRC/'publication-ready.json')['files']:
    p=SRC/item['path'];b=p.read_bytes();assert hashlib.sha256(b.replace(b'\r\n',b'\n')).hexdigest()==item['sha256LF'];manifest.append({'path':p.as_posix(),'sha256LF':item['sha256LF']})
deferrals={r['name']:r for r in read(SRC/'faculty-identity-deferrals.json')['records']}
added=[]
for p in cohort['records']:
    assert not any(r['id']==p['proposedGraduateId'] for r in g['records'])
    fid=p.get('existingPersonId');assert not fid or fid in faculty
    evidence=p['evidenceNote']+' '+p['degreeLocator']
    r={'id':p['proposedGraduateId'],'institution':p['institution'],'name':p['name'],'listedYear':2021,'field':'operations','programId':p['programId'],'facultyId':fid,'match':'reviewed-primary-source-identity' if fid else None,'matchLeads':[],'careerOwner':p['careerOwner'],'identityReview':{'status':'reviewed','checkedAt':p['checkedAt'],'evidence':p['identityStatus']},'degreeReview':{'status':'official-recipient-match','period':p['degreeAwardPeriod'],'awardDay':None,'checkedAt':p['degreeCheckedAt'],'sourceUrl':p['degreeEvidenceSourceUrl'],'evidenceNote':evidence,'limitations':['Exact individual award day unknown; thesis and study dates remain separate.','Source-bounded roster, not an independently established cohort census.']},'sightings':[]}
    if p['name'] in deferrals:r['identityReview']['facultyIdentityEvidence']=deferrals[p['name']]
    for url,name,meaning,note in [(p['sourceUrl'],p['name'],'thesis',p['thesisTitle']+'; thesis date as written: '+p['thesisDateAsWritten']),(p['degreeEvidenceSourceUrl'],p['recipientNameAsWritten'],'graduation',evidence)]:
        r['sightings'].append({'sourceUrl':url,'pageUrl':url,'sourceDate':None,'checkedAt':p['checkedAt'],'archive':'live','name':name,'yearMeaning':meaning,'program':'PhD Operations Research','destination':None,'position':None,'degree':'PhD','note':note,'extractedAt':p['checkedAt']})
    g['records'].append(r);added.append(r['id'])
historyids=[];firstjobs=[]
for f in SRC.glob('*.history-proposal.json'):
    p=read(f);pid=p['personId'];assert not any(r['id']==pid for r in h['records'])
    r=copy.deepcopy(p);r['id']=r.pop('personId');r.pop('integrationStatus',None);r['reviewStatus']='partial';r['careerComplete']=False
    decision=next(x for x in decisions['records'] if x['personId']==pid)
    moves={x['jobIndex']:x for x in decisions['classificationMoves'] if x['personId']==pid}
    r['jobs']=[j for i,j in enumerate(p['jobs']) if i not in moves]
    r['otherEmploymentMentions']=p.get('otherEmploymentMentions',[])+[{**j,'classificationNote':moves[i]['reason'],'evidenceNote':moves[i]['reason']+' '+j['evidenceNote']} for i,j in enumerate(p['jobs']) if i in moves]
    for j in r['otherEmploymentMentions']:
        j.setdefault('employerAsWritten',j.get('organizationAsWritten',j.get('organization')));j.setdefault('titleAsWritten',j.get('roleAsWritten',j.get('role')));j.setdefault('evidenceNote',j.get('note',''))
    for correction in decision.get('jobCorrections',[]):
        j=r['jobs'][correction['retainedJobIndex']];j.update(correction['fields'])
    r['jobs'].extend(decision.get('additionalJobs',[]))
    r['otherEmploymentMentions'].extend(decision.get('additionalMentions',[]))
    gr=next(x for x in g['records'] if x['id']==pid);r['degreeReview']=gr['degreeReview']
    r['linkedInCaptures']=[{k:p.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}] if 'linkedin.com/in/' in p.get('profileUrl','') else []
    r['reviewFollowup']={k:v for k,v in decision.items() if k not in ['personId','firstJobAssessment','jobCorrections']}
    if decision.get('firstJobAssessment'):
        a=copy.deepcopy(decision['firstJobAssessment']);a.update(status='verified',definition='Earliest documented new appointment after doctorate completion',checkedAt='2026-10-27')
        a.setdefault('appointmentType','professional-employee');a.setdefault('sector','industry')
        a.setdefault('degreeBoundary','Formal recipient period is retained separately above. Relative completion and first-position evidence do not assign exact individual award or appointment days.')
        a.setdefault('limitations',['Source-bounded earliest documented job; real-world career remains partial.','Exact award and appointment days remain unknown.'])
        a['sources'].append({'url':gr['degreeReview']['sourceUrl'],'checkedAt':gr['degreeReview']['checkedAt'],'evidenceNote':gr['degreeReview']['evidenceNote']})
        gr['firstJobReview']=a;r['firstJobAssessment']=copy.deepcopy(a)
        if r.get('parkedCase'):r['priorAssessment']=r.pop('parkedCase')
        r['remainingUnknowns']=decision.get('remainingUnknowns',r.get('remainingUnknowns',[]))
        firstjobs.append({'id':pid,'name':r['name'],'employer':a['employer'],'start':a['start']})
    else:
        r['firstJobAssessment']=None
        r['remainingUnknowns']=decision.get('remainingUnknowns',r.get('remainingUnknowns',[]))
        if decision.get('coverageNote'):r['coverageNote']=decision['coverageNote']
    for milestone in decision.get('degreeMilestones',[]):gr.setdefault('degreeMilestones',[]).append(milestone)
    if gr.get('degreeMilestones'):r['degreeMilestones']=copy.deepcopy(gr['degreeMilestones'])
    h['records'].append(r);historyids.append(pid)
m=g['metadata'];m['updatedAt']='2026-10-27';m['records']=len(g['records']);m['sightings']=sum(len(r['sightings']) for r in g['records']);m['linkedToPeople']=sum(bool(r.get('facultyId')) for r in g['records']);m['verifiedGraduateFirstJobs']=sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records'])
m['byField']={k:sum(r['field']==k for r in g['records']) for k in m['byField']};m['byArchive']={k:sum(s.get('archive','live')==k for r in g['records'] for s in r['sightings']) for k in m['byArchive']}
rows=[r for r in g['records'] if r['institution']=='Massachusetts Institute of Technology' and r['listedYear']==2021]
cv=next((r for r in m['coverage'] if r['institution']=='Massachusetts Institute of Technology' and r['listedYear']==2021),None)
if cv is None:cv={'institution':'Massachusetts Institute of Technology','listedYear':2021};m['coverage'].append(cv)
cv.update(names=len(rows),linked=sum(bool(r.get('facultyId')) for r in rows),pages=list(dict.fromkeys(s['pageUrl'] for r in rows for s in r['sightings'])),rosterStatus='partial')
assert oldg==g['records'][:len(oldg)];assert oldh==h['records'][:len(oldh)]
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h);write(OUT/'input-manifest.json',manifest)
write(OUT/'applied.json',{'graduateRecordsAdded':added,'newPartialHistoryIds':historyids,'firstJobs':firstjobs,'verifiedGraduateFirstJobsTotal':m['verifiedGraduateFirstJobs'],'newStructuredRoles':sum(len(r['jobs']) for r in h['records'] if r['id'] in historyids),'newSupportingMentions':sum(len(r.get('otherEmploymentMentions',[])) for r in h['records'] if r['id'] in historyids),'remainingFirstJobIds':[r['id'] for r in h['records'] if r['id'] in historyids and not r.get('firstJobAssessment')]})
print('Added',len(added),'graduates,',len(historyids),'partial histories,',len(firstjobs),'first employers')
