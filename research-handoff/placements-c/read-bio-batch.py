import json,re,sys
from helpers import *
done={r['facultyId'] for r in out}|set(json.loads((p/'bio-pending.json').read_text()));c=0
for f in sorted((p/'bio-text').glob('*.json')):
 r=json.loads(f.read_text(encoding='utf8'))
 if r['facultyId'] in done:continue
 print(r['facultyId'],r['name'].encode('ascii','backslashreplace').decode())
 for s in r['sources']:
  t=s.get('text','');print(s['url'],s.get('error',''));snippets=[]
  for m in re.finditer(r'Ph\.?D|[Dd]octorate|[Ee]mployment|[Bb]iography|[Pp]ostdoc|[Aa]ppointments|[Jj]oined|[Pp]rior to|[Ee]ducation',t):
   a=max(0,m.start()-100);b=min(len(t),m.start()+650)
   if snippets and a<snippets[-1][1]:snippets[-1]=(snippets[-1][0],max(b,snippets[-1][1]))
   else:snippets.append((a,b))
  result=' ... '.join(t[a:b] for a,b in snippets) or t[:900]
  print(result[:2400].encode('ascii','backslashreplace').decode());print('CV',s.get('cvLinks',[])[:2])
 c+=1
 if c==int(sys.argv[1] if len(sys.argv)>1 else 15):break
