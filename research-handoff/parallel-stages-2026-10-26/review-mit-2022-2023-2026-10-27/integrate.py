"""One-shot reviewed MIT integration. Run only against the frozen pre-release cut."""
import json, pathlib, hashlib, copy
ROOT=pathlib.Path('research-handoff/parallel-stages-2026-10-26')
OUT=ROOT/'review-mit-2022-2023-2026-10-27'
def read(p): return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def write(p,v,indent=2): pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=indent)+'\n',encoding='utf-8')
def clean(v):
    if isinstance(v,str):
        if any(x in v for x in ['â€','Ã','Â']):
            try: return v.encode('cp1252').decode('utf-8')
            except (UnicodeError,LookupError): pass
        return v
    if isinstance(v,list): return [clean(x) for x in v]
    if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
    return v
assert not (OUT/'applied.json').exists(), 'Already applied'
dirs=[ROOT/'stage-4-preserved-2026-10-27/mit-or-2023',ROOT/'stage-4-mit-2022-preserved-2026-10-27/mit-or-2022']
reviews=[clean(read('research/mit-review-2023/adjudication.json')),clean(read('research/mit-review-2022/adjudication.json'))]
audit=read('research/mit-identity-audit/results.json')
for name,v in [('review-2023.json',reviews[0]),('review-2022.json',reviews[1]),('identity-classification-audit.json',audit)]: write(OUT/name,v)
g=read('data/graduate-lists.json'); h=read('data/employment-histories.json')
beforeg=copy.deepcopy(g); beforeh=copy.deepcopy(h)
faculty={r['id'] for f in ['faculty','faculty-roster-people'] for r in read('data/'+f+'.json')['records']}
added=[]; manifest=[]
for d in dirs:
    cohort=read(d/'cohort-proposal.json')
    for file in d.glob('*.json'):
        manifest.append({'path':file.as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    deferrals={r['name']:r for r in read(d/'faculty-identity-deferrals.json')['records']}
    for p in cohort['records']:
        assert not any(r['id']==p['proposedGraduateId'] for r in g['records'])
        fid=p.get('existingPersonId')
        if p['name']=='Xiaoyue Gong': fid=audit['identity']['canonicalOverride']['facultyId']
        assert not fid or fid in faculty
        evidence=p['evidenceNote']+' '+p.get('degreeLocator','')
        r={'id':p['proposedGraduateId'],'institution':p['institution'],'name':p['name'],'listedYear':p['listedYear'],'field':'operations','programId':p['programId'],'facultyId':fid,'match':'reviewed-primary-source-identity' if fid else None,'matchLeads':[],'careerOwner':p['careerOwner'],'identityReview':{'status':'reviewed','checkedAt':p['checkedAt'],'evidence':p['evidenceNote']},'degreeReview':{'status':'official-recipient-match','period':p['degreeAwardPeriod'],'awardDay':None,'checkedAt':p['degreeCheckedAt'],'sourceUrl':p['degreeEvidenceSourceUrl'],'evidenceNote':evidence,'limitations':['Exact individual award day unknown; thesis dates and doctoral study periods are separate observations.','This is a source-bounded roster, not a complete cohort census.']},'sightings':[]}
        if p['name'] in deferrals: r['identityReview']['facultyIdentityEvidence']=deferrals[p['name']]
        if p['name']=='Xiaoyue Gong': r['identityReview']['duplicateObservation']=audit['identity']['canonicalOverride']
        for url,name,meaning,note in [(p['sourceUrl'],p.get('nameAsWritten',p['name']),'thesis',p['thesisTitle']+'; thesis date as written: '+str(p.get('thesisDateAsWritten'))),(p['degreeEvidenceSourceUrl'],p.get('recipientNameAsWritten',p['name']),'graduation',evidence)]:
            r['sightings'].append({'sourceUrl':url,'pageUrl':url,'sourceDate':None,'checkedAt':p['checkedAt'],'archive':'live','name':name,'yearMeaning':meaning,'program':'PhD Operations Research','destination':None,'position':None,'degree':'PhD','note':note,'extractedAt':p['checkedAt']})
        g['records'].append(r); added.append(r['id'])
decisions={r['personId']:r['firstJobAssessment'] for r in reviews[0]['records'] if r['firstJobDecision']=='accept'}
decisions.update({r['personId']:r['assessment'] for r in reviews[1]['firstJobDecisions'] if r['decision'].startswith('accept')})
io='grad:massachusetts-institute-of-technology:ioannis-spantidakis:2022'
post='https://www.linkedin.com/posts/georgia-perakis-77a964_orc-mit-share-7069986113716658176-RhcB/'
decisions[io]={'employer':'Amazon','title':'Research Scientist','start':{'asWritten':'Sep 2022','year':2022,'month':9,'precision':'month'},'sourceUrls':[post,'https://spantidakis.com/','https://www.linkedin.com/in/spantidakis/'],'evidenceNote':'Advisor Georgia Perakis identifies Ioannis among graduates starting their careers and names Amazon as their destination. Root read the complete announcement in Chrome. His own professional chronology and the individually read Experience section record Amazon Research Scientist from September 2022 after MIT research assistantship. Together these support the advisor-reported initial post-doctoral employer; no exact within-September order is inferred. The later commencement announcement is not an appointment date.'}
source_notes={s['url']:s.get('supports','') for review in reviews for s in review.get('primarySourcesOpened',[])}
newhist=[]; firstjobs=[]
for item in audit['histories']:
    p=read(item['file']); pid=p['personId']; assert not any(r['id']==pid for r in h['records'])
    r=copy.deepcopy(p); r['id']=r.pop('personId'); r.pop('integrationStatus',None)
    r['reviewStatus']='partial';r['careerComplete']=False
    moves={x['jobIndex']:x for x in item['movesToSupportingMentions']}
    r['otherEmploymentMentions']=r.get('otherEmploymentMentions',[])+[{**j,'classificationNote':moves[i]['reason']} for i,j in enumerate(p['jobs']) if i in moves]
    r['jobs']=[j for i,j in enumerate(p['jobs']) if i not in moves]
    r['linkedInCaptures']=[{k:p.get(k) for k in ['profileUrl','checkedAt','experienceAccess','profileHistoryComplete','coverageNote']}] if p.get('profileUrl','').startswith('https://www.linkedin.com/') else []
    gr=next(x for x in g['records'] if x['id']==pid);r['degreeReview']=gr['degreeReview']
    if pid in decisions:
        a=decisions[pid]; reason=a.get('evidenceNote') or a.get('rationale'); urls=a.get('sourceUrls') or a.get('sources')
        urls=list(dict.fromkeys(urls+[gr['degreeReview']['sourceUrl']]))
        coey='lang-coey' in pid
        v={'status':'verified','definition':'Earliest documented new appointment after doctorate completion','employer':a['employer'],'title':a['title'],'appointmentType':'postdoc' if coey else 'professional-employee','sector':'academia' if coey else 'industry','start':a['start'],'checkedAt':'2026-10-27','reason':reason,'degreeBoundary':reason+' Formal recipient period and individual completion statements remain separate; no exact award or job day is assigned.','limitations':['Earliest documented appointment within the reviewed evidence; this is not an exhaustive lifetime career.','Exact individual award and appointment days remain unknown; stated dates retain source precision.'],'sources':[{'url':u,'checkedAt':'2026-10-27','evidenceNote':source_notes.get(u) or (gr['degreeReview']['evidenceNote'] if u==gr['degreeReview']['sourceUrl'] else reason)} for u in urls]}
        if coey: v['sequenceEvidence']={'kind':'explicit-next-position','sourceUrl':'https://chriscoey.github.io/'};v['limitations'].append('Biography last updated 19 May 2022; unknown appointment start/end and later career. Continuing research projects does not establish an unchanged pre-degree contract.')
        if pid==io: v['limitations'].append('Advisor announcement was read as a later commencement-related account with only relative publication age displayed. It establishes the reported initial employer, not a precise degree/job boundary day.')
        gr['firstJobReview']=v;r['firstJobAssessment']=copy.deepcopy(v)
        if r.get('parkedCase'): r['priorAssessment']=r.pop('parkedCase')
        r['remainingUnknowns']=[x for x in r.get('remainingUnknowns',[]) if 'first' not in x.lower() and 'boundary unresolved' not in x.lower()]
        r['remainingUnknowns'].append('Real-world career completeness and exact degree/job days remain unknown.')
        firstjobs.append({'id':pid,'name':r['name'],'employer':v['employer'],'start':v['start']})
    else:r['firstJobAssessment']=None
    h['records'].append(r);newhist.append(pid)
for m in reviews[0]['additionalDegreeObservations']:
    gr=next(x for x in g['records'] if x['id']==m['personId'])
    gr['degreeMilestones']=[{'kind':m['type'],'displayText':('Reported doctoral defence: '+m['date']) if 'date' in m else 'Advisor-reported graduation year: '+str(m['year']),'sourceUrl':m['sourceUrl'],'checkedAt':m['checkedAt'],'evidenceNote':m['note'],'limitation':'Not assigned as formal conferral or proof of all requirements completed; first-job boundary remains unresolved.','formalAwardDateAssigned':False}]
for pid in newhist:
    gr=next(x for x in g['records'] if x['id']==pid); hr=next(x for x in h['records'] if x['id']==pid)
    if gr.get('degreeMilestones'):hr['degreeMilestones']=gr['degreeMilestones']
m=g['metadata'];m['updatedAt']='2026-10-27';m['records']=len(g['records']);m['sightings']=sum(len(x['sightings']) for x in g['records']);m['linkedToPeople']=sum(bool(x.get('facultyId')) for x in g['records']);m['verifiedGraduateFirstJobs']=sum(bool(x.get('firstJobReview')) and not x.get('facultyId') for x in g['records'])
m['byField']={k:sum(x['field']==k for x in g['records']) for k in m['byField']}
m['byArchive']={k:sum(s.get('archive','live')==k for x in g['records'] for s in x['sightings']) for k in m['byArchive']}
for year in [2022,2023]:
    rows=[x for x in g['records'] if x['institution']=='Massachusetts Institute of Technology' and x['listedYear']==year]
    cv=next((x for x in m['coverage'] if x['institution']=='Massachusetts Institute of Technology' and x['listedYear']==year),None)
    if cv is None:cv={'institution':'Massachusetts Institute of Technology','listedYear':year};m['coverage'].append(cv)
    cv.update(names=len(rows),linked=sum(bool(x.get('facultyId')) for x in rows),pages=list(dict.fromkeys(s['pageUrl'] for x in rows for s in x['sightings'])),rosterStatus='partial')
assert g['records'][:len(beforeg['records'])]==beforeg['records']
assert h['records'][:len(beforeh['records'])]==beforeh['records']
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h)
write(OUT/'input-manifest.json',manifest)
write(OUT/'applied.json',{'graduateRecordsAdded':added,'newPartialHistoryIds':newhist,'firstJobs':firstjobs,'newStructuredRoles':sum(len(x['jobs']) for x in h['records'] if x['id'] in newhist),'newSupportingMentions':sum(len(x.get('otherEmploymentMentions',[])) for x in h['records'] if x['id'] in newhist),'verifiedGraduateFirstJobsTotal':m['verifiedGraduateFirstJobs'],'unchangedPriorGraduateRecords':len(beforeg['records']),'unchangedPriorHistories':len(beforeh['records']),'remainingFirstJobIds':[x for x in newhist if x not in decisions]})
print(json.dumps({'graduatesAdded':len(added),'historiesAdded':len(newhist),'firstJobsAdded':len(firstjobs),'graduateFirstJobsTotal':m['verifiedGraduateFirstJobs']}))
