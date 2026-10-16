from pathlib import Path
import json
p=Path('research/placements-a/results.json')
r=json.loads(p.read_text(encoding='utf-8'))
f=json.loads(Path('data/faculty.json').read_text(encoding='utf-8-sig'))['records']
names={x['id']:x['name'] for x in f}
for x in r:x['name']=names[x['facultyId']]
p.write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
