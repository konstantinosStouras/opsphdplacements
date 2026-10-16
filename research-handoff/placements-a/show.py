import json
from pathlib import Path
base=Path('research/placements-a')
done={x['facultyId'] for x in json.loads((base/'results.json').read_text(encoding='utf-8'))}
rows=[json.loads(p.read_text(encoding='utf-8')) for p in (base/'documents').glob('*.json')]
print('profiles',len(rows))
n=0
for r in rows:
 if r['facultyId'] in done:continue
 for d in r['documents']:
  if d.get('kind')=='pdf':
   print('\n',r['name'],r['facultyId'],d['url']);print(d['text'][:3000]);n+=1;break
 if n>=12:break
