"""Read-only MIT2017 release audit; emits report on stdout, never edits datasets."""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BEFORE = ROOT / 'research/mit-2017-before'
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def clean(r): return {k:v for k,v in r.items() if k not in ('addedAt','updatedAt')}
def index(data): return {r['id']:r for r in data['records']}
def sig(r): return tuple(json.dumps(r.get(k), sort_keys=True, ensure_ascii=False) for k in ('employerAsWritten','titleAsWritten','start','end','sourceUrl','checkedAt'))
issues=[]
checks=[]
def check(ok, description):
    (checks if ok else issues).append(description)
applied=read(HERE/'applied.json')
g=read(ROOT/'data/graduate-lists.json'); h=read(ROOT/'data/employment-histories.json')
gi=index(g); hi=index(h)
bg=index(read(BEFORE/'graduate-lists.json')); bh=index(read(BEFORE/'employment-histories.json'))
check(len(gi)==len(g['records']), 'Graduate IDs unique')
check(len(hi)==len(h['records']), 'History IDs unique')
check(set(gi)-set(bg)==set(applied['graduateRecordsAdded']) and len(set(gi)-set(bg))==12, 'Exactly 12 reviewed graduate records added')
check(set(hi)-set(bh)==set(applied['newPartialHistoryIds']) and len(set(hi)-set(bh))==11, 'Exactly 11 reviewed histories added')
check(all(i in gi and gi[i]==r for i,r in bg.items()), 'Every older graduate record byte-equivalent as JSON')
check(all(i in hi and hi[i]==r for i,r in bh.items() if i!='omlist-c02430ef1166545c'), 'Every older history except Aouad unchanged')
ali=hi['omlist-c02430ef1166545c']; oldali=bh['omlist-c02430ef1166545c']
check(ali['jobs'][:len(oldali['jobs'])]==oldali['jobs'], 'Aouad older roles preserved exactly')
check(ali['otherEmploymentMentions'][:len(oldali['otherEmploymentMentions'])]==oldali['otherEmploymentMentions'], 'Aouad older supporting mentions preserved exactly')
for filename in ['faculty.json','faculty-roster-people.json','placements.json','linkedin-histories.json']:
    check(read(BEFORE/filename)==read(ROOT/'data'/filename), filename+' unchanged')
for path in sorted(HERE.glob('*.history-proposal.json')):
    p=read(path); r=hi[p['personId']]
    allroles=r['jobs']+r.get('otherEmploymentMentions',[])
    signatures=[sig(x) for x in allroles]
    check(all(sig(x) in signatures for x in p['jobs']), p['name']+': every proposal role retained in jobs or supporting mentions')
    check(all(any((m.get('text') or m.get('evidenceNote','')) in x.get('evidenceNote','') and m.get('sourceUrl')==x.get('sourceUrl') for x in allroles) for m in p.get('otherEmploymentMentions',[])), p['name']+': supporting source mentions retained')
    check(r.get('careerComplete') is False and r.get('reviewStatus')=='partial',p['name']+': partial career retained')
    check(all(x.get('sourceUrl') and x.get('checkedAt') and x.get('evidenceNote') for x in allroles),p['name']+': every role/mention has provenance')
    gr=next(x for x in g['records'] if x['id']==p['personId'] or (x.get('facultyId')==p['personId'] and x['id'] in applied['graduateRecordsAdded']))
    check(r.get('firstJobAssessment')==gr.get('firstJobReview'),p['name']+': first-job assessment mirrored without invented result')
    if p['personId'].startswith('omlist-'):
        check(gr['id'] in r['recordIds'],p['name']+': existing faculty identity linked to cohort')
first=[i for i in applied['newPartialHistoryIds'] if hi[i].get('firstJobAssessment')]
check(first==applied['verifiedFirstJobIds'] and len(first)==1,'Only Weinstein receives new verified first job')
f=hi[first[0]]['firstJobAssessment']
check(f['employer']=='Zillow Group' and f['start']['year']==2017 and f['start']['month']==7 and 'June2017' in f['degreeBoundary'], 'Weinstein explicit June graduation precedes July Zillow')
cheung=gi['grad:massachusetts-institute-of-technology:wang-chi-cheung:2017']
check(cheung['degreeReview']['period']['year'] is None and len(cheung['degreeMilestones'])>=3,'Cheung conflicting degree milestones do not invent award year')
aouad=gi['grad:massachusetts-institute-of-technology:mohammed-aouad:2017']
check(aouad['facultyId']=='omlist-c02430ef1166545c' and 'discrepancy' in aouad['identityReview']['evidence'],'Aouad alias linked and thesis discrepancy preserved')
check(any('wright-state' in i and 'christopher-marks' in i for i in bg),'Wright State Marks namesake existed separately and preservation check covers it')
m=g['metadata']
check(m['records']==len(g['records']) and m['sightings']==sum(len(r['sightings']) for r in g['records']), 'Graduate metadata record and sighting counts match')
check(m['linkedToPeople']==sum(bool(r.get('facultyId')) for r in g['records']),'Graduate linked count matches')
check(m['verifiedGraduateFirstJobs']==sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records']),'Verified graduate first-job count matches')
check(all(m['byField'][k]==sum(r['field']==k for r in g['records']) for k in m['byField']),'Graduate field totals match')
check(all(m['byArchive'][k]==sum(s.get('archive','live')==k for r in g['records'] for s in r['sightings']) for k in m['byArchive']),'Graduate archive totals match')
check(applied['newStructuredRoles']==sum(len(hi[i]['jobs']) for i in applied['newPartialHistoryIds'])+1,'Reported 50 new structured roles match')
check(applied['newSupportingMentions']==sum(len(hi[i]['otherEmploymentMentions']) for i in applied['newPartialHistoryIds'])+1,'Reported 46 supporting mentions match')
report=dict(checkedAt='2026-10-27',status='pass' if not issues else 'fail',passedChecks=len(checks),issues=issues,checks=checks,
    qualitativeReview=['All source-proposal roles preserved, including reclassified internships/consultancies.',
    'First-job holds preserve actual completion uncertainty, military continuity, consultancy timing and Cheung date conflict.',
    'Aouad public library sighting explicitly matches library to CV, not ORC; ORC-title discrepancy separately retained.',
    'Full real-world careers and graduating-class census remain incomplete. This audit does not newly verify source pages.'])
print(json.dumps(report,ensure_ascii=False,indent=2))
