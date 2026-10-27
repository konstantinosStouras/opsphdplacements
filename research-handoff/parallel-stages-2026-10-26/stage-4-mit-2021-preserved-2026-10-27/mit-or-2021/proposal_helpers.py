"""Pure local proposal construction helpers. No network or public-data writes."""
import json,calendar
from pathlib import Path
P=Path(__file__).resolve().parent
CO=json.loads((P/'cohort-proposal.json').read_text(encoding='utf-8'))
def dt(s):
 if s in [None,'Present','source-current']:
  return {'asWritten':None if s=='source-current' else s,'year':None,'month':None,'precision':'unknown'}
 parts=s.split('-')
 if len(parts)==2 and parts[0].isdigit() and parts[1].isdigit():
  y,m=map(int,parts);return {'asWritten':f'{calendar.month_abbr[m]} {y}','year':y,'month':m,'precision':'month'}
 if s.isdigit() and len(s)==4:return {'asWritten':s,'year':int(s),'month':None,'precision':'year'}
 return {'asWritten':s,'year':None,'month':None,'precision':'unknown'}
def save(name,profile,basis,roles,first=None,mentions=None,unknowns=None,limitations=None,complete=True,source_type='self-reported-linkedin',coverage=None,aliases=None,parked=None):
 r=next(r for r in CO['records'] if r['name']==name)
 jobs=[]
 for role in roles:
  e,t,start,end,*tail=role
  j={'employerAsWritten':e,'titleAsWritten':t,'employmentTypeAsWritten':tail[0] if tail else None,'start':dt(start),'end':dt(end),'isCurrent':True if end=='Present' else None if end in [None,'source-current'] else False,'sourceUrl':profile,'sourceType':source_type,'sourceSection':'Entire accessible Experience detail view' if complete else 'Personal professional biography','checkedAt':'2026-10-27','evidenceNote':'Individually read; original precision, concurrency and source-stated role type retained. Entry presence does not imply paid employment.'}
  jobs.append(j)
 d={'personId':r['proposedGraduateId'],'recordIds':[],'name':name,'aliases':aliases or [],'careerOwner':'stage-4','reviewer':'Codex Stage4','checkedAt':'2026-10-27','profileUrl':profile,'identityBasis':basis,'experienceAccess':'read-all-visible' if complete else 'not-visible','profileHistoryComplete':complete,'careerComplete':False,'coverageNote':coverage or 'All accessible Experience detail entries read. This is not a complete real-world career.','jobs':jobs,'otherEmploymentMentions':mentions or [],'remainingUnknowns':unknowns or ['Direct formal award day and real-world career completeness unknown.'],'accessLimitations':limitations or [],'firstJobAssessment':first,'integrationStatus':'proposal-only'}
 if parked:d['parkedCase']={'reason':parked,'status':'parked-for-new-evidence'}
 filename=r['proposalId'].replace('stage4-mit-or-2021-','')+'.history-proposal.json'
 (P/filename).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(name,len(jobs),'source entries saved',filename)
 return d
