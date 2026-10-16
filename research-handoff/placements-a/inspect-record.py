import json
from pathlib import Path
p=Path('research/placements-a/documents/omlist-23b71cb5794fc02b.json')
r=json.loads(p.read_text(encoding='utf-8'))
for d in r['documents']:
 if d.get('kind')=='pdf': print(d['text'][2200:4300])
