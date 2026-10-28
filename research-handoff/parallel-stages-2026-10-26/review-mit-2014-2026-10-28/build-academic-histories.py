import json,re
from pathlib import Path
root=Path(__file__).parent
people=json.loads((root/'primary-academic.json').read_text(encoding='utf-8'))['people']
def period(s):
    if s is None: return dict(asWritten=None,year=None,month=None,precision='unknown')
    if s=='present': return dict(asWritten=s,year=None,month=None,precision='present')
    y=re.search(r'\d{4}',s); m=re.fullmatch(r'\d{4}-(\d{2})',s)
    return dict(asWritten=s,year=int(y[0]) if y else None,month=int(m[1]) if m else None,precision='month' if m else 'year')
def job(r):
    return dict(employerAsWritten=r['employer'],titleAsWritten=r['title'],employmentTypeAsWritten=None,locationAsWritten=None,start=period(r['start']),end=period(r['end']),isCurrent=True if r['end']=='present' else False if r['end'] else None,sourceUrl=r['sourceUrl'],checkedAt='2026-10-28',sourceType='primary-source',sourceSection='CV employment or teaching',evidenceNote=r.get('note','Dated CV appointment; date precision preserved.'),additionalSourceUrls=[])
for p in people:
    slug='adam-nabil-elmachtoub' if 'Elmachtoub' in p['name'] else 'vishal-gupta'
    gradid='grad:massachusetts-institute-of-technology:'+slug+':2014'
    q=dict(personId=p.get('existingFacultyId') or gradid,name=p['name'],recordIds=[gradid] if p.get('existingFacultyId') else [],careerOwner='stage-2' if p.get('existingFacultyId') else 'stage-4',reviewer='Codex primary research contributor',checkedAt='2026-10-28',profileUrl=None,identityBasis=p['identity'],experienceAccess='primary-sources-reviewed',profileHistoryComplete=False,careerComplete=False,coverageNote='CV employment, teaching and service sections reviewed. Discrete teaching terms retained; administrative roles and industry collaborations separated. No claim of lifetime completeness.',jobs=[],otherEmploymentMentions=[],remainingUnknowns=p['limitations'],accessLimitations=[],firstJobAssessment=p['firstJobAssessment'],integrationStatus='proposal-only',sourceObservations=p)
    for r in p['roles']:
        if r['title']=='Vice Chair, IEOR' or r['title']=='Affiliate Faculty, AI and Society':
            q['otherEmploymentMentions'].append(job(r)); continue
        if r['employer']=='Massachusetts Institute of Technology' and r['start']=='Fall2012':
            for term in ['Fall2012','Spring2013']:
                rr=dict(r,start=term,end=term,note='Discrete teaching term; no continuous employment inferred.')
                q['jobs'].append(job(rr))
        elif r['employer']=='Massachusetts Institute of Technology' and r['title']=='Instructor':
            for year in ['2013','2014']:
                q['jobs'].append(job(dict(r,start=year,end=year,note='Separate Software Tools for Operations Research course offering; months unknown.')))
        else:q['jobs'].append(job(r))
    q['otherEmploymentMentions'].append(dict(employerAsWritten=None,titleAsWritten='Additional CV observations',evidenceNote=p['otherMentions'],sourceUrl=p['sources'][0]['url'],checkedAt='2026-10-28',sourceType='primary-source'))
    (root/(slug+'.history-proposal.json')).write_text(json.dumps(q,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(slug,len(q['jobs']),len(q['otherEmploymentMentions']))
