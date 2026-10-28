import json
from pathlib import Path
P=Path(__file__).parent; R=P.parents[2]; B=R/'research/mit-2014-before'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
out={'checkedAt':'2026-10-28','reviewer':'Independent academic research agent','checks':{},'issues':[]}
def clean(x):
    if isinstance(x,dict):return {k:clean(v) for k,v in x.items() if k not in ('addedAt','updatedAt')}
    if isinstance(x,list):return [clean(v) for v in x]
    return x
for f in ['graduate-lists.json','employment-histories.json']:
    old=read(B/f)['records']; new=read(R/'data'/f)['records']; idx={x['id']:x for x in new}
    changed=[x['id'] for x in old if x['id'] not in idx or clean(x)!=clean(idx[x['id']])]
    oldids={z['id'] for z in old}
    added=[x for x in new if x['id'] not in oldids]
    out['checks'][f]={'added':len(added),'oldRecordsChanged':changed,'newNames':[x['name'] for x in added],'allNewStamped':all(x.get('addedAt') and x.get('updatedAt') for x in added),'duplicateIds':len(new)-len(idx)}
    if changed:out['issues'].append({'severity':'error','file':f,'oldChanged':changed})
    if len(added)!=5:out['issues'].append({'severity':'error','file':f,'added':len(added)})
    if f=='employment-histories.json':
        out['checks']['roles']=sum(len(x['jobs']) for x in added);out['checks']['mentions']=sum(len(x['otherEmploymentMentions']) for x in added)
        out['checks']['historyAssessments']=[x['name'] for x in added if x.get('firstJobAssessment')]
        out['checks']['allPartial']=all(x.get('reviewStatus')=='partial' and not x.get('careerComplete') for x in added)
        out['checks']['allRolesSourced']=all(j.get('sourceUrl') and j.get('checkedAt') for x in added for j in x['jobs'])
out['checks']['placementsUnchanged']=read(B/'placements.json')==read(R/'data/placements.json')
out['checks']['primaryEvidenceReview']='IBM chronology supported by opened October2026 CV and January2016 institutional narrative. Carnegie Mellon sequence supported by contributor-opened2017 CityU biography; root supplies separately recorded LinkedIn month chronology. Gupta existing USC2014 remains unchanged. Ross/Zhu lack first-job ordering and remain unresolved.'
hist=read(R/'data/employment-histories.json')['records']
adam=next(x for x in hist if x['name']=='Adam Nabil Elmachtoub')
out['checks']['ibmTitleCorrected']=adam['firstJobAssessment']['title']=='Postdoctoral Researcher'
if not out['checks']['ibmTitleCorrected']:out['issues'].append({'severity':'minor','record':'Adam Nabil Elmachtoub','finding':'Use CV title Postdoctoral Researcher.'})
out['checks']['academicProposalRolesPreserved']=[]
for slug in ['adam-nabil-elmachtoub','vishal-gupta']:
    proposal=read(P/(slug+'.history-proposal.json'))
    actual=next(x for x in hist if x['name']==proposal['name'])
    publicroles=actual['jobs']+actual['otherEmploymentMentions']
    for j in proposal['jobs']+proposal['otherEmploymentMentions']:
        matches=[x for x in publicroles if x.get('employerAsWritten')==j.get('employerAsWritten') and x.get('titleAsWritten')==j.get('titleAsWritten') and x.get('start',{}).get('asWritten')==j.get('start',{}).get('asWritten') and x.get('end',{}).get('asWritten')==j.get('end',{}).get('asWritten')]
        if not matches:out['issues'].append({'severity':'error','record':proposal['name'],'missingOrChangedRole':j.get('titleAsWritten'),'start':j.get('start')})
    out['checks']['academicProposalRolesPreserved'].append(proposal['name'])
out['checks']['roleDateEvidenceReview']='Employment dates match primary academic observations; separate MIT TA Fall2012/Spring2013 and instructor2013/2014 offerings retained without continuous interval inference. Original seasonal precision retained in asWritten, without invented months. Undated Gupta TA stays unknown. Industry collaborations and administrative/service roles remain mentions. Current present dates carry no invented calendar endpoint.'
out['status']='pass' if not out['issues'] else 'issues-found'
(P/'audit-mit2014.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
