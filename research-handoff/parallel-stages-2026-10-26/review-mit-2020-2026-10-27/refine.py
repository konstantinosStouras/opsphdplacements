"""Prepublication independent audit corrections, retains initial decision as history."""
import json,pathlib
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf8'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
g=read('data/graduate-lists.json');h=read('data/employment-histories.json');dec=read(O/'decisions.json')
pid='grad:massachusetts-institute-of-technology:michael-hu:2020';gr=next(r for r in g['records'] if r['id']==pid);hr=next(r for r in h['records'] if r['id']==pid)
reason='Advisor placement list says graduated2020 and assumed MGH position, but does not explicitly say first/next and may omit intermediate appointments. MGH role is verified as observed October2020; first-employer ordering remains unestablished.'
prior=gr.pop('firstJobReview',None)
if prior:write(O/'superseded-hu-prepublication-assessment.json',{'status':'rejected-before-publication','reason':reason,'prior':prior})
hr['firstJobAssessment']=None;hr['parkedCase']={'status':'parked-for-new-evidence','reason':reason};hr['remainingUnknowns']=[reason,'Appointment start/end, present employment and real-world complete history unknown.']
li=next(r for r in h['records'] if r['id']=='grad:massachusetts-institute-of-technology:li-wang:2020');li['remainingUnknowns']=['Advisor June2020 graduation supports completion before August Lyft; formal September2020 award retained separately. Exact dates unknown.','Real-world history remains partial; source spelling Engagemnet retained.']
for d in dec:
 r=next(x for x in h['records'] if x['id']==d['id']);d.update(firstJobAssessment=r['firstJobAssessment'],remainingUnknowns=r['remainingUnknowns'])
g['metadata']['verifiedGraduateFirstJobs']=sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in g['records'])
write('data/graduate-lists.json',g,1);write('data/employment-histories.json',h);write(O/'decisions.json',dec)
a=read(O/'applied.json');a['verifiedFirstJobIds']=[x for x in a['verifiedFirstJobIds'] if x!=pid];a['remainingFirstJobIds']=list(dict.fromkeys(a['remainingFirstJobIds']+[pid]));a['prepublicationCorrection']='Hu placement-list evidence insufficient for first-job sequence; observed MGH role retained.';write(O/'applied.json',a)
for file in [pathlib.Path('README.md'),pathlib.Path('TODO.md'),O/'README.md']:
 t=file.read_text(encoding='utf8').replace('four supported first employers','three supported first employers').replace('now total 25','now total 24').replace('Four first employers supported: Hunter—Jump, Li Wang—Lyft, Hu—MGH, Zhang—Volpe.','Three first employers supported: Hunter—Jump, Li Wang—Lyft and Zhang—Volpe; Hu remains unresolved.').replace('Four first employers:','Three first employers:').replace(', Michael Hu—Massachusetts General Hospital (start unknown)','')
 if file==O/'README.md':t+='\nPrepublication independent audit withdrew the Hu first-job assessment: the advisor list can omit intermediate posts and does not explicitly identify the first appointment. MGH remains an observed role. Three first-job holds: Hu, Lu and Yuchen Wang. The superseded decision is retained for audit only, never published. `refine.py` applies this correction after the initial recipe.\n'
 file.write_text(t,encoding='utf8')
