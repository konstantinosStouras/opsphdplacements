import json,pathlib
OUT=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
def write(p,v):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
a=read('research/mit2021-audit/adjudication.json');b=read('research/mit2021-gaps/adjudication.json')
write(OUT/'identity-role-review.json',a);write(OUT/'gap-review.json',b)
result={'checkedAt':'2026-10-27','integrator':'originating chat','records':a['records'],'classificationMoves':a['classificationMoves']}
for r in result['records']:
    v=r.get('firstJobAssessment')
    if v:
        reason=v.pop('rationale');v['reason']=reason
        v['sources']=[{'url':u,'checkedAt':'2026-10-27','evidenceNote':reason} for u in v['sources']]
        if 'jonathan-z' in r['personId']:
            v['title']='Data Scientist'
            v['limitations']=['The initial title comes from the contemporaneous MIT biography. The profile retrospectively labels its March 2021 entry Senior Applied AI Scientist; no promotion date is assigned.','Both Verily profile entries say Present; concurrent wording is preserved.','Career remains partial; exact degree and job days unknown.']
    c=next((x for x in b['cases'] if x['name']==r['name']),None)
    if not c:continue
    r['remainingUnknowns']=c['remaining'];r['gapReviewReason']=c['reason']
    if c['decision'].startswith(('accept','recommend-accept')):
        r['firstJobAssessment']={'employer':c['employer'],'title':c['title'],'start':{'year':2021,'month':6,'precision':'month','asWritten':'June 2021'},'reason':c['reason'],'sources':[{'url':s['url'],'checkedAt':s['checkedAt'],'evidenceNote':s['supports'],'access':s['access']} for s in c['sources']]}
    if r['name']=='Nicholas Renegar':
        source=c['sources'][0]['url']
        r['firstJobAssessment']['limitations']=['Completion is reported in a contemporaneous account of the employer announcement; the formal recipient record remains September 2021. No precise completion or employment day is assigned.','The original syndicated issuer release was unavailable; the opened Seed World report reproduces the employer announcement and biography.','Full career remains partial.']
        r['degreeMilestones']=[{'kind':'employer-reported-completion','displayText':'Employer announcement reports doctorate already earned by 29 June 2021','sourceUrl':source,'checkedAt':'2026-10-27','evidenceNote':'The contemporary report of the new hire says he recently earned the MIT OR doctorate and matches advisor and thesis.','limitation':'Reported completion is separate from the formal September 2021 award; exact completion day remains unknown.','formalAwardDateAssigned':False}]
        r['additionalJobs']=[{'employerAsWritten':'Milliman, Inc.','titleAsWritten':'Healthcare Consulting Actuarial Analyst','start':{'asWritten':'2010','year':2010,'month':None,'precision':'year'},'end':{'asWritten':'2015','year':2015,'month':None,'precision':'year'},'isCurrent':False,'sourceUrl':source,'sourceType':'employer-announcement-reported-by-industry-publication','checkedAt':'2026-10-27','evidenceNote':'Contemporaneous new-hire biography reports this pre-MIT role during 2010–2015. Month boundaries unknown; absent from captured LinkedIn Experience, retained as additional sourced history.'}]
    if r['name']=='Hari Bandi':
        r['additionalMentions']=[{'employerAsWritten':'nference','titleAsWritten':'Employment declared in published paper','sourceUrl':c['sources'][0]['url'],'checkedAt':'2026-10-27','evidenceNote':'A paper published 26 February 2021 lists Hari Bandi at nference and declares its nference authors employees. This is an observed employment bound, not a job start date or proof of degree completion. It predates the September formal award; job conversion and completion ordering remain unknown.'}]
    if r['name']=='Nihal Koduri':r['coverageNote']='Official doctoral identity is verified. No identity-matched employment profile or career history was found in the reviewed sources; no job is inferred.'
result['rootSourceChecks']=[{'url':'https://commencement.mit.edu/sites/default/files/MIT.Commencement.Program2021.pdf','checkedAt':'2026-10-27','evidenceNote':'Opened doctoral recipients at PDF page92 (printed89); read Amar, Delarue, Koduri, Orfanoudaki and Sinha individual entries.'},{'url':'https://commencement.mit.edu/sites/default/files/MIT.Commencement.2022.Graduates.Name.Book.pdf','checkedAt':'2026-10-27','evidenceNote':'Opened doctoral recipients at PDF page98 (printed96); read Bandi, Hazimeh, Paulson and Renegar September2021 annotations.'}]
result['accessLimitations']=['Original MarketScreener syndicated announcement returned web cache miss and browser Access Denied; no bypass or source claim from that failed read. Opened Seed World contemporary employer-announcement report is labelled explicitly.','ORC thesis web reader timed out; retain already reviewed Chrome thesis observation, not a new completed read.']
write(OUT/'decisions.json',result)
