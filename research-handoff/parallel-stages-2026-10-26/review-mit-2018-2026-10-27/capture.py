import json,pathlib
OUT=pathlib.Path('research-handoff/parallel-stages-2026-10-26/review-mit-2018-2026-10-27')
def date(s):
 if not s or s=='Present':return {'asWritten':s,'year':None,'month':None,'precision':'unknown'}
 bits=s.split();return {'asWritten':s,'year':int(bits[-1]),'month':(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].index(bits[0])+1) if len(bits)==2 else None,'precision':'month' if len(bits)==2 else 'year'}
def save(slug,name,url,identity,rows,unknowns):
 r={'personId':'grad:massachusetts-institute-of-technology:'+slug+':2018','name':name,'recordIds':[],'careerOwner':'stage-4','reviewer':'Codex integrator','checkedAt':'2026-10-27','profileUrl':url,'identityBasis':identity,'experienceAccess':'read-all-visible','profileHistoryComplete':True,'careerComplete':False,'coverageNote':'Entire accessible Experience detail section read individually in Chrome; real-world career remains partial.','jobs':[],'otherEmploymentMentions':[],'remainingUnknowns':unknowns,'accessLimitations':[],'firstJobAssessment':None,'integrationStatus':'proposal-only'}
 for employer,title,start,end,typ,loc in rows:r['jobs'].append({'employerAsWritten':employer,'titleAsWritten':title,'employmentTypeAsWritten':typ,'locationAsWritten':loc,'start':date(start),'end':date(end),'isCurrent':end=='Present','sourceUrl':url,'checkedAt':'2026-10-27','sourceType':'self-reported-linkedin','sourceSection':'Entire accessible Experience detail view','evidenceNote':'Individually read role; original date precision and overlapping roles retained.'})
 (OUT/(slug+'.history-proposal.json')).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
